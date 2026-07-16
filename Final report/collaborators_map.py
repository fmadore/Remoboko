import sys
from pathlib import Path

import folium
import pandas as pd
from branca.element import Element
from folium import IFrame

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # repo root
from viz_common import create_base_map, load_json

script_dir = Path(__file__).resolve().parent

# Load the data
data = load_json(script_dir / 'Data' / 'Collaborators_data.json')
df = pd.DataFrame(data)

# Group the data by affiliation to aggregate collaborators
grouped = df.groupby('Affiliation')

# Create the world map
m = create_base_map(location=[20, 0], zoom_start=2)

# Tooltip styling (popups are iframes and carry their own inline CSS)
custom_css = '''
<style>
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
m.get_root().html.add_child(Element(custom_css))

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

    # Generate HTML content for the popup (iframe document, so it carries its own CSS)
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

    # Add a marker for the affiliation
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

collaborators_group.add_to(m)

# Add layer control
folium.LayerControl(collapsed=False).add_to(m)

# Add title
title_html = f'''
<div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;
            background: white; padding: 12px 24px; border-radius: 8px; max-width: min(80vw, 500px);
            box-shadow: 0 2px 10px rgba(0,0,0,0.15); font-family: 'Open Sans', sans-serif;">
    <h3 style="margin: 0; font-size: 18px; color: #333;">Collaborators Map (Total: {total_collaborators})</h3>
</div>
'''
m.get_root().html.add_child(Element(title_html))

# Save the map to an HTML file in the same folder
output_path = script_dir / 'collaborators_map.html'
m.save(str(output_path))

print(f"Map saved to: {output_path}")
