"""Build auditable English/French word clouds from recorded abstracts.

Install requirements-nlp.txt, then explicitly provision resources with
``python "Final report/word_clouds.py" --download-resources``. Normal generation
uses local resources only. No downloads, model loads or writes happen on import.
"""

import argparse
from collections import Counter
import csv
import hashlib
from importlib.metadata import PackageNotFoundError, version
import json
import logging
from pathlib import Path
import platform
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from viz_common import load_json

HERE = Path(__file__).resolve().parent
LANGUAGES = ('English', 'French')
FRENCH_MODEL_VERSION = '3.8.0'
ENGLISH_EXCEPTIONS = {'vincent'}
FRENCH_EXCEPTIONS = {'vincent', 'source', 'auteur', 'texte'}
LOG = logging.getLogger(__name__)


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def nltk_resource_hash(name):
    """Fingerprint exact local resources, including zipped WordNet distributions."""
    from nltk.data import find

    try:
        pointer = find(name)
    except LookupError:
        pointer = find(name + '.zip')
    if hasattr(pointer, 'zipfile'):
        return sha256_file(pointer.zipfile.filename)
    path = Path(str(pointer))
    if path.is_file():
        return sha256_file(path)
    digest = hashlib.sha256()
    for item in sorted(candidate for candidate in path.rglob('*') if candidate.is_file()):
        digest.update(str(item.relative_to(path)).encode('utf-8'))
        digest.update(sha256_file(item).encode('ascii'))
    return digest.hexdigest()


def stable_hash(word):
    return int(hashlib.sha256(word.encode('utf-8')).hexdigest(), 16)


def english_color_func(word, **kwargs):
    colors = ['#1abc9c', '#16a085', '#2ecc71', '#27ae60', '#3498db', '#2980b9']
    return colors[stable_hash(word) % len(colors)]


def french_color_func(word, **kwargs):
    colors = ['#e74c3c', '#c0392b', '#e67e22', '#d35400', '#f39c12', '#f1c40f']
    return colors[stable_hash(word) % len(colors)]


def download_resources():
    """The only network-enabled path; deliberately separate from generation."""
    try:
        import nltk
        from spacy.cli import download
    except ImportError as exc:
        raise RuntimeError('Install requirements-nlp.txt before downloading resources') from exc
    for resource in ('punkt_tab', 'stopwords', 'wordnet'):
        if not nltk.download(resource, raise_on_error=True):
            raise RuntimeError(f'Could not download NLTK resource: {resource}')
    download(f'fr_core_news_lg-{FRENCH_MODEL_VERSION}', direct=True)


class TextProcessor:
    """Lazy language pipelines; dependencies are injected into counting below."""

    def __init__(self):
        self._english = None
        self._french = None
        self.metadata = {}

    def _load_english(self):
        try:
            from nltk.corpus import stopwords, wordnet
            from nltk.stem import WordNetLemmatizer
            from nltk.tokenize import word_tokenize
            words = set(stopwords.words('english')) | ENGLISH_EXCEPTIONS
            lemmatizer = WordNetLemmatizer()
            lemmatizer.lemmatize('tests')  # Fail before processing on a missing WordNet corpus.
            word_tokenize('Resource check.')
        except (ImportError, LookupError) as exc:
            raise RuntimeError('English NLP resources unavailable; install requirements-nlp.txt and run --download-resources') from exc
        self._english = (word_tokenize, lemmatizer, words)
        self.metadata['English'] = {
            'lemmatization': 'NLTK WordNet, noun POS (existing method)',
            'stopwords_sha256': hashlib.sha256('\n'.join(sorted(words)).encode()).hexdigest(),
            'wordnet_version': wordnet.get_version(),
            'resource_sha256': {name: nltk_resource_hash(name) for name in
                                ('tokenizers/punkt_tab/english/', 'corpora/stopwords/english', 'corpora/wordnet')},
        }

    def _load_french(self):
        try:
            import spacy
            from nltk.corpus import stopwords
            nlp = spacy.load('fr_core_news_lg', exclude=['parser', 'ner'])
            if nlp.meta.get('version') != FRENCH_MODEL_VERSION:
                raise RuntimeError(f'Expected fr_core_news_lg {FRENCH_MODEL_VERSION}; run --download-resources')
            words = set(stopwords.words('french')) | nlp.Defaults.stop_words | FRENCH_EXCEPTIONS
        except (ImportError, LookupError, OSError) as exc:
            raise RuntimeError('French NLP resources unavailable; install requirements-nlp.txt and run --download-resources') from exc
        self._french = (nlp, words)
        self.metadata['French'] = {
            'model': 'fr_core_news_lg', 'model_version': nlp.meta.get('version'),
            'pipeline': nlp.pipe_names, 'excluded_components': ['parser', 'ner'],
            'resource_sha256': {'corpora/stopwords/french': nltk_resource_hash('corpora/stopwords/french')},
            'stopwords_sha256': hashlib.sha256('\n'.join(sorted(words)).encode()).hexdigest(),
        }

    def documents(self, texts, language):
        if language == 'English':
            if self._english is None:
                self._load_english()
            tokenize, lemmatizer, stop_words = self._english
            for text in texts:
                yield [lemmatizer.lemmatize(word) for word in tokenize(text.lower())
                       if word.isalnum() and word not in stop_words]
        elif language == 'French':
            if self._french is None:
                self._load_french()
            nlp, stop_words = self._french
            for doc in nlp.pipe((text.lower() for text in texts), batch_size=16):
                yield [token.lemma_ for token in doc if token.text.isalnum()
                       and token.text not in stop_words and token.lemma_ not in stop_words]
        else:
            raise ValueError(f'Unsupported language: {language!r}')


