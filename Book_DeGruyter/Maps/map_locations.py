import folium
from folium.plugins import Fullscreen, MiniMap, MousePosition
import numpy as np
import os

# Define the locations for Benin
benin_locations = {
    "Catholic Chaplaincy of the Université d'Abomey-Calavi et des grandes écoles du Bénin": (6.42431, 2.33785),
    'Oumar Ibn Khattab Mosque (ACEEMUB)': (6.41478, 2.33682),
    'Saint-Dominique Cotonou convent': (6.3558124810442935, 2.421426082297773),
    'Bon Pasteur parish': (6.3570692871919885, 2.398772893785117),
    'Bâtiment C': (6.41449, 2.34240),
    'GBEEB Headquarters': (6.372156046604895, 2.4974942706506096),
    'Père Aupiais College': (6.388846482524025, 2.3474732769556033),
    'Jardin U': (6.41389, 2.34348),
    'Lycée Béhanzin': (6.479698137720823, 2.6149709960150442),
    'University of Parakou': (9.337619664615962, 2.644594132986409),
    'Zogbo parish': (6.39321349885147, 2.3915586634006054),
    'CEG Gbégamey': (6.359403662261627, 2.4172856048142135),
    'Cours secondaire Notre-Dame des Apôtres': (6.360689579780806, 2.4175906695021823),
    "Université d'Agriculture de Kétou": (7.36033789536867, 2.604034046121942),
    'Université Nationale des Sciences, Technologies, Ingénierie et Mathématiques': (7.160651258439677, 2.0208896494132866),
    'Institut National Supérieur de Technologie Industrielle de Lokossa': (6.652598412860042, 1.725566066731119),
    'Bon Pasteur parish': (6.357065573930122, 2.398786735584982),
    "Sainte-Thérèse de l'Enfant Jésus parish": (6.388992725155074, 2.3469247082733733),
}

# Define the locations for Togo
togo_locations = {
    'Centre Catholique Universitaire (CCU)': (6.17428, 1.21188),
    "Mosquée de l'AEEMT": (6.17170, 1.21159),
    'Amphi 600': (6.17349, 1.21336),
    'Cité A': (6.16872, 1.21665),
    'Cité B': (6.16807, 1.21573),
    'Grand Amphi': (6.17522, 1.21385),
    'Amphi 20 ans': (6.17387, 1.21318),
    'Benches near the Library': (6.17423,1.21462),
    'Quartier de Doumasséssé': (6.1607, 1.2175),
    'Centre Saint Jean Lomé (University Parish)': (6.148969553402552, 1.2346652112254952),
    'Village du Bénin': (6.16674, 1.21730),
    'Lycée de Tokoin': (6.151229331563282, 1.2280969671765716),
    'University of Kara': (9.53171555198078, 1.2075454248806252),
    'Collège Saint-Joseph': (6.150308464664608, 1.2330026950072206),
}

# Define the locations for West Africa
west_africa_locations = {
    'Université Félix Houphouët-Boigny': (5.345626890265415, -3.9862531136424355),
    'Cheikh Anta Diop University': (14.692546490588276, -17.461838944294787),
}

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

# Combine all locations
all_locations = {**benin_locations, **togo_locations, **west_africa_locations}

# Calculate the center of the map
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

# Add markers with labels for Benin, Togo, and West Africa locations
add_markers_with_labels(m, benin_locations, 'darkblue', 'university', 'Benin')
add_markers_with_labels(m, togo_locations, 'green', 'university', 'Togo')
add_markers_with_labels(m, west_africa_locations, 'orange', 'university', 'West Africa')

# Add layer control for toggling layers and switching base maps
folium.LayerControl(collapsed=False).add_to(m)

# Save the map to an HTML file in the same folder as the script
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, 'UAC_UL_locations_map.html')
m.save(output_path)
