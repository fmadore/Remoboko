import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

import plotly.express as px

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # repo root
from viz_common import load_json, plotly_config, register_plotly_template

script_dir = Path(__file__).resolve().parent

# Load the JSON data
data = load_json(script_dir / 'Data' / 'Publications_and_activities_data.json')
publications = data['rows']

# Aggregate publication counts by (Type, Language, Year)
aggregated = Counter(
    (pub['Type'], pub['Language'], str(datetime.strptime(pub['Date'], '%Y-%m-%d').year))
    for pub in publications
    if pub['Type'] and pub['Language'] and pub['Date']
)

total_publications = sum(aggregated.values())
skipped = len(publications) - total_publications
if skipped:
    print(f"Warning: {skipped} row(s) skipped (missing Type, Language or Date)")

# Convert to list for plotly
plot_data = [
    {'Type': k[0], 'Language': k[1], 'Year': k[2], 'Count': v}
    for k, v in aggregated.items()
]

register_plotly_template()

# Create treemap
fig = px.treemap(
    plot_data,
    path=['Type', 'Language', 'Year'],
    values='Count',
    color='Type',
    color_discrete_sequence=px.colors.qualitative.Set2,
    title=f'Publications & Activities Treemap (Total: {total_publications})'
)

fig.update_layout(
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

# Save the chart as an interactive HTML file
output_path = script_dir / 'treemap_chart.html'
fig.write_html(output_path, config=plotly_config('treemap_chart', width=1000, height=700))

print(f"Treemap chart has been saved as '{output_path}'")
