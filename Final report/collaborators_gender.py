"""Generate the report's gender donut without network or import-time writes."""

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from viz_common import TEXT_COLOR, gender_series, load_json

HERE = Path(__file__).resolve().parent


def create_chart(records):
    import matplotlib.pyplot as plt

    series = gender_series(records)
    if not series:
        raise ValueError('Cannot draw the gender chart: there are no collaborators')
    total = sum(item['count'] for item in series)
    fig, ax = plt.subplots(figsize=(10, 8), facecolor='none')
    ax.set_facecolor('none')
    wedges, _, autotexts = ax.pie(
        [item['count'] for item in series], autopct='%1.1f%%', startangle=90,
        colors=[item['color'] for item in series],
        wedgeprops={'width': 0.6, 'edgecolor': 'white', 'linewidth': 2},
        pctdistance=0.75, shadow=False, explode=[0.02] * len(series),
    )
    for text in autotexts:
        text.set_color(TEXT_COLOR)
        text.set_fontsize(14)
        text.set_fontweight('bold')
        text.set_bbox({'facecolor': 'white', 'edgecolor': 'none', 'pad': 2})
    ax.text(0, 0, f'{total}\nTotal', ha='center', va='center',
            fontsize=24, fontweight='bold', color=TEXT_COLOR)
    ax.set_title('Distribution of Collaborators by Gender', fontsize=18,
                 fontweight='bold', color=TEXT_COLOR, pad=20)
    ax.legend(wedges, [f"{item['label']} ({item['count']})" for item in series],
              title='Gender', loc='center left', bbox_to_anchor=(1, 0, 0.5, 1),
              fontsize=12, title_fontsize=13, frameon=False)
    ax.axis('equal')
    fig.tight_layout()
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
                        dpi=150, bbox_inches='tight')
            print(f'Chart saved as {path}')
        if args.show:
            plt.show()
    finally:
        plt.close(fig)


if __name__ == '__main__':
    main()
