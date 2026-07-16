import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

import plotly.graph_objects as go

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # repo root
from viz_common import QUALITATIVE_PALETTE, load_json, plotly_config, register_plotly_template

script_dir = Path(__file__).resolve().parent

# Load the JSON data
data = load_json(script_dir / 'Data' / 'Publications_and_activities_data.json')

# Process the data
type_by_quarter = {}
dates = []
total_activities = 0

for item in data['rows']:
    if item['Date'] and item['Type']:
        date = datetime.strptime(item['Date'], '%Y-%m-%d')
        dates.append(date)
        quarter = (date.month - 1) // 3 + 1
        quarter_key = f"{date.year}-Q{quarter}"
        if quarter_key not in type_by_quarter:
            type_by_quarter[quarter_key] = Counter()
        type_by_quarter[quarter_key][item['Type']] += 1
        total_activities += 1

if not dates:
    raise SystemExit("No rows with both Date and Type found - nothing to plot.")

# Generate all quarters between the first and last quarter present in the data
min_year, max_year = min(dates).year, max(dates).year
all_quarters = [f"{year}-Q{quarter}" for year in range(min_year, max_year + 1) for quarter in range(1, 5)]
last_quarter = f"{max(dates).year}-Q{(max(dates).month - 1) // 3 + 1}"
all_quarters = all_quarters[:all_quarters.index(last_quarter) + 1]

# Prepare data for plotting
types = sorted(set(type for counts in type_by_quarter.values() for type in counts))

# Extend the shared palette so all 12 types get a distinct color
palette = QUALITATIVE_PALETTE + ['#1f78b4', '#b15928', '#7570b3', '#737373']

# Create traces for each publication type
traces = []
for i, type_name in enumerate(types):
    counts = [type_by_quarter.get(quarter, Counter())[type_name] for quarter in all_quarters]
    color = palette[i % len(palette)]
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

register_plotly_template()

layout = go.Layout(
    title=dict(
        text=f'Publications & Activities by Type Over Time (Total: {total_activities})',
        y=0.95,
        yanchor='top'
    ),
    xaxis=dict(
        title=dict(text='Year'),
        tickangle=0,
        tickmode='array',
        tickvals=all_quarters[::4],  # Show every 4th tick to avoid overcrowding
        ticktext=[q.split('-')[0] for q in all_quarters[::4]],  # Show only year for these ticks
        range=[-0.5, len(all_quarters) - 0.5],  # End the x-axis at the last quarter with data
        rangeslider=dict(visible=True, thickness=0.08),  # Zoom into any period
    ),
    yaxis=dict(
        title=dict(text='Count'),
    ),
    barmode='stack',
    bargap=0.15,
    hovermode='x unified',
    hoverlabel=dict(namelength=-1),
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
    height=650,
    margin=dict(l=60, r=150, t=60, b=60)
)

fig = go.Figure(data=traces, layout=layout)

# Save the figure as an HTML file in the same directory as the script
output_path = script_dir / 'activities_type_over_time.html'
fig.write_html(output_path, config=plotly_config('activities_type_over_time', width=1200))

print(f"Chart saved as: {output_path}")
