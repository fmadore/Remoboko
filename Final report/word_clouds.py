import json
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import spacy
from tqdm import tqdm
import logging
import os
import numpy as np

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Create WordClouds folder if it doesn't exist
wordclouds_dir = os.path.join(current_dir, 'WordClouds')
os.makedirs(wordclouds_dir, exist_ok=True)

# Define path to Data folder
data_dir = os.path.join(current_dir, 'Data')

# Download necessary NLTK data
logging.info("Downloading NLTK data...")
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('punkt_tab', quiet=True)

# Load spaCy French model
nlp_fr = spacy.load('fr_core_news_lg')

# Read the JSON file
logging.info("Reading JSON file...")
json_path = os.path.join(data_dir, 'Publications_and_activities_data.json')
try:
    with open(json_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
except UnicodeDecodeError:
    logging.warning("UTF-8 encoding failed, trying ISO-8859-1...")
    with open(json_path, 'r', encoding='iso-8859-1') as file:
        data = json.load(file)

# Initialize lemmatizer for English
lemmatizer = WordNetLemmatizer()

# Exception lists
english_exceptions = {'vincent'}
french_exceptions = {'vincent', 'source', 'auteur', 'texte'}

# Define custom color functions for each language
def english_color_func(word, font_size, position, orientation, random_state=None, **kwargs):
    """Blue-teal color scheme for English"""
    colors = ['#1abc9c', '#16a085', '#2ecc71', '#27ae60', '#3498db', '#2980b9']
    return colors[hash(word) % len(colors)]

def french_color_func(word, font_size, position, orientation, random_state=None, **kwargs):
    """Orange-red color scheme for French"""
    colors = ['#e74c3c', '#c0392b', '#e67e22', '#d35400', '#f39c12', '#f1c40f']
    return colors[hash(word) % len(colors)]

# Function to preprocess text
def preprocess_text(text, language):
    if text is None:
        return ""
    # Tokenize the text
    tokens = word_tokenize(text.lower())

    if language == 'English':
        stop_words = set(stopwords.words('english')).union(english_exceptions)
        processed_tokens = [lemmatizer.lemmatize(word) for word in tokens if word.isalnum() and word not in stop_words]
    elif language == 'French':
        nltk_stop_words = set(stopwords.words('french'))
        spacy_stop_words = nlp_fr.Defaults.stop_words
        all_stop_words = nltk_stop_words.union(spacy_stop_words).union(french_exceptions)
        doc = nlp_fr(text.lower())
        processed_tokens = [token.lemma_ for token in doc if token.text.isalnum() and token.text not in all_stop_words]

    return ' '.join(processed_tokens)

# Function to generate and save word cloud
def generate_wordcloud(text, language):
    logging.info(f"Generating {language} word cloud...")

    # Select color function based on language
    color_func = english_color_func if language == 'English' else french_color_func

    # Create word cloud with improved settings
    wordcloud = WordCloud(
        width=1600,
        height=800,
        background_color=None,
        mode="RGBA",
        max_words=200,
        min_font_size=10,
        max_font_size=150,
        relative_scaling=0.5,
        prefer_horizontal=0.7,
        color_func=color_func,
        margin=10,
        contour_width=0,
        collocations=False  # Avoid repeated word pairs
    ).generate(text)

    # Create figure with modern styling
    fig, ax = plt.subplots(figsize=(20, 10), dpi=300, facecolor='none')
    ax.set_facecolor('none')

    # Display word cloud
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')

    # Add subtle title
    lang_label = 'English Abstracts' if language == 'English' else 'French Abstracts'
    ax.set_title(
        lang_label,
        fontsize=24,
        fontweight='bold',
        color='#333',
        pad=20,
        loc='center'
    )

    # Save with tight layout
    output_path = os.path.join(wordclouds_dir, f'{language.lower()}_wordcloud.png')
    plt.savefig(output_path, bbox_inches='tight', pad_inches=0.5, transparent=True, facecolor='none')
    plt.close()
    logging.info(f"{language} word cloud saved as {output_path}")

# Preprocess and generate word cloud for English entries
logging.info("Processing English entries...")
english_entries = [item for item in data['rows'] if item['Language'] == 'English' and item['Abstract'] is not None]
english_text = ' '.join([preprocess_text(item['Abstract'], 'English') for item in tqdm(english_entries)])
if english_text.strip():
    generate_wordcloud(english_text, 'English')
else:
    logging.warning("No English text found for word cloud generation")

# Preprocess and generate word cloud for French entries
logging.info("Processing French entries...")
french_entries = [item for item in data['rows'] if item['Language'] == 'French' and item['Abstract'] is not None]
french_text = ' '.join([preprocess_text(item['Abstract'], 'French') for item in tqdm(french_entries)])
if french_text.strip():
    generate_wordcloud(french_text, 'French')
else:
    logging.warning("No French text found for word cloud generation")

logging.info("Word clouds generated successfully!")
