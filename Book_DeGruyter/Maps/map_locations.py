import json
import os

import folium
import numpy as np
from folium.plugins import Fullscreen, MiniMap, MousePosition

# Locations are single-sourced from locations.json (GeoJSON), which is also
# consumed by points_of_interest.html.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Folium icon color per country group
COUNTRY_COLORS = {
    'Benin': 'darkblue',
    'Togo': 'green',
    'West Africa': 'orange',
}


def load_locations():
    """
    Load locations from locations.json, grouped by country.
    Returns {country: {name: (lat, lng)}}.
    """
    with open(os.path.join(SCRIPT_DIR, 'locations.json'), 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    locations_by_country = {}
    for feature in geojson['features']:
        name = feature['properties']['name']
        country = feature['properties']['country']
        lng, lat = feature['geometry']['coordinates']
        locations_by_country.setdefault(country, {})[name] = (lat, lng)
    return locations_by_country


def calculate_map_center(locations):
    """
    Calculate the geographical center of the provided locations.
    """
    latitudes, longitudes = zip(*locations.values())
    return [np.mean(latitudes), np.mean(longitudes)]


def create_popup_html(name, coords):
    """
    Create styled HTML popup for a location.
    """
    return f'''
    <div style="font-family: Arial, sans-serif; width: 220px;">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; line-height: 1.3;">{name}</h4>
        <p style="margin: 0; font-size: 12px; color: #666;">
            📍 {coords[0]:.4f}, {coords[1]:.4f}
        </p>
    </div>
    '''


def add_markers_with_labels(map_obj, locations, icon_color, icon_name, category):
    """
    Add markers to the map for the given locations with styled popups.
    """
    feature_group = folium.FeatureGroup(name=category)
    for name, coords in locations.items():
        popup_html = create_popup_html(name, coords)
        folium.Marker(
            location=coords,
            icon=folium.Icon(color=icon_color, icon=icon_name, prefix='fa'),
            popup=folium.Popup(popup_html, max_width=250),
            tooltip=name
        ).add_to(feature_group)
    feature_group.add_to(map_obj)


locations_by_country = load_locations()

# Calculate the center of the map over all locations
all_locations = {name: coords
                 for locations in locations_by_country.values()
                 for name, coords in locations.items()}
map_center = calculate_map_center(all_locations)

# Create a base map with CartoDB Voyager as default
m = folium.Map(location=map_center, zoom_start=8, tiles=None)

# Add multiple tile layer options
folium.TileLayer("CartoDB Voyager", name="Detailed", show=True).add_to(m)
folium.TileLayer("CartoDB Positron", name="Light").add_to(m)
folium.TileLayer("CartoDB DarkMatter", name="Dark").add_to(m)

# Add interactive plugins
Fullscreen(position='topleft').add_to(m)
MiniMap(position='bottomright', width=120, height=120, toggle_display=True).add_to(m)
MousePosition(position='bottomleft', prefix='Coordinates:').add_to(m)

# Add markers grouped by country
for country, locations in locations_by_country.items():
    add_markers_with_labels(m, locations, COUNTRY_COLORS.get(country, 'gray'), 'university', country)

# Add layer control for toggling layers and switching base maps
folium.LayerControl(collapsed=False).add_to(m)

# Save the map to an HTML file in the same folder as the script
output_path = os.path.join(SCRIPT_DIR, 'UAC_UL_locations_map.html')
m.save(output_path)
