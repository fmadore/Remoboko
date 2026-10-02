// Four universities, with equivalent map and keyboard-accessible data views.
import { loadJSON, el, makeCollapsible, buildTable } from '../../assets/remoboko.js';
import { createMapView, readPointFeatures } from '../../assets/maps.js';

async function main() {
  let universities;
  let skipped;
  try {
    ({ points: universities, skipped } = readPointFeatures(await loadJSON('universities.json'), { universities: true }));
  } catch {
    const view = createMapView();
    view.setData(el('p', {}, 'The university records could not be read. Reload the page to try again.'),
      el('a', { href: 'universities.json' }, 'Read the source data'));
    view.fail('The university data could not be loaded.');
    return;
  }
  const view = createMapView({ featureCount: universities.length });
  document.getElementById('map-description').textContent = `${universities.length} public universities studied in the book. Select a logo or use the university list to explore each campus.${skipped ? ` ${skipped} invalid or duplicate records could not be shown.` : ''}`;
  const markers = new Map();
  const select = (university) => {
    const marker = markers.get(university.id);
    if (!marker) return;
    for (const item of markers.values()) item.getPopup().remove();
    view.navigate(university, { zoom: 12, onArrival: () => {
      if (!marker.getPopup().isOpen()) marker.togglePopup();
    } });
  };
  view.setData(buildTable([
    { key: 'name', label: 'University' }, { key: 'country', label: 'Country' }, { key: 'city', label: 'City' },
    { key: 'lat', label: 'Coordinates', format: (_, university) => `${university.lat.toFixed(4)}, ${university.lng.toFixed(4)}` },
    { key: 'id', label: 'Map', format: (_, university) => el('button', {
      type: 'button', class: 'rb-map-link', 'data-map-target': university.id, disabled: true,
      'aria-label': `Show ${university.name} on map`, onclick: () => select(university),
    }, 'Show on map') },
  ], universities, 'Universities and their campus locations.'));
  if (!universities.length) { view.empty('No universities are available.'); return; }

  const legend = document.getElementById('legend-card');
  const list = el('ul', { class: 'rb-uni-list' }, universities.map((university) => el('li', {},
    el('button', { type: 'button', disabled: true, onclick: () => select(university) },
      el('img', { src: university.logo, alt: '', width: 22, height: 22 }),
      el('span', {}, university.name), el('span', { class: 'muted' }, university.country)))));
  legend.append(el('h2', {}, 'Universities'), list);
  makeCollapsible(legend, { label: 'list' });
  const map = await view.init({ center: [1.9, 7.9], zoom: 6.4, minZoom: 0, maxZoom: 19 });
  if (!map) return;
  for (const university of universities) {
    const element = el('button', {
      type: 'button', class: 'rb-logo-marker', title: university.name,
      'aria-label': `${university.name}, ${university.city}, ${university.country}`,
    }, el('span', { class: 'rb-logo-image' }, el('img', { src: university.logo, alt: '', width: 48, height: 48 })));
    const popup = new view.lib.Popup({ offset: [0, -28], maxWidth: '260px' }).setDOMContent(
      el('div', { class: 'rb-popup' }, el('img', { src: university.logo, alt: `${university.name} logo` }),
        el('p', { class: 'rb-popup-title' }, university.name),
        el('p', { class: 'rb-popup-sub' }, `${university.city}, ${university.country}`)));
    const marker = new view.lib.Marker({ element }).setLngLat([university.lng, university.lat]).setPopup(popup).addTo(map);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); marker.togglePopup(); }
    });
    markers.set(university.id, marker);
  }
  list.querySelectorAll('button').forEach((button) => { button.disabled = false; });
  const reset = () => {
    for (const marker of markers.values()) marker.getPopup().remove();
    view.fitPoints(universities, { base: 40 });
  };
  view.setReset(reset);
  reset();
}

main();
