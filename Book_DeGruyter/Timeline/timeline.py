"""Generate the book's monochrome print timelines, preserving manual label hints."""

import argparse
from datetime import date, timedelta
from pathlib import Path
import sys
import textwrap

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from viz_common import load_json, parse_date

HERE = Path(__file__).resolve().parent


def setup_fonts():
    """Use licensed local book fonts when supplied; otherwise DejaVu Sans."""
    import matplotlib.pyplot as plt
    from matplotlib import font_manager

    families = []
    for filename in ('De-Gruyter-Sans-Regular.otf', 'De-Gruyter-Sans-Bold.otf'):
        path = HERE / filename
        if path.exists():
            font_manager.fontManager.addfont(path)
            name = font_manager.FontProperties(fname=path).get_name()
            if name not in families:
                families.append(name)
    plt.rcParams['font.family'] = families + ['DejaVu Sans']


def get_label(item):
    if item.get('label'):
        return item['label']
    if item.get('wrap') is False:
        return item['event']
    return '\n'.join(textwrap.wrap(item['event'], width=18))


def date_bounds(dates):
    """Enclose full dates, including late events in a five-year boundary year."""
    if not dates:
        raise ValueError('Cannot draw a timeline without events')
    earliest, latest = min(dates), max(dates)
    start_year = (earliest.year // 5) * 5
    end_year = ((latest.year + 4) // 5) * 5
    end = date(end_year, 1, 1)
    # Keep the final book tick (2010) while extending the spine to the actual event.
    end = max(end, latest)
    padding = timedelta(days=max(120, (end - date(start_year, 1, 1)).days * 0.012))
    return date(start_year, 1, 1) - padding, end + padding, range(start_year, end_year + 1, 5)


def create_timeline(data, categories):
    import matplotlib.pyplot as plt

    records = sorted((item for item in data if item['category'] in categories), key=lambda item: parse_date(item['date']))
    dates = [parse_date(item['date']) for item in records]
    lower, upper, years = date_bounds(dates)
    fig, ax = plt.subplots(figsize=(8, 8))
    fig.subplots_adjust(left=0.22, bottom=0.05, right=0.78, top=0.95)
    ax.set_ylim([upper, lower])
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.75)
    for year in years:
        ax.text(0.5, date(year, 1, 1), str(year), ha='center', va='center', fontsize=11, backgroundcolor='white')
    for row, event_date in zip(records, dates):
        if row['country'] == 'Benin':
            default_x, align, line_start = 0.35, 'right', 0.495
        elif row['country'] == 'Togo':
            default_x, align, line_start = 0.65, 'left', 0.505
        else:
            raise ValueError(f"Unsupported timeline country: {row['country']!r}")
        text_x = row.get('x', default_x)
        ax.plot([line_start, text_x], [event_date, event_date], color='gray', linewidth=0.5)
        ax.text(text_x, event_date, get_label(row), va='center', ha=align, fontsize=11,
                bbox={'boxstyle': 'round,pad=0.3', 'fc': 'white', 'ec': 'black', 'linewidth': 0.5}, zorder=10)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)
    ax.text(0.15, 1.02, 'Benin', ha='right', va='bottom', transform=ax.transAxes, fontsize=14, fontweight='bold')
    ax.text(1.15 if 'Religion' in categories else 0.85, 1.02, 'Togo', ha='left', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    return fig


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, default=HERE / 'data.json')
    parser.add_argument('--output-dir', type=Path, default=HERE)
    parser.add_argument('--show', action='store_true', help='Display windows after saving')
    args = parser.parse_args(argv)
    if not args.show:
        import matplotlib
        matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    setup_fonts()
    data = load_json(args.data)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for categories, name in [(['Religion'], 'Religion_Timeline'), (['Education', 'Politics'], 'Education_Politics_Timeline')]:
        fig = create_timeline(data, categories)
        try:
            for extension in ('png', 'svg'):
                path = args.output_dir / f'{name}.{extension}'
                fig.savefig(path, dpi=300, bbox_inches='tight')
                print(f'Wrote {path}')
            if args.show:
                plt.show()
        finally:
            plt.close(fig)


if __name__ == '__main__':
    main()
