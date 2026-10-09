"""Generate the report's gender proportion bar without network or import-time writes.

Two categories are a share, not a pie: like the interactive figure, the print
version is one bar with the headline number in its description.
"""

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from viz_common import TEXT_COLOR, format_share, gender_series, load_json

HERE = Path(__file__).resolve().parent
INK_2 = '#4a4a4a'
INK_3 = '#6f6f6f'
SOURCE = 'Source: Remoboko project data (CC BY 4.0). Gender as recorded in the project\'s collaborator list.'


def pick_font():
    """Source Sans 3 as on the web when installed, otherwise DejaVu Sans."""
    from matplotlib import font_manager
    installed = {font.name for font in font_manager.fontManager.ttflist}
    return next((family for family in ('Source Sans 3', 'Source Sans Pro') if family in installed), 'DejaVu Sans')


def create_chart(records):
    import matplotlib.pyplot as plt
    from matplotlib.patches import Patch, Rectangle

    series = gender_series(records)
    if not series:
        raise ValueError('Cannot draw the gender chart: there are no collaborators')
    total = sum(item['count'] for item in series)
    women = next((item for item in series if item['id'] == 'female'), None)
    description = (f"{women['count']} of the {total} people who collaborated with Remoboko are women, "
                   f"{format_share(women['share'])} of the total." if women
                   else f'The {total} people who collaborated with Remoboko, by gender.')

    plt.rcParams['font.family'] = [pick_font(), 'DejaVu Sans']
    fig = plt.figure(figsize=(10, 3.2), facecolor='none')
    fig.text(0.04, 0.9, 'Collaborators by gender', fontsize=18, fontweight='bold', color=TEXT_COLOR, va='top')
    fig.text(0.04, 0.77, description, fontsize=12, color=INK_2, va='top')
    fig.legend(handles=[Patch(facecolor=item['color'], label=f"{item['label']} {item['count']}") for item in series],
               loc='upper left', bbox_to_anchor=(0.035, 0.67), ncol=len(series), frameon=False,
               fontsize=11, handlelength=0.9, handleheight=0.9, handletextpad=0.5, columnspacing=1.6,
               labelcolor=INK_2)

    ax = fig.add_axes([0.04, 0.2, 0.92, 0.12])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.patch.set_alpha(0)
    gap = 2 / (0.92 * fig.get_figwidth() * 72)  # 2pt surface gap between segments
    renderer = fig.canvas.get_renderer() if hasattr(fig.canvas, 'get_renderer') else None
    start = 0
    for index, item in enumerate(series):
        width = item['share'] - (gap if index < len(series) - 1 else 0)
        ax.add_patch(Rectangle((start, 0), max(0, width), 1, facecolor=item['color'], edgecolor='none'))
        # Name and value above the segment start; a segment too narrow keeps the legend only.
        labels = [ax.text(start, 1.95, item['label'], fontsize=11, fontweight='bold', color=TEXT_COLOR, va='bottom', clip_on=False),
                  ax.text(start, 1.25, f"{item['count']} · {format_share(item['share'])}", fontsize=10, color=INK_3,
                          va='bottom', clip_on=False)]
        if renderer is not None:
            segment = ax.transData.transform((start + width, 0))[0] - ax.transData.transform((start, 0))[0]
            if max(label.get_window_extent(renderer).width for label in labels) + 8 > segment:
                for label in labels:
                    label.remove()
        start += item['share']
    fig.text(0.04, 0.06, SOURCE, fontsize=9, color=INK_3)
    return fig


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, default=HERE / 'Data/Collaborators_data.json')
    parser.add_argument('--output-dir', type=Path, default=HERE)
    parser.add_argument('--show', action='store_true', help='Display a window after saving')
    args = parser.parse_args(argv)
    if not args.show:
        import matplotlib
        matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    args.output_dir.mkdir(parents=True, exist_ok=True)
    fig = create_chart(load_json(args.data))
    try:
        for name, transparent in [('collaborators_gender.png', True), ('collaborators_gender_white.png', False)]:
            path = args.output_dir / name
            fig.savefig(path, transparent=transparent, facecolor='none' if transparent else 'white',
                        dpi=150, bbox_inches='tight', pad_inches=0.2)
            print(f'Chart saved as {path}')
        if args.show:
            plt.show()
    finally:
        plt.close(fig)


if __name__ == '__main__':
    main()
