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

- [Collaborators by country](https://fmadore.github.io/Remoboko/Final%20report/collaborators_by_country.html) · [by affiliation, on a map](https://fmadore.github.io/Remoboko/Final%20report/collaborators_map.html)
- [Publications and activities by type and language](https://fmadore.github.io/Remoboko/Final%20report/treemap_chart.html) · [over time](https://fmadore.github.io/Remoboko/Final%20report/activities_type_over_time.html)

Every chart offers a table view and PNG/SVG download. Maps use [OpenFreeMap](https://openfreemap.org/) vector tiles rendered with MapLibre GL, which need no API key.

## Contents

### `assets/`

The shared design system for the interactive figures: `remoboko.css` (tokens, layout, legend, tooltip, table and map styles) and `remoboko.js` (colours, data loading, tooltip, legend, segmented control, table view, PNG/SVG export). Charts use [D3](https://d3js.org/) and maps use [MapLibre GL](https://maplibre.org/), both loaded from a CDN as ES modules; there is no build step.

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
| `treemap_chart.html` + `.js` | 181 publications and activities by type, language and year | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/treemap_chart.html) |
| `activities_type_over_time.html` + `.js` | The same outputs stacked by type, per quarter or per year | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/activities_type_over_time.html) |
| `collaborators_gender.py` | `collaborators_gender.png` (+ `_white` variant), a print figure | — |
| `word_clouds.py` | `WordClouds/english_wordcloud.png` and `french_wordcloud.png` | — |

### `viz_common.py`

Design tokens shared by the Python print scripts (the country colours match `assets/remoboko.css`) and `load_json`.

## Data

| File | Records |
| --- | --- |
| `Book_DeGruyter/Maps/locations.json` | 33 GeoJSON points — name, country, type |
| `Book_DeGruyter/Maps/universities.json` | 4 GeoJSON points — name, country, city, logo file |
| `Book_DeGruyter/Timeline/data.json` | 37 events — date, country, category (Religion / Education / Politics), plus optional label-layout hints for the print version |
| `Final report/Data/Collaborators_data.json` | 93 collaborators — name, gender, affiliation, country, coordinates |
| `Final report/Data/Publications_and_activities_data.json` | 181 records — title, type, author(s), date, language, abstract |

## Getting started

The interactive figures are plain files. Serve the repository root with any static server and open a page:

```bash
python -m http.server 8765
```

Then visit <http://localhost:8765/>. Opening the HTML files directly from disk does not work, because the pages fetch their JSON data.

To run the smoke tests (every page loads, draws its marks from the data and throws no errors, on desktop and phone):

```bash
npm ci
npx playwright install chromium
npm test
```

The print figures still need Python:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS / Linux

pip install -r requirements.txt
python -m spacy download fr_core_news_lg   # only needed for word_clouds.py

python Book_DeGruyter/Timeline/timeline.py
python "Final report/collaborators_gender.py"
```

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
