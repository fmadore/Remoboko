# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remoboko is a research data visualization project for studying religiosity and secular education in West Africa. It publishes interactive maps, charts and a timeline (hand-written HTML/JavaScript, served from GitHub Pages) plus a few print figures (Python) from research data about Christian and Muslim student activism on university campuses in Togo, Benin, Niger, and Nigeria.

## Development Environment

```bash
# Interactive figures: any static server at the repo root, no build step
python -m http.server 8765        # then open http://localhost:8765/

# Smoke tests (Playwright, desktop + phone)
npm ci
npx playwright install chromium
npm test

# Print figures (Python)
.venv\Scripts\activate   # Windows
source .venv/bin/activate  # Unix
pip install -r requirements.txt
python -m spacy download fr_core_news_lg   # word clouds only
```

## Running Scripts

```bash
python Book_DeGruyter/Timeline/timeline.py       # Religion_Timeline.png/svg and Education_Politics_Timeline.png/svg
python "Final report/collaborators_gender.py"    # collaborators_gender.png (+ _white.png variant)
python "Final report/word_clouds.py"             # WordClouds/*.png
python .github/assets/social_preview.py          # .github/assets/social-preview.png (1280x640)
```

## Architecture

### Interactive figure pages (permanent URLs, embedded in iframes on remoboko.hypotheses.org)
- `Book_DeGruyter/Maps/UAC_UL_locations_map.html` and `points_of_interest.html` — identical shells sharing `locations-map.js` (both URLs must keep working)
- `Book_DeGruyter/Maps/universities_map.html` + `universities-map.js` (data in `universities.json`)
- `Book_DeGruyter/Timeline/index.html` + `script.js`
- `Final report/collaborators_by_country.html`, `collaborators_map.html`, `treemap_chart.html`, `activities_type_over_time.html`, each with a `.js` of the same name
- `index.html` at the root lists them all

Every page is `<figure>`-shaped (title, description, controls row, plot, footer with source line and actions) or a full-viewport map with floating cards. Pages load D3 and MapLibre GL from jsdelivr as ES modules and import `assets/remoboko.js` with a relative path. Never rename or move a page: the URLs are referenced from the blog and the book.

### Shared design system
- `assets/remoboko.css` — tokens (`--rb-*`), figure layout, legend, segmented control, tooltip, table view, chart mark classes, map cards and markers
- `assets/remoboko.js` — country colours, the validated 8-slot categorical palette, basemap style URLs, Font Awesome icon paths, `loadJSON`, `el`, `createTooltip`, `renderLegend`, `renderSegmented`, `renderActions` (table toggle + PNG/SVG export with the web font embedded), `buildTable`, `onResize`
- `viz_common.py` — the same country colours for the Python print scripts, plus `load_json`

### Data Sources
- `Book_DeGruyter/Timeline/data.json` - Timeline events (date, country, category, plus optional `label`/`wrap`/`x` fields used only by the matplotlib print version)
- `Book_DeGruyter/Maps/locations.json` - GeoJSON points of interest (name, country, type)
- `Book_DeGruyter/Maps/universities.json` - GeoJSON of the four universities (name, country, city, logo)
- `Final report/Data/Collaborators_data.json` - Collaborator info (name, country, gender, affiliation, coordinates, URL)
- `Final report/Data/Publications_and_activities_data.json` - Publications/activities with type, language, date, abstract
- `.github/assets/west-africa.geo.json` - Trimmed Natural Earth country outlines, used only by the social preview generator

### Key Patterns
- Basemaps are OpenFreeMap vector styles (Liberty / Positron / Dark) rendered by MapLibre GL; they need no API key. Do not switch back to CARTO raster tiles: without a key every tile is watermarked "API KEY REQUIRED". maplibre-gl 6 is ESM-only and exposes named exports, so import it as a namespace (`import * as maplibregl`)
- Country identity is fixed: Benin `#3388ff`, Togo `#2ecc71`, West Africa `#e67e22`, in both `assets/remoboko.css` and `viz_common.py`
- Categorical series use the fixed-order palette in `assets/remoboko.js`; past eight series fold into "Other" (grey), hues are never generated. The palette was validated with the dataviz skill's `validate_palette.js`
- Charts read the JSON at load, aggregate in the browser, and re-draw on resize (`onResize`). Every value is reachable without hovering (direct labels or the table view), and tooltips are built with `textContent`
- Pages must work inside an iframe of any size: `.rb-figure` is a `100dvh` flex column, the plot flexes, and short frames scroll
- Timeline label layout for the print version (manual x positions, wrapping) lives in `data.json` per event, not in code
- Word cloud generation uses NLTK for English and spaCy for French text processing
- CI (`.github/workflows/ci.yml`) lints with ruff, runs the Python print scripts headless, and runs the Playwright smoke tests in `tests/`
- Design context for the impeccable skill lives in `PRODUCT.md` and `DESIGN.md`
