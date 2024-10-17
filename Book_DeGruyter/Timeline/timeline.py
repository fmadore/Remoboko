import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

# Set the font to a Unicode-compatible font
plt.rcParams['font.family'] = 'DejaVu Sans'

def create_timeline(data, categories, filename):
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    width_inches = 16.51 / 2.54
    height_inches = 24.13 / 2.54
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    plt.subplots_adjust(left=0.15, right=0.95, bottom=0.05, top=0.95)

    # Draw vertical lines to separate columns
    ax.axvline(x=0.33, color='gray', linestyle='--', linewidth=0.5)
    ax.axvline(x=0.66, color='gray', linestyle='--', linewidth=0.5)

    min_date = min(df['date'])
    max_date = max(df['date'])
    ax.set_ylim([min_date - pd.DateOffset(years=1), max_date + pd.DateOffset(years=1)])

    for _, row in df.iterrows():
        date = row['date']
        event = row['event']
        country = row['country']
        
        if country == 'Benin':
            x_position = 0.5
            ha = 'center'
        elif country == 'Togo':
            x_position = 0.83
            ha = 'left'
        
        # Convert date to a number
        date_num = mdates.date2num(date)
        ax.text(x_position, date_num, event, verticalalignment='center', horizontalalignment=ha, fontsize=7, wrap=True)

    ax.yaxis_date()
    date_format = mdates.DateFormatter('%Y')
    ax.yaxis.set_major_formatter(date_format)
    ax.yaxis.set_major_locator(mdates.YearLocator(5))

    ax.xaxis.set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)

    # Add column headers
    ax.text(0.5, 1.02, 'Benin', ha='center', va='bottom', transform=ax.transAxes, fontsize=10, fontweight='bold')
    ax.text(0.83, 1.02, 'Togo', ha='left', va='bottom', transform=ax.transAxes, fontsize=10, fontweight='bold')

    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the JSON data
with open(os.path.join(current_dir, 'data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create Religion timeline
create_timeline(data, ['Religion'], os.path.join(current_dir, 'Religion_Timeline.png'))

# Create Education and Politics timeline
create_timeline(data, ['Education', 'Politics'], os.path.join(current_dir, 'Education_Politics_Timeline.png'))

print("Timelines have been created successfully.")
