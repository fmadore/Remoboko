import folium
from folium.plugins import Fullscreen, MiniMap, MousePosition
from branca.element import Element
import os

# Define the coordinates and paths for the university logos
universities = {
    'University of Lomé': {
        'coords': (6.175690527334621, 1.2137727591902188),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Lome.jpg',
        'country': 'Togo'
    },
    'University of Abomey-Calavi': {
        'coords': (6.415312316251478, 2.341522503861767),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Abomey-Calavi.jpg',
        'country': 'Benin'
    },
    'University of Kara': {
        'coords': (9.53190563529209, 1.2075618607303693),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Kara.jpg',
        'country': 'Togo'
    },
    'University of Parakou': {
        'coords': (9.335184240782041, 2.6466607924077525),
        'logo': 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Book_DeGruyter/Maps/University_Parakou.jpg',
        'country': 'Benin'
    }
}

def create_popup_html(name, logo, country):
    """
    Create rich popup HTML with logo and info.
    """
    return f'''
    <div style="font-family: Arial, sans-serif; text-align: center; width: 180px; padding: 10px;">
        <img src="{logo}" style="width: 60px; height: 60px; border-radius: 8px; margin-bottom: 8px; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <h4 style="margin: 0 0 4px 0; color: #333; font-size: 13px; line-height: 1.3;">{name}</h4>
        <p style="margin: 0; font-size: 11px; color: #666;">📍 {country}</p>
    </div>
    '''

# Calculate the average coordinates to center the map on all universities
avg_lat = sum(uni['coords'][0] for uni in universities.values()) / len(universities)
avg_lng = sum(uni['coords'][1] for uni in universities.values()) / len(universities)
map_center = [avg_lat, avg_lng]

# Create a base map with CartoDB Voyager as default
m = folium.Map(location=map_center, zoom_start=7, tiles=None)

# Add multiple tile layer options
folium.TileLayer("CartoDB Voyager", name="Detailed", show=True).add_to(m)
folium.TileLayer("CartoDB Positron", name="Light").add_to(m)
folium.TileLayer("CartoDB DarkMatter", name="Dark").add_to(m)

# Add interactive plugins
Fullscreen(position='topleft').add_to(m)
MiniMap(position='bottomright', width=120, height=120, toggle_display=True).add_to(m)
MousePosition(position='bottomleft', prefix='Coordinates:').add_to(m)

# Add CSS for custom tooltip styling
tooltip_css = '''
<style>
.custom-tooltip {
    background-color: white !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    padding: 6px 10px !important;
    font-family: Arial, sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #333 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
}
</style>
'''
m.get_root().html.add_child(Element(tooltip_css))

# Create a feature group for universities
universities_group = folium.FeatureGroup(name='Universities')

# Add custom icon markers for the universities
for uni, details in universities.items():
    icon = folium.CustomIcon(details['logo'], icon_size=(50, 50))
    popup_html = create_popup_html(uni, details['logo'], details['country'])

    folium.Marker(
        location=details['coords'],
        icon=icon,
        popup=folium.Popup(popup_html, max_width=220),
        tooltip=folium.Tooltip(uni, permanent=False, className='custom-tooltip')
    ).add_to(universities_group)

universities_group.add_to(m)

# Add layer control for toggling layers and switching base maps
folium.LayerControl(collapsed=False).add_to(m)

# Save the map to an HTML file in the same folder as the script
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, 'universities_map.html')
m.save(output_path)
