import folium

# Define the coordinates and paths for the university logos
universities = {
    'University of Lomé': {
        'coords': (6.175690527334621, 1.2137727591902188),
        'logo': 'University_Lome.jpg'
    },
    'University of Abomey-Calavi': {
        'coords': (6.415312316251478, 2.341522503861767),
        'logo': 'University_Abomey-Calavi.jpg'
    }
}

# Create a base map centered between the two universities
map_center = [(universities['University of Lomé']['coords'][0] + universities['University of Abomey-Calavi']['coords'][0]) / 2,
              (universities['University of Lomé']['coords'][1] + universities['University of Abomey-Calavi']['coords'][1]) / 2]
m = folium.Map(location=map_center, zoom_start=8)

# Add standard marker icons for the universities with popup logos
for uni, details in universities.items():
    html = f'<img src="{details["logo"]}" alt="{uni}" style="width:100px;"><br>{uni}'
    iframe = folium.IFrame(html, width=150, height=150)
    popup = folium.Popup(iframe, max_width=2650)
    folium.Marker(location=details['coords'], popup=popup).add_to(m)

# Save the map to an HTML file
m.save('universities_map.html')
