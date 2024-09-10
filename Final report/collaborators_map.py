import json
import pandas as pd
import folium
from folium import IFrame
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load the data from the local JSON file in the Data folder
json_path = os.path.join(script_dir, 'Data', 'Collaborators_data.json')
with open(json_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Convert the JSON data to a pandas DataFrame
df = pd.DataFrame(data)

# Group the data by affiliation to aggregate collaborators
grouped = df.groupby('Affiliation')

# Create the map, centered around a default location
map = folium.Map(location=[0, 0], zoom_start=2)

# Iterate over each affiliation group
for affiliation, group in grouped:
    # Parse the first row to get the location
    try:
        location = [float(coord) for coord in group.iloc[0]['Coordinate location'].split(',')]
    except ValueError:
        print(f"Skipping {affiliation} due to invalid coordinates")
        continue

    # Generate HTML content for the popup with styling
    popup_html = '<style>body { font-family: Arial, sans-serif; font-size: 16px; }</style>'
    popup_html += '<ul>'
    popup_html += ''.join(
        [f'<li><a href="{row["URL"]}" target="_blank">{row["Collaborator"]}</a></li>' for index, row in
         group.iterrows()])
    popup_html += '</ul>'

    iframe = IFrame(html=popup_html, width=250, height=110)
    popup = folium.Popup(iframe, parse_html=True)

    # Add a marker for the affiliation
    folium.Marker(
        location=location,
        popup=popup,
        tooltip=affiliation  # Shows the affiliation when hovering over the marker
    ).add_to(map)

# Save the map to an HTML file in the same folder
output_path = os.path.join(script_dir, 'collaborators_map.html')
map.save(output_path)

print(f"Map saved to: {output_path}")
