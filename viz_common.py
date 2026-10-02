"""Small, dependency-free data helpers shared by the print generators."""

from collections import Counter
from datetime import date
import json
import re

# Keep these values in sync with assets/remoboko.js and assets/remoboko.css.
COUNTRY_HEX = {'Benin': '#3388ff', 'Togo': '#2ecc71', 'West Africa': '#e67e22'}
QUALITATIVE_PALETTE = [
    '#2a78d6', '#eb6834', '#1baf7a', '#eda100',
    '#e87ba4', '#008300', '#4a3aa7', '#e34948',
]
OTHER_COLOR = '#9c9c98'
TEXT_COLOR = '#1b1b1b'
GENDER_COLORS = {'female': QUALITATIVE_PALETTE[0], 'male': QUALITATIVE_PALETTE[1]}
GENDER_LABELS = {'female': 'Women', 'male': 'Men', 'unknown': 'Unknown'}


def load_json(path):
    """Load strict UTF-8 JSON; reject duplicate keys and non-finite numbers."""
    def pairs_hook(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'Duplicate JSON key: {key}')
            result[key] = value
        return result

    def invalid_constant(value):
        raise ValueError(f'Invalid JSON numeric constant: {value}')

    with open(path, encoding='utf-8') as stream:
        return json.load(stream, object_pairs_hook=pairs_hook, parse_constant=invalid_constant)


def parse_date(value):
    """Accept a real, complete ISO calendar date, never a rollover or shorthand."""
    if not isinstance(value, str) or re.fullmatch(r'\d{4}-\d{2}-\d{2}', value) is None:
        raise ValueError(f'Expected YYYY-MM-DD, got {value!r}')
    return date.fromisoformat(value)


def normalize_gender(value):
    """Match browser normalization without inferring an unrecorded gender."""
    if value is None:
        return 'unknown'
    if not isinstance(value, str):
        raise ValueError('Gender must be a string or null')
    return value.strip().lower() or 'unknown'


def gender_series(records):
    """Count every person, including missing gender; preserve stable identities."""
    counts = Counter(normalize_gender(item.get('Gender')) for item in records)
    order = [key for key in ('female', 'male') if key in counts]
    order += sorted((key for key in counts if key not in order), key=lambda key: (-counts[key], key))
    total = sum(counts.values())
    return [
        {'id': key, 'label': GENDER_LABELS.get(key, key.capitalize()), 'count': counts[key],
         'share': counts[key] / total, 'color': GENDER_COLORS.get(key, OTHER_COLOR)}
        for key in order
    ]
