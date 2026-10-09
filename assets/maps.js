// Shared map lifecycle and data checks. Data views do not depend on WebGL or
// the map CDN; MapLibre is loaded only after a readable table is available.
import { BASEMAPS, SOURCE_LINE, el, renderSegmented, cardPadding, prefersReducedMotion } from './remoboko.js';

export const stableId = (...parts) => `map-${encodeURIComponent(JSON.stringify(parts.map((part) => String(part).trim().normalize('NFC'))))}`;
export const collaboratorRadius = (count) => 7 * Math.sqrt(Math.max(0, count));

/** Latitude/longitude input used by the collaborator spreadsheet export. */
export function parseCoordinates(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !part)) return null;
  const [lat, lng] = parts.map(Number);
  return validCoordinates(lng, lat) ? { lat, lng } : null;
}

function validCoordinates(lng, lat) {
  return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export function safeProfileUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

/** Read GeoJSON points without allowing one bad record to blank the figure. */
export function readPointFeatures(data, { types, universities = false } = {}) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Expected a GeoJSON FeatureCollection.');
  const points = [];
  const seen = new Set();
  let skipped = 0;
  for (const feature of data.features) {
    const p = feature?.properties;
    const coordinates = feature?.geometry?.coordinates;
    const type = p?.type || 'landmark';
    if (feature?.type !== 'Feature' || feature?.geometry?.type !== 'Point' || !Array.isArray(coordinates) || coordinates.length < 2
      || !validCoordinates(coordinates[0], coordinates[1]) || !hasText(p?.name) || !hasText(p?.country)
      || (types && !Object.hasOwn(types, type))
      || (universities && (!hasText(p.city) || !/^[\w-]+\.jpg$/i.test(p.logo || '')))) {
      skipped += 1;
      continue;
    }
    const id = stableId(p.country, p.name);
    if (seen.has(id)) { skipped += 1; continue; }
    seen.add(id);
    points.push({ ...p, name: p.name.trim(), country: p.country.trim(), type, id, lng: coordinates[0], lat: coordinates[1] });
  }
  return { points, skipped };
}

/** Aggregate by stable institution identity; reject conflicting coordinates. */
export function groupCollaborators(data) {
  if (!Array.isArray(data)) throw new Error('Expected an array of collaborators.');
  const groups = new Map();
  const unmapped = [];
  for (const row of data) {
    const coords = parseCoordinates(row?.['Coordinate location']);
    if (!hasText(row?.Affiliation) || !hasText(row?.Country) || !hasText(row?.Collaborator)) {
      throw new Error('Collaborators must have a name, affiliation and country.');
    }
    const affiliation = row.Affiliation.trim();
    const country = row.Country.trim();
    const person = { name: row.Collaborator.trim(), url: safeProfileUrl(row.URL) };
    const id = stableId(country, affiliation);
    if (!coords) { unmapped.push({ affiliation, country, person }); continue; }
    if (!groups.has(id)) groups.set(id, { id, affiliation, country, ...coords, people: [] });
    const group = groups.get(id);
    if (Math.abs(group.lat - coords.lat) > 1e-6 || Math.abs(group.lng - coords.lng) > 1e-6) {
      throw new Error(`Conflicting coordinates for ${affiliation}.`);
    }
    group.people.push(person);
  }
  const places = [...groups.values()].map((place) => ({ ...place, count: place.people.length }))
    .sort((a, b) => b.count - a.count || a.affiliation.localeCompare(b.affiliation));
  places.forEach((place) => place.people.sort((a, b) => a.name.localeCompare(b.name)));
  return { places, unmapped, total: data.length };
}

/**
 * Group same-country pins that would cover each other on screen. Points are
 * {id, country, x, y} in pixels; `keep` (a selected place) always stays a pin.
 */
export function overlappingGroups(points, { width = 20, height = 26, keep = null } = {}) {
  const pending = new Set(points.filter((point) => point.id !== keep));
  const groups = [];
  for (const seed of points) {
    if (!pending.has(seed)) continue;
    const members = [...pending].filter((point) => point.country === seed.country
      && Math.abs(point.x - seed.x) < width && Math.abs(point.y - seed.y) < height);
    if (members.length < 2) continue;
    for (const member of members) pending.delete(member);
    groups.push({ country: seed.country, ids: members.map((member) => member.id) });
  }
  return groups;
}

export function profileList(people) {
  return el('ul', { class: 'rb-people-list' }, people.map((person) => el('li', {},
    person.url ? el('a', { href: person.url, target: '_blank', rel: 'noopener noreferrer' }, person.name) : person.name)));
}

