import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
import os

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the spreadsheet data
file_path = os.path.join(current_dir, 'Timeline.xlsx')
data = pd.read_excel(file_path)

# Preprocess the data
data['Date'] = pd.to_datetime(data['Date'], errors='coerce')
data = data.dropna(subset=['Date'])
data.sort_values('Date', ascending=False, inplace=True)

# Create the figure and axis for the timeline, adjusting for vertical layout
fig, ax = plt.subplots(figsize=(10, 23))

# Adjust subplot parameters
plt.subplots_adjust(left=0.5, bottom=0, top=1)  # Adjusting subplot margins

# Draw a central vertical timeline
ax.axvline(x=0, color='black', linewidth=2)

# Invert the y-axis to have the oldest dates at the top
ax.set_ylim([max(data['Date']) + pd.DateOffset(years=1), min(data['Date']) - pd.DateOffset(years=1)])

# Plot each event
for i, (idx, row) in enumerate(data.iterrows()):
    date = mdates.date2num(row['Date'])
    event = row['Event']
    country = row['Country']
    x_position = 0.1 if country == 'Togo' else -0.1
    text_position = x_position + 0.05 if country == 'Togo' else x_position - 0.05

    # Add text with appropriate alignment
    ha = 'left' if country == 'Togo' else 'right'
    ax.text(text_position, date, event, verticalalignment='center', horizontalalignment=ha, fontsize=14)

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

# Save the figure in the same directory
output_path = os.path.join(current_dir, 'Timeline.png')
plt.savefig(output_path, dpi=300, bbox_inches='tight')

# Show the plot
plt.show()
