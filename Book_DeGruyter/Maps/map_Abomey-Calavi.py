import folium
from folium import IFrame
from branca.element import Element

# Define the locations
locations = {
    'Institut de Langue Arabe et de la Culture Islamique': (6.42047, 2.34345),
    'Oumar Ibn Khattab Mosque (ACEEMUB)': (6.41478, 2.33682),
    'Catholic Chaplaincy of the Université d’Abomey-Calavi et des grandes écoles du Bénin': (6.42431, 2.33785),
    'Saint-Dominique Cotonou convent': (6.3558124810442935, 2.421426082297773),
    'Bon Pasteur Parish': (6.3570692871919885, 2.398772893785117),
    'Bâtiment C': (6.41449, 2.34240),
    'GBEEB Headquarters': (6.372156046604895, 2.4974942706506096),
    'Jardin U': (6.414055663522571, 2.343605535178956),
}

# Calculate the center of the map
avg_lat = sum(loc[0] for loc in locations.values()) / len(locations)
avg_lng = sum(loc[1] for loc in locations.values()) / len(locations)
map_center = [avg_lat, avg_lng]

# Create a base map
m = folium.Map(location=map_center, zoom_start=13)

# Add markers for each location
for name, coords in locations.items():
    folium.Marker(location=coords, popup=name, icon=folium.Icon(color='blue')).add_to(m)

# HTML code for the legend
legend_html = '''
     <div style="position: fixed; 
     bottom: 50px; left: 50px; width: 150px; height: 120px; 
     border:2px solid grey; z-index:9999; font-size:14px;
     ">&nbsp; University of Abomey-Calavi <br>
     &nbsp; <i class="fa fa-map-marker" style="color:blue"></i>&nbsp; Points of Interest
     </div>
     '''

# Add the legend to the map
m.get_root().html.add_child(Element(legend_html))

# Save the map to an HTML file
m.save('UAC_locations_map.html')
