import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

def create_timeline(data, categories, filename):
    # Filter data for the specified categories
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=False)

    # Create the figure and axis for the timeline
    fig, ax = plt.subplots(figsize=(10, 23))
    plt.subplots_adjust(left=0.5, bottom=0, top=1)

    # Draw a central vertical timeline
    ax.axvline(x=0, color='black', linewidth=2)

    # Invert the y-axis to have the oldest dates at the top
    ax.set_ylim([max(df['date']) + pd.DateOffset(years=1), min(df['date']) - pd.DateOffset(years=1)])

    # Plot each event
    for _, row in df.iterrows():
        date = mdates.date2num(row['date'])
        event = row['event']
        country = row['country']
        x_position = 0.1 if country == 'Togo' else -0.1
        text_position = x_position + 0.05 if country == 'Togo' else x_position - 0.05

        # Add text with appropriate alignment
        ha = 'left' if country == 'Togo' else 'right'
        ax.text(text_position, date, event, verticalalignment='center', horizontalalignment=ha, fontsize=10, wrap=True)

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

    # Add title
    plt.title(f"Timeline of {', '.join(categories)} Events", fontsize=16, y=1.02)

    # Save the figure
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the JSON data
with open(os.path.join(current_dir, 'data.json'), 'r') as f:
    data = json.load(f)

# Create Religion timeline
create_timeline(data, ['Religion'], os.path.join(current_dir, 'Religion_Timeline.png'))

# Create Education and Politics timeline
create_timeline(data, ['Education', 'Politics'], os.path.join(current_dir, 'Education_Politics_Timeline.png'))

print("Timelines have been created successfully.")
