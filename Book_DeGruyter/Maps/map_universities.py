import folium

# Define the coordinates and paths for the university logos
universities = {
    'University of Lomé': {
        'coords': (6.175690527334621, 1.2137727591902188),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Lome.jpg'
    },
    'University of Abomey-Calavi': {
        'coords': (6.415312316251478, 2.341522503861767),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Abomey-Calavi.jpg'
    },
    'University of Kara': {
        'coords': (9.53190563529209, 1.2075618607303693),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Kara.jpg'
    },
    'University of Parakou': {
        'coords': (9.335184240782041, 2.6466607924077525),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Parakou.jpg'
    }
}

# Calculate the average coordinates to center the map on all universities
avg_lat = sum(uni['coords'][0] for uni in universities.values()) / len(universities)
avg_lng = sum(uni['coords'][1] for uni in universities.values()) / len(universities)
map_center = [avg_lat, avg_lng]

# Create a base map using the average coordinates
m = folium.Map(location=map_center, zoom_start=7)  # Adjust zoom level if necessary

# Add custom icon markers for the universities
for uni, details in universities.items():
    icon = folium.CustomIcon(details['logo'], icon_size=(50, 50))  # Adjust icon size as needed
    folium.Marker(location=details['coords'], icon=icon, tooltip=uni).add_to(m)

# Save the map to an HTML file in the same folder
m.save('Book_DeGruyter/Maps/universities_map.html')
