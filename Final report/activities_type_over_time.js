// Publications and activities by type over time: stacked columns per quarter
// or per year, seven named types plus "Other", legend toggles, one tooltip
// listing every series at the hovered period.
import * as d3 from '../assets/d3.js';
import {
  CATEGORICAL, OTHER_COLOR, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderSegmented,
  renderActions, buildTable, showEmpty, formatCount, measureText, availablePlotHeight, updateQueryState,
} from '../assets/remoboko.js';
import { createChart, bindTooltip } from '../assets/chart.js';
import { normalizePublications, outputSeries, aggregatePeriods } from '../assets/data.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const granBox = document.getElementById('granularity');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const notes = document.getElementById('notes');
const tooltip = createTooltip();
const TITLE = 'Publications and activities over time';
const query = new URLSearchParams(window.location.search);

let records;
let series = [];        // [{id, label, color, types:[...]}] in fixed order
let dataByGran = {};
let granularity = query.get('period') === 'year' ? 'year' : 'quarter';
const hidden = new Set();

try {
  const normalized = normalizePublications(await loadJSON('Data/Publications_and_activities_data.json'));
  records = normalized.records;
  if (!records.length) throw new Error('No valid dated outputs are available.');
  series = outputSeries(records, CATEGORICAL, OTHER_COLOR);
  dataByGran = Object.fromEntries(['quarter', 'year'].map((gran) => [gran, aggregatePeriods(records, series, gran)]));
  try {
    const requested = JSON.parse(query.get('hidden') || '[]');
    if (Array.isArray(requested)) requested.forEach((id) => { if (series.some((s) => s.id === id)) hidden.add(id); });
  } catch { /* Ignore malformed optional view state. */ }
  const [minDate, maxDate] = d3.extent(records, (d) => d.date);
  desc.textContent = `Remoboko's ${formatCount(records.length)} outputs by type, ${minDate.getUTCFullYear()}–${maxDate.getUTCFullYear()}. `
    + `${series[0].label}: ${formatCount(series[0].count)} outputs.`;
  if (normalized.issues.length) notes.textContent += ` ${normalized.issues.length} records with a missing type or invalid date are excluded.`;
  const other = series.find((s) => s.id === 'other');
  if (other) notes.textContent += ` "Other" groups ${other.detail}.`;
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `Stacked column chart of ${records.length} outputs by type and ${granularity}, ${minDate.getUTCFullYear()} to ${maxDate.getUTCFullYear()}.`);
} catch (err) {
  showEmpty(plot, records?.length === 0 ? 'No valid dated outputs are available.' : 'The publications data could not be loaded.');
  throw err;
}

const chart = createChart(d3.select(plot).append('svg'));
const { svg } = chart;

renderLegend(legendBox, series.map((s) => ({ id: s.id, label: s.label, color: s.color, count: s.count })), {
  onToggle: (id, visible) => {
    if (visible) hidden.delete(id); else hidden.add(id);
    syncQuery();
    chart.render();
  },
});

legendBox.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(!hidden.has(series[i].id))));

function syncQuery() {
  updateQueryState({ period: granularity === 'year' ? 'year' : null, hidden: hidden.size ? JSON.stringify([...hidden]) : null });
}

renderSegmented(granBox, [{ id: 'quarter', label: 'By quarter' }, { id: 'year', label: 'By year' }], {
  value: granularity,
  label: 'Time granularity',
  onChange: (id) => { granularity = id; syncQuery(); chart.render(); },
});

function stackedData() {
  const visible = series.filter((s) => !hidden.has(s.id));
  const table = dataByGran[granularity].map(({ period, counts }) => ({
    period, ...counts, total: d3.sum(visible, (s) => counts[s.id]),
  }));
  return { periods: table.map((row) => row.period), visible, table };
}

function viewTitle() {
  const labels = series.filter((s) => !hidden.has(s.id)).map((s) => s.label);
  return `${TITLE}, by ${granularity}${hidden.size ? ` — ${labels.length ? labels.join(', ') : 'no types selected'}` : ''}`;
}