/** Controls and status shared by all maps; tables are available before init(). */
export function createMapView({ style = 'detailed', featureCount = 0, headcount } = {}) {
  const container = document.getElementById('map');
  const dataPanel = document.getElementById('map-data');
  const toggle = document.getElementById('map-data-toggle');
  const status = document.getElementById('map-status');
  const retry = document.getElementById('map-retry');
  const toolsCard = document.getElementById('tools-card');
  let pendingMove = null;
  let resetView = null;
  let watchdog;
  let resizeObserver;
  const view = { map: null, lib: null, container };
  container.dataset.mapState = 'loading';

  view.showData = (show = true, focus = false) => {
    dataPanel.hidden = !show;
    document.body.classList.toggle('rb-map-data-visible', show);
    container.inert = show;
    for (const card of document.querySelectorAll('.rb-map-body > .rb-card')) card.inert = show;
    toggle.textContent = show ? 'Show map' : 'Show data';
    toggle.setAttribute('aria-pressed', String(show));
    if (show && focus) dataPanel.focus();
    if (!show) view.map?.resize();
  };
  toggle.addEventListener('click', () => view.showData(dataPanel.hidden));
  retry.addEventListener('click', () => window.location.reload());
  view.setData = (...nodes) => dataPanel.replaceChildren(...nodes, el('p', { class: 'rb-map-source' }, SOURCE_LINE));
  view.setStatus = (message, state) => {
    status.textContent = message;
    if (state) container.dataset.mapState = state;
    retry.hidden = !['error', 'unavailable'].includes(state);
  };
  view.fail = (message, state = 'unavailable') => {
    clearTimeout(watchdog);
    view.setStatus(message, state);
    view.showData(true);
    toggle.disabled = !view.map;
  };
  view.empty = (message) => {
    view.setStatus(message, 'empty');
    view.showData(true);
    toggle.disabled = true;
  };
  view.setReset = (callback) => { resetView = callback; };

  // One pending arrival callback prevents a cancelled flight opening old popups.
  view.navigate = (point, { zoom = 12, onArrival } = {}) => {
    const map = view.map;
    if (!map) return;
    if (pendingMove) map.off('moveend', pendingMove);
    pendingMove = null;
    map.stop();
    view.showData(false);
    if (onArrival) {
      pendingMove = () => { pendingMove = null; onArrival(); };
      map.once('moveend', pendingMove);
    }
    const options = { center: [point.lng, point.lat], zoom };
    if (prefersReducedMotion()) map.jumpTo(options); else map.flyTo(options);
    // An unchanged camera need not emit a movement event.
    if (!map.isMoving() && pendingMove) {
      const callback = pendingMove;
      map.off('moveend', callback);
      callback();
    }
  };

  view.fitPoints = (points, { maxZoom = 12, base = 24 } = {}) => {
    if (!view.map || !points.length) return;
    const bounds = points.reduce((box, point) => box.extend([point.lng, point.lat]), new view.lib.LngLatBounds());
    const padding = cardPadding({ legendCard: document.getElementById('legend-card'), toolsCard, base });
    // Short embeds must retain some drawable area after reserving card space.
    for (const [a, b, size] of [['top', 'bottom', container.clientHeight], ['left', 'right', container.clientWidth]]) {
      const scale = Math.min(1, Math.max(0, size - 80) / (padding[a] + padding[b]));
      padding[a] *= scale;
      padding[b] *= scale;
    }
    view.map.resize();
    view.map.fitBounds(bounds, { padding, maxZoom, duration: 0 });
  };

  view.init = async ({ onStyleLoad, scale = true, ...options } = {}) => {
    const watchLoading = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => view.fail('The map is taking longer to load. You can read the data or reload the map.', 'error'), 15000);
    };
    watchLoading();
    try {
      const lib = await import('https://cdn.jsdelivr.net/npm/maplibre-gl@6.13.0/+esm');
      view.lib = lib;
      const map = new lib.Map({
        container, style: BASEMAPS[style].style, attributionControl: false,
        cooperativeGestures: window.self !== window.top, ...options,
      });
      view.map = map;
      toggle.disabled = false;
      // Useful for diagnostics and deterministic browser verification.
      container.remobokoMap = map;
      map.on('error', () => {
        const message = 'Some map content could not be loaded. All records remain available in Show data.';
        if (container.dataset.mapState === 'loading') view.fail(message, 'error');
        else view.setStatus(message, 'error');
      });
      map.on('style.load', () => {
        try {
          onStyleLoad?.(map, lib);
          container.dataset.featureCount = String(featureCount);
          if (headcount != null) container.dataset.headcount = String(headcount);
          clearTimeout(watchdog);
          view.setStatus('', 'ready');
        } catch {
          view.fail('The map could not display its records. The full data remain available below.', 'error');
        }
      });
      map.addControl(new lib.AttributionControl({ compact: false }), 'bottom-right');
      map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-left');
      map.addControl(new lib.FullscreenControl({ container: document.body }), 'top-left');
      if (scale) map.addControl(new lib.ScaleControl({ unit: 'metric' }), 'bottom-right');
      const basemaps = el('div');
      renderSegmented(basemaps, Object.entries(BASEMAPS).map(([id, basemap]) => ({ id, label: basemap.label })), {
        value: style, label: 'Basemap', onChange: (id) => {
          view.setStatus('Loading basemap…', 'loading');
          watchLoading();
          try { map.setStyle(BASEMAPS[id].style); }
          catch { view.fail('This basemap is unavailable. Choose another basemap or read the data.', 'error'); }
        },
      });
      toolsCard.append(basemaps, el('button', { type: 'button', class: 'rb-map-reset', onclick: () => {
        if (pendingMove) map.off('moveend', pendingMove);
        pendingMove = null;
        map.stop();
        resetView?.();
      } }, 'Reset view'));
      for (const button of dataPanel.querySelectorAll('[data-map-target]')) button.disabled = false;
      resizeObserver = new ResizeObserver(() => { if (dataPanel.hidden) map.resize(); });
      resizeObserver.observe(container);
      window.addEventListener('pagehide', (event) => {
        // A back/forward-cache restore reuses the page and its map instance.
        if (event.persisted) return;
        clearTimeout(watchdog);
        resizeObserver.disconnect();
        map.remove();
      });
      return map;
    } catch {
      view.map?.remove();
      view.map = null;
      view.fail('The interactive map is unavailable. You can still read all the data below.');
      return null;
    }
  };
  return view;
}
