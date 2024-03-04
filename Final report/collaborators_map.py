import pandas as pd
import folium
import requests
from io import BytesIO
from folium import IFrame

# URL of the Excel file on GitHub
excel_url = 'https://github.com/fmadore/Remoboko/raw/master/Final%20report/Report_data.xlsx'

# Fetch the content of the Excel file
response = requests.get(excel_url)
data = BytesIO(response.content)

# Load the data into a Pandas DataFrame
df = pd.read_excel(data, sheet_name='Collaborators')

# Group the data by affiliation to aggregate collaborators
grouped = df.groupby('Affiliation')

# Create the map, centered around a default location
map = folium.Map(location=[0, 0], zoom_start=2)

# Iterate over each affiliation group
for affiliation, group in grouped:
    # Parse the first row to get the location (assuming all rows in the group have the same location)
    try:
        location = [float(coord) for coord in group.iloc[0]['Coordinate location'].split(',')]
    except ValueError:
        print(f"Skipping {affiliation} due to invalid coordinates")
        continue

    # Generate HTML content for the popup
    popup_content = '<br>'.join([f'<a href="{row["URL"]}" target="_blank">{row["Collaborator"]}</a>' for index, row in group.iterrows()])
    iframe = IFrame(html=popup_content, width=200, height=100)
    popup = folium.Popup(iframe, parse_html=True)

    # Add a marker for the affiliation
    folium.Marker(
        location=location,
        popup=popup,
        tooltip=affiliation  # Shows the affiliation when hovering over the marker
    ).add_to(map)

# Save the map to an HTML file
map.save('collaborators_map.html')