def corpus_frequencies(rows, language, processor, weighting='token'):
    """Return exact counts and coverage; document mode counts each term once per record."""
    if weighting not in ('token', 'document'):
        raise ValueError(f'Unsupported weighting: {weighting!r}')
    records = [row for row in rows if row['Language'] == language]
    texts = [row['Abstract'] for row in records if isinstance(row.get('Abstract'), str) and row['Abstract'].strip()]
    counts = Counter()
    token_count = 0
    empty_documents = 0
    for tokens in processor.documents(texts, language) if texts else ():
        tokens = list(tokens)
        token_count += len(tokens)
        empty_documents += not bool(tokens)
        counts.update(tokens if weighting == 'token' else set(tokens))
    # Stable ordering breaks equal-frequency ties before WordCloud layout.
    ordered = dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))
    return ordered, {
        'records': len(records), 'included_abstracts': len(texts),
        'missing_abstracts': len(records) - len(texts),
        'empty_after_processing': empty_documents, 'processed_tokens': token_count,
        'unique_terms': len(counts), 'weighting': weighting,
    }


def save_frequencies(counts, path):
    with open(path, 'w', encoding='utf-8', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['term', 'count'])
        writer.writerows(counts.items())


def generate_wordcloud(counts, language, output_path, seed=42, font_path=None):
    """Render the exact published counts: no second tokenizer or plural merging."""
    try:
        from wordcloud import WordCloud
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise RuntimeError('Install requirements-nlp.txt to render word clouds') from exc
    if not counts:
        raise ValueError(f'No {language} terms to render')
    cloud = WordCloud(
        width=1600, height=800, background_color=None, mode='RGBA', max_words=200,
        min_font_size=10, max_font_size=150, relative_scaling=0.5, prefer_horizontal=0.7,
        color_func=english_color_func if language == 'English' else french_color_func,
        margin=10, contour_width=0, collocations=False, random_state=seed,
        font_path=str(font_path) if font_path else None,
    ).generate_from_frequencies(counts)
    fig, ax = plt.subplots(figsize=(20, 10), dpi=300, facecolor='none')
    try:
        ax.set_facecolor('none')
        ax.imshow(cloud, interpolation='bilinear')
        ax.axis('off')
        ax.set_title(f'{language} Abstracts', fontsize=24, fontweight='bold', color='#1b1b1b', pad=20)
        fig.savefig(output_path, bbox_inches='tight', pad_inches=0.5, transparent=True, facecolor='none')
    finally:
        plt.close(fig)
    return {'font_file': Path(cloud.font_path).name, 'font_sha256': sha256_file(cloud.font_path)}


def package_versions():
    result = {}
    for package in ('wordcloud', 'matplotlib', 'numpy', 'nltk', 'spacy', 'pillow'):
        try:
            result[package] = version(package)
        except PackageNotFoundError:
            result[package] = None
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, default=HERE / 'Data/Publications_and_activities_data.json')
    parser.add_argument('--output-dir', type=Path, default=HERE / 'WordClouds')
    parser.add_argument('--download-resources', action='store_true', help='Download NLP corpora/model, then exit')
    parser.add_argument('--languages', nargs='+', choices=LANGUAGES, default=list(LANGUAGES))
    parser.add_argument('--weighting', choices=('token', 'document'), default='token')
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--font', type=Path, help='Explicit font for repeatable image layouts')
    parser.add_argument('--frequencies-only', action='store_true', help='Write counts/methods without rendering PNGs')
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    if args.download_resources:
        download_resources()
        return
    rows = load_json(args.data)['rows']
    args.output_dir.mkdir(parents=True, exist_ok=True)
    processor = TextProcessor()
    manifest = {
        'source_file': args.data.name, 'source_sha256': sha256_file(args.data),
        'python': platform.python_version(), 'packages': package_versions(), 'seed': args.seed,
        'weighting': args.weighting,
        'method': 'Lowercase, language-specific stopwords and lemmatization; exact alphanumeric lemma counts; no WordCloud text postprocessing.',
        'scope': 'Recorded nonempty abstracts; records can include full blog text. Token counts weight longer records more heavily.',
        'unprocessed_languages': dict(Counter(row['Language'] for row in rows if row['Language'] not in args.languages)),
        'languages': {},
    }
    for language in dict.fromkeys(args.languages):
        counts, coverage = corpus_frequencies(rows, language, processor, args.weighting)
        prefix = language.lower() if args.weighting == 'token' else f'{language.lower()}_document'
        save_frequencies(counts, args.output_dir / f'{prefix}_frequencies.csv')
        coverage['image_generated'] = False
        if counts and not args.frequencies_only:
            coverage['rendering'] = generate_wordcloud(counts, language, args.output_dir / f'{prefix}_wordcloud.png', args.seed, args.font)
            coverage['image_generated'] = True
        elif not counts:
            LOG.warning('No %s terms; counts written, no PNG generated', language)
        manifest['languages'][language] = coverage
        LOG.info('%s: %s/%s records included, %s terms', language, coverage['included_abstracts'], coverage['records'], len(counts))
    manifest['processing'] = processor.metadata
    (args.output_dir / f'wordcloud_methods_{args.weighting}.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError) as exc:
        LOG.error('%s', exc)
        sys.exit(1)
