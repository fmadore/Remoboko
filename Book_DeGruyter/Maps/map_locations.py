import folium
from folium.plugins import MarkerCluster
from branca.element import Element, Figure
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

def add_markers_with_labels(map_obj, locations, icon_color, category):
    """
    Add markers to the map for the given locations with toggleable labels.
    """
    feature_group = folium.FeatureGroup(name=category)
    for name, coords in locations.items():
        folium.Marker(
            location=coords,
            icon=folium.Icon(color=icon_color),
            popup=name
        ).add_to(feature_group)
        folium.map.Marker(
            coords,
            icon=folium.DivIcon(
                icon_size=(150, 36),
                icon_anchor=(0, 0),
                html=f'<div class="label-container {category}-label" style="display: none; background-color: white; padding: 2px; border: 1px solid {icon_color}; border-radius: 3px; font-size: 12px; color: {icon_color};">{name}</div>',
            )
        ).add_to(feature_group)
    feature_group.add_to(map_obj)

def create_legend_html():
    """
    Create the HTML for the map legend with only the toggle button for labels.
    """
    return '''
    <div style="position: fixed; 
    bottom: 50px; left: 50px; width: 170px; 
    border:2px solid grey; z-index:9999; font-size:14px;
    background-color:white; padding: 10px;
    ">
    <div style="font-weight: bold; margin-bottom: 5px;">Points of interest</div>
    <div style="background-color: white; margin: 2px; padding: 2px;">
        <i class="fa fa-map-marker" style="color:blue"></i>&nbsp; Benin
    </div>
    <div style="background-color: white; margin: 2px; padding: 2px;">
        <i class="fa fa-map-marker" style="color:green"></i>&nbsp; Togo
    </div>
    <div style="background-color: white; margin: 2px; padding: 2px;">
        <i class="fa fa-map-marker" style="color:red"></i>&nbsp; West Africa
    </div>
    <div style="margin-top: 10px;">
        <button onclick="toggleAllLabels()">Toggle All Labels</button>
    </div>
    </div>
    '''

def add_toggle_script(map_obj):
    """
    Add JavaScript to handle label toggling.
    """
    toggle_script = """
    <script>
    function toggleAllLabels() {
        var labels = document.getElementsByClassName('label-container');
        var displayStyle = labels[0].style.display === 'none' ? 'block' : 'none';
        for (var i = 0; i < labels.length; i++) {
            labels[i].style.display = displayStyle;
        }
    }
    </script>
    """
    map_obj.get_root().html.add_child(Element(toggle_script))

# Combine all locations
all_locations = {**benin_locations, **togo_locations, **west_africa_locations}

# Calculate the center of the map
map_center = calculate_map_center(all_locations)

# Create a base map
m = folium.Map(location=map_center, zoom_start=8)

# Add markers with labels for Benin, Togo, and West Africa locations
add_markers_with_labels(m, benin_locations, 'blue', 'benin')
add_markers_with_labels(m, togo_locations, 'green', 'togo')
add_markers_with_labels(m, west_africa_locations, 'red', 'west-africa')

# Add layer control (it will be hidden, but we need it for the toggleLayer function)
folium.LayerControl().add_to(m)

# Add the legend to the map
legend_html = create_legend_html()
m.get_root().html.add_child(Element(legend_html))

# Add the toggle script to the map
add_toggle_script(m)

# Save the map to an HTML file in the same folder as the script
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, 'UAC_UL_locations_map.html')
m.save(output_path)
