// Points of interest around Abomey-Calavi and Lomé: MapLibre GL map with
// pins coloured by country and iconed by type, search with autocomplete,
// per-country toggles and a basemap switch. Shared by
// UAC_UL_locations_map.html and points_of_interest.html (same figure, two
// permanent URLs).
import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.9.0/+esm';
import {
  COUNTRY_COLORS, BASEMAPS, loadJSON, el, iconSvg, renderLegend, renderSegmented, cardPadding, makeCollapsible,
} from '../../assets/remoboko.js';

const TYPE_LABELS = {
  mosque: 'Mosque',
  church: 'Church or parish',
  school: 'School or lycée',
  university: 'University or institute',
  landmark: 'Campus landmark',
};

const titleCard = document.getElementById('title-card');
const legendCard = document.getElementById('legend-card');
const toolsCard = document.getElementById('tools-card');

let features = [];
try {
  const geojson = await loadJSON('locations.json');
  features = geojson.features.map((f, i) => ({
    id: i,
    name: f.properties.name,
    country: f.properties.country,
    type: f.properties.type || 'landmark',
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
} catch (err) {
  titleCard.append(el('p', { class: 'rb-desc', role: 'alert' }, 'The location data could not be loaded.'));
  throw err;
}

// --- Map --------------------------------------------------------------------

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAPS.detailed.style,
  center: [1.9, 6.5],
  zoom: 7.6,
  minZoom: 2,
  maxZoom: 19,
  attributionControl: false,
});
map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
// Fullscreen the whole page, not just the canvas, so the cards (search, key, basemap switch) stay available.
map.addControl(new maplibregl.FullscreenControl({ container: document.body }), 'top-left');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');


// --- Markers -------------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';
function pinElement(f) {
  const wrap = el('button', {
    type: 'button',
    class: 'rb-pin',
    style: { '--pin': COUNTRY_COLORS[f.country] || '#6f6f6f' },
    'aria-label': `${f.name}, ${TYPE_LABELS[f.type]}, ${f.country}`,
    title: f.name,
  });
  wrap.style.border = '0';
  wrap.style.padding = '0';
  wrap.style.background = 'none';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 30 38');
  svg.setAttribute('aria-hidden', 'true');
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('class', 'pin-body');
  body.setAttribute('d', 'M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 38 15 38S30 25.9 30 14.8C30 6.6 23.3 0 15 0z');
  svg.append(body);
  const icon = ICON_PATHS[f.type];
  const g = document.createElementNS(SVG_NS, 'g');
  // Fit the icon into a 16px box centred on the pin head
  const [, , vw, vh] = icon.viewBox.split(' ').map(Number);
  const s = 15 / Math.max(vw, vh);
  g.setAttribute('transform', `translate(${15 - (vw * s) / 2} ${14.5 - (vh * s) / 2}) scale(${s})`);
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('class', 'pin-icon');
  p.setAttribute('d', icon.d);
  g.append(p);
  svg.append(g);
  wrap.append(svg);
  return wrap;
}

const ICON_PATHS = {};
for (const type of Object.keys(TYPE_LABELS)) {
  const svg = iconSvg(type);
  ICON_PATHS[type] = { viewBox: svg.getAttribute('viewBox'), d: svg.firstChild.getAttribute('d') };
}

const markers = features.map((f) => {
  const element = pinElement(f);
  const popup = new maplibregl.Popup({ offset: [0, -34], maxWidth: '280px', closeButton: true })
    .setDOMContent(popupContent(f));
  const marker = new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat([f.lng, f.lat]).setPopup(popup).addTo(map);
  element.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marker.togglePopup(); } });
  return { feature: f, marker, element };
});

function popupContent(f) {
  return el('div', { class: 'rb-popup' },
    el('p', { class: 'rb-popup-title' }, f.name),
    el('p', { class: 'rb-popup-sub' }, `${TYPE_LABELS[f.type]} · ${f.country}`),
    el('p', { class: 'rb-popup-sub' }, `${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}`),
  );
}

// --- Title, legend, tools ----------------------------------------------------------

const countries = Object.keys(COUNTRY_COLORS).filter((c) => features.some((f) => f.country === c));
const visibleCountries = new Set(countries);

