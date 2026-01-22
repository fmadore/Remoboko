import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import json
import os

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the JSON file
data_file_path = os.path.join(current_dir, 'Data', 'Collaborators_data.json')

# Load data from the JSON file
with open(data_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Create a DataFrame from the collaborators data
df = pd.DataFrame(data)

# Count the number of collaborators by gender
gender_counts = df['Gender'].value_counts()

# Calculate the total number of collaborators
total_collaborators = df.shape[0]

# Define modern color palette (lowercase to match data)
colors = {
    'male': '#3498db',
    'female': '#e74c3c',
    'other': '#2ecc71',
    'unknown': '#95a5a6'
}

# Get colors in order of gender_counts index
pie_colors = [colors.get(gender, '#95a5a6') for gender in gender_counts.index]

# Create figure with modern styling
fig, ax = plt.subplots(figsize=(10, 8), facecolor='none')
ax.set_facecolor('none')

# Create donut chart
wedges, texts, autotexts = ax.pie(
    gender_counts,
    labels=None,  # We'll use legend instead
    autopct='%1.1f%%',
    startangle=90,
    colors=pie_colors,
    wedgeprops=dict(width=0.6, edgecolor='white', linewidth=2),
    pctdistance=0.75,
    shadow=False,
    explode=[0.02] * len(gender_counts)  # Slight separation
)

# Style the percentage text
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontsize(14)
    autotext.set_fontweight('bold')

# Add center circle for donut effect (already done with wedgeprops width)
# Add center text
center_text = ax.text(
    0, 0,
    f'{total_collaborators}\nTotal',
    ha='center',
    va='center',
    fontsize=24,
    fontweight='bold',
    color='#333'
)

# Add title
ax.set_title(
    'Distribution of Collaborators by Gender',
    fontsize=18,
    fontweight='bold',
    color='#333',
    pad=20
)

# Add legend
legend_labels = [f'{gender} ({count})' for gender, count in zip(gender_counts.index, gender_counts.values)]
ax.legend(
    wedges,
    legend_labels,
    title='Gender',
    loc='center left',
    bbox_to_anchor=(1, 0, 0.5, 1),
    fontsize=12,
    title_fontsize=13,
    frameon=True,
    fancybox=True,
    shadow=False,
    edgecolor='#ddd'
)

# Ensure the pie is circular
ax.axis('equal')

# Adjust layout
plt.tight_layout()

# Construct full path for output file
png_output_path = os.path.join(current_dir, 'collaborators_gender.png')

# Save the pie chart with a transparent background
plt.savefig(png_output_path, transparent=True, dpi=150, bbox_inches='tight')

print(f"Chart saved as {png_output_path}")

# Display the plot
plt.show()
