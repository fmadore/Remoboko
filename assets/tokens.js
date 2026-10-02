// Shared browser design and data-source tokens.
export const COUNTRY_COLORS = {
  Benin: '#3388ff',
  Togo: '#2ecc71',
  'West Africa': '#e67e22',
};

// Fixed-order categorical palette (see assets/remoboko.css). Series past
// the seventh fold into "Other"; hues are never generated.
export const CATEGORICAL = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948',
];
export const OTHER_COLOR = '#9c9c98';
export const SEQ_COLOR = '#2a78d6';

export const FONT_FAMILY = '"Source Sans 3", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// OpenFreeMap vector styles: no API key, no usage limits.
export const BASEMAPS = {
  detailed: { label: 'Detailed', style: 'https://tiles.openfreemap.org/styles/liberty' },
  light: { label: 'Light', style: 'https://tiles.openfreemap.org/styles/positron' },
  dark: { label: 'Dark', style: 'https://tiles.openfreemap.org/styles/dark' },
};
export const BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const SOURCE_LINE = 'Source: Remoboko project data (CC BY 4.0)';
