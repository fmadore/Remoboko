// Collaborators by country: horizontal bars, one series, names on hover.
import * as d3 from '../assets/d3.js';
import {
  SEQ_COLOR, SOURCE_LINE, loadJSON, createTooltip, renderActions, buildTable,
  showEmpty, formatCount, measureText, availablePlotHeight,
} from '../assets/remoboko.js';
import { createChart, bindTooltip, roundedBarPath } from '../assets/chart.js';
import { normalizeCollaborators } from '../assets/data.js';

const plot = document.getElementById('plot');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const tooltip = createTooltip();
const TITLE = 'Collaborators by country';

let rows = [];

try {
  const data = normalizeCollaborators(await loadJSON('Data/Collaborators_data.json'));
  if (!data.length) throw new Error('The collaborator dataset is empty.');
  rows = d3.rollups(data, (v) => v.map((d) => d.Collaborator).sort(d3.ascending), (d) => d.Country)
    .map(([country, names]) => ({ country, count: names.length, names }))
    .sort((a, b) => d3.descending(a.count, b.count) || d3.ascending(a.country, b.country));
  const total = d3.sum(rows, (d) => d.count);
  desc.textContent = `The ${formatCount(total)} people who collaborated with Remoboko, counted by the country of their institution. `
    + `${rows.length} countries; ${rows[0].country} alone accounts for ${formatCount(rows[0].count)}.`;
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `Bar chart of ${total} collaborators across ${rows.length} countries, led by ${rows[0].country} with ${rows[0].count}.`);
} catch (err) {
  showEmpty(plot, 'The collaborator data could not be loaded.');
  throw err;
}

const chart = createChart(d3.select(plot).append('svg'));
const { svg } = chart;

function draw() {
  const width = plot.clientWidth;
  const narrow = width < 480;
  const n = rows.length;

  // Row height adapts to the space the iframe gives us, within legible bounds.
  const available = availablePlotHeight(plot);
  const minRow = narrow ? 42 : 20;
  const maxRow = narrow ? 48 : 30;
  const rowH = Math.max(minRow, Math.min(maxRow, Math.floor(available / n)));
  const height = rowH * n;
  plot.style.minHeight = `${height}px`;

  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  svg.selectAll('*').remove();

  const labelW = narrow ? 0 : Math.min(width * 0.42, d3.max(rows, (d) => measureText(svg, d.country, 'rb-cat-label')) + 14);
  const valueW = measureText(svg, formatCount(d3.max(rows, (d) => d.count)), 'rb-value') + 10;
  const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.count)]).range([0, Math.max(40, width - labelW - valueW)]);
  const y = d3.scaleBand().domain(rows.map((d) => d.country)).range([0, height]).paddingInner(0);
  const barH = Math.min(24, narrow ? rowH - 24 : rowH - 8);
  const barY = (d) => (narrow ? y(d.country) + 20 : y(d.country) + (rowH - barH) / 2);
  const barPath = (d, value = d.count) => roundedBarPath(0, barY(d), x(value), barH);

  const g = svg.append('g').attr('transform', `translate(${labelW},0)`);

  // Row-wide hit targets (bigger than the mark)
  const row = svg.append('g').attr('class', 'rows').selectAll('g').data(rows).join('g')
    .attr('transform', (d) => `translate(0,${y(d.country)})`);
  const hit = row.append('rect').attr('class', 'rb-hit').attr('width', width).attr('height', rowH).attr('tabindex', 0)
    .attr('data-key', (d) => d.country)
    .attr('role', 'img').attr('aria-label', (d) => `${d.country}: ${d.count} ${d.count === 1 ? 'collaborator' : 'collaborators'}`);

  row.append('text').attr('class', 'rb-cat-label').attr('pointer-events', 'none')
    .attr('x', narrow ? 0 : labelW - 12)
    .attr('y', narrow ? 13 : rowH / 2)
    .attr('dy', narrow ? 0 : '0.35em')
    .attr('text-anchor', narrow ? 'start' : 'end')
    .text((d) => d.country);

  // Square at the baseline, 4px rounded at the data end.
  const bars = g.selectAll('path.rb-mark').data(rows).join('path')
    .attr('class', 'rb-mark').attr('fill', SEQ_COLOR)
    .attr('d', (d) => barPath(d));

  const values = g.selectAll('text.rb-value').data(rows).join('text')
    .attr('class', 'rb-value')
    .attr('x', (d) => x(d.count) + 6)
    .attr('y', (d) => barY(d) + barH / 2).attr('dy', '0.35em')
    .text((d) => formatCount(d.count));

  if (chart.entrance) {
    bars.attr('d', (d) => barPath(d, 0))
      .transition().duration(700).delay((d, i) => i * 18).ease(d3.easeExpOut).attr('d', (d) => barPath(d));
    values.attr('opacity', 0).transition().duration(400).delay((d, i) => 300 + i * 18).attr('opacity', 1);
  }

  bindTooltip(hit, tooltip, {
    content: (d) => ({ title: d.country, sub: `${formatCount(d.count)} ${d.count === 1 ? 'collaborator' : 'collaborators'}`, list: d.names }),
    highlight: (d) => bars.classed('is-dim', (b) => d !== null && b !== d),
    anchor: (box) => [box.left + Math.min(box.width, 160), box.top + box.height / 2],
  });
}

const actionView = renderActions(actions, {
  filename: 'collaborators_by_country',
  title: TITLE,
  source: SOURCE_LINE,
  plot,
  getSvg: chart.node,
  buildTable: () => buildTable([
    { key: 'country', label: 'Country' },
    { key: 'count', label: 'Collaborators', numeric: true, format: formatCount },
    { key: 'names', label: 'Names', format: (v) => v.join(', ') },
  ], rows, `${TITLE}. ${SOURCE_LINE}`),
});

chart.start(draw, { after: actionView.refresh });
