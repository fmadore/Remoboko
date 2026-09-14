// Collaborators by affiliation: one circle per institution, area scaled by
// headcount, hover for the institution and click for the names.
import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.9.0/+esm';
import { SEQ_COLOR, BASEMAPS, loadJSON, el, renderSegmented, formatCount, createTooltip, cardPadding, makeCollapsible } from '../assets/remoboko.js';

const titleCard = document.getElementById('title-card');
const legendCard = document.getElementById('legend-card');
const toolsCard = document.getElementById('tools-card');
const tooltip = createTooltip();

const radius = (count) => 7 + 4 * Math.sqrt(Math.max(0, count - 1));

let places = [];
let total = 0;
let skipped = 0;
try {
  const data = await loadJSON('Data/Collaborators_data.json');
  total = data.length;
  const byAffiliation = new Map();
  for (const row of data) {
    const coords = String(row['Coordinate location'] || '').split(',').map((s) => parseFloat(s));
    if (coords.length !== 2 || coords.some((c) => Number.isNaN(c))) { skipped += 1; continue; }
    const key = row.Affiliation;
    if (!byAffiliation.has(key)) byAffiliation.set(key, { affiliation: key, country: row.Country, lat: coords[0], lng: coords[1], people: [] });
    byAffiliation.get(key).people.push({ name: row.Collaborator, url: row.URL });
  }
  places = Array.from(byAffiliation.values()).map((p) => ({ ...p, count: p.people.length }))
    .sort((a, b) => b.count - a.count);
  places.forEach((p) => p.people.sort((a, b) => a.name.localeCompare(b.name)));
} catch (err) {
  titleCard.append(el('p', { class: 'rb-desc', role: 'alert' }, 'The collaborator data could not be loaded.'));
  throw err;
}

const countries = new Set(places.map((p) => p.country));
titleCard.append(
  el('h1', { class: 'rb-title' }, 'Collaborators by affiliation'),
  el('p', { class: 'rb-desc' }, `${formatCount(total - skipped)} collaborators at ${formatCount(places.length)} institutions in ${countries.size} countries. Circle area scales with headcount; click one for the names.`),
);
if (skipped) titleCard.append(el('p', { class: 'rb-desc' }, `${skipped} ${skipped === 1 ? 'collaborator has' : 'collaborators have'} no usable coordinates and ${skipped === 1 ? 'is' : 'are'} not shown.`));

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAPS.light.style,
  center: [10, 20],
  zoom: 1.4,
  minZoom: 1,
  maxZoom: 18,
  attributionControl: false,
});
map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
// Fullscreen the whole page, not just the canvas, so the cards (search, key, basemap switch) stay available.
map.addControl(new maplibregl.FullscreenControl({ container: document.body }), 'top-left');

const geojson = {
  type: 'FeatureCollection',
  features: places.map((p, i) => ({
    type: 'Feature',
    id: i,
    properties: { affiliation: p.affiliation, country: p.country, count: p.count, r: radius(p.count) },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
  })),
};

function addLayers() {
  if (map.getSource('collaborators')) return;
  map.addSource('collaborators', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'collaborators-circles',
    type: 'circle',
    source: 'collaborators',
    paint: {
      'circle-radius': ['get', 'r'],
      'circle-color': SEQ_COLOR,
      'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.8],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
}
map.on('style.load', addLayers);

let hovered = null;
map.on('mousemove', 'collaborators-circles', (e) => {
  const f = e.features[0];
  map.getCanvas().style.cursor = 'pointer';
  if (hovered !== null && hovered !== f.id) map.setFeatureState({ source: 'collaborators', id: hovered }, { hover: false });
  hovered = f.id;
  map.setFeatureState({ source: 'collaborators', id: hovered }, { hover: true });
  tooltip.show({ title: f.properties.affiliation, sub: `${f.properties.country} · ${formatCount(f.properties.count)} ${f.properties.count === 1 ? 'collaborator' : 'collaborators'}`, note: 'Click for names' }, e.originalEvent.clientX, e.originalEvent.clientY);
});
map.on('mouseleave', 'collaborators-circles', () => {
  map.getCanvas().style.cursor = '';
  if (hovered !== null) map.setFeatureState({ source: 'collaborators', id: hovered }, { hover: false });
  hovered = null;
  tooltip.hide();
});

let popup = null;
map.on('click', 'collaborators-circles', (e) => {
  const f = e.features[0];
  const place = places[f.id];
  tooltip.hide();
  popup?.remove();
  popup = new maplibregl.Popup({ offset: radius(place.count) + 4, maxWidth: '300px' })
    .setLngLat(f.geometry.coordinates)
    .setDOMContent(el('div', { class: 'rb-popup' },
      el('p', { class: 'rb-popup-title' }, place.affiliation),
      el('p', { class: 'rb-popup-sub' }, `${place.country} · ${formatCount(place.count)} ${place.count === 1 ? 'collaborator' : 'collaborators'}`),
      el('ul', {}, place.people.map((p) => el('li', {}, p.url ? el('a', { href: p.url, target: '_blank', rel: 'noopener' }, p.name) : p.name)))))
    .addTo(map);
});

// Size key: the samples are the real marks at true size
legendCard.append(
  el('h2', {}, 'Collaborators per institution'),
  el('ul', { class: 'rb-size-key' }, [1, 4, 8].map((n) => el('li', {},
    el('span', { style: { width: `${2 * radius(n)}px`, height: `${2 * radius(n)}px` } }),
    el('span', {}, `${n} ${n === 1 ? 'collaborator' : 'collaborators'}`)))),
);

// Keyboard and screen-reader access to the same data: a sortable list in the tools card
const basemapBox = el('div');
renderSegmented(basemapBox, Object.entries(BASEMAPS).map(([id, b]) => ({ id, label: b.label })), {
  value: 'light',
  label: 'Basemap',
  onChange: (id) => map.setStyle(BASEMAPS[id].style),
});
toolsCard.append(basemapBox);
makeCollapsible(legendCard);

// Every institution on screen, clear of the cards. A phone is narrower than
// the world at zoom 1, so when no zoom can hold the 260° span, open on the
// Atlantic hemisphere (the Americas, Europe and Africa hold 80 of the 93).
const bounds = places.reduce((b, p) => b.extend([p.lng, p.lat]), new maplibregl.LngLatBounds([places[0].lng, places[0].lat], [places[0].lng, places[0].lat]));
map.resize(); // the title strip changed the map height after construction
const camera = map.cameraForBounds(bounds, { padding: cardPadding({ legendCard, toolsCard, base: 28 }) });
if (camera && camera.zoom > map.getMinZoom() + 0.05) map.jumpTo(camera); else map.jumpTo({ center: [-25, 8], zoom: 1 });

// Hidden but accessible listing of every institution for assistive tech
document.body.append(el('div', { class: 'rb-sr-only' },
  el('h2', {}, 'Institutions'),
  el('ul', {}, places.map((p) => el('li', {}, `${p.affiliation}, ${p.country}: ${p.people.map((x) => x.name).join(', ')}`)))));
