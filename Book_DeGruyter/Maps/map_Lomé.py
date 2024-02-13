import folium
from folium import IFrame
from branca.element import Element

# Define the locations
locations = {
    'Centre Catholique Universitaire (CCU)': (6.17428, 1.21188),
    'Mosquée de l\'AEEMT': (6.17170, 1.21159),
    'Amphi 600': (6.17349, 1.21336),
    'Cité A': (6.16872, 1.21665),
    'Cité B': (6.16807, 1.21573),
    'Grand Amphi': (6.17522, 1.21385),
    'Amphi 20 ans': (6.17387, 1.21318),
    'Benches near the Library': (6.17423,1.21462),
    'Quartier de Doumasséssé': (6.1607, 1.2175),
    'Centre Saint Jean Lomé': (6.148969553402552, 1.2346652112254952),
}

# Calculate the center of the map
avg_lat = sum(loc[0] for loc in locations.values()) / len(locations)
avg_lng = sum(loc[1] for loc in locations.values()) / len(locations)
map_center = [avg_lat, avg_lng]

# Create a base map
m = folium.Map(location=map_center, zoom_start=15)

# Add markers for each location
for name, coords in locations.items():
    folium.Marker(location=coords, popup=name, icon=folium.Icon(color='blue')).add_to(m)

# HTML code for the legend
legend_html = '''
     <div style="position: fixed; 
     bottom: 50px; left: 50px; width: 150px; height: 120px; 
     border:2px solid grey; z-index:9999; font-size:14px;
     ">&nbsp; University of Lomé <br>
     &nbsp; <i class="fa fa-map-marker" style="color:blue"></i>&nbsp; Points of Interest
     </div>
     '''

# Add the legend to the map
m.get_root().html.add_child(Element(legend_html))

# Save the map to an HTML file
m.save('UL_locations_map.html')
