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

    # Compact figure size suitable for book
    width_inches = 4.5  # narrow width for book column
    height_inches = 8   # proportional height
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    
    # Timeline range setup
    min_date = min(df['date'])
    max_date = max(df['date'])
    start_year = (min_date.year // 5) * 5
    end_year = ((max_date.year + 4) // 5) * 5
    
    ax.set_ylim([pd.Timestamp(f"{end_year}-01-01"), pd.Timestamp(f"{start_year}-01-01")])
    
    # Central timeline
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.75)

    # Year labels
    years = range(start_year, end_year + 1, 5)
    for year in years:
        y_pos = pd.Timestamp(f"{year}-01-01")
        ax.text(0.5, y_pos, str(year), ha='center', va='center', 
               fontsize=9, backgroundcolor='white')

    def wrap_text(text, max_width=20):  # Narrower text boxes
        return '\n'.join(textwrap.wrap(text, width=max_width))

    # Initialize draggable_texts list
    draggable_texts = []

    # Process events
    events_by_country = {'Benin': [], 'Togo': []}
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    # Position text boxes extremely close to timeline
    for country, events in events_by_country.items():
        if country == 'Benin':
            text_x = 0.35  # Much closer to timeline
            align = 'right'
            line_start = 0.495  # Very short line
        else:  # Togo
            text_x = 0.65  # Much closer to timeline
            align = 'left'
            line_start = 0.505  # Very short line
        
        for date, event in events:
            # Minimal connecting lines
            ax.plot([line_start, text_x], [date, date],
                   color='gray', linestyle='-', linewidth=0.5)
            
            bbox_props = dict(
                boxstyle="round,pad=0.2",  # Reduced padding
                fc="white",
                ec="black",
                alpha=1.0,
                linewidth=0.5,
                picker=True
            )
            
            text_obj = ax.text(text_x, date, event,
                             verticalalignment='center',
                             horizontalalignment=align,
                             fontsize=9,
                             bbox=bbox_props,
                             picker=True)
            
            draggable_texts.append(DraggableTextBox(text_obj))

    # Clean up plot
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)

    # Country labels - moved closer to timeline
    ax.text(0.35, 1.02, 'Benin', ha='right', va='bottom',
            transform=ax.transAxes, fontsize=10, fontweight='bold')
    ax.text(0.65, 1.02, 'Togo', ha='left', va='bottom',
            transform=ax.transAxes, fontsize=10, fontweight='bold')

    # Even tighter margins
    plt.subplots_adjust(left=0.01, right=0.99, bottom=0.05, top=0.95)

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