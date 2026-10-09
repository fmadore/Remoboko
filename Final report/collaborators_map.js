// Proportional-area institution circles and an equivalent linked data table.
import { SEQ_COLOR, loadJSON, el, formatCount, createTooltip, makeCollapsible, buildTable } from '../assets/remoboko.js';
import { createMapView, groupCollaborators, collaboratorRadius, profileList } from '../assets/maps.js';

async function main() {
  let places;
  let unmapped;
  let total;
  try {
    ({ places, unmapped, total } = groupCollaborators(await loadJSON('Data/Collaborators_data.json')));
  } catch {
    const view = createMapView({ style: 'light' });
    view.setData(el('p', {}, 'The collaborator records could not be read. Reload the page to try again.'),
      el('a', { href: 'Data/Collaborators_data.json' }, 'Read the source data'));
    view.fail('The collaborator data could not be loaded.');
    return;
  }
  const shown = total - unmapped.length;
  const view = createMapView({ style: 'light', featureCount: places.length, headcount: shown });
  const tooltip = createTooltip();
  const byId = new Map(places.map((place) => [place.id, place]));
  let popup = null;
  let hovered = null;
  const countries = new Set(places.map((place) => place.country));
  document.getElementById('map-description').textContent = `${formatCount(shown)} collaborators at ${formatCount(places.length)} institutions in ${countries.size} countries. Circle area is proportional to headcount. Use Show data for every name and profile.${unmapped.length ? ` ${unmapped.length} records without usable coordinates are listed separately in the data view.` : ''}`;

  const openPopup = (place) => {
    if (!view.map) return;
    tooltip.hide();
    popup?.remove();
    popup = new view.lib.Popup({ offset: collaboratorRadius(place.count) + 4, maxWidth: '300px' })
      .setLngLat([place.lng, place.lat]).setDOMContent(el('div', { class: 'rb-popup' },
        el('p', { class: 'rb-popup-title' }, place.affiliation),
        el('p', { class: 'rb-popup-sub' }, `${place.country} · ${formatCount(place.count)} ${place.count === 1 ? 'collaborator' : 'collaborators'}`),
        profileList(place.people)))
      .addTo(view.map);
  };
  const table = buildTable([
    { key: 'affiliation', label: 'Institution' }, { key: 'country', label: 'Country' },
    { key: 'count', label: 'People', numeric: true },
    { key: 'people', label: 'Names and profiles', format: profileList },
    { key: 'id', label: 'Map', format: (_, place) => el('button', {
      type: 'button', class: 'rb-map-link', 'data-map-target': place.id, disabled: true,
      'aria-label': `Show ${place.affiliation} on map`, onclick: () => {
        popup?.remove();
        view.navigate(place, { zoom: 8, onArrival: () => openPopup(place) });
      },
    }, 'Show on map') },
  ], places, `${formatCount(shown)} collaborators at ${formatCount(places.length)} geolocated institutions. Profile links open in a new tab.`);
  const other = unmapped.length ? el('section', {}, el('h2', {}, 'Records without usable coordinates'),
    el('ul', {}, unmapped.map((row) => el('li', {}, `${row.affiliation}, ${row.country}`, profileList([row.person]))))) : null;
  view.setData(table, ...(other ? [other] : []));
  if (!places.length) {
    view.empty(total ? 'No collaborators have usable coordinates. Their names and profiles are listed below.' : 'No collaborators are available.');
    return;
  }

  const legend = document.getElementById('legend-card');
  legend.append(el('h2', {}, 'Collaborators per institution'),
    el('ul', { class: 'rb-size-key' }, [1, 4, 8].map((count) => el('li', {},
      el('span', { style: { width: `${2 * collaboratorRadius(count)}px`, height: `${2 * collaboratorRadius(count)}px` } }),
      el('span', {}, `${count} ${count === 1 ? 'collaborator' : 'collaborators'}`)))));
  makeCollapsible(legend);

  const geojson = {
    type: 'FeatureCollection', features: places.map((place) => ({
      type: 'Feature', id: place.id,
      properties: { affiliation: place.affiliation, country: place.country, count: place.count, r: collaboratorRadius(place.count) },
      geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
    })),
  };
  const map = await view.init({ center: [10, 20], zoom: 1.4, minZoom: -2, maxZoom: 18, scale: false,
    onStyleLoad: (activeMap) => {
      hovered = null;
      tooltip.hide();
      if (!activeMap.getSource('collaborators')) activeMap.addSource('collaborators', { type: 'geojson', data: geojson });
      if (!activeMap.getLayer('collaborators-circles')) activeMap.addLayer({
        id: 'collaborators-circles', type: 'circle', source: 'collaborators',
        // Larger institutions draw first, so overlapping smaller ones stay visible and selectable.
        layout: { 'circle-sort-key': ['*', -1, ['get', 'count']] },
        paint: {
          'circle-radius': ['get', 'r'], 'circle-color': SEQ_COLOR,
          'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.8],
          'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2,
        },
      });
    },
  });
  if (!map) return;
  map.on('mousemove', 'collaborators-circles', (event) => {
    const feature = event.features?.[0];
    if (!feature || !map.getSource('collaborators')) return;
    map.getCanvas().style.cursor = 'pointer';
    if (hovered !== null && hovered !== feature.id) map.setFeatureState({ source: 'collaborators', id: hovered }, { hover: false });
    const changed = hovered !== feature.id;
    hovered = feature.id;
    map.setFeatureState({ source: 'collaborators', id: hovered }, { hover: true });
    if (changed) tooltip.show({ title: feature.properties.affiliation,
      sub: `${feature.properties.country} · ${formatCount(feature.properties.count)} ${feature.properties.count === 1 ? 'collaborator' : 'collaborators'}`,
      note: 'Select for names, or use Show data',
    }, event.originalEvent.clientX, event.originalEvent.clientY);
    else tooltip.move(event.originalEvent.clientX, event.originalEvent.clientY);
  });
  map.on('mouseleave', 'collaborators-circles', () => {
    map.getCanvas().style.cursor = '';
    if (hovered !== null && map.getSource('collaborators')) map.setFeatureState({ source: 'collaborators', id: hovered }, { hover: false });
    hovered = null;
    tooltip.hide();
  });
  map.on('click', 'collaborators-circles', (event) => {
    const place = byId.get(event.features?.[0]?.id);
    if (place) openPopup(place);
  });
  document.getElementById('map-data-toggle').addEventListener('click', () => { tooltip.hide(); popup?.remove(); });
  const reset = () => { popup?.remove(); tooltip.hide(); view.fitPoints(places, { base: 28 }); };
  view.setReset(reset);
  reset();
}

main();
