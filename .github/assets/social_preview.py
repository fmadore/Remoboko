"""
Generate the GitHub social preview card (1280x640 PNG).

    python .github/assets/social_preview.py

Writes .github/assets/social-preview.png, which is uploaded under
Settings > General > Social preview on github.com/fmadore/Remoboko.

Country boundaries come from west-africa.geo.json, a trimmed extract of
Natural Earth 1:50m Admin 0 Countries (public domain).
"""

import sys
from math import cos, radians
from pathlib import Path

import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import to_rgb
from matplotlib.patches import Circle, Polygon, Rectangle

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # repo root
from viz_common import COUNTRY_HEX, load_json

HERE = Path(__file__).resolve().parent

W, H = 1280, 640

# --- Palette ---------------------------------------------------------------

INK = '#0d1a24'          # card background
LAND = '#17293a'         # countries outside the study
LAND_EDGE = '#24394c'
GRATICULE = '#183041'
WHITE = '#ffffff'
BRIGHT = '#e8f1f7'
MUTED = '#8ba6b8'
DIM = '#5f7d92'

# Benin and Togo reuse the canonical project colors from viz_common; Niger
# takes the shared 'West Africa' orange and Nigeria one more palette hue.
FOCUS = {
    'BEN': ('Benin', "Université d'Abomey-Calavi", COUNTRY_HEX['Benin']),
    'TGO': ('Togo', 'Université de Lomé', COUNTRY_HEX['Togo']),
    'NER': ('Niger', 'Université Abdou Moumouni', COUNTRY_HEX['West Africa']),
    'NGA': ('Nigeria', 'University of Ibadan', '#ffd92f'),
}
ORDER = ['BEN', 'TGO', 'NER', 'NGA']

# Campus marker (lon, lat) plus the label anchor and its alignment. The two
# coastal campuses are ~120 km apart, so their labels are pulled apart into
# the empty water of the Gulf of Guinea with leader lines.
CAMPUSES = [
    ('NER', 'Niamey', 2.10, 13.50, 3.10, 13.50, 'left'),
    ('NGA', 'Ibadan', 3.90, 7.44, 5.00, 7.20, 'left'),
    # Both leader lines stay over water: the Niger Delta reaches no further
    # south than ~4.3 N, so the Abomey-Calavi label sits below that.
    ('BEN', 'Abomey-Calavi', 2.34, 6.42, 4.90, 3.60, 'left'),
    ('TGO', 'Lomé', 1.21, 6.18, -0.80, 4.10, 'right'),
]

LON_MIN, LON_MAX = -4.5, 15.4
LAT_MIN, LAT_MAX = 1.0, 19.0


def pick_font():
    """First installed family from the preference list, so findfont stays quiet."""
    from matplotlib import font_manager
    installed = {f.name for f in font_manager.fontManager.ttflist}
    for family in ('Open Sans', 'Segoe UI', 'Lato', 'Source Sans Pro'):
        if family in installed:
            return family
    return 'DejaVu Sans'


FONTS = pick_font()


def spaced(text):
    """Fake letter-spacing, which matplotlib text has no property for."""
    return ' '.join(text)


