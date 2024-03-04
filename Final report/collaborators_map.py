import pandas as pd
import folium
import requests
from io import BytesIO

# URL of the Excel file on GitHub (make sure it's the raw version)
excel_url = 'https://github.com/fmadore/Remoboko/raw/master/Final%20report/Report_data.xlsx'

# Fetch the content of the Excel file
response = requests.get(excel_url)
data = BytesIO(response.content)

# Load the data into a Pandas DataFrame
df = pd.read_excel(data, sheet_name='Collaborators')

# Create the map, centered around a default location
# You might want to change the initial location and zoom_start to better suit your data
map = folium.Map(location=[0, 0], zoom_start=2)

# Function to create the popup content for each marker
def create_popup(row):
    return folium.Popup(f'<a href="{row["URL"]}" target="_blank">{row["Collaborator"]}</a>', parse_html=True)

# Add markers to the map
for index, row in df.iterrows():
    # Ensure the coordinates are correctly parsed
    try:
        location = [float(coord) for coord in row['Coordinate location'].split(',')]
        folium.Marker(
            location=location,
            popup=create_popup(row),
            tooltip=row['Affiliation']  # Shows the affiliation when hovering over the marker
        ).add_to(map)
    except ValueError:
        print(f"Skipping {row['Collaborator']} due to invalid coordinates")

# Save the map to an HTML file
map.save('collaborators_map.html')
