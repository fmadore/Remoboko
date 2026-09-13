# Licensing notice

This repository is dual-licensed. The scope note lives here rather than inside
`LICENSE`, because GitHub only recognises a licence file that contains the
standard text verbatim.

## Code — MIT (`LICENSE`)

The Python scripts, `viz_common.py`, the shared front-end in `assets/`
(`remoboko.css`, `remoboko.js`), the HTML pages and the JavaScript next to
each of them (`Book_DeGruyter/Maps/*.html` and `*.js`,
`Book_DeGruyter/Timeline/index.html` and `script.js`, `Final report/*.html`
and `*.js`, `index.html`), and the Playwright tests in `tests/`.

## Research data and generated figures — CC BY 4.0 (`LICENSE-DATA`)

- `Book_DeGruyter/Maps/locations.json`
- `Book_DeGruyter/Maps/universities.json`
- `Book_DeGruyter/Timeline/data.json`
- `Final report/Data/Collaborators_data.json`
- `Final report/Data/Publications_and_activities_data.json`
- The generated outputs: the `.png` and `.svg` timelines, charts and word
  clouds, and the images the interactive pages export.

Attribution should cite the repository (see `CITATION.cff`) or the monograph,
<https://doi.org/10.1515/9783111428895>.

## Third-party material

- `Book_DeGruyter/Maps/University_*.jpg` — university logos, reproduced for
  identification purposes only; neither licence applies.
- `Book_DeGruyter/Timeline/*_icon*.png` — national flag icons; neither
  licence applies.
- The map-pin and control icons embedded in `assets/remoboko.js` are from
  [Font Awesome Free 6.7.2](https://fontawesome.com/license/free)
  (icons: CC BY 4.0).
- The interactive pages load [D3](https://d3js.org/) (ISC) and
  [MapLibre GL JS](https://maplibre.org/) (BSD-3-Clause) from a CDN at run
  time, and basemaps from [OpenFreeMap](https://openfreemap.org/)
  (© OpenMapTiles, data © OpenStreetMap contributors, ODbL).

## Public domain

- `.github/assets/west-africa.geo.json` — a trimmed extract of
  [Natural Earth](https://www.naturalearthdata.com/) 1:50m Admin 0 Countries.
