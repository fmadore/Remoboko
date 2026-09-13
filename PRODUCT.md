# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and ES-module JavaScript served from GitHub Pages, no build step. D3 (CDN) for charts, MapLibre GL (CDN) with OpenFreeMap vector styles for maps. Python stays only for print figures (matplotlib timelines, gender donut) and NLP word clouds.

## Users

Readers of the Remoboko project blog (remoboko.hypotheses.org), where the figures are embedded in iframes at fixed heights inside blog posts; readers of the De Gruyter monograph who follow the companion links to the interactive maps and timeline; and researchers or funders reading the final project report. They arrive from a text page, on desktop or phone, wanting to locate a place, read a distribution, or check a date, then go back to reading.

## Product Purpose

Publish the research data and interactive figures of Remoboko (Religion, Morality and Boko in West Africa), a Leibniz Junior Research Group (2018-2024, ZMO Berlin) that studied religiosity and secular education on university campuses in Togo, Benin, Niger and Nigeria. Success: each figure answers its question in seconds, embeds cleanly in a blog post, and keeps working at its existing URL.

## Positioning

The figures are built directly on the project's own published research data (33 geolocated campus sites, 37 dated events, 93 collaborators, 181 outputs), not on a generic dataset, and they stay citable: every page keeps its URL, and the data files sit beside it under CC BY 4.0.

## Operating Context

- Each HTML page is embedded via `<iframe>` on remoboko.hypotheses.org and also opened standalone from README and book links. Pages therefore fill their viewport and carry no site chrome.
- Existing URLs are permanent: `Book_DeGruyter/Maps/UAC_UL_locations_map.html`, `universities_map.html`, `points_of_interest.html`, `Book_DeGruyter/Timeline/index.html`, `Final report/collaborators_by_country.html`, `collaborators_map.html`, `treemap_chart.html`, `activities_type_over_time.html`.
- Hosting is GitHub Pages from the master branch; CI runs ruff and the Python print scripts.
- Basemaps: OpenFreeMap vector styles rendered by MapLibre GL (no API key). CARTO raster tiles are watermarked without a key and must not return.

## Capabilities and Constraints

Confirmed (must survive the rebuild):
- Image export of every chart (PNG and SVG), replacing the Plotly toolbar.
- Map search box with autocomplete and per-country marker toggles on the points-of-interest map.
- Detailed / Light / Dark basemap switch on every map.
- Same data files and same figures; interaction details may change.

Decided:
- The six Python generators (three folium maps, three Plotly charts) are deleted once their pages are hand-written; folium, branca and plotly leave requirements.txt.
- No build step, no framework, no bundler: pages must work when opened from GitHub Pages as plain files.

## Brand Commitments

- Name: Remoboko. Country colours are fixed identity: Benin blue `#3388ff`, Togo green `#2ecc71`, West Africa orange `#e67e22` (in `viz_common.py` and every map).
- University logos (`Book_DeGruyter/Maps/*.jpg`) and national flag icons (`Book_DeGruyter/Timeline/*_icon*.png`) are third-party assets, usable but not restyled.
- Visual register (standing preference, chosen 2026-09-13): plain editorial charts played straight, at Datawrapper's craft level. No decorative world, no marginalia; white ground, one workhorse sans, hairline grid, restrained colour, strong titles and source lines.
- Funder acknowledgement: Leibniz Competition, hosted by Leibniz-Zentrum Moderner Orient (ZMO).

## Evidence on Hand

- `Book_DeGruyter/Maps/locations.json`: 33 GeoJSON points (name, country, type: mosque/church/school/university/landmark).
- `Book_DeGruyter/Maps/map_universities.py`: four universities (Lomé, Abomey-Calavi, Kara, Parakou) with coordinates and logo files; to be moved to JSON.
- `Book_DeGruyter/Timeline/data.json`: 37 events 1960-2010, Togo and Benin, categories Religion / Education / Politics.
- `Final report/Data/Collaborators_data.json`: 93 collaborators (name, gender, affiliation, country, coordinates, blog URL).
- `Final report/Data/Publications_and_activities_data.json`: 181 outputs (title, type, authors, date, language, abstract), 2018-2025, 12 types, 3 languages.
- `.github/assets/west-africa.geo.json`: Natural Earth outlines of 13 countries (public domain).
- No testimonials, no usage metrics.

## Product Principles

- The figure is the page: no chrome that competes with the data inside an iframe.
- Every value reachable without hovering; tooltips enhance.
- Country identity is stable across every figure.
- Data lives in JSON beside the page; the page reads it at load, nothing is pre-rendered.
- Print and screen share one visual language but are produced by the right tool each.

## Accessibility & Inclusion

Figures are read on phones inside blog posts: legible at 360px wide, keyboard-reachable controls, colour never the only channel for identity.
