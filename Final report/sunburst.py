import json
import plotly.graph_objects as go
import plotly.express as px
from collections import defaultdict
from datetime import datetime
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load the JSON data
data_path = os.path.join(script_dir, 'Data', 'Publications_and_activities_data.json')
with open(data_path, 'r', encoding='utf-8') as f:
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
colors = []

# Define a modern color palette for publication types
type_colors = {
    'Publication': '#3498db',
    'Conference': '#2ecc71',
    'Workshop': '#9b59b6',
    'Seminar': '#e74c3c',
    'Other': '#f39c12',
}

# Get unique types for color assignment
all_types = list(hierarchy.keys())
color_palette = px.colors.qualitative.Set2

for i, pub_type in enumerate(hierarchy.keys()):
    base_color = color_palette[i % len(color_palette)]
    labels.append(pub_type)
    parents.append("")
    values.append(sum(sum(years.values()) for years in hierarchy[pub_type].values()))
    colors.append(base_color)

    for language, years in hierarchy[pub_type].items():
        labels.append(f"{pub_type} - {language}")
        parents.append(pub_type)
        values.append(sum(years.values()))
        colors.append(base_color)

        for year, count in years.items():
            labels.append(f"{year}")
            parents.append(f"{pub_type} - {language}")
            values.append(count)
            colors.append(base_color)

# Count total publications
total_publications = sum(v for v, p in zip(values, parents) if p == "")

# Create the Sunburst chart
fig = go.Figure(go.Sunburst(
    labels=labels,
    parents=parents,
    values=values,
    branchvalues="total",
    maxdepth=3,
    insidetextorientation='radial',
    marker=dict(
        colors=colors,
        line=dict(width=2, color='white')
    ),
    hovertemplate='<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percentParent:.1%}<extra></extra>'
))

# Update layout with modern styling
fig.update_layout(
    title=dict(
        text=f"Publications & Activities Sunburst Chart (Total: {total_publications})",
        font=dict(
            family='Open Sans, sans-serif',
            size=20,
            color='#333'
        ),
        x=0.5,
        xanchor='center'
    ),
    font=dict(
        family='Open Sans, sans-serif',
        size=13,
        color='#333'
    ),
    paper_bgcolor='rgba(0,0,0,0)',
    hoverlabel=dict(
        bgcolor='white',
        font_size=13,
        font_family='Open Sans, sans-serif',
        font_color='#333',
        bordercolor='#ddd'
    ),
    width=900,
    height=900,
    margin=dict(l=20, r=20, t=80, b=20)
)

# Configure interactive options
config = {
    'displayModeBar': True,
    'modeBarButtonsToAdd': ['downloadSVG'],
    'modeBarButtonsToRemove': ['lasso2d', 'select2d'],
    'displaylogo': False,
    'toImageButtonOptions': {
        'format': 'png',
        'filename': 'sunburst_chart',
        'height': 900,
        'width': 900,
        'scale': 2
    }
}

# Save the chart as an interactive HTML file
output_path = os.path.join(script_dir, 'sunburst_chart.html')
fig.write_html(output_path, config=config)

print(f"Sunburst chart has been saved as '{output_path}'")
