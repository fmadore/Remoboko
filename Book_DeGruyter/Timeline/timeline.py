import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.offsetbox import OffsetImage, AnnotationBbox

# Load the spreadsheet data
file_path = 'Timeline.xlsx'
data = pd.read_excel(file_path)

# Preprocess the data
data['Date'] = pd.to_datetime(data['Date'], errors='coerce')
data = data.dropna(subset=['Date'])
data.sort_values('Date', inplace=True)

# Load PNG files for Togo and Benin icons
togo_icon_path = 'togo_icon.png'
benin_icon_path = 'benin_icon.png'
togo_icon = OffsetImage(plt.imread(togo_icon_path), zoom=0.5)  # Adjust zoom as needed
benin_icon = OffsetImage(plt.imread(benin_icon_path), zoom=0.5)  # Adjust zoom as needed

# Create the figure and axis for the timeline
fig, ax = plt.subplots(figsize=(15, len(data) / 2))  # Adjust the figure size as needed

# Set the x-axis to cover the full range of dates plus some padding
min_date = min(data['Date'])
max_date = max(data['Date'])
ax.set_xlim([min_date - pd.DateOffset(years=1), max_date + pd.DateOffset(years=1)])

# Plot each event
for i, (idx, row) in enumerate(data.iterrows()):
    date = mdates.date2num(row['Date'])
    event = row['Event']
    country = row['Country']

    # Choose the appropriate icon for the country
    if country == 'Togo':
        ab = AnnotationBbox(togo_icon, (date, i), frameon=False)
        ax.add_artist(ab)
    elif country == 'Benin':
        ab = AnnotationBbox(benin_icon, (date, i), frameon=False)
        ax.add_artist(ab)
    else:
        ax.plot(date, i, marker='o', color='black', markersize=8)

    # Add a small horizontal offset to the text to avoid overlap with the icon
    ax.text(date + 10, i, '  ' + event, verticalalignment='center', fontsize=8, ha='left')

# Set the date format on the x-axis
ax.xaxis_date()
date_format = mdates.DateFormatter('%Y')
ax.xaxis.set_major_formatter(date_format)

# Display only every 5 or 10 years on the x-axis
ax.xaxis.set_major_locator(mdates.YearLocator(5))  # Change to 10 if preferred

# Remove grid lines
ax.grid(False)

# Improve layout
ax.set_ylim(-1, len(data) + 1)
ax.invert_yaxis()

# Set labels for y-axis to none
ax.set_yticklabels([])
ax.set_yticks([])

plt.subplots_adjust(bottom=0.2, left=0.05, right=0.95)  # Adjust margins to ensure all data fits
plt.show()
