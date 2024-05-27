import folium
from branca.element import Element
import numpy as np

# Define the locations for Benin
benin_locations = {
    'Institut de Langue Arabe et de la Culture Islamique': (6.42047, 2.34345),
    'Oumar Ibn Khattab Mosque (ACEEMUB)': (6.41478, 2.33682),
    'Catholic Chaplaincy of the Université d’Abomey-Calavi et des grandes écoles du Bénin': (6.42431, 2.33785),
    'Saint-Dominique Cotonou convent': (6.3558124810442935, 2.421426082297773),
    'Bon Pasteur Parish': (6.3570692871919885, 2.398772893785117),
    'Bâtiment C': (6.41449, 2.34240),
    'GBEEB Headquarters': (6.372156046604895, 2.4974942706506096),
    'Père Aupiais College': (6.388846482524025, 2.3474732769556033),
    'Jardin U': (6.41389, 2.34348),
    'Lycée Béhanzin': (6.479698137720823, 2.6149709960150442),
    'University of Parakou': (9.335122564235926, 2.6466825672064243),
    'Zogbo Parish': (6.39321349885147, 2.3915586634006054),
}

# Define the locations for Togo
togo_locations = {
    'Centre Catholique Universitaire (CCU)': (6.17428, 1.21188),
    'Mosquée de l\'AEEMT': (6.17170, 1.21159),
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
}

def calculate_map_center(locations):
    """
    Calculate the geographical center of the provided locations.
    """
    latitudes, longitudes = zip(*locations.values())
    return [np.mean(latitudes), np.mean(longitudes)]

def add_markers_with_labels(map_obj, locations, icon_color):
    """
    Add markers to the map for the given locations with always-visible labels.
    """
    for name, coords in locations.items():
        folium.Marker(
            location=coords,
            icon=folium.Icon(color=icon_color),
        ).add_to(map_obj)
        folium.map.Marker(
            coords,
            icon=folium.DivIcon(
                icon_size=(150, 36),
                icon_anchor=(0, 0),
                html=f'<div style="font-size: 12px; color: {icon_color};">{name}</div>',
            )
        ).add_to(map_obj)

def create_legend_html():
    """
    Create the HTML for the map legend.
    """
    return '''
    <div style="position: fixed; 
    bottom: 50px; left: 50px; width: 150px; height: 90px; 
    border:2px solid grey; z-index:9999; font-size:14px;
    background-color:white; padding: 10px;
    ">&nbsp; Points of interest <br>
    &nbsp; <i class="fa fa-map-marker" style="color:blue"></i>&nbsp; Benin <br>
    &nbsp; <i class="fa fa-map-marker" style="color:green"></i>&nbsp; Togo
    </div>
    '''

# Combine all locations
all_locations = {**benin_locations, **togo_locations}

# Calculate the center of the map
map_center = calculate_map_center(all_locations)

# Create a base map
m = folium.Map(location=map_center, zoom_start=8)

# Add markers with labels for Benin and Togo locations
add_markers_with_labels(m, benin_locations, 'blue')
add_markers_with_labels(m, togo_locations, 'green')

# Add the legend to the map
legend_html = create_legend_html()
m.get_root().html.add_child(Element(legend_html))

# Save the map to an HTML file
m.save('UAC_UL_locations_map.html')
