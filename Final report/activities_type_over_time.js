// Publications and activities by type over time: stacked columns per quarter
// or per year, seven named types plus "Other", legend toggles, one tooltip
// listing every series at the hovered period.
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import {
  CATEGORICAL, OTHER_COLOR, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderSegmented,
  renderActions, buildTable, onResize, showEmpty, formatCount, prefersReducedMotion, measureText,
} from '../assets/remoboko.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const granBox = document.getElementById('granularity');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const notes = document.getElementById('notes');
const tooltip = createTooltip();
const TITLE = 'Publications and activities over time';
const MAX_NAMED = 7;

let records = [];
let series = [];        // [{id, label, color, types:[...]}] in fixed order
let periodsByGran = {}; // {quarter: [...], year: [...]}
let granularity = 'quarter';
const hidden = new Set();

try {
  const data = await loadJSON('Data/Publications_and_activities_data.json');
  const skipped = data.rows.filter((r) => !(r.Date && r.Type)).length;
  records = data.rows.filter((r) => r.Date && r.Type).map((r) => {
    const date = new Date(r.Date);
    const q = Math.floor(date.getUTCMonth() / 3) + 1;
    return { type: r.Type, year: String(date.getUTCFullYear()), quarter: `${date.getUTCFullYear()}-Q${q}`, date };
  });

  const byType = d3.rollups(records, (v) => v.length, (d) => d.type)
    .sort((a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0]));
  const named = byType.slice(0, MAX_NAMED);
  const folded = byType.slice(MAX_NAMED);
  series = named.map(([type, count], i) => ({ id: type, label: type, color: CATEGORICAL[i], types: [type], count }));
  if (folded.length) {
    series.push({
      id: 'Other',
      label: `Other (${folded.length} types)`,
      color: OTHER_COLOR,
      types: folded.map(([t]) => t),
      count: d3.sum(folded, ([, c]) => c),
      detail: folded.map(([t, c]) => `${t} ${c}`).join(', '),
    });
  }
  const typeToSeries = new Map(series.flatMap((s) => s.types.map((t) => [t, s.id])));
  records.forEach((r) => { r.series = typeToSeries.get(r.type); });

  const [minDate, maxDate] = d3.extent(records, (d) => d.date);
  const quarters = [];
  for (let y = minDate.getUTCFullYear(); y <= maxDate.getUTCFullYear(); y += 1) {
    for (let q = 1; q <= 4; q += 1) quarters.push(`${y}-Q${q}`);
  }
  const lastQ = records.reduce((m, r) => (r.quarter > m ? r.quarter : m), quarters[0]);
  periodsByGran = {
    quarter: quarters.slice(quarters.indexOf(records.reduce((m, r) => (r.quarter < m ? r.quarter : m), lastQ)), quarters.indexOf(lastQ) + 1),
    year: d3.range(minDate.getUTCFullYear(), maxDate.getUTCFullYear() + 1).map(String),
  };

  desc.textContent = `Remoboko's ${formatCount(records.length)} outputs by type, from the project's start in ${minDate.getUTCFullYear()} to its final activities in ${maxDate.getUTCFullYear()}. `
    + `${named[0][0]}s dominate, with ${formatCount(named[0][1])}.`;
  if (skipped) notes.textContent += ` ${skipped} undated ${skipped === 1 ? 'record is' : 'records are'} not shown.`;
  const other = series.find((s) => s.id === 'Other');
  if (other) notes.textContent += ` "Other" groups ${other.detail}.`;
  plot.setAttribute('role', 'img');
  plot.setAttribute('aria-label', `Stacked column chart of ${records.length} outputs by type and ${granularity}, ${minDate.getUTCFullYear()} to ${maxDate.getUTCFullYear()}.`);
} catch (err) {
  showEmpty(plot, 'The publications data could not be loaded.');
  throw err;
}

renderLegend(legendBox, series.map((s) => ({ id: s.id, label: s.label, color: s.color, count: s.count })), {
  onToggle: (id, visible) => {
    if (visible) hidden.delete(id); else hidden.add(id);
    draw();
  },
});

renderSegmented(granBox, [{ id: 'quarter', label: 'By quarter' }, { id: 'year', label: 'By year' }], {
  value: granularity,
  label: 'Time granularity',
  onChange: (id) => { granularity = id; draw(); },
});

const svg = d3.select(plot).append('svg').attr('aria-hidden', 'true');
let firstDraw = true;

function stackedData() {
  const periods = periodsByGran[granularity];
  const visible = series.filter((s) => !hidden.has(s.id));
  const counts = d3.rollup(records, (v) => v.length, (d) => d[granularity], (d) => d.series);
  const table = periods.map((p) => {
    const row = { period: p, total: 0 };
    for (const s of series) {
      row[s.id] = counts.get(p)?.get(s.id) ?? 0;
    }
    row.total = d3.sum(visible, (s) => row[s.id]);
    return row;
  });
  return { periods, visible, table };
}

