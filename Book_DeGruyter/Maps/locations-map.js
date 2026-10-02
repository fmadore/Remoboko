// Both permanent points-of-interest URLs share this figure.
import { COUNTRY_COLORS, OTHER_COLOR, loadJSON, el, iconSvg, renderLegend, makeCollapsible, buildTable } from '../../assets/remoboko.js';
import { createMapView, readPointFeatures } from '../../assets/maps.js';

const TYPE_LABELS = {
  mosque: 'Mosque', church: 'Church or parish', school: 'School or lycée',
  university: 'University or institute', landmark: 'Campus landmark',
};
const normalise = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

async function main() {
  let features;
  let skipped;
  try {
    ({ points: features, skipped } = readPointFeatures(await loadJSON('locations.json'), { types: TYPE_LABELS }));
  } catch {
    const view = createMapView();
    view.setData(el('p', {}, 'The location records could not be read. Reload the page to try again.'),
      el('a', { href: 'locations.json' }, 'Read the source data'));
    view.fail('The location data could not be loaded.');
    return;
  }
  const view = createMapView({ featureCount: features.length });
  const legendCard = document.getElementById('legend-card');
  const toolsCard = document.getElementById('tools-card');
  document.getElementById('map-description').textContent = `${features.length} churches, mosques, schools, universities and campus landmarks from the book. Pin colour is the country, the icon is the type.${skipped ? ` ${skipped} invalid or duplicate records could not be shown.` : ''}`;
  const markers = new Map();
  const countries = [...new Set(features.map((feature) => feature.country))];
  const visibleCountries = new Set(countries);
  const countryBox = el('div');
  renderLegend(countryBox, countries.map((country) => ({
    id: country, label: country, color: COUNTRY_COLORS[country] || OTHER_COLOR,
    count: features.filter((feature) => feature.country === country).length,
  })), { shape: 'dot', onToggle: (country, visible) => {
    if (visible) visibleCountries.add(country); else visibleCountries.delete(country);
    applyVisibility();
  } });
  const countryButtons = new Map();
  [...countryBox.querySelectorAll('.rb-key')].forEach((button, index) => {
    button.dataset.country = countries[index];
    countryButtons.set(countries[index], button);
  });
  legendCard.append(el('h2', {}, 'Country'), countryBox, el('h2', {}, 'Type'),
    el('ul', { class: 'rb-type-key', 'aria-label': 'Icon key' }, Object.entries(TYPE_LABELS)
      .map(([type, label]) => el('li', {}, iconSvg(type), el('span', {}, label)))));
  makeCollapsible(legendCard);

  function applyVisibility() {
    for (const { feature, element, marker } of markers.values()) {
      const visible = visibleCountries.has(feature.country);
      element.hidden = !visible;
      if (!visible) marker.getPopup().remove();
    }
  }

  function select(feature) {
    const entry = markers.get(feature.id);
    if (!entry) return;
    if (!visibleCountries.has(feature.country)) {
      visibleCountries.add(feature.country);
      countryButtons.get(feature.country)?.setAttribute('aria-pressed', 'true');
      applyVisibility();
    }
    input.value = feature.name;
    closeResults();
    for (const { marker } of markers.values()) marker.getPopup().remove();
    view.navigate(feature, { zoom: Math.max(view.map.getZoom(), 14), onArrival: () => {
      if (visibleCountries.has(feature.country) && !entry.marker.getPopup().isOpen()) entry.marker.togglePopup();
    } });
  }

  view.setData(buildTable([
    { key: 'name', label: 'Location' }, { key: 'country', label: 'Country' },
    { key: 'type', label: 'Type', format: (type) => TYPE_LABELS[type] },
    { key: 'lat', label: 'Coordinates', format: (_, feature) => `${feature.lat.toFixed(4)}, ${feature.lng.toFixed(4)}` },
    { key: 'id', label: 'Map', format: (_, feature) => el('button', {
      type: 'button', class: 'rb-map-link', 'data-map-target': feature.id, disabled: true,
      'aria-label': `Show ${feature.name} on map`, onclick: () => select(feature),
    }, 'Show on map') },
  ], features, 'All points of interest, including places outside the initial map view.'));
  if (!features.length) { view.empty('No locations are available.'); return; }

  const input = el('input', {
    type: 'search', placeholder: 'Search locations…', 'aria-label': 'Search locations', autocomplete: 'off',
    role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'search-results', 'aria-autocomplete': 'list', disabled: true,
  });
  const results = el('ul', { id: 'search-results', role: 'listbox', hidden: true });
  const search = el('div', { class: 'rb-search' }, iconSvg('search'), input, results);
  toolsCard.append(search);
  const searchable = features.map((feature) => ({ feature, name: normalise(feature.name) }));
  let active = -1;
  let matches = [];
  function updateActive() {
    [...results.children].forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
    const selected = matches[active] && results.children[active];
    if (selected) {
      input.setAttribute('aria-activedescendant', selected.id);
      selected.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function closeResults() {
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }
  function renderResults() {
    results.replaceChildren(...(matches.length ? matches.map((feature) => {
      const option = el('li', { role: 'option', id: `opt-${feature.id}`, 'aria-selected': 'false' },
        el('span', {}, feature.name), el('span', { class: 'muted' }, feature.country));
      // Keep focus in the combobox until selection; also support synthetic click.
      option.addEventListener('pointerdown', (event) => event.preventDefault());
      option.addEventListener('click', () => select(feature));
      return option;
    }) : [el('li', { class: 'rb-search-empty', role: 'option', 'aria-disabled': 'true' }, 'No location matches')]));
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    updateActive();
  }
  input.addEventListener('input', () => {
    const query = normalise(input.value.trim());
    if (query.length < 2) { closeResults(); return; }
    matches = searchable.filter((entry) => entry.name.includes(query)).map((entry) => entry.feature).slice(0, 12);
    active = matches.length ? 0 : -1;
    renderResults();
  });
  input.addEventListener('keydown', (event) => {
    if (results.hidden) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (matches.length) active = Math.max(0, Math.min(matches.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)));
      updateActive();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (matches[active]) select(matches[active]);
    } else if (event.key === 'Escape') { event.preventDefault(); closeResults(); }
  });
  input.addEventListener('blur', closeResults);

  const map = await view.init({ center: [1.9, 6.5], zoom: 7.6, minZoom: 0, maxZoom: 19 });
  if (!map) return;
  for (const feature of features) {
    const element = pinElement(feature);
    const popup = new view.lib.Popup({ offset: [0, -34], maxWidth: '280px', closeButton: true })
      .setDOMContent(el('div', { class: 'rb-popup' },
        el('p', { class: 'rb-popup-title' }, feature.name),
        el('p', { class: 'rb-popup-sub' }, `${TYPE_LABELS[feature.type]} · ${feature.country}`),
        el('p', { class: 'rb-popup-sub' }, `${feature.lat.toFixed(4)}, ${feature.lng.toFixed(4)}`)));
    const marker = new view.lib.Marker({ element, anchor: 'bottom' }).setLngLat([feature.lng, feature.lat]).setPopup(popup).addTo(map);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); marker.togglePopup(); }
    });
    markers.set(feature.id, { feature, marker, element });
  }
  applyVisibility();
  input.disabled = false;
  const local = features.filter((feature) => ['Benin', 'Togo'].includes(feature.country));
  const reset = () => {
    for (const { marker } of markers.values()) marker.getPopup().remove();
    view.fitPoints(local.length ? local : features, { maxZoom: 10 });
  };
  view.setReset(reset);
  reset();
}

function pinElement(feature) {
  const wrap = el('button', {
    type: 'button', class: 'rb-pin', style: { '--pin': COUNTRY_COLORS[feature.country] || OTHER_COLOR },
    'aria-label': `${feature.name}, ${TYPE_LABELS[feature.type]}, ${feature.country}`, title: feature.name,
  });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 30 38');
  svg.setAttribute('aria-hidden', 'true');
  const body = document.createElementNS(ns, 'path');
  body.setAttribute('class', 'pin-body');
  body.setAttribute('d', 'M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 38 15 38S30 25.9 30 14.8C30 6.6 23.3 0 15 0z');
  const icon = iconSvg(feature.type);
  const [, , width, height] = icon.getAttribute('viewBox').split(' ').map(Number);
  const scale = 15 / Math.max(width, height);
  const group = document.createElementNS(ns, 'g');
  group.setAttribute('transform', `translate(${15 - width * scale / 2} ${14.5 - height * scale / 2}) scale(${scale})`);
  const path = icon.firstChild;
  path.setAttribute('class', 'pin-icon');
  group.append(path);
  svg.append(body, group);
  wrap.append(svg);
  return wrap;
}

main();
