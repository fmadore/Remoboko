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

    width_inches = 16.51 / 2.54
    height_inches = 24.13 / 2.54
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    plt.subplots_adjust(left=0.15, right=0.95, bottom=0.05, top=0.95)

    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=1.0)

    min_date = min(df['date'])
    max_date = max(df['date'])
    ax.set_ylim([max_date + pd.DateOffset(years=1), min_date - pd.DateOffset(years=1)])

    def wrap_text(text, max_width=25):
        wrapped = textwrap.wrap(text, width=max_width)
        return '\n'.join(wrapped)

    events_by_country = {'Benin': [], 'Togo': []}
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    for country, events in events_by_country.items():
        # Determine x positions based on country
        if country == 'Benin':
            base_x = 0.25
            text_x = 0.1  # Keep text boxes in left half
            align = 'right'
        else:  # Togo
            base_x = 0.75
            text_x = 0.9  # Keep text boxes in right half
            align = 'left'
        
        y_offset = 0
        for date, event in events:
            date_num = mdates.date2num(date)
            y_position = date_num + y_offset
            
            # Draw connecting line from timeline to text box
            ax.plot([base_x, text_x], [y_position, y_position],
                   color='gray', linestyle='-', linewidth=0.5)
            
            # Add text box
            bbox_props = dict(
                boxstyle="round,pad=0.5",
                fc="white",
                ec="black",
                alpha=1.0,
                linewidth=1.0
            )
            
            text = ax.text(text_x, y_position, event,
                         verticalalignment='center',
                         horizontalalignment=align,
                         fontsize=9,
                         bbox=bbox_props)
            
            # Adjust spacing between events
            bbox = text.get_bbox_patch()
            y_offset += bbox.get_height() / (max_date - min_date).days * 2.2

    ax.yaxis_date()
    date_format = mdates.DateFormatter('%Y')
    ax.yaxis.set_major_formatter(date_format)
    ax.yaxis.set_major_locator(mdates.YearLocator(5))

    ax.xaxis.set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)

    ax.text(0.25, 1.02, 'Benin', ha='center', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    ax.text(0.75, 1.02, 'Togo', ha='center', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    plt.subplots_adjust(left=0.2, right=0.9, bottom=0.05, top=0.95)

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