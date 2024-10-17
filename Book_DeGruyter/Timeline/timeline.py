import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os
from matplotlib.textpath import TextPath
from matplotlib.transforms import Affine2D

# Set the font to a Unicode-compatible font
plt.rcParams['font.family'] = 'DejaVu Sans'

def create_timeline(data, categories, filename):
    # Filter data for the specified categories
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=False)

    # Create the figure and axis for the timeline
    # Convert cm to inches (1 inch = 2.54 cm)
    width_inches = 16.51 / 2.54
    height_inches = 24.13 / 2.54
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    plt.subplots_adjust(left=0.5, right=0.95, bottom=0.05, top=0.95)

    # Draw a central vertical timeline
    ax.axvline(x=0, color='black', linewidth=1.5)

    # Invert the y-axis to have the oldest dates at the top
    ax.set_ylim([max(df['date']) + pd.DateOffset(years=1), min(df['date']) - pd.DateOffset(years=1)])

    # Plot each event
    text_boxes = []
    for _, row in df.iterrows():
        date = mdates.date2num(row['date'])
        event = row['event']
        country = row['country']
        x_position = 0.1 if country == 'Togo' else -0.1
        text_position = x_position + 0.05 if country == 'Togo' else x_position - 0.05
        ha = 'left' if country == 'Togo' else 'right'

        # Check for collisions and adjust position
        text_path = TextPath((0, 0), event, size=7)
        text_bbox = text_path.get_extents()
        text_height = text_bbox.height / fig.dpi
        
        collision = True
        offset = 0
        while collision and offset < 5:  # Limit the number of attempts to avoid infinite loop
            collision = any(abs(box[1] - date) < text_height * 1.2 for box in text_boxes)
            if collision:
                date += 0.05 if country == 'Togo' else -0.05  # Adjust date slightly
                offset += 1
            
        text_boxes.append((text_position, date))
        ax.text(text_position, date, event, verticalalignment='center', horizontalalignment=ha, fontsize=7, wrap=True)

    # Adjust the y-axis to use dates and format them
    ax.yaxis_date()
    date_format = mdates.DateFormatter('%Y')
    ax.yaxis.set_major_formatter(date_format)
    ax.yaxis.set_major_locator(mdates.YearLocator(5))

    # Remove x-axis and right spine/frame
    ax.xaxis.set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)

    # Save the figure
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
