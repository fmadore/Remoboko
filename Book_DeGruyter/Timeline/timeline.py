import json
import pandas as pd
import matplotlib.pyplot as plt
import os
import textwrap

plt.rcParams['font.family'] = 'DejaVu Sans'

def create_timeline(data, categories, filename_base, manual_positions=None):
    if manual_positions is None:
        manual_positions = {}
        
    filtered_data = [item for item in data if item['category'] in categories]
    df = pd.DataFrame(filtered_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date', ascending=True)

    width_inches = 8.0
    height_inches = 8
    fig, ax = plt.subplots(figsize=(width_inches, height_inches))
    
    plt.subplots_adjust(left=0.22, bottom=0.05, right=0.78, top=0.95, wspace=0.2, hspace=0.2)
    
    min_date = min(df['date'])
    max_date = max(df['date'])
    start_year = (min_date.year // 5) * 5
    end_year = ((max_date.year + 4) // 5) * 5
    
    ax.set_ylim([pd.Timestamp(f"{end_year}-01-01"), pd.Timestamp(f"{start_year}-01-01")])
    ax.axvline(x=0.5, color='black', linestyle='-', linewidth=0.75)

    years = range(start_year, end_year + 1, 5)
    for year in years:
        y_pos = pd.Timestamp(f"{year}-01-01")
        ax.text(0.5, y_pos, str(year), ha='center', va='center', fontsize=11, backgroundcolor='white')

    def wrap_text(text, max_width=18):
        no_wrap_events = [
            "GBUST officially recognised", "8th GBUAF Triennial Congress",
            "Ban of religious sects", "CCU construction begins",
            "RAJEC Benin founded", "CIUB officially recognised",
            "Independence of Togo", "University of Kara founded",
            "Independence of Benin", "UB renamed University of Lomé",
            "University of Dahomey founded", "Youth associations banned",
            "Mathieu Kérékou seizes power", "Official inauguration of UB",
            "University of Benin founded"
        ]
        
        if text == "UDahomey renamed National University of Benin":
            return "UDahomey\nrenamed National\nUniversity of Benin"
        elif text == "UNB renamed University of Abomey-Calavi":
            return "UNB renamed\nUniversity of Abomey-Calavi"
        elif text == "University of Parakou founded":
            return "University of\nParakou founded"
        elif text == "École Nouvelle reform":
            return "École Nouvelle\nreform"
            
        if text in no_wrap_events:
            return text
        return '\n'.join(textwrap.wrap(text, width=max_width))

    events_by_country = {'Benin': [], 'Togo': []}
    
    for _, row in df.iterrows():
        events_by_country[row['country']].append((row['date'], wrap_text(row['event'])))

    for country, events in events_by_country.items():
        if country == 'Benin':
            default_x = 0.35
            align = 'right'
            line_start = 0.495
        else:
            default_x = 0.65
            align = 'left'
            line_start = 0.505
        
        for date, event in events:
            if event == "École Nouvelle\nreform" and country == "Togo":
                text_x = 0.54
            else:
                text_x = manual_positions.get(event, default_x)
            
            ax.plot([line_start, text_x], [date, date], color='gray', linestyle='-', linewidth=0.5)
            
            bbox_props = dict(boxstyle="round,pad=0.3", fc="white", ec="black", alpha=1.0, linewidth=0.5)
            ax.text(text_x, date, event, verticalalignment='center',
                    horizontalalignment=align, fontsize=11, bbox=bbox_props, zorder=10)

    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.yaxis.set_visible(False)

    ax.text(0.15, 1.02, 'Benin', ha='right', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')
    
    togo_x = 1.15 if 'Religion' in categories else 0.85
    ax.text(togo_x, 1.02, 'Togo', ha='left', va='bottom',
            transform=ax.transAxes, fontsize=14, fontweight='bold')

    plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
    plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')

    def on_key(event):
        if event.key == 's':
            plt.savefig(f"{filename_base}.png", dpi=300, bbox_inches='tight')
            plt.savefig(f"{filename_base}.svg", format='svg', bbox_inches='tight')

    fig.canvas.mpl_connect('key_press_event', on_key)
    plt.show()

current_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(current_dir, 'data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

religion_positions = {
    "GBEEB founded": 0.15,
    "ILACI foundation\nstone laid": 0.20,
    "CIUB officially recognised": 0.45,
}

education_politics_positions = {
    "University of\nParakou founded": 0.46,
    "École Nouvelle\nreform": 0.46,
    "Youth associations banned": 0.53,
    "Official inauguration of UB": 0.65,
    "University of Benin founded": 0.60,
    "Dahomean May": 0.46
}

create_timeline(data, ['Religion'], 
               os.path.join(current_dir, 'Religion_Timeline'),
               manual_positions=religion_positions)

create_timeline(data, ['Education', 'Politics'],
               os.path.join(current_dir, 'Education_Politics_Timeline'),
               manual_positions=education_politics_positions)