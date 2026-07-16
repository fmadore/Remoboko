# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remoboko is a research data visualization project for studying religiosity and secular education in West Africa. It generates interactive maps, timelines, charts, and word clouds from research data about Christian and Muslim student activism on university campuses in Togo, Benin, Niger, and Nigeria.

## Development Environment

```bash
# Activate virtual environment
.venv\Scripts\activate   # Windows
source .venv/bin/activate  # Unix

# Install dependencies
pip install -r requirements.txt

# For word cloud generation, also install spaCy French model
python -m spacy download fr_core_news_lg
```

## Running Scripts

All Python scripts are standalone and output HTML/PNG/SVG files to their respective folders:

```bash
# Book visualizations
python Book_DeGruyter/Maps/map_locations.py      # Outputs UAC_UL_locations_map.html
python Book_DeGruyter/Maps/map_universities.py   # Outputs universities_map.html
python Book_DeGruyter/Timeline/timeline.py       # Outputs Religion_Timeline.png/svg and Education_Politics_Timeline.png/svg

# Final report visualizations
python "Final report/collaborators_country.py"   # Outputs collaborators_by_country.html
python "Final report/collaborators_map.py"       # Outputs collaborators_map.html
python "Final report/collaborators_gender.py"    # Outputs collaborators_gender.png (+ _white.png variant)
python "Final report/treemap.py"                 # Outputs treemap_chart.html
python "Final report/activities_type_time.py"    # Outputs activities_type_over_time.html
python "Final report/word_clouds.py"             # Outputs WordClouds/*.png
```

## Architecture

### Data Sources
- `Book_DeGruyter/Timeline/data.json` - Timeline events (date, country, category, plus optional `label`/`wrap`/`x` fields controlling matplotlib label layout)
- `Book_DeGruyter/Maps/locations.json` - Canonical GeoJSON for points of interest (name, country, type); consumed by both `map_locations.py` and `points_of_interest.html`
- `Final report/Data/Collaborators_data.json` - Collaborator info (name, country, gender, affiliation, coordinates)
- `Final report/Data/Publications_and_activities_data.json` - Publications/activities with type, language, date, abstract

### Shared Module
- `viz_common.py` (repo root) - design tokens (fonts, country colors, qualitative palette), `load_json`, the standard folium base map (`create_base_map`), and the `remoboko` Plotly template (`register_plotly_template`) plus `plotly_config`. Scripts import it by inserting the repo root into `sys.path`.

### Visualization Libraries
- **folium/branca**: Interactive maps with markers, popups, and custom legends
- **plotly**: Interactive charts (bar charts, sunburst diagrams, stacked bar charts)
- **matplotlib**: Static charts (pie charts, timelines) and word clouds
- **D3.js**: Browser-based timeline (`Book_DeGruyter/Timeline/index.html` + `script.js`)

### Key Patterns
- Scripts determine their output path from their own file location
- Map markers use color coding by country (blue=Benin, green=Togo, orange=West Africa) and Font Awesome icons by location type (mosque/church/school/university/landmark)
- Timeline label layout (manual x positions, wrapping) lives in `data.json` per event, not in code
- Word cloud generation uses NLTK for English and spaCy for French text processing
- CI (`.github/workflows/ci.yml`) lints with ruff and runs every script headless
