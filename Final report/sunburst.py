import json
import plotly.graph_objects as go
from collections import defaultdict
from datetime import datetime

# Load the JSON data
with open('Final report/Data/Publications_and_activities_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Process the data
publications = data['rows']

# Create hierarchical data structure
hierarchy = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

for pub in publications:
    if pub['Type'] and pub['Language'] and pub['Date']:
        pub_type = pub['Type']
        language = pub['Language']
        year = datetime.strptime(pub['Date'], '%Y-%m-%d').year
        hierarchy[pub_type][language][year] += 1

# Prepare data for Plotly
labels = []
parents = []
values = []

for pub_type, languages in hierarchy.items():
    labels.append(pub_type)
    parents.append("")
    values.append(sum(sum(years.values()) for years in languages.values()))
    
    for language, years in languages.items():
        labels.append(f"{pub_type} - {language}")
        parents.append(pub_type)
        values.append(sum(years.values()))
        
        for year, count in years.items():
            labels.append(f"{year}")
            parents.append(f"{pub_type} - {language}")
            values.append(count)

# Create the Sunburst chart
fig = go.Figure(go.Sunburst(
    labels=labels,
    parents=parents,
    values=values,
    branchvalues="total",
    maxdepth=3,
    insidetextorientation='radial'
))

# Update layout
fig.update_layout(
    title="Publications Sunburst Chart",
    width=1000,
    height=1000,
)

# Save the chart as an interactive HTML file
fig.write_html("Final report/sunburst_chart.html")

print("Sunburst chart has been saved as 'sunburst_chart.html'")
