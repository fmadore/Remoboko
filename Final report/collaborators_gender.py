import sys
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # repo root
from viz_common import QUALITATIVE_PALETTE, load_json

script_dir = Path(__file__).resolve().parent

# Load data from the JSON file
data = load_json(script_dir / 'Data' / 'Collaborators_data.json')
df = pd.DataFrame(data)

# Count the number of collaborators by gender
gender_counts = df['Gender'].value_counts()

# Calculate the total number of collaborators
total_collaborators = df.shape[0]

# Neutral palette from the shared qualitative colors (keys lowercase to match data)
colors = {
    'male': QUALITATIVE_PALETTE[0],    # teal
    'female': QUALITATIVE_PALETTE[1],  # orange
    'other': QUALITATIVE_PALETTE[2],
    'unknown': '#b3b3b3',
}

# Get colors in order of gender_counts index
pie_colors = [colors.get(gender, '#b3b3b3') for gender in gender_counts.index]

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

# Add center text
ax.text(
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

# Transparent version for slides/report layouts on light backgrounds,
# plus a white-background version that works anywhere.
transparent_path = script_dir / 'collaborators_gender.png'
plt.savefig(transparent_path, transparent=True, dpi=150, bbox_inches='tight')
print(f"Chart saved as {transparent_path}")

white_path = script_dir / 'collaborators_gender_white.png'
plt.savefig(white_path, transparent=False, facecolor='white', dpi=150, bbox_inches='tight')
print(f"Chart saved as {white_path}")

# Display the plot
plt.show()
