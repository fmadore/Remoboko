import json
import os
import textwrap

import matplotlib.pyplot as plt
import pandas as pd
from matplotlib import font_manager

current_dir = os.path.dirname(os.path.abspath(__file__))


def setup_fonts():
    """
    Use the De Gruyter Sans fonts when the (gitignored) OTF files are present,
    falling back to DejaVu Sans otherwise.
    """
    families = []
    for filename in ('De-Gruyter-Sans-Regular.otf', 'De-Gruyter-Sans-Bold.otf'):
        path = os.path.join(current_dir, filename)
        if os.path.exists(path):
            font_manager.fontManager.addfont(path)
            name = font_manager.FontProperties(fname=path).get_name()
            if name not in families:
                families.append(name)
    plt.rcParams['font.family'] = families + ['DejaVu Sans']


def get_label(item):
    """
    Resolve the display label for an event. data.json may provide:
    - "label": explicit label text (with manual line breaks), or
    - "wrap": false to keep the event title on a single line.
    Otherwise the title is wrapped automatically.
    """
    if 'label' in item and item['label']:
        return item['label']
    if item.get('wrap') is False:
        return item['event']
    return '\n'.join(textwrap.wrap(item['event'], width=18))


def create_timeline(data, categories, filename_base):
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['label'] = [get_label(item) for item in filtered_data]
    if 'x' not in df.columns:
        df['x'] = None
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    width_inches = 8.0
    height_inches = 8
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))

    plt.subplots_adjust(left=0.22, bottom=0.05, right=0.78, top=0.95, wspace=0.2, hspace=0.2)

    min_date = min(df['date'])
    max_date = max(df['date'])
    start_year = (min_date.year // 5) * 5
    end_year = ((max_date.year + 4) // 5) * 5

    ax.set_ylim([pd.Timestamp(f"{end_year}-01-01"), pd.Timestamp(f"{start_year}-01-01")])
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.75)

    years = range(start_year, end_year + 1, 5)
    for year in years:
        y_pos = pd.Timestamp(f"{year}-01-01")
        ax.text(0.5, y_pos, str(year), ha='center', va='center', fontsize=11, backgroundcolor='white')

    for _, row in df.iterrows():
        if row['country'] == 'Benin':
            default_x = 0.35
            align = 'right'
            line_start = 0.495
        else:
            default_x = 0.65
            align = 'left'
            line_start = 0.505

        text_x = row['x'] if pd.notna(row['x']) else default_x

        ax.plot([line_start, text_x], [row['date'], row['date']], color='gray', linestyle='-', linewidth=0.5)

        bbox_props = dict(boxstyle="round,pad=0.3", fc="white", ec="black", alpha=1.0, linewidth=0.5)
        ax.text(text_x, row['date'], row['label'], verticalalignment='center',
                horizontalalignment=align, fontsize=11, bbox=bbox_props, zorder=10)

    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)

    ax.text(0.15, 1.02, 'Benin', ha='right', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    togo_x = 1.15 if 'Religion' in categories else 0.85
    ax.text(togo_x, 1.02, 'Togo', ha='left', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
    plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')

    def on_key(event):
        if event.key == 's':
            plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
            plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')

    fig.canvas.mpl_connect('key_press_event', on_key)
    plt.show()


setup_fonts()

with open(os.path.join(current_dir, 'data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

create_timeline(data, ['Religion'],
                os.path.join(current_dir, 'Religion_Timeline'))

create_timeline(data, ['Education', 'Politics'],
                os.path.join(current_dir, 'Education_Politics_Timeline'))