titleCard.append(
  el('h1', { class: 'rb-title' }, 'Points of interest around Abomey-Calavi and Lomé'),
  el('p', { class: 'rb-desc' }, `${features.length} churches, mosques, schools, universities and campus landmarks from the book. Pin colour is the country, the icon is the type.`),
);

const countryBox = el('div');
renderLegend(countryBox, countries.map((c) => ({ id: c, label: c, color: COUNTRY_COLORS[c], count: features.filter((f) => f.country === c).length })), {
  shape: 'dot',
  onToggle: (id, visible) => {
    if (visible) visibleCountries.add(id); else visibleCountries.delete(id);
    applyVisibility();
  },
});
const typeKey = el('ul', { class: 'rb-type-key', 'aria-label': 'Icon key' },
  Object.entries(TYPE_LABELS).map(([type, label]) => el('li', {}, iconSvg(type), el('span', {}, label))));
legendCard.append(el('h2', {}, 'Country'), countryBox, el('h2', {}, 'Type'), typeKey);

function applyVisibility() {
  for (const { feature, element } of markers) {
    element.hidden = !visibleCountries.has(feature.country);
  }
}

// Basemap switch keeps the markers (they are DOM markers, not style layers).
const basemapBox = el('div');
renderSegmented(basemapBox, Object.entries(BASEMAPS).map(([id, b]) => ({ id, label: b.label })), {
  value: 'detailed',
  label: 'Basemap',
  onChange: (id) => map.setStyle(BASEMAPS[id].style),
});

// Search with autocomplete
const input = el('input', { type: 'search', placeholder: 'Search locations…', 'aria-label': 'Search locations', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'search-results', 'aria-autocomplete': 'list' });
const results = el('ul', { id: 'search-results', role: 'listbox', hidden: true });
const search = el('div', { class: 'rb-search' }, iconSvg('search'), input, results);
let active = -1;
let matches = [];

function renderResults() {
  results.replaceChildren(...(matches.length
    ? matches.map((f, i) => {
      const li = el('li', { role: 'option', id: `opt-${f.id}`, 'aria-selected': String(i === active) },
        el('span', {}, f.name), el('span', { class: 'muted' }, f.country));
      li.addEventListener('pointerdown', (e) => { e.preventDefault(); select(f); });
      return li;
    })
    : [el('li', { class: 'rb-search-empty', role: 'option', 'aria-disabled': 'true' }, 'No location matches')]));
  results.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-activedescendant', active >= 0 && matches[active] ? `opt-${matches[active].id}` : '');
}
function closeResults() {
  results.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  active = -1;
}
function normalise(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
input.addEventListener('input', () => {
  const q = normalise(input.value.trim());
  if (q.length < 2) { closeResults(); return; }
  matches = features.filter((f) => normalise(f.name).includes(q)).slice(0, 12);
  active = matches.length ? 0 : -1;
  renderResults();
});
input.addEventListener('keydown', (e) => {
  if (results.hidden) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(matches.length - 1, active + 1); renderResults(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); renderResults(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) select(matches[active]); }
  else if (e.key === 'Escape') { closeResults(); }
});
input.addEventListener('blur', () => setTimeout(closeResults, 120));

function select(f) {
  input.value = f.name;
  closeResults();
  const entry = markers[f.id];
  if (!visibleCountries.has(f.country)) {
    visibleCountries.add(f.country);
    countryBox.querySelectorAll('.rb-key').forEach((k) => { if (k.textContent.startsWith(f.country)) k.setAttribute('aria-pressed', 'true'); });
    applyVisibility();
  }
  map.flyTo({ center: [f.lng, f.lat], zoom: Math.max(map.getZoom(), 14), essential: true });
  map.once('moveend', () => { if (!entry.marker.getPopup().isOpen()) entry.marker.togglePopup(); });
}

toolsCard.append(search, basemapBox);
makeCollapsible(legendCard);

// Open on the two campuses, clear of the cards; the two West African context
// pins (Abidjan, Dakar) sit off-screen until searched for or panned to.
const focus = features.filter((f) => f.country === 'Benin' || f.country === 'Togo');
const bounds = focus.reduce((b, f) => b.extend([f.lng, f.lat]), new maplibregl.LngLatBounds([focus[0].lng, focus[0].lat], [focus[0].lng, focus[0].lat]));
map.resize(); // the title strip changed the map height after construction
map.fitBounds(bounds, { padding: cardPadding({ legendCard, toolsCard }), duration: 0, maxZoom: 10 });
