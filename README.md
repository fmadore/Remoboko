# Remoboko

[![CI](https://github.com/fmadore/Remoboko/actions/workflows/ci.yml/badge.svg)](https://github.com/fmadore/Remoboko/actions/workflows/ci.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA)
[![Project website](https://img.shields.io/badge/website-remoboko.hypotheses.org-informational)](https://remoboko.hypotheses.org/)
[![Live visualisations](https://img.shields.io/badge/live-visualisations-success)](https://fmadore.github.io/Remoboko/)

**Religion, Morality and Boko in West Africa**

Research data, Python code and interactive visualisations from Remoboko, a study of religiosity and how it affects secular education (*boko*, in Hausa) in West Africa.

The project focused on the presence, competition and conflict between secularism, Salafism and Pentecostalism on four campuses — Université Abdou Moumouni (Niamey, Niger), University of Ibadan (Nigeria), Université de Lomé (Togo) and Université d'Abomey-Calavi (Benin). It examined how students seeking a degree that would ensure them a better life resort to Salafism and Pentecostalism, and how *boko* in this context is both appealing and rejected.

Remoboko was a Leibniz Junior Research Group that ran from June 2018 to 2024. It was based at [Leibniz-Zentrum Moderner Orient](https://www.zmo.de/) (ZMO) in Berlin and funded through the Leibniz Competition. Project blog: <https://remoboko.hypotheses.org/>.

## Interactive visualisations

Every HTML visualisation in this repository is served live from GitHub Pages — no download or Python install needed.

**Maps for the book:**

- [Points of interest around Abomey-Calavi and Lomé](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/UAC_UL_locations_map.html) — 33 churches, mosques, schools, universities and landmarks
- [Universities of Benin and Togo](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/universities_map.html)
- [Timeline of religion, education and politics](https://fmadore.github.io/Remoboko/Book_DeGruyter/Timeline/index.html) — 37 events, 1960–2010

**Final report:**

- [Collaborators by country](https://fmadore.github.io/Remoboko/Final%20report/collaborators_by_country.html) · [mapped by affiliation](https://fmadore.github.io/Remoboko/Final%20report/collaborators_map.html)
- [Publications and activities by type and language](https://fmadore.github.io/Remoboko/Final%20report/treemap_chart.html) · [over time](https://fmadore.github.io/Remoboko/Final%20report/activities_type_over_time.html)

## Contents

### `Book_DeGruyter/`

Code and data for the maps and timelines in the monograph:

> Frédérick Madore, *Religious Activism on Campuses in Togo and Benin: Christian and Muslim Students Navigating Authoritarianism and Laïcité, 1970–2023*. ZMO-Studien 48. Berlin: De Gruyter, 2025. <https://doi.org/10.1515/9783111428895>

| Path | What it produces | View |
| --- | --- | --- |
| `Maps/map_locations.py` | `UAC_UL_locations_map.html` — 33 points of interest (churches, mosques, schools, universities, landmarks) around Abomey-Calavi and Lomé | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/UAC_UL_locations_map.html) |
| `Maps/map_universities.py` | `universities_map.html` — the four Beninese and Togolese universities, with logos as markers | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/universities_map.html) |
| `Maps/points_of_interest.html` | Standalone Leaflet view of the same `locations.json` | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Maps/points_of_interest.html) |
| `Timeline/timeline.py` | `Religion_Timeline` and `Education_Politics_Timeline` (PNG + SVG) — 37 events, 1960–2010, across Togo and Benin | — |
| `Timeline/index.html` + `script.js` | D3.js version of the timeline for the browser | [Open ↗](https://fmadore.github.io/Remoboko/Book_DeGruyter/Timeline/index.html) |

### `Final report/`

Code, data and figures for the project's final report:

| Path | What it produces | View |
| --- | --- | --- |
| `collaborators_country.py` | `collaborators_by_country.html` — 93 collaborators across 24 countries | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/collaborators_by_country.html) |
| `collaborators_map.py` | `collaborators_map.html` — the same collaborators geolocated by affiliation | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/collaborators_map.html) |
| `collaborators_gender.py` | `collaborators_gender.png` (+ `_white` variant) | — |
| `treemap.py` | `treemap_chart.html` — 181 publications and activities by type and language | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/treemap_chart.html) |
| `activities_type_time.py` | `activities_type_over_time.html` — output by type, 2018–2025 | [Open ↗](https://fmadore.github.io/Remoboko/Final%20report/activities_type_over_time.html) |
| `word_clouds.py` | `WordClouds/english_wordcloud.png` and `french_wordcloud.png` | — |

### `viz_common.py`

Shared design tokens (fonts, country colours, qualitative palette), `load_json`, the standard folium base map and the `remoboko` Plotly template. Every script imports it so the figures stay visually consistent.

## Data

| File | Records |
| --- | --- |
| `Book_DeGruyter/Maps/locations.json` | 33 GeoJSON points — name, country, type |
| `Book_DeGruyter/Timeline/data.json` | 37 events — date, country, category (Religion / Education / Politics), plus optional label-layout hints |
| `Final report/Data/Collaborators_data.json` | 93 collaborators — name, gender, affiliation, country, coordinates |
| `Final report/Data/Publications_and_activities_data.json` | 181 records — title, type, author(s), date, language, abstract |

## Getting started

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS / Linux

pip install -r requirements.txt
python -m spacy download fr_core_news_lg   # only needed for word_clouds.py
```

Every script is standalone and writes its output next to itself:

```bash
python Book_DeGruyter/Maps/map_locations.py
python "Final report/treemap.py"
```

## How to cite

If you use this repository — its code, its data or the figures it generates — please cite it. GitHub renders a ready-made citation from [`CITATION.cff`](CITATION.cff) via the **Cite this repository** button in the sidebar.

For the research itself, cite the book: <https://doi.org/10.1515/9783111428895>.

## License

- **Code** (Python scripts, `viz_common.py`, `script.js`, HTML scaffolding) — [MIT](LICENSE).
- **Research data and generated figures** (the JSON files, and the PNG / SVG / HTML outputs) — [CC BY 4.0](LICENSE-DATA).
- The university logos in `Book_DeGruyter/Maps/` and the national flag icons in `Book_DeGruyter/Timeline/` are third-party material and are covered by neither licence.

See [NOTICE.md](NOTICE.md) for the file-by-file breakdown.

## Acknowledgements

Funded through the Leibniz Competition and hosted by Leibniz-Zentrum Moderner Orient (ZMO), Berlin. Country boundaries in `.github/assets/` come from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
