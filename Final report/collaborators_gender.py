import pandas as pd
import matplotlib.pyplot as plt
import json
import os

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the JSON file
data_file_path = os.path.join(current_dir, 'Data', 'Collaborators_data.json')

# Load data from the JSON file
with open(data_file_path, 'r') as file:
    data = json.load(file)

# Create a DataFrame from the collaborators data
df = pd.DataFrame(data)

# Count the number of collaborators by gender
gender_counts = df['Gender'].value_counts()

# Calculate the total number of collaborators
total_collaborators = df.shape[0]

# Create a pie chart to visualize the distribution of collaborators by gender
plt.figure(figsize=(8, 8))
plt.pie(gender_counts, labels=gender_counts.index, autopct='%1.1f%%', startangle=140)
plt.title(f'Distribution of Collaborators by Gender (Total: {total_collaborators})')

# Construct full path for output file
png_output_path = os.path.join(current_dir, 'collaborators_gender.png')

# Save the pie chart with a transparent background
plt.savefig(png_output_path, transparent=True)

# Display the plot
plt.show()
