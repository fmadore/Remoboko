// Pure data preparation shared by the interactive figures and unit tests.
// Invalid rows are reported explicitly; a missing language remains visible as Unknown.
const text = (value) => typeof value === 'string' ? value.trim() : '';

export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function normalizePublications(data) {
  if (!data || !Array.isArray(data.rows)) throw new TypeError('Publication data must contain a rows array.');
  const records = [];
  const issues = [];
  data.rows.forEach((row, index) => {
    const date = parseDate(row?.Date);
    const type = text(row?.Type);
    if (!date || !type) {
      issues.push({ index, reason: !date ? 'Missing or invalid date' : 'Missing output type' });
      return;
    }
    const year = String(date.getUTCFullYear());
    records.push({
      type, language: text(row.Language) || 'Unknown', year,
      quarter: `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`,
      date, title: text(row.Title),
    });
  });
  return { records, issues };
}

export function normalizeCollaborators(data) {
  if (!Array.isArray(data)) throw new TypeError('Collaborator data must be an array.');
  return data.map((row, index) => {
    if (!text(row?.Collaborator)) throw new TypeError(`Collaborator ${index + 1} needs a name.`);
    return { ...row, Collaborator: text(row.Collaborator), Country: text(row.Country) || 'Unknown', Gender: text(row.Gender).toLowerCase() || 'unknown' };
  });
}

export function normalizeTimeline(data) {
  if (!Array.isArray(data)) throw new TypeError('Timeline data must be an array.');
  return data.map((row, index) => {
    const date = parseDate(row?.date);
    if (!date || !text(row.event) || !['Benin', 'Togo'].includes(row.country)
      || !['Religion', 'Education', 'Politics'].includes(row.category)) {
      throw new TypeError(`Timeline event ${index + 1} has an invalid date, country, theme or label.`);
    }
    return { ...row, event: text(row.event), id: index, date };
  }).sort((a, b) => a.date - b.date);
}

export function rankedCounts(records, key) {
  const counts = new Map();
  for (const row of records) counts.set(row[key], (counts.get(row[key]) || 0) + 1);
  return Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
}

export function outputSeries(records, colors, otherColor, maxNamed = 7) {
  const ranked = rankedCounts(records, 'type');
  const series = ranked.slice(0, maxNamed).map(([type, count], i) => ({ id: `type:${type}`, label: type, color: colors[i], types: [type], count }));
  const folded = ranked.slice(maxNamed);
  if (folded.length) series.push({
    // The reserved id cannot collide with a published type called Other.
    id: 'other', label: `Other (${folded.length} types)`, color: otherColor,
    types: folded.map(([type]) => type), count: folded.reduce((sum, [, count]) => sum + count, 0),
    typeCounts: folded,
    detail: folded.map(([type, count]) => `${type} ${count}`).join(', '),
  });
  return series;
}

const GENDER_LABELS = { female: 'Women', male: 'Men', unknown: 'Unknown' };

/**
 * Count every person, missing gender included; women, then men, then other
 * values by count. Mirrors gender_series() in viz_common.py.
 */
export function genderSeries(records, { female, male, other }) {
  const counts = new Map();
  for (const row of records) {
    const key = text(row?.Gender).toLowerCase() || 'unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const rest = [...counts.keys()].filter((key) => key !== 'female' && key !== 'male')
    .sort((a, b) => counts.get(b) - counts.get(a) || (a < b ? -1 : a > b ? 1 : 0));
  const total = records.length;
  const colors = { female, male };
  return ['female', 'male'].filter((key) => counts.has(key)).concat(rest).map((id) => ({
    id, label: GENDER_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1),
    count: counts.get(id), share: counts.get(id) / total, color: colors[id] || other,
  }));
}

export function aggregatePeriods(records, series, granularity) {
  if (!['quarter', 'year'].includes(granularity)) throw new TypeError('Unknown time granularity.');
  if (!records.length) return [];
  const index = (row) => Number(row.year) * 4 + Number(row.quarter.slice(-1)) - 1;
  let first = Infinity;
  let last = -Infinity;
  for (const record of records) {
    const value = index(record);
    first = Math.min(first, value);
    last = Math.max(last, value);
  }
  const start = granularity === 'quarter' ? first : Math.floor(first / 4);
  const end = granularity === 'quarter' ? last : Math.floor(last / 4);
  const rows = [];
  for (let i = start; i <= end; i += 1) {
    const period = granularity === 'year' ? String(i) : `${Math.floor(i / 4)}-Q${i % 4 + 1}`;
    rows.push({ period, counts: Object.fromEntries(series.map((s) => [s.id, 0])) });
  }
  const byPeriod = new Map(rows.map((row) => [row.period, row]));
  const typeToSeries = new Map(series.flatMap((s) => s.types.map((type) => [type, s.id])));
  for (const record of records) {
    const key = typeToSeries.get(record.type);
    if (key !== undefined) byPeriod.get(record[granularity]).counts[key] += 1;
  }
  return rows;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return channels.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function readableInk(fill) {
  // Black and white guarantee at least 4.5:1 for every opaque sRGB fill.
  return contrastRatio(fill, '#000000') >= contrastRatio(fill, '#ffffff') ? '#000000' : '#ffffff';
}
