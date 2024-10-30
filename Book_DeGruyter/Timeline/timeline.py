import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os
import textwrap
from matplotlib.patches import Rectangle

# Set the font to a Unicode-compatible font
plt.rcParams['font.family'] = 'DejaVu Sans'

class DraggableTextBox:
    def __init__(self, text_obj):
        self.text_obj = text_obj
        self.press = None
        self.background = None
        
        # Get the bbox patch
        self.bbox_patch = text_obj.get_bbox_patch()
        
        # Make both text and bbox pickable
        self.text_obj.set_picker(5)  # 5 points tolerance
        if self.bbox_patch:
            self.bbox_patch.set_picker(5)
        
        self.connect()

    def connect(self):
        self.cidpress = self.text_obj.figure.canvas.mpl_connect('button_press_event', self.on_press)
        self.cidrelease = self.text_obj.figure.canvas.mpl_connect('button_release_event', self.on_release)
        self.cidmotion = self.text_obj.figure.canvas.mpl_connect('motion_notify_event', self.on_motion)

    def on_press(self, event):
        if event.inaxes != self.text_obj.axes:
            return
        contains, attrd = self.text_obj.contains(event)
        if not contains:
            return
        x0, y0 = self.text_obj.get_position()
        # Convert y0 to float if it's a Timestamp
        if isinstance(y0, pd.Timestamp):
            y0 = mdates.date2num(y0)
        self.press = x0, y0, event.xdata, event.ydata

    def on_motion(self, event):
        if self.press is None:
            return
        if event.inaxes != self.text_obj.axes:
            return
        x0, y0, xpress, ypress = self.press
        dx = event.xdata - xpress
        dy = event.ydata - ypress
        self.text_obj.set_position((x0 + dx, y0 + dy))
        self.text_obj.figure.canvas.draw()

    def on_release(self, event):
        self.press = None
        self.text_obj.figure.canvas.draw()

def create_timeline(data, categories, filename_base):
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    width_inches = 16.51 / 2.54
    height_inches = 24.13 / 2.54
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    
    # Set up the timeline range
    min_date = min(df['date'])
    max_date = max(df['date'])
    
    # Round to nearest 5 years for clean boundaries
    start_year = (min_date.year // 5) * 5
    end_year = ((max_date.year + 4) // 5) * 5
    
    ax.set_ylim([pd.Timestamp(f"{end_year}-01-01"), pd.Timestamp(f"{start_year}-01-01")])
    
    # Create vertical lines for timeline
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.5)

    # Set up year labels on the central axis
    years = range(start_year, end_year + 1, 5)
    for year in years:
        y_pos = pd.Timestamp(f"{year}-01-01")
        ax.axhline(y=y_pos, color='lightgray', linestyle='--', linewidth=0.5, xmin=0.48, xmax=0.52)
        ax.text(0.5, y_pos, str(year), ha='center', va='center', fontsize=9)

    def wrap_text(text, max_width=25):
        return '\n'.join(textwrap.wrap(text, width=max_width))

    # Initialize draggable_texts list
    draggable_texts = []

    # Create events_by_country dictionary
    events_by_country = {'Benin': [], 'Togo': []}
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    # Process events for both countries
    for country, events in events_by_country.items():
        if country == 'Benin':
            text_x = 0.15
            align = 'right'
            line_start = 0.45
        else:  # Togo
            text_x = 0.85
            align = 'left'
            line_start = 0.55
        
        for date, event in events:
            # Draw connecting line
            ax.plot([line_start, text_x], [date, date],
                   color='gray', linestyle='-', linewidth=0.5)
            
            # Add event text box with increased picking radius
            bbox_props = dict(
                boxstyle="round,pad=0.5",
                fc="white",
                ec="black",
                alpha=1.0,
                linewidth=1.0,
                picker=True
            )
            
            text_obj = ax.text(text_x, date, event,
                             verticalalignment='center',
                             horizontalalignment=align,
                             fontsize=9,
                             bbox=bbox_props,
                             picker=True)
            
            draggable_texts.append(DraggableTextBox(text_obj))

    # Remove all spines and the x-axis
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)

    # Add country labels
    ax.text(0.15, 1.02, 'Benin', ha='center', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    ax.text(0.85, 1.02, 'Togo', ha='center', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    # Adjust margins
    plt.subplots_adjust(left=0.2, right=0.9, bottom=0.05, top=0.95)

    def on_key(event):
        if event.key == 's':
            plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
            plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')
            print(f"Timeline saved to {filename_base}.png and {filename_base}.svg")

    fig.canvas.mpl_connect('key_press_event', on_key)
    plt.show()

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the JSON data
with open(os.path.join(current_dir, 'data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create Religion timeline
create_timeline(data, ['Religion'], os.path.join(current_dir, 'Religion_Timeline'))

# Create Education and Politics timeline
create_timeline(data, ['Education', 'Politics'], os.path.join(current_dir, 'Education_Politics_Timeline'))

print("Timelines have been created successfully in both PNG and SVG formats.")