def draw_map(ax, geo):
    ax.set_xlim(LON_MIN, LON_MAX)
    ax.set_ylim(LAT_MIN, LAT_MAX)
    ax.set_aspect(1 / cos(radians((LAT_MIN + LAT_MAX) / 2)))
    ax.set_facecolor(INK)
    ax.axis('off')

    for lon in range(-5, 16, 5):
        ax.plot([lon, lon], [LAT_MIN, LAT_MAX], color=GRATICULE, lw=0.7, zorder=1)
    for lat in range(5, 21, 5):
        ax.plot([LON_MIN, LON_MAX], [lat, lat], color=GRATICULE, lw=0.7, zorder=1)

    for feature in geo['features']:
        iso = feature['properties']['iso']
        focus = FOCUS.get(iso)
        for poly in feature['geometry']['coordinates']:
            # Focus countries stay dark and let the coloured outline carry the
            # identity; a heavier fill turns the palette muddy on this ink.
            ax.add_patch(Polygon(
                poly[0], closed=True, edgecolor='none', zorder=2,
                facecolor=focus[2] if focus else LAND,
                alpha=0.17 if focus else 1.0,
            ))
            ax.add_patch(Polygon(
                poly[0], closed=True, facecolor='none', zorder=3,
                edgecolor=focus[2] if focus else LAND_EDGE,
                linewidth=2.0 if focus else 0.8,
            ))

    for iso, city, lon, lat, tx, ty, ha in CAMPUSES:
        color = FOCUS[iso][2]
        if abs(ty - lat) > 1.0:
            ax.plot([lon, tx], [lat, ty], color=color, lw=1.0, alpha=0.6, zorder=4)
        ax.scatter([lon], [lat], s=460, color=color, alpha=0.20, linewidths=0, zorder=5)
        ax.scatter([lon], [lat], s=115, facecolor=INK, edgecolor=color, linewidths=2.2, zorder=6)
        ax.scatter([lon], [lat], s=26, color=WHITE, linewidths=0, zorder=7)
        ax.text(
            tx + (0.32 if ha == 'left' else -0.32), ty, city, zorder=8,
            color=BRIGHT, fontsize=13, fontfamily=FONTS, ha=ha, va='center',
        )


def main():
    geo = load_json(HERE / 'west-africa.geo.json')

    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100, facecolor=INK)

    # Map panel, bleeding off the right, top and bottom edges.
    ax = fig.add_axes([0.40, -0.14, 0.64, 1.28])
    draw_map(ax, geo)

    # Overlay in pixel coordinates, origin top-left, so every offset below is
    # a real pixel measurement rather than a figure fraction.
    ov = fig.add_axes([0, 0, 1, 1], zorder=15)
    ov.set_xlim(0, W)
    ov.set_ylim(H, 0)
    ov.set_aspect('equal')
    ov.axis('off')
    ov.patch.set_alpha(0)

    # The map keeps a fixed geographic aspect, so matplotlib shrinks its box to
    # fit. Draw once to learn where the map actually starts, then anchor the
    # gradient scrim there -- otherwise the map ends in a hard vertical edge.
    fig.canvas.draw()
    map_left = ax.get_position().x0 * W

    scrim = np.zeros((1, 256, 4))
    scrim[..., :3] = to_rgb(INK)
    scrim[..., 3] = np.linspace(1.0, 0.0, 256)
    ov.imshow(scrim, extent=[map_left - 4, map_left + 320, H, 0],
              interpolation='bilinear', zorder=1)

    def txt(x, y, s, size, color, weight='normal', ha='left'):
        ov.text(x, y, s, fontsize=size, color=color, fontweight=weight,
                fontfamily=FONTS, ha=ha, va='center', zorder=20)

    x0 = 72
    txt(x0, 96, spaced('LEIBNIZ JUNIOR RESEARCH GROUP'), 11, DIM)
    txt(x0, 121, spaced('ZMO BERLIN · 2018–2024'), 11, DIM)

    txt(x0, 197, 'Remoboko', 68, WHITE, weight='bold')

    for i, iso in enumerate(ORDER):
        ov.add_patch(Rectangle((x0 + i * 46, 243), 34, 5,
                               facecolor=FOCUS[iso][2], edgecolor='none', zorder=20))

    txt(x0, 297, 'Religion, Morality and Boko', 25, BRIGHT)
    txt(x0, 331, 'in West Africa', 25, BRIGHT)

    txt(x0, 384, 'Research data, Python code and interactive', 15.5, MUTED)
    txt(x0, 408, 'visualisations: maps, timelines, charts, word clouds.', 15.5, MUTED)

    for i, iso in enumerate(ORDER):
        country, university, color = FOCUS[iso]
        y = 468 + i * 28
        ov.add_patch(Circle((x0 + 5, y), 4.5, facecolor=color, edgecolor='none', zorder=20))
        txt(x0 + 22, y, country, 13, BRIGHT)
        txt(x0 + 96, y, university, 13, DIM)

    txt(x0, 594, 'github.com/fmadore/Remoboko', 13, DIM)

    out = HERE / 'social-preview.png'
    fig.savefig(out, dpi=100, facecolor=INK)
    plt.close(fig)
    print(f'Wrote {out} ({out.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
