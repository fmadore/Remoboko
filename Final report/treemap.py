import json
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

# Build flat data for treemap
treemap_data = []

for pub in publications:
    if pub['Type'] and pub['Language'] and pub['Date']:
        pub_type = pub['Type']
        language = pub['Language']
        year = datetime.strptime(pub['Date'], '%Y-%m-%d').year
        treemap_data.append({
            'Type': pub_type,
            'Language': language,
            'Year': str(year),
            'count': 1
        })

# Count total
total_publications = len(treemap_data)

# Aggregate by Type, Language, Year
from collections import Counter
aggregated = Counter((d['Type'], d['Language'], d['Year']) for d in treemap_data)

# Convert to list for plotly
plot_data = [
    {'Type': k[0], 'Language': k[1], 'Year': k[2], 'Count': v}
    for k, v in aggregated.items()
]

# Create treemap
fig = px.treemap(
    plot_data,
    path=['Type', 'Language', 'Year'],
    values='Count',
    color='Type',
    color_discrete_sequence=px.colors.qualitative.Set2,
    title=f'Publications & Activities Treemap (Total: {total_publications})'
)

# Update layout with modern styling
fig.update_layout(
    font=dict(
        family='Open Sans, sans-serif',
        size=13,
        color='#333'
    ),
    title=dict(
        font=dict(size=20, color='#333'),
        x=0.5,
        xanchor='center'
    ),
    paper_bgcolor='rgba(0,0,0,0)',
    hoverlabel=dict(
        bgcolor='white',
        font_size=13,
        font_family='Open Sans, sans-serif',
        font_color='#333',
        bordercolor='#ddd'
    ),
    margin=dict(l=20, r=20, t=80, b=20),
    width=1000,
    height=700
)

# Update traces for better text display
fig.update_traces(
    textinfo='label+value',
    textfont=dict(size=12),
    hovertemplate='<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percentParent:.1%}<extra></extra>',
    marker=dict(
        line=dict(width=2, color='white')
    )
)

# Configure interactive options
config = {
    'displayModeBar': True,
    'modeBarButtonsToAdd': ['downloadSVG'],
    'modeBarButtonsToRemove': ['lasso2d', 'select2d'],
    'displaylogo': False,
    'toImageButtonOptions': {
        'format': 'png',
        'filename': 'treemap_chart',
        'height': 700,
        'width': 1000,
        'scale': 2
    }
}

# Save the chart as an interactive HTML file
output_path = os.path.join(script_dir, 'treemap_chart.html')
fig.write_html(output_path, config=config)

print(f"Treemap chart has been saved as '{output_path}'")
