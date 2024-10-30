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
        
        # Make text box always pickable
        self.text_obj.set_picker(True)
        if self.text_obj.get_bbox_patch():
            self.text_obj.get_bbox_patch().set_picker(True)
        
        # Connect events
        self.cid_press = text_obj.figure.canvas.mpl_connect(
            'button_press_event', self.on_press)
        self.cid_motion = text_obj.figure.canvas.mpl_connect(
            'motion_notify_event', self.on_motion)
        self.cid_release = text_obj.figure.canvas.mpl_connect(
            'button_release_event', self.on_release)

    def on_press(self, event):
        """Called when a mouse button is pressed"""
        if event.inaxes != self.text_obj.axes:
            return
        
        contains, _ = self.text_obj.contains(event)
        if not contains:
            return
            
        # Store current position and mouse coordinates
        self.press = self.text_obj.get_position()
        self.mouse_start = (event.xdata, event.ydata)

    def on_motion(self, event):
        """Called when mouse is moved"""
        if self.press is None:
            return
        if event.inaxes != self.text_obj.axes or event.xdata is None or event.ydata is None:
            return

        # Calculate movement
        dx = event.xdata - self.mouse_start[0]
        dy = event.ydata - self.mouse_start[1]
        
        # Update position
        new_pos = (self.press[0] + dx, self.press[1] + dy)
        self.text_obj.set_position(new_pos)
        self.text_obj.figure.canvas.draw_idle()

    def on_release(self, event):
        """Called when mouse button is released"""
        self.press = None
        self.mouse_start = None
        if self.text_obj.figure:  # Check if figure still exists
            self.text_obj.figure.canvas.draw_idle()

    def disconnect(self):
        """Disconnect all callbacks"""
        if self.text_obj.figure:  # Check if figure still exists
            self.text_obj.figure.canvas.mpl_disconnect(self.cid_press)
            self.text_obj.figure.canvas.mpl_disconnect(self.cid_motion)
            self.text_obj.figure.canvas.mpl_disconnect(self.cid_release)

def create_timeline(data, categories, filename_base):
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    # Compact figure size suitable for book
    width_inches = 4.5  # narrow width for book column
    height_inches = 8   # proportional height
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    
    # Set specific subplot parameters from the beginning
    plt.subplots_adjust(
        left=0.374,    # matches your left value
        bottom=0.05,   # matches your bottom value
        right=0.617,   # matches your right value
        top=0.95,      # matches your top value
        wspace=0.2,    # matches your wspace value
        hspace=0.2     # matches your hspace value
    )
    
    # Timeline range setup
    min_date = min(df['date'])
    max_date = max(df['date'])
    start_year = (min_date.year // 5) * 5
    end_year = ((max_date.year + 4) // 5) * 5
    
    ax.set_ylim([pd.Timestamp(f"{end_year}-01-01"), pd.Timestamp(f"{start_year}-01-01")])
    
    # Central timeline
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.75)

    # Year labels with larger font
    years = range(start_year, end_year + 1, 5)
    for year in years:
        y_pos = pd.Timestamp(f"{year}-01-01")
        ax.text(0.5, y_pos, str(year), ha='center', va='center', 
               fontsize=11, backgroundcolor='white')

    def wrap_text(text, max_width=18):  # Slightly reduced width to accommodate larger font
        return '\n'.join(textwrap.wrap(text, width=max_width))

    # Initialize draggable_texts list
    draggable_texts = []

    # Process events
    events_by_country = {'Benin': [], 'Togo': []}
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    # Position text boxes
    for country, events in events_by_country.items():
        if country == 'Benin':
            text_x = 0.35
            align = 'right'
            line_start = 0.495
        else:  # Togo
            text_x = 0.65
            align = 'left'
            line_start = 0.505
        
        for date, event in events:
            ax.plot([line_start, text_x], [date, date],
                   color='gray', linestyle='-', linewidth=0.5)
            
            bbox_props = dict(
                boxstyle="round,pad=0.3",  # Slightly increased padding for larger font
                fc="white",
                ec="black",
                alpha=1.0,
                linewidth=0.5,
                picker=True
            )
            
            text_obj = ax.text(text_x, date, event,
                             verticalalignment='center',
                             horizontalalignment=align,
                             fontsize=11,  # Increased from 9
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

    # Country labels - larger and bolder
    ax.text(0.35, 1.02, 'Benin', ha='right', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    ax.text(0.65, 1.02, 'Togo', ha='left', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

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