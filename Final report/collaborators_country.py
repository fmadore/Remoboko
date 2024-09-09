import json
import pandas as pd
import plotly.express as px
import plotly.offline as pyo

# Step 1: Load the Data
with open('Final report/collaborators_data.json', 'r') as file:
    data = json.load(file)

# Convert JSON data to DataFrame
df = pd.DataFrame(data)

# Step 2: Prepare the Data
# Convert each collaborator's name into a list element for later joining with line breaks
df['hover_text'] = df['Collaborator']

# Aggregate the data to get a list of contributors' names for each country
country_contributors = df.groupby('Country')['hover_text'].apply(list).reset_index()

# Transform the list of names into a single string with names separated by HTML line breaks
country_contributors['hover_text'] = country_contributors['hover_text'].apply(lambda x: '<br>'.join(x))

# Count the number of contributors by country for the bar chart values
country_contributors['Contributors Count'] = country_contributors['hover_text'].apply(lambda x: len(x.split('<br>')))

# Sort countries by the number of contributors in descending order
country_contributors_sorted = country_contributors.sort_values(by='Contributors Count', ascending=True)

# Step 3: Generate an Interactive Plotly Chart
fig = px.bar(country_contributors_sorted, x='Contributors Count', y='Country',
             hover_data=['hover_text'], labels={'hover_text': 'Contributors'},
             title='Distribution of Collaborators by Country')

# Make the background transparent
fig.update_layout({
    'plot_bgcolor': 'rgba(0,0,0,0)',
    'paper_bgcolor': 'rgba(0,0,0,0)',
})

# Customize hover text to format names with line breaks
fig.update_traces(hovertemplate='%{y}:<br>%{customdata[0]}')

# Step 4: Save the Chart as an HTML File
# Save the interactive chart to an HTML file in the same folder
html_file_path = 'Final report/collaborators_by_country.html'
pyo.plot(fig, filename=html_file_path, auto_open=False)

print(f"Chart saved as {html_file_path}.")
