"""
Shared helpers for the Remoboko print figures (matplotlib scripts).

The interactive figures are hand-written HTML/JavaScript pages that read
their tokens from assets/remoboko.css and assets/remoboko.js; the country
colours below are the same values, so print and screen stay consistent.
Scripts import this module by adding the repository root to sys.path:

    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # repo root
    from viz_common import ...
"""

import json

# --- Design tokens ---------------------------------------------------------

FONT_FAMILY = 'Open Sans, Arial, sans-serif'
TEXT_COLOR = '#333'
MUTED_TEXT_COLOR = '#666'
GRID_COLOR = '#eee'
AXIS_LINE_COLOR = '#ddd'

# Canonical country colors (identical to --rb-benin / --rb-togo /
# --rb-west-africa in assets/remoboko.css).
COUNTRY_HEX = {
    'Benin': '#3388ff',
    'Togo': '#2ecc71',
    'West Africa': '#e67e22',
}

# Neutral qualitative palette for categorical series (matches plotly Set2).
QUALITATIVE_PALETTE = [
    '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3',
    '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3',
]


# --- Data loading ----------------------------------------------------------

def load_json(path):
    """Load a UTF-8 JSON file."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)