function draw() {
  const width = plot.clientWidth;
  const height = Math.max(260, plot.clientHeight);
  if (!width) return;
  plot.style.minHeight = '260px';

  const { periods, visible, table } = stackedData();
  const stack = d3.stack().keys(visible.map((s) => s.id))(table);
  const maxY = d3.max(table, (d) => d.total) || 1;

  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  svg.selectAll('*').remove();

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

  // Grid and axes
  g.append('g').attr('class', 'rb-grid').selectAll('line').data(y.ticks(5)).join('line')
    .attr('x1', 0).attr('x2', innerW).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
  g.append('g').attr('class', 'rb-axis').attr('transform', `translate(-8,0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat(formatCount))
    .call((ax) => ax.select('.domain').remove());
  const xAxis = g.append('g').attr('class', 'rb-axis').attr('transform', `translate(0,${innerH})`);
  xAxis.append('line').attr('x1', 0).attr('x2', innerW);
  const labelEvery = granularity === 'year' ? 1 : 4;
  const tickPeriods = periods.filter((p, i) => (granularity === 'year' ? true : p.endsWith('Q1') || i === 0));
  xAxis.selectAll('text').data(tickPeriods).join('text')
    .attr('x', (p) => x(p) + x.bandwidth() / 2)
    .attr('y', 18)
    .attr('text-anchor', granularity === 'year' ? 'middle' : 'start')
    .attr('dx', granularity === 'year' ? 0 : -barW / 2)
    .text((p) => p.slice(0, 4))
    .filter((p, i) => granularity === 'quarter' && innerW / periods.length * labelEvery < 34 && i % 2 === 1)
    .remove();

  // Hit bands: full-height, wider than the bar
  const bands = g.append('g').selectAll('rect').data(table).join('rect')
    .attr('class', 'rb-hit')
    .attr('x', (d) => x(d.period) - x.step() * 0.1).attr('width', x.step())
    .attr('y', 0).attr('height', innerH)
    .attr('tabindex', 0).attr('role', 'img')
    .attr('aria-label', (d) => `${d.period}: ${d.total} ${d.total === 1 ? 'output' : 'outputs'}`);

  const colorOf = new Map(series.map((s) => [s.id, s.color]));
  const layers = g.append('g').selectAll('g').data(stack).join('g').attr('fill', (d) => colorOf.get(d.key));
  const segs = layers.selectAll('rect').data((d) => d.filter((v) => v[1] > v[0]).map((v) => ({ ...v, key: d.key }))).join('rect')
    .attr('class', 'rb-mark')
    .attr('x', (d) => barX(d.data.period)).attr('width', barW)
    .attr('y', (d) => y(d[1]))
    .attr('height', (d) => Math.max(0, y(d[0]) - y(d[1]) - 2)); // 2px surface gap above each segment

  // Totals on the cap, only when the columns are wide enough to carry them
  if (barW >= 18) {
    g.append('g').selectAll('text').data(table.filter((d) => d.total > 0)).join('text')
      .attr('class', 'rb-value rb-value--muted')
      .attr('x', (d) => barX(d.period) + barW / 2).attr('y', (d) => y(d.total) - 6)
      .attr('text-anchor', 'middle')
      .text((d) => formatCount(d.total));
  }

  if (firstDraw && !prefersReducedMotion()) {
    segs.attr('y', innerH).attr('height', 0)
      .transition().duration(700).delay((d, i) => i * 12).ease(d3.easeExpOut)
      .attr('y', (d) => y(d[1])).attr('height', (d) => Math.max(0, y(d[0]) - y(d[1]) - 2));
  }
  firstDraw = false;

  function show(event, d) {
    const [px, py] = event.type.startsWith('focus') ? centre(event.target) : [event.clientX, event.clientY];
    const rows = visible.filter((s) => d[s.id] > 0).reverse().map((s) => ({ key: s.label, value: formatCount(d[s.id]), color: s.color }));
    tooltip.show({
      title: granularity === 'year' ? d.period : d.period.replace('-', ' '),
      rows: rows.length ? rows : [{ key: 'No outputs', value: '', muted: true }],
      note: rows.length > 1 ? `${formatCount(d.total)} in total` : null,
    }, px, py);
    segs.classed('is-dim', (s) => s.data.period !== d.period);
  }
  function hide() {
    tooltip.hide();
    segs.classed('is-dim', false);
  }
  bands.on('pointerenter', show).on('pointermove', (event) => tooltip.move(event.clientX, event.clientY))
    .on('pointerleave', hide).on('focus', show).on('blur', hide);
}

function centre(node) {
  const r = node.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + 40];
}

renderActions(actions, {
  filename: 'activities_type_over_time',
  title: TITLE,
  source: SOURCE_LINE,
  plot,
  getSvg: () => svg.node(),
  buildTable: () => {
    const { table } = stackedData();
    const cols = [{ key: 'period', label: granularity === 'year' ? 'Year' : 'Quarter' }]
      .concat(series.map((s) => ({ key: s.id, label: s.label, numeric: true, format: formatCount })))
      .concat([{ key: 'all', label: 'Total', numeric: true, format: formatCount }]);
    const rows = table.map((r) => ({ ...r, all: d3.sum(series, (s) => r[s.id]) }));
    return buildTable(cols, rows, `${TITLE}, by ${granularity}. ${SOURCE_LINE}`);
  },
});

onResize(plot, draw);
