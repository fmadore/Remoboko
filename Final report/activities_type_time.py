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
type_by_year = {}
for item in data['rows']:
    if item['Date'] and item['Type']:
        year = datetime.strptime(item['Date'], '%Y-%m-%d').year
        if year not in type_by_year:
            type_by_year[year] = Counter()
        type_by_year[year][item['Type']] += 1

# Prepare data for plotting
years = sorted(type_by_year.keys())
types = sorted(set(type for counts in type_by_year.values() for type in counts))

# Create traces for each publication type
traces = []
for type in types:
    counts = [type_by_year[year][type] for year in years]
    trace = go.Bar(x=years, y=counts, name=type)
    traces.append(trace)

# Create the layout
layout = go.Layout(
    title='Remoboko publications and activities by type over time',
    xaxis=dict(title='Year'),
    yaxis=dict(title='Count'),
    barmode='stack'
)

# Create the figure
fig = go.Figure(data=traces, layout=layout)

# Save the figure as an HTML file in the same directory as the script
output_path = os.path.join(current_dir, 'activities_type_over_time.html')
fig.write_html(output_path)

print(f"Chart saved as: {output_path}")

# Optionally, still show the figure in the default browser
fig.show()
