import json
import os
from collections import Counter
from datetime import datetime
import plotly.graph_objects as go
import plotly.express as px

# Determine the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(script_dir, 'Data', 'Publications_and_activities_data.json')

# Load the JSON data
with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Process the data
type_by_quarter = {}
all_quarters = set()
min_year, max_year = float('inf'), 2025  # Set max_year to 2025
total_activities = 0  # Initialize total activities counter

for item in data['rows']:
    if item['Date'] and item['Type']:
        date = datetime.strptime(item['Date'], '%Y-%m-%d')
        year = date.year
        min_year = min(min_year, year)
        quarter = (date.month - 1) // 3 + 1
        quarter_key = f"{year}-Q{quarter}"
        all_quarters.add(quarter_key)
        if quarter_key not in type_by_quarter:
            type_by_quarter[quarter_key] = Counter()
        type_by_quarter[quarter_key][item['Type']] += 1
        total_activities += 1  # Increment total activities counter

# Generate all quarters between min_year and max_year (2025)
all_quarters = [f"{year}-Q{quarter}" for year in range(min_year, max_year + 1) for quarter in range(1, 5)]
all_quarters.sort()

# Prepare data for plotting
types = sorted(set(type for counts in type_by_quarter.values() for type in counts))

# Define a modern color palette
color_palette = px.colors.qualitative.Set2

# Create traces for each publication type
traces = []
for i, type_name in enumerate(types):
    counts = [type_by_quarter.get(quarter, Counter())[type_name] for quarter in all_quarters]
    color = color_palette[i % len(color_palette)]
    # Replace zeros with None to hide them in hover
    counts_with_none = [c if c > 0 else None for c in counts]
    trace = go.Bar(
        x=all_quarters,
        y=counts_with_none,
        name=type_name,
        marker=dict(
            color=color,
            line=dict(width=0)
        ),
        hovertemplate=f'{type_name}: %{{y}}<extra></extra>'
    )
    traces.append(trace)

# Update the layout for better readability
layout = go.Layout(
    title=dict(
        text=f'Publications & Activities by Type Over Time (Total: {total_activities})',
        font=dict(
            family='Open Sans, sans-serif',
            size=20,
            color='#333'
        ),
        x=0.5,
        xanchor='center',
        y=0.95,
        yanchor='top'
    ),
    font=dict(
        family='Open Sans, sans-serif',
        size=13,
        color='#333'
    ),
    xaxis=dict(
        title=dict(text='Year', font=dict(size=14)),
        tickangle=0,
        tickmode='array',
        tickvals=all_quarters[::4],  # Show every 4th tick to avoid overcrowding
        ticktext=[q.split('-')[0] for q in all_quarters[::4]],  # Show only year for these ticks
        range=[-0.5, all_quarters.index('2025-Q1') + 0.5],  # Set the x-axis range to end at 2025-Q1
        gridcolor='#eee',
        showline=True,
        linewidth=1,
        linecolor='#ddd'
    ),
    yaxis=dict(
        title=dict(text='Count', font=dict(size=14)),
        gridcolor='#eee',
        showline=True,
        linewidth=1,
        linecolor='#ddd'
    ),
    barmode='stack',
    bargap=0.15,
    hovermode='x unified',
    hoverlabel=dict(
        bgcolor='white',
        font_size=13,
        font_family='Open Sans, sans-serif',
        bordercolor='#ddd',
        namelength=-1
    ),
    legend=dict(
        orientation='v',
        yanchor='top',
        y=1,
        xanchor='left',
        x=1.02,
        bgcolor='rgba(255,255,255,0.9)',
        bordercolor='#eee',
        borderwidth=1,
        title=dict(text='Type', font=dict(size=13))
    ),
    template='plotly_white',
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(0,0,0,0)',
    height=650,
    margin=dict(l=60, r=150, t=60, b=60)
)

# Create the figure
fig = go.Figure(data=traces, layout=layout)

# Configure interactive options
config = {
    'displayModeBar': True,
    'modeBarButtonsToAdd': ['downloadSVG'],
    'modeBarButtonsToRemove': ['lasso2d', 'select2d'],
    'displaylogo': False,
    'toImageButtonOptions': {
        'format': 'png',
        'filename': 'activities_type_over_time',
        'height': 600,
        'width': 1200,
        'scale': 2
    }
}

# Save the figure as an HTML file in the same directory as the script
output_path = os.path.join(script_dir, 'activities_type_over_time.html')
fig.write_html(output_path, config=config)

print(f"Chart saved as: {output_path}")
