import json
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download necessary NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Read the JSON file
try:
    with open('Final report/Publications_and_activities_data.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
except UnicodeDecodeError:
    # If UTF-8 fails, try with ISO-8859-1 encoding
    with open('Final report/Publications_and_activities_data.json', 'r', encoding='iso-8859-1') as file:
        data = json.load(file)

# Initialize lemmatizer
lemmatizer = WordNetLemmatizer()

# Function to preprocess text
def preprocess_text(text, language):
    if text is None:
        return ""
    # Tokenize the text
    tokens = word_tokenize(text.lower())
    
    # Remove stop words and lemmatize
    if language == 'English':
        stop_words = set(stopwords.words('english'))
        processed_tokens = [lemmatizer.lemmatize(word) for word in tokens if word.isalnum() and word not in stop_words]
    elif language == 'French':
        stop_words = set(stopwords.words('french'))
        processed_tokens = [lemmatizer.lemmatize(word) for word in tokens if word.isalnum() and word not in stop_words]
    
    return ' '.join(processed_tokens)

# Function to generate and save word cloud
def generate_wordcloud(text, language):
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
    
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis('off')
    plt.title(f'{language} Word Cloud')
    
    plt.savefig(f'{language.lower()}_wordcloud.png')
    plt.close()

# Preprocess and generate word cloud for English entries
english_text = ' '.join([preprocess_text(item['Abstract'], 'English') for item in data['rows'] if item['Language'] == 'English' and item['Abstract'] is not None])
generate_wordcloud(english_text, 'English')

# Preprocess and generate word cloud for French entries
french_text = ' '.join([preprocess_text(item['Abstract'], 'French') for item in data['rows'] if item['Language'] == 'French' and item['Abstract'] is not None])
generate_wordcloud(french_text, 'French')

print("Word clouds generated successfully!")
