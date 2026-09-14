// The four universities of Benin and Togo: logo markers on a MapLibre map
// with a clickable list that flies to each campus.
import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.9.0/+esm';
import { COUNTRY_COLORS, BASEMAPS, loadJSON, el, renderSegmented, cardPadding, makeCollapsible } from '../../assets/remoboko.js';

const titleCard = document.getElementById('title-card');
const legendCard = document.getElementById('legend-card');
const toolsCard = document.getElementById('tools-card');

let universities = [];
try {
  const geojson = await loadJSON('universities.json');
  universities = geojson.features.map((f) => ({ ...f.properties, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }));
} catch (err) {
  titleCard.append(el('p', { class: 'rb-desc', role: 'alert' }, 'The university data could not be loaded.'));
  throw err;
}

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAPS.detailed.style,
  center: [1.9, 7.9],
  zoom: 6.4,
  minZoom: 2,
  maxZoom: 19,
  attributionControl: false,
});
map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
// Fullscreen the whole page, not just the canvas, so the cards (search, key, basemap switch) stay available.
map.addControl(new maplibregl.FullscreenControl({ container: document.body }), 'top-left');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');


const markers = universities.map((u) => {
  const element = el('button', { type: 'button', class: 'rb-logo-marker', 'aria-label': `${u.name}, ${u.city}, ${u.country}`, title: u.name, style: { padding: 0 } },
    el('img', { src: u.logo, alt: '', width: 48, height: 48, loading: 'eager' }));
  const popup = new maplibregl.Popup({ offset: [0, -28], maxWidth: '260px' }).setDOMContent(
    el('div', { class: 'rb-popup' },
      el('img', { src: u.logo, alt: `${u.name} logo` }),
      el('p', { class: 'rb-popup-title' }, u.name),
      el('p', { class: 'rb-popup-sub' }, `${u.city}, ${u.country}`)),
  );
  const marker = new maplibregl.Marker({ element, anchor: 'center' }).setLngLat([u.lng, u.lat]).setPopup(popup).addTo(map);
  element.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marker.togglePopup(); } });
  return { u, marker };
});

titleCard.append(
  el('h1', { class: 'rb-title' }, 'Universities of Benin and Togo'),
  el('p', { class: 'rb-desc' }, 'The four public universities studied in the book. Click a logo for the campus name and city.'),
);

legendCard.append(
  el('h2', {}, 'Universities'),
  el('ul', { class: 'rb-uni-list' }, universities.map((u, i) => el('li', {},
    el('button', {
      type: 'button',
      onclick: () => {
        map.flyTo({ center: [u.lng, u.lat], zoom: 12, essential: true });
        map.once('moveend', () => { if (!markers[i].marker.getPopup().isOpen()) markers[i].marker.togglePopup(); });
      },
    },
    el('img', { src: u.logo, alt: '' }),
    el('span', {}, u.name),
    el('span', { class: 'muted', style: { color: COUNTRY_COLORS[u.country] ? undefined : null } }, u.country)),
  ))),
);

const basemapBox = el('div');
renderSegmented(basemapBox, Object.entries(BASEMAPS).map(([id, b]) => ({ id, label: b.label })), {
  value: 'detailed',
  label: 'Basemap',
  onChange: (id) => map.setStyle(BASEMAPS[id].style),
});
toolsCard.append(basemapBox);
makeCollapsible(legendCard, { label: 'list' });

const bounds = universities.reduce((b, u) => b.extend([u.lng, u.lat]), new maplibregl.LngLatBounds([universities[0].lng, universities[0].lat], [universities[0].lng, universities[0].lat]));
map.resize(); // the title strip changed the map height after construction
map.fitBounds(bounds, { padding: cardPadding({ legendCard, toolsCard, base: 40 }), duration: 0 });
