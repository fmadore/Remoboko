// Collaborators by gender: one proportion bar. Two categories are a share,
// not a pie, so the headline carries the number and the bar shows it.
import * as d3 from '../assets/d3.js';
import {
  CATEGORICAL, OTHER_COLOR, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderActions, buildTable,
  showEmpty, formatCount, formatPct, measureText,
} from '../assets/remoboko.js';
import { createChart, bindTooltip } from '../assets/chart.js';
import { normalizeCollaborators, genderSeries } from '../assets/data.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const tooltip = createTooltip();
const TITLE = 'Collaborators by gender';

let series = []; // [{id, label, count, share, color}] women first, then men, then anything else by count
let total = 0;

try {
  const data = normalizeCollaborators(await loadJSON('Data/Collaborators_data.json'));
  if (!data.length) throw new Error('The collaborator dataset is empty.');
  total = data.length;
  series = genderSeries(data, { female: CATEGORICAL[0], male: CATEGORICAL[1], other: OTHER_COLOR });
  const women = series.find((s) => s.id === 'female');
  desc.textContent = women
    ? `${formatCount(women.count)} of the ${formatCount(total)} people who collaborated with Remoboko are women, ${formatPct(women.share)} of the total.`
    : `The ${formatCount(total)} people who collaborated with Remoboko, by gender.`;
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `Proportion bar: ${series.map((s) => `${s.label} ${s.count} (${formatPct(s.share)})`).join(', ')}.`);
} catch (err) {
  showEmpty(plot, 'The collaborator data could not be loaded.');
  throw err;
}

renderLegend(legendBox, series.map((s) => ({ id: s.id, label: s.label, color: s.color, count: s.count })));

const chart = createChart(d3.select(plot).append('svg'));
const { svg } = chart;

function draw() {
  const width = plot.clientWidth;
  const labelBand = 40;   // name and value above each segment
  const barH = 24;
  const height = labelBand + barH + 8;
  plot.style.height = `${height}px`;
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  svg.selectAll('*').remove();

  const x = d3.scaleLinear().domain([0, 1]).range([0, width]);
  let x0 = 0;
  const segs = series.map((s) => { const seg = { ...s, x0, x1: x0 + s.share }; x0 += s.share; return seg; });
  const segWidth = (d) => Math.max(0, x(d.x1) - x(d.x0) - (d === segs[segs.length - 1] ? 0 : 2)); // 2px surface gap

  const g = svg.append('g').attr('transform', `translate(0,${labelBand})`);
  const rects = g.selectAll('rect.rb-mark').data(segs).join('rect')
    .attr('class', 'rb-mark')
    .attr('y', 0).attr('height', barH)
    .attr('x', (d) => x(d.x0))
    .attr('width', segWidth)
    .attr('fill', (d) => d.color);

  // Labels above the segment start; a segment too narrow for its label keeps the legend and tooltip
  const labels = svg.append('g').selectAll('g').data(segs).join('g')
    .attr('transform', (d) => `translate(${x(d.x0)},0)`);
  labels.each(function label(d) {
    const node = d3.select(this);
    const segW = x(d.x1) - x(d.x0);
    const name = node.append('text').attr('class', 'seg-name').attr('y', 14).text(d.label);
    const value = node.append('text').attr('class', 'seg-value').attr('y', 31).text(`${formatCount(d.count)} · ${formatPct(d.share)}`);
    const fits = Math.max(measureText(svg, d.label, 'seg-name'), measureText(svg, value.text(), 'seg-value')) + 8 <= segW;
    if (!fits) { name.remove(); value.remove(); }
  });

  if (chart.entrance) {
    rects.attr('width', 0).transition().duration(700).delay((d, i) => i * 120).ease(d3.easeExpOut).attr('width', segWidth);
  }

  // Hit targets cover the label band as well as the bar
  const hits = svg.append('g').selectAll('rect').data(segs).join('rect')
    .attr('class', 'rb-hit')
    .attr('x', (d) => x(d.x0)).attr('width', (d) => x(d.x1) - x(d.x0))
    .attr('y', 0).attr('height', height)
    .attr('tabindex', 0).attr('role', 'img').attr('data-key', (d) => d.id)
    .attr('aria-label', (d) => `${d.label}: ${d.count} collaborators, ${formatPct(d.share)}`);
  bindTooltip(hits, tooltip, {
    content: (d) => ({ title: d.label, rows: [
      { key: 'Collaborators', value: formatCount(d.count), color: d.color }, { key: 'Share', value: formatPct(d.share), color: d.color },
    ] }),
    highlight: (d) => rects.classed('is-dim', (s) => d !== null && s.id !== d.id),
    anchor: (box) => [box.left + 20, box.top + box.height],
  });
}

const actionView = renderActions(actions, {
  filename: 'collaborators_gender',
  title: TITLE,
  source: SOURCE_LINE,
  plot,
  getSvg: chart.node,
  buildTable: () => buildTable([
    { key: 'label', label: 'Gender' },
    { key: 'count', label: 'Collaborators', numeric: true, format: formatCount },
    { key: 'share', label: 'Share', numeric: true, format: formatPct },
  ], series, `${TITLE}, ${formatCount(total)} collaborators. ${SOURCE_LINE}`),
});

chart.start(draw, { after: actionView.refresh });
