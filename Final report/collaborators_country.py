import sys
from pathlib import Path

import pandas as pd
import plotly.express as px

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # repo root
from viz_common import load_json, plotly_config, register_plotly_template

script_dir = Path(__file__).resolve().parent

# Load the data
data = load_json(script_dir / 'Data' / 'Collaborators_data.json')
df = pd.DataFrame(data)

# Aggregate contributors per country: bar length + hover list of names
country_contributors = (
    df.groupby('Country')['Collaborator']
    .agg(**{
        'Contributors Count': 'size',
        'hover_text': lambda names: '<br>'.join(names),
    })
    .reset_index()
    .sort_values(by='Contributors Count', ascending=True)
)

total_collaborators = len(df)

# Define color palette with better contrast
colors = ['#c6e5f5', '#8dcde3', '#4db6d1', '#2596be', '#1a759f', '#1e6091', '#184e77']

register_plotly_template()

# Generate an Interactive Plotly Chart
fig = px.bar(
    country_contributors,
    x='Contributors Count',
    y='Country',
    hover_data=['hover_text'],
    labels={'hover_text': 'Contributors'},
    title=f'Distribution of Collaborators by Country (Total: {total_collaborators})',
    color='Contributors Count',
    color_continuous_scale=colors
)

fig.update_layout(
    coloraxis_showscale=False,
    margin=dict(l=20, r=20, t=60, b=20),
    xaxis_title='Number of Contributors',
    yaxis_title='',
)

# Update bar styling
fig.update_traces(
    hovertemplate='<b>%{y}</b><br><br>%{customdata[0]}<extra></extra>',
    marker=dict(
        line=dict(width=0),
        cornerradius=4
    )
)

# Save the Chart as an HTML File
output_path = script_dir / 'collaborators_by_country.html'
fig.write_html(output_path, config=plotly_config('collaborators_by_country'))

print(f"Chart saved as {output_path}")
