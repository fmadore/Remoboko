import pandas as pd
import plotly.express as px
import plotly.offline as pyo

# Step 1: Load the Data
# Direct URL to the raw Excel file on GitHub
url = 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Final%20report/Report_data.xlsx'
df = pd.read_excel(url, sheet_name='Collaborators')

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

# Customize hover text to format names with line breaks
fig.update_traces(hovertemplate='%{y}:<br>%{customdata[0]}')

# Step 4: Save the Chart as an HTML File
# Save the interactive chart to an HTML file
html_file_path = 'collaborators_by_country.html'
pyo.plot(fig, filename=html_file_path, auto_open=False)

print(f"Chart saved as {html_file_path}.")
