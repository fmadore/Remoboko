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
    
    # Set up the timeline range
    min_date = min(df['date'])
    max_date = max(df['date'])
    
    # Round to nearest 5 years for clean boundaries
    start_year = (min_date.year // 5) * 5
    end_year = ((max_date.year + 4) // 5) * 5
    
    ax.set_ylim([pd.Timestamp(f"{end_year}-01-01"), pd.Timestamp(f"{start_year}-01-01")])
    
    # Create vertical lines for timeline
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.5)

    # Set up year labels on the central axis
    years = range(start_year, end_year + 1, 5)
    for year in years:
        y_pos = pd.Timestamp(f"{year}-01-01")
        ax.axhline(y=y_pos, color='lightgray', linestyle='--', linewidth=0.5, xmin=0.48, xmax=0.52)
        ax.text(0.5, y_pos, str(year), ha='center', va='center', fontsize=9)

    def wrap_text(text, max_width=25):
        return '\n'.join(textwrap.wrap(text, width=max_width))

    # Create events_by_country dictionary
    events_by_country = {'Benin': [], 'Togo': []}
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    # Process events for both countries
    for country, events in events_by_country.items():
        if country == 'Benin':
            text_x = 0.15
            align = 'right'
            line_start = 0.45
        else:  # Togo
            text_x = 0.85
            align = 'left'
            line_start = 0.55
        
        for date, event in events:
            # Draw connecting line
            ax.plot([line_start, text_x], [date, date],
                   color='gray', linestyle='-', linewidth=0.5)
            
            # Add event text box
            bbox_props = dict(
                boxstyle="round,pad=0.5",
                fc="white",
                ec="black",
                alpha=1.0,
                linewidth=1.0
            )
            
            ax.text(text_x, date, event,
                   verticalalignment='center',
                   horizontalalignment=align,
                   fontsize=9,
                   bbox=bbox_props)

    # Remove all spines and the x-axis
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)

    # Add country labels
    ax.text(0.15, 1.02, 'Benin', ha='center', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    ax.text(0.85, 1.02, 'Togo', ha='center', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    # Adjust margins
    plt.subplots_adjust(left=0.2, right=0.9, bottom=0.05, top=0.95)

    # Save files
    plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
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