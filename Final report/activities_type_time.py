import json
import os
from collections import Counter
from datetime import datetime
import plotly.graph_objects as go

# Determine the directory of the current script
current_dir = os.path.dirname(__file__)
data_path = os.path.join(current_dir, 'Data', 'Publications_and_activities_data.json')

# Load the JSON data
with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Process the data
type_by_quarter = {}
all_quarters = set()
min_year, max_year = float('inf'), float('-inf')

for item in data['rows']:
    if item['Date'] and item['Type']:
        date = datetime.strptime(item['Date'], '%Y-%m-%d')
        year = date.year
        min_year = min(min_year, year)
        max_year = max(max_year, year)
        quarter = (date.month - 1) // 3 + 1
        quarter_key = f"{year}-Q{quarter}"
        all_quarters.add(quarter_key)
        if quarter_key not in type_by_quarter:
            type_by_quarter[quarter_key] = Counter()
        type_by_quarter[quarter_key][item['Type']] += 1

# Generate all quarters between min_year and max_year
all_quarters = [f"{year}-Q{quarter}" for year in range(min_year, max_year + 1) for quarter in range(1, 5)]
all_quarters.sort()

# Prepare data for plotting
types = sorted(set(type for counts in type_by_quarter.values() for type in counts))

# Create traces for each publication type
traces = []
for type in types:
    counts = [type_by_quarter.get(quarter, Counter())[type] for quarter in all_quarters]
    trace = go.Bar(
        x=all_quarters, 
        y=counts, 
        name=type,
        hovertemplate='<b>%{x}</b><br>' +
                      'Type: ' + type + '<br>' +
                      'Count: %{y}<br>' +
                      '<extra></extra>'
    )
    traces.append(trace)

# Update the layout for better readability
layout = go.Layout(
    title='Remoboko publications and activities by type over time (Quarterly)',
    xaxis=dict(
        title='Year-Quarter',
        tickangle=45,
        tickmode='array',
        tickvals=all_quarters[::4],  # Show every 4th tick to avoid overcrowding
        ticktext=[q.split('-')[0] for q in all_quarters[::4]]  # Show only year for these ticks
    ),
    yaxis=dict(title='Count'),
    barmode='stack',
    hovermode='closest',
    hoverlabel=dict(
        bgcolor="white",
        font_size=12,
        font_family="Rockwell"
    ),
    height=600,  # Increase height for better visibility
    margin=dict(b=100)  # Increase bottom margin for rotated x-axis labels
)

# Create the figure
fig = go.Figure(data=traces, layout=layout)

# Save the figure as an HTML file in the same directory as the script
output_path = os.path.join(current_dir, 'activities_type_over_time_quarterly.html')
fig.write_html(output_path)

print(f"Chart saved as: {output_path}")

# Optionally, still show the figure in the default browser
fig.show()
