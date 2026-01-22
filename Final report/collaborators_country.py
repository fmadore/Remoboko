import json
import pandas as pd
import plotly.express as px
import plotly.io as pio
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load the Data
data_file_path = os.path.join(script_dir, 'Data', 'Collaborators_data.json')
with open(data_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Convert JSON data to DataFrame
df = pd.DataFrame(data)

# Prepare the Data
df['hover_text'] = df['Collaborator']

# Aggregate the data to get a list of contributors' names for each country
country_contributors = df.groupby('Country')['hover_text'].apply(list).reset_index()

# Transform the list of names into a single string with names separated by HTML line breaks
country_contributors['hover_text'] = country_contributors['hover_text'].apply(lambda x: '<br>'.join(x))

# Count the number of contributors by country for the bar chart values
country_contributors['Contributors Count'] = country_contributors['hover_text'].apply(lambda x: len(x.split('<br>')))

# Sort countries by the number of contributors in descending order
country_contributors_sorted = country_contributors.sort_values(by='Contributors Count', ascending=True)

# Count the total number of collaborators
total_collaborators = df['Collaborator'].nunique()

# Define color palette with better contrast
colors = ['#c6e5f5', '#8dcde3', '#4db6d1', '#2596be', '#1a759f', '#1e6091', '#184e77']

# Generate an Interactive Plotly Chart
fig = px.bar(
    country_contributors_sorted,
    x='Contributors Count',
    y='Country',
    hover_data=['hover_text'],
    labels={'hover_text': 'Contributors'},
    title=f'Distribution of Collaborators by Country (Total: {total_collaborators})',
    color='Contributors Count',
    color_continuous_scale=colors
)

# Update layout with modern styling
fig.update_layout(
    template='plotly_white',
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
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(0,0,0,0)',
    hoverlabel=dict(
        bgcolor='white',
        font_size=13,
        font_family='Open Sans, sans-serif',
        font_color='#333',
        bordercolor='#ddd'
    ),
    coloraxis_showscale=False,
    margin=dict(l=20, r=20, t=60, b=20),
    xaxis=dict(
        title=dict(text='Number of Contributors', font=dict(size=14)),
        gridcolor='#eee',
        showline=True,
        linewidth=1,
        linecolor='#ddd'
    ),
    yaxis=dict(
        title=dict(text='', font=dict(size=14)),
        gridcolor='#eee',
        showline=True,
        linewidth=1,
        linecolor='#ddd'
    )
)

# Update bar styling
fig.update_traces(
    hovertemplate='<b>%{y}</b><br><br>%{customdata[0]}<extra></extra>',
    marker=dict(
        line=dict(width=0),
        cornerradius=4
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
        'filename': 'collaborators_by_country',
        'height': 600,
        'width': 1000,
        'scale': 2
    }
}

# Save the Chart as an HTML File
output_path = os.path.join(script_dir, 'collaborators_by_country.html')
fig.write_html(output_path, config=config)

print(f"Chart saved as {output_path}")
