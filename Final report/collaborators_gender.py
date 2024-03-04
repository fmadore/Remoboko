import pandas as pd
import matplotlib.pyplot as plt

# Direct URL to the raw Excel file on GitHub
url = 'https://raw.githubusercontent.com/fmadore/Remoboko/master/Final%20report/Report_data.xlsx'

# Load the specific sheet into a DataFrame
df = pd.read_excel(url, sheet_name='Collaborators')

# Count the number of collaborators by gender
gender_counts = df['Gender'].value_counts()

# Create a pie chart to visualize the distribution of collaborators by gender
plt.figure(figsize=(8, 8))
plt.pie(gender_counts, labels=gender_counts.index, autopct='%1.1f%%', startangle=140)
plt.title('Distribution of Collaborators by Gender')

# Save the pie chart with a transparent background
plt.savefig('collaborators_by_gender_transparent.png', transparent=True)

# Display the plot
plt.show()
