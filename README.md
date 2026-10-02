# Remoboko

[![CI](https://github.com/fmadore/Remoboko/actions/workflows/ci.yml/badge.svg)](https://github.com/fmadore/Remoboko/actions/workflows/ci.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA)
[![Project website](https://img.shields.io/badge/website-remoboko.hypotheses.org-informational)](https://remoboko.hypotheses.org/)
[![Live visualisations](https://img.shields.io/badge/live-visualisations-success)](https://fmadore.github.io/Remoboko/)

**Religion, Morality and Boko in West Africa**

Research data, interactive figures and Python code from Remoboko, a study of religiosity and how it affects secular education (*boko*, in Hausa) in West Africa.

The project focused on the presence, competition and conflict between secularism, Salafism and Pentecostalism on four campuses — Université Abdou Moumouni (Niamey, Niger), University of Ibadan (Nigeria), Université de Lomé (Togo) and Université d'Abomey-Calavi (Benin). It examined how students seeking a degree that would ensure them a better life resort to Salafism and Pentecostalism, and how *boko* in this context is both appealing and rejected.

Remoboko was a Leibniz Junior Research Group that ran from June 2018 to 2024. It was based at [Leibniz-Zentrum Moderner Orient](https://www.zmo.de/) (ZMO) in Berlin and funded through the Leibniz Competition. Project blog: <https://remoboko.hypotheses.org/>.

## Interactive figures

Every figure is a self-contained HTML page served from GitHub Pages, listed at <https://fmadore.github.io/Remoboko/>. Each page reads its data from the JSON files in this repository at load time, so a data edit is live as soon as it is pushed. The pages are made to be embedded: drop any of the URLs below into an `<iframe>` and the figure fills the frame.

**Maps and timeline for the book:**

- [Points of interest around Abomey-Calavi and Lomé](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/UAC_UL_locations_map.html) — 33 churches, mosques, schools, universities and landmarks, searchable and filterable by country (also at [`points_of_interest.html`](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/points_of_interest.html))
- [Universities of Benin and Togo](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/universities_map.html)
- [Religion, education and politics in Togo and Benin, 1960–2010](https://fmadore.github.io/Remoboko/Book_DeGruyter/Timeline/index.html) — 37 events, filterable by theme

**Final report:**

- [Collaborators by country](https://fmadore.github.io/Remoboko/Final%20report/collaborators_by_country.html) · [by affiliation, on a map](https://fmadore.github.io/Remoboko/Final%20report/collaborators_map.html) · [by gender](https://fmadore.github.io/Remoboko/Final%20report/collaborators_gender.html)
- [Publications and activities by type and language](https://fmadore.github.io/Remoboko/Final%20report/treemap_chart.html) · [over time](https://fmadore.github.io/Remoboko/Final%20report/activities_type_over_time.html)

Every chart offers a table view, CSV download, and PNG/SVG export of the current selection. Timeline themes, activity periods/hidden series, and treemap drilldowns are reflected in the URL for sharing. Maps offer a keyboard-accessible data table, search/selection controls, and a readable fallback when WebGL, the map library or the basemap service is unavailable. Maps use [OpenFreeMap](https://openfreemap.org/) vector tiles rendered with MapLibre GL, which need no API key.

## Contents

### `assets/`

The interactive figures share small ES modules:

| Module | Responsibility |
| --- | --- |
| `remoboko.css` | Design tokens, figure layouts, keyboard focus, tables and map styles |
| `tokens.js` | Country/categorical colours, basemaps and source attribution |
| `data.js` | Strict calendar dates, normalization, counts and complete time periods |
| `remoboko.js` | Data loading, controls, tooltips, tables and responsive figure helpers |
| `export.js` | Self-contained chart SVG/PNG exports, current-view metadata and CSV |
| `maps.js` | Map data identities, validation, accessible fallback and shared map lifecycle |
| `d3.js` | One pinned D3 import used by every chart |

Charts use [D3](https://d3js.org/) and maps use [MapLibre GL](https://maplibre.org/), loaded from a CDN as ES modules; there is no application build step. npm dependencies provide the same releases locally for tests, so regression tests do not need live map tiles or CDN responses.

### `Book_DeGruyter/`

Figures and data for the monograph:

> Frédérick Madore, *Religious Activism on Campuses in Togo and Benin: Christian and Muslim Students Navigating Authoritarianism and Laïcité, 1970–2023*. ZMO-Studien 48. Berlin: De Gruyter, 2025. <https://doi.org/10.1515/9783111428895>

| Path | What it is | View |
| --- | --- | --- |
| `Maps/UAC_UL_locations_map.html` + `locations-map.js` | 33 points of interest around Abomey-Calavi and Lomé, from `locations.json` | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/UAC_UL_locations_map.html) |
| `Maps/points_of_interest.html` | Same figure at its original URL | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/points_of_interest.html) |
| `Maps/universities_map.html` + `universities-map.js` | The four Beninese and Togolese universities, from `universities.json`, with logos as markers | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/universities_map.html) |
| `Timeline/index.html` + `script.js` | Interactive timeline of the 37 events in `data.json` | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Timeline/index.html) |
| `Timeline/timeline.py` | Print versions: `Religion_Timeline` and `Education_Politics_Timeline` (PNG + SVG) | — |

### `Final report/`

Figures and data for the project's final report:

| Path | What it is | View |
| --- | --- | --- |
| `collaborators_by_country.html` + `.js` | 93 collaborators across 24 countries, names on hover | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/collaborators_by_country.html) |
| `collaborators_map.html` + `.js` | The same collaborators located at 56 institutions | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/collaborators_map.html) |
| `collaborators_gender.html` + `.js` | The same collaborators by gender, as a proportion bar | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/collaborators_gender.html) |
| `treemap_chart.html` + `.js` | 181 publications and activities by type, language and year | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/treemap_chart.html) |
| `activities_type_over_time.html` + `.js` | The same outputs stacked by type, per quarter or per year | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/activities_type_over_time.html) |
| `collaborators_gender.py` | `collaborators_gender.png` (+ `_white` variant), the print version | — |
| `word_clouds.py` | `WordClouds/english_wordcloud.png` and `french_wordcloud.png` | — |

### `viz_common.py`

Dependency-free Python helpers: strict JSON/calendar-date loading, missing-gender normalization, and print palettes matching browser country and gender identities. The book timelines retain their monochrome publication styling.

## Data

| File | Records |
| --- | --- |
| `Book_DeGruyter/Maps/locations.json` | 33 GeoJSON points — name, country, type |
| `Book_DeGruyter/Maps/universities.json` | 4 GeoJSON points — name, country, city, logo file |
| `Book_DeGruyter/Timeline/data.json` | 37 events — date, country, category (Religion / Education / Politics), plus optional label-layout hints for the print version |
| `Final report/Data/Collaborators_data.json` | 93 collaborators — name, gender, affiliation, country, coordinates |
| `Final report/Data/Publications_and_activities_data.json` | 181 records — title, type, author(s), date, language, abstract |

## Getting started

Serve the repository root with any static server:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Then visit <http://localhost:8765/>. Opening HTML directly from disk does not work because pages fetch their JSON data.

### Tests and validation

Use Node.js 22.13 or later. The browser suite covers desktop/phone Chromium, plus a focused Firefox/WebKit compatibility suite. It checks interactions, filtered exports, keyboard access, failure fallbacks, and iframe layouts.

```bash
npm ci
npm run check
npx playwright install chromium firefox webkit
npm test
```

Browser tests serve the pinned npm releases locally and replace external basemaps with an empty style. This checks our rendering and behavior independently of third-party availability; it does not certify that a remote tile service is online. Reports and failure traces are retained in CI.

Research-data validation uses only Python's standard library:

```bash
python scripts/validate_data.py
python -m unittest discover -s tests/python -v
```

The six schemas in `schemas/` cover research JSON and the social-preview boundaries. Validation checks required fields, controlled categories, real calendar dates, numeric coordinate bounds, duplicate identities, polygon closure and local logo references. The bundled evaluator supports the schema keywords used here and rejects unsupported keywords. A full JSON Schema implementation can also consume the individual schema files. Coordinate bounds and valid dates do not verify historical accuracy.

### Print figures

Use Python 3.11 or later and a virtual environment. The core constraints capture the tested Python 3.12 Linux rendering environment; CI also exercises Python 3.11. They constrain core figure dependencies only, not the optional NLP pipeline.

```bash
python -m venv .venv
source .venv/bin/activate       # macOS / Linux
# Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt -c constraints-core.txt

python Book_DeGruyter/Timeline/timeline.py --output-dir build/figures
python "Final report/collaborators_gender.py" --output-dir build/figures
python .github/assets/social_preview.py --output-dir build/figures
```

The generators default to headless output and never render on import. Without `--output-dir`, they save beside their original script (preserving existing paths). Timeline and gender scripts accept `--show` for an interactive window and `--data` for an alternate dataset. Book fonts are optional licensed local files; otherwise the timeline uses DejaVu Sans.

For linting and the seeded word-cloud rendering test:

```bash
python -m pip install -r requirements-dev.txt -c constraints-core.txt
ruff check .
python -m unittest discover -s tests/python -v
```

The small WordCloud renderer is included in development dependencies so CI can test deterministic rendering from a count fixture without downloading language models. Core CI writes figures outside the checkout and retains them as artifacts.

### Optional word clouds

NLP dependencies are separate from core plotting. Resource installation is an explicit network operation; ordinary generation uses local resources only.

```bash
python -m pip install -r requirements-nlp.txt
python "Final report/word_clouds.py" --download-resources
python "Final report/word_clouds.py" --output-dir build/wordclouds
python "Final report/word_clouds.py" --weighting document --output-dir build/wordclouds
```

Setup installs NLTK `punkt_tab`, `stopwords`, and `wordnet`, plus the exact `fr_core_news_lg` **3.8.0** model compatible with spaCy 3.8. The French pipeline retains its tokenizer, morphology and lemmatization components and excludes unused parsing/NER. Texts are batched. A normal run fails with setup instructions if resources are unavailable; it never downloads them implicitly.

Each run writes term/count CSVs and `wordcloud_methods_token.json` or `wordcloud_methods_document.json`, alongside the PNGs. The manifest records source and resource hashes, coverage, Python/package/model versions, pipeline components, font hash, seed, and weighting. Document-frequency filenames include `_document` to coexist with token-frequency outputs. `--languages English` processes only English; `--frequencies-only` omits image rendering; `--seed` and `--font` make rendering choices explicit.

The optional NLP stack has version ranges and a pinned French model, not a fully tested transitive lock. The manifest records the actual environment. Reproducing a published cloud requires preserving its source file, manifest, dependencies, resources and font; a random seed alone does not guarantee identical output across environments.

## Research methods and provenance

The JSON files remain the primary records. Country means the recorded affiliation's country in collaborator figures, not nationality. Missing gender remains visible as **Unknown** and contributes to the denominator; no gender is inferred. Counts describe the recorded project corpus, not all possible collaborators or activities.

Currently 72 of 181 output records have no abstract. English word-cloud input covers 74 of 114 English records; French covers 34 of 65. German has one nonempty abstract across two records and is not processed by the English/French pipeline. The `Abstract` field includes both short abstracts and long blog text, so token frequency gives longer records more influence. Document frequency counts each term once per included record and offers a different, explicit weighting.

The pipeline lowercases text, applies language-specific stopwords and lemmatization, and publishes exact counts. English retains the existing WordNet noun-lemma method; French uses the pinned spaCy model. WordCloud receives counts directly, without a second tokenizer, plural normalization or stopword pass. The clouds are exploratory illustrations; the CSVs expose the quantities behind them.

Timeline dates are displayed as recorded. Some dates fall on 1 January, but the source data does not distinguish exact dates from year-only estimates. No precision or missing citations have been invented. The book provides the overarching scholarly source; item-level source identifiers, temporal precision and provenance can be added through documented future curation. Technical validation cannot replace that historical review.

## How to cite

If you use this repository — its code, its data or the figures it generates — please cite it. GitHub renders a ready-made citation from [`CITATION.cff`](CITATION.cff) via the **Cite this repository** button in the sidebar.

For the research itself, cite the book: <https://doi.org/10.1515/9783111428895>.

## License

- **Code** (Python scripts, `viz_common.py`, the JavaScript and CSS in `assets/` and next to each figure, HTML scaffolding, tests) — [MIT](LICENSE).
- **Research data and generated figures** (the JSON files, and the PNG / SVG outputs) — [CC BY 4.0](LICENSE-DATA).
- The university logos in `Book_DeGruyter/Maps/` and the national flag icons in `Book_DeGruyter/Timeline/` are third-party material and are covered by neither licence. The map pin icons in `assets/remoboko.js` are from [Font Awesome Free](https://fontawesome.com/license/free) (CC BY 4.0).

See [NOTICE.md](NOTICE.md) for the file-by-file breakdown.

## Acknowledgements

Funded through the Leibniz Competition and hosted by Leibniz-Zentrum Moderner Orient (ZMO), Berlin. Country boundaries in `.github/assets/` come from [Natural Earth](https://www.naturalearthdata.com/) (public domain). Basemaps by [OpenFreeMap](https://openfreemap.org/), © [OpenMapTiles](https://www.openmaptiles.org/), data from [OpenStreetMap](https://www.openstreetmap.org/copyright).
