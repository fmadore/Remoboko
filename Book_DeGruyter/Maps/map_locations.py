import json
import os
import sys
from pathlib import Path

import folium
import numpy as np
from branca.element import Element
from folium.plugins import FeatureGroupSubGroup, Search

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # repo root
from viz_common import COUNTRY_HEX, COUNTRY_ICON_COLORS, create_base_map

# Locations are single-sourced from locations.json (GeoJSON), which is also
# consumed by points_of_interest.html.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Font Awesome icon per location type (folium bundles Font Awesome 6)
TYPE_ICONS = {
    'mosque': 'mosque',
    'church': 'church',
    'school': 'school',
    'university': 'building-columns',
    'landmark': 'location-dot',
}
TYPE_LABELS = {
    'mosque': 'Mosque',
    'church': 'Church / parish',
    'school': 'School / lycée',
    'university': 'University / institute',
    'landmark': 'Campus landmark',
}


def load_locations():
    """
    Load locations from locations.json.
    Returns a list of (name, country, type, (lat, lng)) tuples.
    """
    with open(os.path.join(SCRIPT_DIR, 'locations.json'), 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    locations = []
    for feature in geojson['features']:
        props = feature['properties']
        lng, lat = feature['geometry']['coordinates']
        locations.append((props['name'], props['country'], props.get('type', 'landmark'), (lat, lng)))
    return locations


def calculate_map_center(locations):
    """
    Calculate the geographical center of the provided locations.
    """
    latitudes = [coords[0] for *_, coords in locations]
    longitudes = [coords[1] for *_, coords in locations]
    return [np.mean(latitudes), np.mean(longitudes)]


def create_popup_html(name, loc_type, coords):
    """
    Create styled HTML popup for a location.
    """
    return f'''
    <div style="font-family: 'Open Sans', Arial, sans-serif; width: 220px;">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; line-height: 1.3;">{name}</h4>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">{TYPE_LABELS[loc_type]}</p>
        <p style="margin: 0; font-size: 12px; color: #666;">
            📍 {coords[0]:.4f}, {coords[1]:.4f}
        </p>
    </div>
    '''


locations = load_locations()
map_center = calculate_map_center(locations)

# Create the standard base map
m = create_base_map(location=map_center, zoom_start=8)

# Parent group holds every marker (used by the search box); one toggleable
# subgroup per country shows up in the layer control.
all_group = folium.FeatureGroup(name='All locations', control=False).add_to(m)
country_groups = {}
for country in COUNTRY_ICON_COLORS:
    country_groups[country] = FeatureGroupSubGroup(all_group, name=country).add_to(m)

for name, country, loc_type, coords in locations:
    folium.Marker(
        location=coords,
        icon=folium.Icon(
            color=COUNTRY_ICON_COLORS.get(country, 'gray'),
            icon=TYPE_ICONS[loc_type],
            prefix='fa',
        ),
        popup=folium.Popup(create_popup_html(name, loc_type, coords), max_width=250),
        tooltip=name,
        title=name,  # searchable by the Search plugin
    ).add_to(country_groups.get(country, all_group))

# Search box over all markers
Search(
    layer=all_group,
    search_label='title',
    placeholder='Search locations...',
    collapsed=False,
    position='topright',
).add_to(m)

# Add layer control for toggling countries and switching base maps
folium.LayerControl(collapsed=False).add_to(m)

# Fixed legend: marker color = country, icon = location type
legend_countries = ''.join(
    f'<div style="margin: 4px 0;"><span style="display:inline-block; width:12px; height:12px; '
    f'border-radius:50%; background:{COUNTRY_HEX[country]}; margin-right:8px;"></span>{country}</div>'
    for country in COUNTRY_ICON_COLORS
)
legend_types = ''.join(
    f'<div style="margin: 4px 0;"><i class="fa fa-{TYPE_ICONS[t]}" '
    f'style="width:16px; text-align:center; margin-right:6px; color:#555;"></i>{TYPE_LABELS[t]}</div>'
    for t in TYPE_ICONS
)
legend_html = f'''
<div style="position: fixed; bottom: 20px; left: 20px; z-index: 1000; background: white;
            padding: 12px 14px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.15);
            font-family: 'Open Sans', Arial, sans-serif; font-size: 12px; color: #333;">
    <div style="font-weight: 600; margin-bottom: 6px;">Country</div>
    {legend_countries}
    <div style="font-weight: 600; margin: 10px 0 6px;">Type</div>
    {legend_types}
</div>
'''
m.get_root().html.add_child(Element(legend_html))

# Save the map to an HTML file in the same folder as the script
output_path = os.path.join(SCRIPT_DIR, 'UAC_UL_locations_map.html')
m.save(output_path)
