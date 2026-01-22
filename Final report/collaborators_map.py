import json
import pandas as pd
import folium
from folium import IFrame
from folium.plugins import Fullscreen, MiniMap, MousePosition
from branca.element import Element
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

# Create the map with CartoDB Voyager as default
map = folium.Map(location=[20, 0], zoom_start=2, tiles=None)

# Add multiple tile layer options
folium.TileLayer("CartoDB Voyager", name="Detailed", show=True).add_to(map)
folium.TileLayer("CartoDB Positron", name="Light").add_to(map)
folium.TileLayer("CartoDB DarkMatter", name="Dark").add_to(map)

# Add interactive plugins
Fullscreen(position='topleft').add_to(map)
MiniMap(position='bottomright', width=120, height=120, toggle_display=True).add_to(map)
MousePosition(position='bottomleft', prefix='Coordinates:').add_to(map)

# Add custom CSS for popups and tooltips
custom_css = '''
<style>
.custom-popup {
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 14px;
}
.custom-popup h4 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 15px;
    font-weight: 600;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}
.custom-popup ul {
    margin: 0;
    padding-left: 0;
    list-style: none;
}
.custom-popup li {
    margin: 6px 0;
    padding: 4px 0;
}
.custom-popup a {
    color: #3498db;
    text-decoration: none;
    transition: color 0.2s;
}
.custom-popup a:hover {
    color: #2980b9;
    text-decoration: underline;
}
.leaflet-tooltip.custom-tooltip {
    background-color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
</style>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
'''
map.get_root().html.add_child(Element(custom_css))

# Create a feature group for collaborators
collaborators_group = folium.FeatureGroup(name='Collaborators')

# Count total collaborators
total_collaborators = len(df)

# Iterate over each affiliation group
for affiliation, group in grouped:
    # Parse the first row to get the location
    try:
        location = [float(coord) for coord in group.iloc[0]['Coordinate location'].split(',')]
    except ValueError:
        print(f"Skipping {affiliation} due to invalid coordinates")
        continue

    # Count collaborators at this affiliation
    collab_count = len(group)

    # Generate HTML content for the popup with modern styling (includes font for IFrame)
    collaborator_links = ''.join(
        [f'<li><a href="{row["URL"]}" target="_blank">{row["Collaborator"]}</a></li>'
         for index, row in group.iterrows()]
    )
    popup_html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
        <style>
            body {{
                margin: 0;
                padding: 10px;
                font-family: 'Open Sans', Arial, sans-serif;
                font-size: 14px;
                color: #333;
            }}
            h4 {{
                margin: 0 0 10px 0;
                font-size: 15px;
                font-weight: 600;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 8px;
            }}
            ul {{
                margin: 0;
                padding: 0;
                list-style: none;
            }}
            li {{
                margin: 6px 0;
                padding: 2px 0;
            }}
            a {{
                color: #3498db;
                text-decoration: none;
            }}
            a:hover {{
                color: #2980b9;
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <h4>{affiliation}</h4>
        <ul>{collaborator_links}</ul>
    </body>
    </html>
    '''

    iframe = IFrame(html=popup_html, width=280, height=min(150 + collab_count * 25, 300))
    popup = folium.Popup(iframe, parse_html=True)

    # Add a marker for the affiliation with modern styling
    folium.Marker(
        location=location,
        popup=popup,
        tooltip=folium.Tooltip(
            f"<b>{affiliation}</b><br>{collab_count} collaborator(s)",
            permanent=False,
            className='custom-tooltip'
        ),
        icon=folium.Icon(color='blue', icon='user', prefix='fa')
    ).add_to(collaborators_group)

collaborators_group.add_to(map)

# Add layer control
folium.LayerControl(collapsed=False).add_to(map)

# Add title
title_html = f'''
<div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;
            background: white; padding: 12px 24px; border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15); font-family: 'Open Sans', sans-serif;">
    <h3 style="margin: 0; font-size: 18px; color: #333;">Collaborators Map (Total: {total_collaborators})</h3>
</div>
'''
map.get_root().html.add_child(Element(title_html))

# Save the map to an HTML file in the same folder
output_path = os.path.join(script_dir, 'collaborators_map.html')
map.save(output_path)

print(f"Map saved to: {output_path}")