function draw() {
  const width = plot.clientWidth;
  const height = Math.max(260, availablePlotHeight(plot));
  plot.style.minHeight = '260px';

  const { periods, visible, table } = stackedData();
  const stack = d3.stack().keys(visible.map((s) => s.id))(table);
  const maxY = d3.max(table, (d) => d.total) || 1;

  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  svg.selectAll('*').remove();
  plot.setAttribute('aria-label', `${viewTitle()}. ${d3.sum(table, (row) => row.total)} outputs in the current selection.`);

  const yTicks = d3.ticks(0, maxY, 5);
  const yLabelW = measureText(svg, formatCount(yTicks[yTicks.length - 1]), 'rb-axis') + 12;
  const margin = { top: 20, right: 8, bottom: 26, left: yLabelW };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(periods).range([0, innerW]).paddingInner(0.2).paddingOuter(0.1);
  const y = d3.scaleLinear().domain([0, maxY]).nice(5).range([innerH, 0]);
  const barW = Math.min(24, x.bandwidth());
  const barX = (p) => x(p) + (x.bandwidth() - barW) / 2;

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Years in the quarter view: faint separators, and one label centred under each year's quarters.
  const years = d3.groups(periods, (p) => p.slice(0, 4)).map(([year, quarters]) => ({
    year, start: x(quarters[0]), end: x(quarters[quarters.length - 1]) + x.bandwidth(),
  }));
  const gap = x.step() - x.bandwidth();

  // Grid and axes
  const grid = g.append('g').attr('class', 'rb-grid');
  grid.selectAll('line.y').data(y.ticks(5)).join('line').attr('class', 'y')
    .attr('x1', 0).attr('x2', innerW).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
  if (granularity === 'quarter') {
    grid.selectAll('line.year').data(years.slice(1)).join('line').attr('class', 'year')
      .attr('x1', (d) => Math.round(d.start - gap / 2) + 0.5).attr('x2', (d) => Math.round(d.start - gap / 2) + 0.5)
      .attr('y1', 0).attr('y2', innerH + 6);
  }
  g.append('g').attr('class', 'rb-axis').attr('transform', `translate(-8,0)`)
    .call(d3.axisLeft(y).tickValues(y.ticks(5).filter(Number.isInteger)).tickSize(0).tickFormat(formatCount))
    .call((ax) => ax.select('.domain').remove());
  const xAxis = g.append('g').attr('class', 'rb-axis').attr('transform', `translate(0,${innerH})`);
  xAxis.append('line').attr('x1', 0).attr('x2', innerW);
  const labels = granularity === 'year'
    ? periods.map((p) => ({ year: p, centre: x(p) + x.bandwidth() / 2 }))
    : years.map((d) => ({ year: d.year, centre: (d.start + d.end) / 2 }));
  const crowded = granularity === 'quarter' && x.step() * 4 < 34;
  xAxis.selectAll('text').data(labels.filter((d, i) => !crowded || i % 2 === 0)).join('text')
    .attr('x', (d) => d.centre).attr('y', 18).attr('text-anchor', 'middle')
    .text((d) => d.year);

  // Hit bands: full-height, wider than the bar
  const bands = g.append('g').selectAll('rect').data(table).join('rect')
    .attr('class', 'rb-hit')
    .attr('x', (d) => x(d.period) - x.step() * 0.1).attr('width', x.step())
    .attr('y', 0).attr('height', innerH)
    .attr('tabindex', 0).attr('role', 'img').attr('data-key', (d) => d.period)
    .attr('aria-label', (d) => `${d.period}: ${d.total} ${d.total === 1 ? 'output' : 'outputs'}`);

  const colorOf = new Map(series.map((s) => [s.id, s.color]));
  const layers = g.append('g').attr('pointer-events', 'none').selectAll('g').data(stack).join('g').attr('fill', (d) => colorOf.get(d.key));
  const segHeight = (d) => Math.max(0, y(d[0]) - y(d[1]) - 2); // 2px surface gap above each segment
  const segs = layers.selectAll('rect').data((d) => d.filter((v) => v[1] > v[0]).map((v) => ({ ...v, key: d.key }))).join('rect')
    .attr('class', 'rb-mark')
    .attr('x', (d) => barX(d.data.period)).attr('width', barW)
    .attr('y', (d) => y(d[1]))
    .attr('height', segHeight);

  // Totals on the cap, only when the columns are wide enough to carry them
  if (barW >= 18) {
    g.append('g').attr('pointer-events', 'none').selectAll('text').data(table.filter((d) => d.total > 0)).join('text')
      .attr('class', 'rb-value rb-value--muted')
      .attr('x', (d) => barX(d.period) + barW / 2).attr('y', (d) => y(d.total) - 6)
      .attr('text-anchor', 'middle')
      .text((d) => formatCount(d.total));
  }

  if (chart.entrance) {
    segs.attr('y', innerH).attr('height', 0)
      .transition().duration(700).delay((d, i) => i * 12).ease(d3.easeExpOut)
      .attr('y', (d) => y(d[1])).attr('height', segHeight);
  }

  bindTooltip(bands, tooltip, {
    content: (d) => {
      const rows = visible.filter((s) => d[s.id] > 0).reverse().map((s) => ({ key: s.label, value: formatCount(d[s.id]), color: s.color }));
      return {
        title: granularity === 'year' ? d.period : d.period.replace('-', ' '),
        rows: rows.length ? rows : [{ key: 'No outputs', value: '', muted: true }],
        note: rows.length > 1 ? `${formatCount(d.total)} in total` : null,
      };
    },
    highlight: (d) => segs.classed('is-dim', (s) => d !== null && s.data.period !== d.period),
    anchor: (box) => [box.left + box.width / 2, box.top + 40],
  });
}

const actionView = renderActions(actions, {
  filename: 'activities_type_over_time',
  title: viewTitle,
  source: SOURCE_LINE,
  plot,
  getSvg: chart.node,
  buildTable: () => {
    const { table, visible } = stackedData();
    const cols = [{ key: 'period', label: granularity === 'year' ? 'Year' : 'Quarter' }]
      .concat(visible.map((s) => ({ key: s.id, label: s.label, numeric: true, format: formatCount })))
      .concat([{ key: 'total', label: 'Selected total', numeric: true, format: formatCount }]);
    return buildTable(cols, table, `${viewTitle()}. ${SOURCE_LINE}`);
  },
});

chart.start(draw, { after: actionView.refresh });
