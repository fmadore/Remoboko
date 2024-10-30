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
        
        # Connect events
        self.cidpress = text_obj.figure.canvas.mpl_connect(
            'button_press_event', self.on_press)
        self.cidrelease = text_obj.figure.canvas.mpl_connect(
            'button_release_event', self.on_release)
        self.cidmotion = text_obj.figure.canvas.mpl_connect(
            'motion_notify_event', self.on_motion)

    def on_press(self, event):
        """Called when a mouse button is pressed"""
        if event.inaxes != self.text_obj.axes:
            return
        
        contains, attrd = self.text_obj.contains(event)
        if not contains:
            return
        
        # Store the initial position in display coordinates
        self.press = self.text_obj.get_position()
        self.mouse_start = (event.x, event.y)
        
    def on_motion(self, event):
        """Called when mouse is moved"""
        if self.press is None or self.mouse_start is None:
            return
        if event.inaxes != self.text_obj.axes:
            return
        
        # Calculate movement in display coordinates
        dx = event.x - self.mouse_start[0]
        dy = event.y - self.mouse_start[1]
        
        # Convert movement to data coordinates
        dx_data = dx / self.text_obj.axes.figure.dpi * self.text_obj.axes.get_window_extent().width
        dy_data = dy / self.text_obj.axes.figure.dpi * self.text_obj.axes.get_window_extent().height
        
        # Update position
        new_x = self.press[0] + dx_data * 0.1  # Scale factor to make movement less sensitive
        new_y = self.press[1]  # Keep original y position (date)
        
        self.text_obj.set_position((new_x, new_y))
        self.text_obj.figure.canvas.draw()

    def on_release(self, event):
        """Called when mouse button is released"""
        self.press = None
        self.mouse_start = None
        self.text_obj.figure.canvas.draw()

    def disconnect(self):
        """Disconnect all callbacks"""
        self.text_obj.figure.canvas.mpl_disconnect(self.cidpress)
        self.text_obj.figure.canvas.mpl_disconnect(self.cidrelease)
        self.text_obj.figure.canvas.mpl_disconnect(self.cidmotion)

def create_timeline(data, categories, filename_base, manual_positions=None):
    """
    Create timeline with manual positions for specific events.
    manual_positions should be a dict like:
    {
        "event_text": x_position,  # where x_position is between 0 and 1
        ...
    }
    """
    if manual_positions is None:
        manual_positions = {}
        
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    # Compact figure size suitable for book
    width_inches = 7.5  # Increased from 6.0 to give more room
    height_inches = 8   # keep same height
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    
    # Set specific subplot parameters from the beginning
    plt.subplots_adjust(
        left=0.25,     # Moved left margin in slightly
        bottom=0.05,   
        right=0.75,    # Moved right margin out slightly
        top=0.95,      
        wspace=0.2,    
        hspace=0.2     
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
            default_x = 0.35
            align = 'right'
            line_start = 0.495
        else:  # Togo
            default_x = 0.65
            align = 'left'
            line_start = 0.505
        
        for date, event in events:
            # Check if this event has a manual position
            text_x = manual_positions.get(event, default_x)
            
            ax.plot([line_start, text_x], [date, date],
                   color='gray', linestyle='-', linewidth=0.5)
            
            bbox_props = dict(
                boxstyle="round,pad=0.3",
                fc="white",
                ec="black",
                alpha=1.0,
                linewidth=0.5
            )
            
            text_obj = ax.text(text_x, date, event,
                             verticalalignment='center',
                             horizontalalignment=align,
                             fontsize=11,
                             bbox=bbox_props,
                             zorder=10)
            
            draggable_texts.append(text_obj)

    # Clean up plot
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)

    # Country labels - larger and bolder
    ax.text(0.15, 1.02, 'Benin', ha='right', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    ax.text(0.85, 1.02, 'Togo', ha='left', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    def on_key(event):
        if event.key == 's':
            plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
            plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')
            print(f"Timeline saved to {filename_base}.png and {filename_base}.svg")

    # Save figures immediately with tight bbox
    plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
    plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')
    print(f"Timeline saved to {filename_base}.png and {filename_base}.svg")

    # Optional: keep the interactive save functionality
    fig.canvas.mpl_connect('key_press_event', on_key)
    plt.show()

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the JSON data
with open(os.path.join(current_dir, 'data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print all events to help with positioning
print("\nAvailable events for positioning:")
for item in data:
    wrapped = '\n'.join(textwrap.wrap(item['event'], width=18))
    print(f"\nOriginal: {item['event']}")
    print(f"Wrapped: {wrapped}")

# Define manual positions
manual_positions = {
    "GBEEB founded": 0.15,         # Far left
    "ILACI foundation\nstone laid": 0.15,  # Same position as GBEEB
    "8th GBUAF\nTriennial Congress": 0.85,  # Far right
    "CIUB officially\nrecognised": 0.40  # Slightly closer to center than default 0.35
}

# Create Religion timeline with manual positions
create_timeline(data, ['Religion'], 
               os.path.join(current_dir, 'Religion_Timeline'),
               manual_positions=manual_positions)

# Create Education and Politics timeline with the same figure parameters
create_timeline(data, ['Education', 'Politics'],
               os.path.join(current_dir, 'Education_Politics_Timeline'))

print("\nTimelines have been created successfully in both PNG and SVG formats.")