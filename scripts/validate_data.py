"""Validate every research JSON file using bundled schemas and cross-record checks.

The dependency-free schema evaluator implements only the keywords used in our
bundled JSON Schemas. Unknown keywords fail explicitly rather than being ignored.
Schemas remain usable by full JSON Schema validators outside this repository.
"""

import argparse
import json
import math
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from viz_common import load_json, parse_date

ROOT = Path(__file__).resolve().parents[1]
DATA_SCHEMAS = {
    'Book_DeGruyter/Timeline/data.json': 'timeline.schema.json',
    'Book_DeGruyter/Maps/locations.json': 'locations.schema.json',
    'Book_DeGruyter/Maps/universities.json': 'universities.schema.json',
    'Final report/Data/Collaborators_data.json': 'collaborators.schema.json',
    'Final report/Data/Publications_and_activities_data.json': 'outputs.schema.json',
    '.github/assets/west-africa.geo.json': 'boundaries.schema.json',
}
KEYWORDS = {'$schema', 'title', 'description', 'type', 'enum', 'const', 'properties', 'required',
            'additionalProperties', 'items', 'minItems', 'maxItems', 'minLength', 'pattern',
            'minimum', 'maximum', 'format', 'anyOf'}


def validate_schema(value, schema, path='$'):
    """Yield useful row/field errors for the small, explicit schema vocabulary."""
    unsupported = set(schema) - KEYWORDS
    if unsupported:
        raise ValueError(f'Unsupported schema keywords: {sorted(unsupported)}')
    if 'anyOf' in schema:
        if all(list(validate_schema(value, option, path)) for option in schema['anyOf']):
            yield f'{path}: does not match any permitted value type'
        return
    kinds = {
        'object': isinstance(value, dict), 'array': isinstance(value, list),
        'string': isinstance(value, str), 'null': value is None, 'boolean': isinstance(value, bool),
        'number': isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value),
    }
    expected = schema.get('type')
    if expected and not kinds[expected]:
        yield f'{path}: expected {expected}, got {type(value).__name__}'
        return
    if 'const' in schema and value != schema['const']:
        yield f"{path}: expected {schema['const']!r}"
    if 'enum' in schema and value not in schema['enum']:
        yield f"{path}: expected one of {schema['enum']!r}, got {value!r}"
    if isinstance(value, dict):
        for key in schema.get('required', []):
            if key not in value:
                yield f'{path}.{key}: required field is missing'
        properties = schema.get('properties', {})
        for key, item in value.items():
            if key in properties:
                yield from validate_schema(item, properties[key], f'{path}.{key}')
            elif schema.get('additionalProperties') is False:
                yield f'{path}.{key}: unexpected field'
    elif isinstance(value, list):
        if len(value) < schema.get('minItems', 0) or len(value) > schema.get('maxItems', math.inf):
            yield f'{path}: invalid number of items ({len(value)})'
        for index, item in enumerate(value):
            yield from validate_schema(item, schema.get('items', {}), f'{path}[{index}]')
    elif isinstance(value, str):
        if len(value) < schema.get('minLength', 0):
            yield f'{path}: string is too short'
        if 'pattern' in schema and not re.search(schema['pattern'], value):
            yield f'{path}: value does not match the required format'
        if schema.get('format') == 'date':
            try:
                parse_date(value)
            except ValueError:
                yield f'{path}: invalid calendar date {value!r}'
        elif schema.get('format') == 'uri':
            url = urlparse(value)
            if url.scheme not in ('http', 'https') or not url.netloc or any(char.isspace() for char in value):
                yield f'{path}: expected an absolute HTTP(S) URL'
    elif kinds['number']:
        if value < schema.get('minimum', -math.inf) or value > schema.get('maximum', math.inf):
            yield f'{path}: number out of bounds'


def valid_coordinates(coords):
    return (isinstance(coords, (list, tuple)) and len(coords) == 2
            and all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in coords)
            and -180 <= coords[0] <= 180 and -90 <= coords[1] <= 90)


def validate_semantics(relative, data, root):
    if relative.endswith('Collaborators_data.json'):
        seen = set()
        for index, row in enumerate(data):
            identity = row['Collaborator'].strip().casefold()
            if identity in seen:
                yield f'row {index}: duplicate collaborator {row["Collaborator"]!r}'
            seen.add(identity)
            try:
                lat, lon = map(float, row['Coordinate location'].split(','))
                if not valid_coordinates([lon, lat]):
                    raise ValueError
            except (ValueError, TypeError):
                yield f'row {index}: expected latitude,longitude within geographic bounds'
    elif relative.endswith('Timeline/data.json'):
        seen = set()
        for index, row in enumerate(data):
            identity = (row['country'], row['event'], row['date'])
            if identity in seen:
                yield f'row {index}: duplicate timeline event'
            seen.add(identity)
    elif isinstance(data, dict) and data.get('type') == 'FeatureCollection':
        seen = set()
        for index, feature in enumerate(data['features']):
            props, geometry = feature['properties'], feature['geometry']
            identity = (props.get('country'), props.get('iso'), props['name'])
            if identity in seen:
                yield f'feature {index}: duplicate feature identity'
            seen.add(identity)
            if geometry['type'] == 'Point':
                if not valid_coordinates(geometry['coordinates']):
                    yield f'feature {index}: invalid longitude,latitude'
            else:
                for polygon in geometry['coordinates']:
                    for ring in polygon:
                        if len(ring) < 4 or ring[0] != ring[-1] or not all(valid_coordinates(point) for point in ring):
                            yield f'feature {index}: invalid or unclosed polygon ring'
            if 'logo' in props:
                base = (root / relative).parent.resolve()
                asset = (base / props['logo']).resolve()
                if not asset.is_relative_to(base) or not asset.is_file():
                    yield f'feature {index}: missing or unsafe logo reference {props["logo"]!r}'


def validate_repository(root=ROOT):
    errors = []
    for relative, schema_name in DATA_SCHEMAS.items():
        try:
            data = load_json(root / relative)
            schema = load_json(ROOT / 'schemas' / schema_name)
            failures = list(validate_schema(data, schema))
            if not failures:
                failures += list(validate_semantics(relative, data, root))
            errors.extend(f'{relative}: {failure}' for failure in failures)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            errors.append(f'{relative}: {exc}')
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository/data fixture root')
    args = parser.parse_args(argv)
    errors = validate_repository(args.root)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Validated {len(DATA_SCHEMAS)} research datasets: schemas, dates, coordinates, identities and assets.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
