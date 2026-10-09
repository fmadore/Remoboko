# CLAUDE.md

Guidance for maintaining Remoboko's research figures and data.

## Product and permanent URLs

This is a static research publication: hand-written HTML/JavaScript on GitHub Pages, plus Python print figures. Read `PRODUCT.md` and `DESIGN.md`. Keep every existing figure URL working: they are embedded on remoboko.hypotheses.org and linked from the book. Do not introduce a framework or application build step.

- `Book_DeGruyter/Maps/UAC_UL_locations_map.html` and `points_of_interest.html` share `locations-map.js`.
- `Book_DeGruyter/Maps/universities_map.html` uses `universities-map.js`.
- `Book_DeGruyter/Timeline/index.html` uses `script.js`.
- `Final report/` contains country, gender, affiliation-map, treemap and activities-over-time figures.
- Root `index.html` lists the figures.

## Development and verification

```bash
# Local interactive figures
python scripts/serve.py --port 8765   # or any static server

# Node >=22.22.2; pinned local libraries support network-independent browser tests
npm ci
npm run check
npx playwright install chromium firefox webkit
npm test

# Python >=3.12, in a virtual environment
python -m pip install -r requirements-dev.txt -c constraints-core.txt
ruff check .
python scripts/validate_data.py
python -m unittest discover -s tests/python -v

# Generate outside the checkout when checking changes
python Book_DeGruyter/Timeline/timeline.py --output-dir /tmp/remoboko-figures
python "Final report/collaborators_gender.py" --output-dir /tmp/remoboko-figures
python .github/assets/social_preview.py --output-dir /tmp/remoboko-figures
```

Inspect generated figures before updating committed PNG/SVG artifacts. Python imports must not download resources, load NLP models, change Matplotlib backends, or write outputs. Print generators default to headless operation; timeline/gender accept `--show`. Preserve monochrome book styling and optional licensed De Gruyter fonts with a DejaVu fallback.

CI validates data, lints Python/JavaScript, runs unit and browser tests, and generates print figures outside the checkout. It retains figures and browser reports/traces. Dependencies and Actions receive Dependabot updates; Actions are SHA-pinned. Browser tests substitute pinned local libraries and a blank style, so they do not depend on external map/CDN uptime.

## Shared architecture

- `assets/tokens.js`: country/categorical palettes, basemap URLs and source attribution.
- `assets/data.js`: pure strict-date parsing, record normalization, aggregation, full time intervals, colour contrast.
- `assets/remoboko.js`: data loading, DOM controls, keyboard tooltips, legends, tables, responsive sizing, query-state helpers and actions.
- `assets/export.js`: independent publication exports, SVG style/font embedding and metadata wrapping.
- `assets/maps.js`: stable map identities, validated location/institution preparation, accessible data fallback and map lifecycle.
- `assets/d3.js`: single pinned D3 CDN module; synchronize versions with `package.json`.
- `assets/remoboko.css`: tokens, chart/map layouts, keyboard focus and table styles.
- `viz_common.py`: dependency-free Python JSON/date loading, gender normalization and matching print identities.
- `scripts/validate_data.py` and `schemas/`: executable contracts for all six research/geometry JSON files.

Use the relevant small module rather than adding unrelated code to `remoboko.js`. Browser pure data functions are tested with Node; DOM behavior with jsdom/Playwright. Tests should check real values, state transitions and exports, including empty/malformed records and short iframes.

## Figure behavior to preserve

- Country identity: Benin `#3388ff`, Togo `#2ecc71`, West Africa `#e67e22`, mirrored in Python and CSS.
- Fixed categorical palette; the seven largest named output types plus a grey remainder. Keep meaning stable when filtering.
- Every chart value is available without hovering. Use keyboard-accessible marks/controls and a table; do not put focusable descendants under `aria-hidden`.
- PNG/SVG exports and CSV describe the current view, including visible series, timeline theme or treemap drilldown. Use readable fallback fonts if external fonts fail.
- Timeline theme, activity period/hidden series and treemap path persist in query parameters. Ignore invalid optional state safely; preserve existing permanent pathnames.
- Complete time periods include zero-output intervals; parse dates strictly in UTC.
- Missing gender is `unknown`, kept in totals, without inference. Python and browser use women blue, men orange and other/unknown grey.
- Maps provide a readable table before importing the map library, with retry/status for failures. Keep location search keyboard-operable and marker controls semantic.
- OpenFreeMap vector styles (Detailed/Light/Dark), no API key. Do not return to keyed CARTO raster tiles. MapLibre 6 uses named ESM exports.
- Fit markers with padding for floating controls; do not change the book map's initial Benin/Togo focus to the entire regional dataset.
- Pages embed at arbitrary iframe sizes. Measure the available figure content area rather than recursing on a plot's own expanding height.
- Put data text into `textContent`; validate URLs before building links.

## Data and research scope

Data stays alongside its figures. The current files contain 33 locations, four universities, 37 events, 93 collaborators and 181 outputs. Counts are descriptive snapshots, not validation constants. Change research facts only with supporting evidence. Schema changes must accompany intentional new fields/categories.

Timeline `label`, `wrap` and `x` are print layout hints, not historical facts. Current dates have no explicit precision field or item-level citations: never infer uncertain precision from a January date or invent a source. Collaborator country refers to recorded affiliation location. The data schemas validate structure, calendar dates, coordinate ranges and asset existence; they do not establish scholarly accuracy.

## Optional NLP and reproducibility

```bash
python -m pip install -r requirements-nlp.txt
python "Final report/word_clouds.py" --download-resources
python "Final report/word_clouds.py" --output-dir /tmp/remoboko-clouds
python "Final report/word_clouds.py" --weighting document --output-dir /tmp/remoboko-clouds
```

Only `--download-resources` may download NLTK corpora and the pinned `fr_core_news_lg` 3.8.0 model (spaCy 3.8). Ordinary runs must be offline. English uses NLTK WordNet noun lemmatization; French retains morphology/lemmatization, excludes parser/NER, and batches texts. Do not change models or language methods without examining their impact on counts.

Generate exact token counters first, export CSV, and pass frequencies directly into seeded WordCloud rendering. Document mode counts a term once per record. Record source/resource/font hashes, included/omitted records, package/model versions and seed in the methods JSON. Abstracts are incomplete and mix short abstracts with long blog posts; disclose coverage and weighting. German is outside this pipeline. Core constraints are tested; the optional NLP dependency ranges are not a validated full transitive lock. See README for commands and limitations.
