import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os
import textwrap

# Set the font to a Unicode-compatible font
plt.rcParams['font.family'] = 'DejaVu Sans'

def create_timeline(data, categories, filename_base):
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    width_inches = 24.13 / 2.54
    height_inches = 16.51 / 2.54
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    plt.subplots_adjust(left=0.05, right=0.95, bottom=0.15, top=0.95)

    ax.axhline(y=0.5, color='gray', linestyle='--', linewidth=0.5)

    min_date = min(df['date'])
    max_date = max(df['date'])
    ax.set_xlim([min_date - pd.DateOffset(years=1), max_date + pd.DateOffset(years=1)])

    def wrap_text(text, max_width=18):
        return '\n'.join(textwrap.wrap(text, width=max_width))

    events_by_country = {'Benin': [], 'Togo': []}
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    for country, events in events_by_country.items():
        base_y = 0.25 if country == 'Benin' else 0.75
        x_offset = 0
        above = True
        for date, event in events:
            date_num = mdates.date2num(date)
            x_position = date_num + x_offset
            
            y_position = base_y + 0.1 if above else base_y - 0.1
            
            bbox_props = dict(boxstyle="round,pad=0.4", fc="white", ec="gray", alpha=0.8)
            text = ax.text(x_position, y_position, event, verticalalignment='center' if above else 'center',
                           horizontalalignment='center',
                           fontsize=9, wrap=True, bbox=bbox_props, rotation=0)
            
            bbox = text.get_bbox_patch()
            x_offset += bbox.get_width() / (max_date - min_date).days * 1.8
            
            above = not above

    ax.xaxis_date()
    date_format = mdates.DateFormatter('%Y')
    ax.xaxis.set_major_formatter(date_format)
    ax.xaxis.set_major_locator(mdates.YearLocator(5))

    ax.yaxis.set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    ax.text(0, 0.25, 'Benin', ha='right', va='center', transform=ax.transAxes, fontsize=12, fontweight='bold')
    ax.text(0, 0.75, 'Togo', ha='right', va='center', transform=ax.transAxes, fontsize=12, fontweight='bold')

    # Save as PNG
    plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
    
    # Save as SVG
    plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')
    
    plt.close()

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the JSON data
with open(os.path.join(current_dir, 'data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create Religion timeline
create_timeline(data, ['Religion'], os.path.join(current_dir, 'Religion_Timeline'))

# Create Education and Politics timeline
create_timeline(data, ['Education', 'Politics'], os.path.join(current_dir, 'Education_Politics_Timeline'))

print("Timelines have been created successfully in both PNG and SVG formats.")
