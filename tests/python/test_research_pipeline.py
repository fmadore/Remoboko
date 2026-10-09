"""Regression checks for the research data contracts and print/NLP pipelines."""

from datetime import date
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from viz_common import format_share, gender_series, load_json, normalize_gender, parse_date


def module_from_path(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


timeline = module_from_path('timeline', 'Book_DeGruyter/Timeline/timeline.py')
clouds = module_from_path('clouds', 'Final report/word_clouds.py')
gender_chart = module_from_path('gender_chart', 'Final report/collaborators_gender.py')
validator = module_from_path('validator', 'scripts/validate_data.py')


class DataContractTests(unittest.TestCase):
    def test_shipped_research_data(self):
        self.assertEqual(validator.validate_repository(), [])

    def test_strict_calendar_dates(self):
        self.assertEqual(parse_date('2024-02-29'), date(2024, 2, 29))
        for value in ['2023-02-29', '2024-13-01', '2024-2-01', '20240101', None]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_date(value)

    def test_invalid_fields_are_reported_with_row(self):
        schema = load_json(ROOT / 'schemas/timeline.schema.json')
        records = [{'country': 'Togo', 'date': '2023-02-29', 'category': 'Typo', 'event': ' '}]
        errors = list(validator.validate_schema(records, schema))
        self.assertTrue(any('$[0].date' in error for error in errors))
        self.assertTrue(any('$[0].category' in error for error in errors))
        self.assertTrue(any('$[0].event' in error for error in errors))

    def test_malformed_coordinates(self):
        for point in [[1, 91], [181, 1], [float('nan'), 1], [1, float('inf')], [True, 1], [1], ['1', 2]]:
            with self.subTest(point=point):
                self.assertFalse(validator.valid_coordinates(point))
        self.assertTrue(validator.valid_coordinates([-180, -90]))

    def test_duplicate_people_and_bad_latitude_are_rejected(self):
        records = load_json(ROOT / 'Final report/Data/Collaborators_data.json')[:1]
        records = [records[0], {**records[0], 'Coordinate location': '91,0'}]
        errors = list(validator.validate_semantics('Collaborators_data.json', records, ROOT))
        self.assertTrue(any('duplicate collaborator' in error for error in errors))
        self.assertTrue(any('geographic bounds' in error for error in errors))

    def test_logo_traversal_is_rejected(self):
        relative = 'Book_DeGruyter/Maps/universities.json'
        data = load_json(ROOT / relative)
        data['features'][0]['properties']['logo'] = '../../../README.md'
        self.assertTrue(any('unsafe logo' in error for error in validator.validate_semantics(relative, data, ROOT)))

    def test_duplicate_json_keys_and_nan_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'bad.json'
            for text in ['{"x":1,"x":2}', '{"x":NaN}']:
                path.write_text(text)
                with self.assertRaises(ValueError):
                    load_json(path)

    def test_unrecognized_schema_keyword_does_not_silently_pass(self):
        with self.assertRaises(ValueError):
            list(validator.validate_schema([], {'uniqueItems': True}))


class FigureDataTests(unittest.TestCase):
    def test_missing_gender_remains_in_the_denominator(self):
        records = [{'Gender': 'male'}, {'Gender': None}, {'Gender': ' Female '}, {'Gender': ''}, {}]
        series = gender_series(records)
        self.assertEqual(sum(item['count'] for item in series), len(records))
        self.assertAlmostEqual(sum(item['share'] for item in series), 1)
        self.assertEqual({item['id']: item['count'] for item in series}, {'female': 1, 'male': 1, 'unknown': 3})
        self.assertEqual(gender_series([]), [])

    def test_gender_identity_does_not_depend_on_present_categories(self):
        women = gender_series([{'Gender': 'female'}])[0]
        men = gender_series([{'Gender': 'male'}])[0]
        self.assertEqual(women['color'], '#2a78d6')
        self.assertEqual(men['color'], '#eb6834')
        self.assertEqual(normalize_gender('  '), 'unknown')

    def test_shares_round_like_the_browser_figures(self):
        self.assertEqual(format_share(35 / 93), '38%')
        self.assertEqual(format_share(0.0754), '7.5%')
        self.assertEqual(format_share(1), '100%')

    def test_print_gender_bar_labels_only_segments_wide_enough(self):
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        records = [{'Gender': 'female'}] * 40 + [{'Gender': 'male'}] * 59 + [{'Gender': None}]
        fig = gender_chart.create_chart(records)
        try:
            texts = [text.get_text() for ax in fig.axes for text in ax.texts]
            self.assertIn('Women', texts)
            self.assertIn('59 · 59%', texts)
            self.assertNotIn('Unknown', texts, 'a 1% segment keeps its legend entry only')
            legend = [text.get_text() for text in fig.legends[0].get_texts()]
            self.assertEqual(legend, ['Women 40', 'Men 59', 'Unknown 1'])
        finally:
            plt.close(fig)

    def test_last_timeline_event_is_inside_axis(self):
        data = load_json(ROOT / 'Book_DeGruyter/Timeline/data.json')
        dates = [parse_date(row['date']) for row in data]
        lower, upper, ticks = timeline.date_bounds(dates)
        self.assertLess(lower, min(dates))
        self.assertGreater(upper, date(2010, 6, 11))
        self.assertIn(2010, ticks)

    def test_timeline_single_date_and_empty_selection(self):
        lower, upper, _ = timeline.date_bounds([date(2020, 12, 31)])
        self.assertLess(lower, date(2020, 12, 31))
        self.assertGreater(upper, date(2020, 12, 31))
        with self.assertRaises(ValueError):
            timeline.date_bounds([])

    def test_manual_book_layout_hints_are_preserved(self):
        self.assertEqual(timeline.get_label({'event': 'Long original', 'label': 'Book\nlabel'}), 'Book\nlabel')
        self.assertEqual(timeline.get_label({'event': 'A sufficiently long unbroken display title', 'wrap': False}),
                         'A sufficiently long unbroken display title')


class WordCloudCountingTests(unittest.TestCase):
    class Processor:
        def documents(self, texts, language):
            for text in texts:
                yield text.split()

    def setUp(self):
        self.records = [
            {'Language': 'French', 'Abstract': 'école école élève'},
            {'Language': 'French', 'Abstract': 'école étude'},
            {'Language': 'French', 'Abstract': None},
            {'Language': 'French', 'Abstract': '  '},
            {'Language': 'English', 'Abstract': 'school'},
        ]

    def test_exact_token_frequencies_and_missing_coverage(self):
        counts, coverage = clouds.corpus_frequencies(self.records, 'French', self.Processor())
        self.assertEqual(counts, {'école': 3, 'élève': 1, 'étude': 1})
        self.assertEqual(coverage['records'], 4)
        self.assertEqual(coverage['included_abstracts'], 2)
        self.assertEqual(coverage['missing_abstracts'], 2)
        self.assertEqual(coverage['processed_tokens'], 5)

    def test_document_frequency_caps_each_record_at_one_vote(self):
        counts, _ = clouds.corpus_frequencies(self.records, 'French', self.Processor(), 'document')
        self.assertEqual(counts['école'], 2)
        self.assertEqual(counts['élève'], 1)

    def test_empty_corpus_does_not_load_language_models(self):
        class NoResources:
            def documents(self, texts, language):
                raise AssertionError('Must not load a model for an empty corpus')
        counts, coverage = clouds.corpus_frequencies([], 'French', NoResources())
        self.assertEqual(counts, {})
        self.assertEqual(coverage['included_abstracts'], 0)

    def test_frequency_order_is_independent_of_record_order(self):
        first, _ = clouds.corpus_frequencies(self.records, 'French', self.Processor())
        second, _ = clouds.corpus_frequencies(list(reversed(self.records)), 'French', self.Processor())
        self.assertEqual(list(first.items()), list(second.items()))

    def test_csv_preserves_unicode_and_exact_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'counts.csv'
            clouds.save_frequencies({'école': 3}, path)
            self.assertEqual(path.read_text(encoding='utf-8').splitlines(), ['term,count', 'école,3'])

    @unittest.skipUnless(importlib.util.find_spec('wordcloud'), 'Install requirements-dev.txt to exercise rendering')
    def test_same_seed_and_counts_produce_identical_pixels(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as directory:
            a, b = Path(directory) / 'a.png', Path(directory) / 'b.png'
            counts = {'école': 10, 'élève': 8, 'étude': 5, 'campus': 3}
            clouds.generate_wordcloud(counts, 'French', a, seed=42)
            clouds.generate_wordcloud(counts, 'French', b, seed=42)
            with Image.open(a) as first, Image.open(b) as second:
                self.assertEqual(first.size, second.size)
                self.assertEqual(first.mode, second.mode)
                self.assertTrue(first.tobytes() == second.tobytes(), 'Same seed produced different pixels')


class ImportSafetyTests(unittest.TestCase):
    def test_importing_generators_does_not_generate_files_or_load_nlp(self):
        paths = ['Final report/word_clouds.py', 'Final report/collaborators_gender.py',
                 'Book_DeGruyter/Timeline/timeline.py', '.github/assets/social_preview.py']
        code = """
import importlib.util, sys
for index, path in enumerate(sys.argv[1:]):
    spec = importlib.util.spec_from_file_location('generator_' + str(index), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
assert 'spacy' not in sys.modules
assert 'nltk' not in sys.modules
assert 'matplotlib.pyplot' not in sys.modules
"""
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, '-c', code, *(str(ROOT / p) for p in paths)],
                                    cwd=directory, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, '')
            self.assertEqual(list(Path(directory).iterdir()), [])


if __name__ == '__main__':
    unittest.main()
