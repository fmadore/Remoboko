import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { stableId, parseCoordinates, readPointFeatures, groupCollaborators, collaboratorRadius, safeProfileUrl, createMapView } from '../../assets/maps.js';

const readJSON = async (path) => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));

test('coordinates accept export whitespace but reject partial, non-finite and out-of-range values', () => {
  assert.deepEqual(parseCoordinates('29.6475, -82.345'), { lat: 29.6475, lng: -82.345 });
  for (const value of ['', ',2', '1,', '1,2,3', '13junk,2', 'Infinity,2', '91,2', '1,181', null]) {
    assert.equal(parseCoordinates(value), null, String(value));
  }
  assert.deepEqual(parseCoordinates('-90,180'), { lat: -90, lng: 180 });
});

test('stable IDs preserve identity across reordering and distinguish delimiter-like input', () => {
  assert.equal(stableId(' Togo ', 'Lomé'), stableId('Togo', 'Lomé'));
  assert.notEqual(stableId('a--b', 'c'), stableId('a', 'b--c'));
  assert.notEqual(stableId('Togo', 'University'), stableId('Benin', 'University'));
});

test('GeoJSON reader handles empty arrays and skips invalid coordinates, types and duplicate identities', async () => {
  const data = await readJSON('Book_DeGruyter/Maps/locations.json');
  const types = { mosque: true, church: true, school: true, university: true, landmark: true };
  const result = readPointFeatures(data, { types });
  assert.equal(result.points.length, 33);
  assert.equal(result.skipped, 0);
  const invalid = structuredClone(data.features[0]);
  invalid.geometry.coordinates[0] = '2.3';
  const unknown = structuredClone(data.features[1]);
  unknown.properties.type = 'unsupported';
  const mixed = readPointFeatures({ ...data, features: [...data.features, invalid, unknown, data.features[0]] }, { types });
  assert.equal(mixed.points.length, 33);
  assert.equal(mixed.skipped, 3);
  assert.deepEqual(readPointFeatures({ type: 'FeatureCollection', features: [] }), { points: [], skipped: 0 });
  assert.throws(() => readPointFeatures({ features: [] }), /FeatureCollection/);
});

test('university data validates local logos and preserves all four campuses', async () => {
  const data = await readJSON('Book_DeGruyter/Maps/universities.json');
  assert.equal(readPointFeatures(data, { universities: true }).points.length, 4);
  data.features[0].properties.logo = 'https://example.org/image.jpg';
  assert.equal(readPointFeatures(data, { universities: true }).skipped, 1);
});

test('collaborator aggregation preserves all people and institution IDs when records reorder', async () => {
  const data = await readJSON('Final report/Data/Collaborators_data.json');
  const result = groupCollaborators(data);
  assert.equal(result.total, 93);
  assert.equal(result.places.length, 56);
  assert.equal(result.unmapped.length, 0);
  assert.equal(result.places.reduce((total, place) => total + place.count, 0), 93);
  assert.equal(result.places.flatMap((place) => place.people).filter((person) => person.url).length, 93);
  assert.deepEqual(groupCollaborators([...data].reverse()), result);
});

test('unmapped collaborators retain profiles and conflicting institution coordinates fail explicitly', () => {
  const row = { Affiliation: 'Campus', Country: 'Togo', Collaborator: 'Name', URL: 'https://example.org/person', 'Coordinate location': '6,1' };
  const result = groupCollaborators([{ ...row, 'Coordinate location': 'invalid' }]);
  assert.equal(result.places.length, 0);
  assert.equal(result.unmapped[0].person.url, row.URL);
  assert.throws(() => groupCollaborators([row, { ...row, Collaborator: 'Second person', 'Coordinate location': '7,1' }]), /Conflicting coordinates/);
  assert.throws(() => groupCollaborators([{ ...row, Affiliation: '' }]), /affiliation/);
  assert.deepEqual(groupCollaborators([]), { places: [], unmapped: [], total: 0 });
});

test('bubble areas are proportional to headcount and profile URLs only permit web links', () => {
  for (const count of [1, 2, 4, 8, 9, 93]) assert.ok(Math.abs((collaboratorRadius(count) / collaboratorRadius(1)) ** 2 - count) < 1e-10);
  assert.equal(safeProfileUrl('javascript:alert(1)'), null);
  assert.equal(safeProfileUrl('data:text/html,test'), null);
  assert.equal(safeProfileUrl('https://example.org/person'), 'https://example.org/person');
});

test('navigation registers synchronous reduced-motion arrivals and cancels superseded callbacks', () => {
  const dom = new JSDOM('<div id="map"></div><div id="map-data" hidden></div><button id="map-data-toggle"></button><p id="map-status"></p><button id="map-retry" hidden></button><div id="tools-card"></div>');
  const keys = ['window', 'document', 'Node'];
  const previous = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  keys.forEach((key) => Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] }));
  try {
    let reduce = true;
    window.matchMedia = () => ({ matches: reduce });
    const listeners = new Set();
    let moving = false;
    let flights = 0;
    const emit = () => { for (const callback of [...listeners]) { listeners.delete(callback); callback(); } };
    const view = createMapView();
    view.map = {
      off: (_, callback) => listeners.delete(callback), once: (_, callback) => listeners.add(callback),
      resize() {}, stop() { moving = false; emit(); },
      jumpTo() { moving = false; emit(); }, flyTo() { moving = true; flights += 1; },
      isMoving: () => moving,
    };
    let arrivals = 0;
    view.navigate({ lng: 2, lat: 6 }, { onArrival: () => { arrivals += 1; } });
    assert.equal(arrivals, 1);
    assert.equal(flights, 0);
    assert.equal(listeners.size, 0);
    reduce = false;
    view.navigate({ lng: 1, lat: 6 }, { onArrival: () => { arrivals += 100; } });
    view.navigate({ lng: 2, lat: 7 }, { onArrival: () => { arrivals += 1; } });
    emit();
    assert.equal(arrivals, 2);
    view.fail('Map unavailable.');
    assert.equal(document.getElementById('map-data').hidden, false);
    assert.equal(document.getElementById('map').dataset.mapState, 'unavailable');
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
  }
});
