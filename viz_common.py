"""
Shared helpers for the Remoboko visualization scripts.

Keeps typography, colors, folium map setup and Plotly styling consistent
across every figure. Scripts import this module by adding the repository
root to sys.path:

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

# Canonical country colors, shared by every map and chart that encodes
# Benin/Togo/West Africa. Hex values for CSS/SVG, named values for
# folium.Icon (which only accepts a fixed color list).
COUNTRY_HEX = {
    'Benin': '#3388ff',
    'Togo': '#2ecc71',
    'West Africa': '#e67e22',
}
COUNTRY_ICON_COLORS = {
    'Benin': 'darkblue',
    'Togo': 'green',
    'West Africa': 'orange',
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


# --- Folium ----------------------------------------------------------------

def create_base_map(location, zoom_start):
    """
    Create the project's standard folium base map: CartoDB Voyager default
    plus Light/Dark tile options, fullscreen, minimap and mouse position.
    Call folium.LayerControl(collapsed=False).add_to(m) after adding layers.
    """
    import folium
    from folium.plugins import Fullscreen, MiniMap, MousePosition

    m = folium.Map(location=location, zoom_start=zoom_start, tiles=None)

    folium.TileLayer('CartoDB Voyager', name='Detailed', show=True).add_to(m)
    folium.TileLayer('CartoDB Positron', name='Light').add_to(m)
    folium.TileLayer('CartoDB DarkMatter', name='Dark').add_to(m)

    Fullscreen(position='topleft').add_to(m)
    MiniMap(position='bottomright', width=120, height=120, toggle_display=True).add_to(m)
    MousePosition(position='bottomleft', prefix='Coordinates:').add_to(m)
    return m


# --- Plotly ----------------------------------------------------------------

def register_plotly_template():
    """
    Register and activate the 'remoboko' Plotly template: plotly_white with
    Open Sans, transparent backgrounds and the project's axis/hover styling.
    """
    import plotly.graph_objects as go
    import plotly.io as pio

    axis_style = dict(
        gridcolor=GRID_COLOR,
        showline=True,
        linewidth=1,
        linecolor=AXIS_LINE_COLOR,
        title=dict(font=dict(size=14)),
    )
    pio.templates['remoboko'] = go.layout.Template(
        layout=dict(
            font=dict(family=FONT_FAMILY, size=13, color=TEXT_COLOR),
            title=dict(font=dict(size=20, color=TEXT_COLOR), x=0.5, xanchor='center'),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            hoverlabel=dict(
                bgcolor='white',
                font_size=13,
                font_family=FONT_FAMILY,
                font_color=TEXT_COLOR,
                bordercolor=AXIS_LINE_COLOR,
            ),
            colorway=QUALITATIVE_PALETTE,
            xaxis=axis_style,
            yaxis=axis_style,
        )
    )
    pio.templates.default = 'plotly_white+remoboko'


def plotly_config(filename, width=1000, height=600):
    """Standard interactive config for fig.write_html()."""
    return {
        'displayModeBar': True,
        'modeBarButtonsToAdd': ['downloadSVG'],
        'modeBarButtonsToRemove': ['lasso2d', 'select2d'],
        'displaylogo': False,
        'toImageButtonOptions': {
            'format': 'png',
            'filename': filename,
            'height': height,
            'width': width,
            'scale': 2,
        },
    }
