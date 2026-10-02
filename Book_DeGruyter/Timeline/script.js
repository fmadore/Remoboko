// Interactive timeline of the Book_DeGruyter events (data.json).
// Desktop: a horizontal axis with Benin above and Togo below, labels
// staggered in lanes. Phones: one vertical column, to scale where the
// dates allow and pushed apart where they crowd.
import * as d3 from '../../assets/d3.js';
import {
  COUNTRY_COLORS, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderSegmented, renderActions,
  buildTable, onResize, showEmpty, prefersReducedMotion, availablePlotHeight, updateQueryState,
} from '../../assets/remoboko.js';

import { normalizeTimeline } from '../../assets/data.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const filterBox = document.getElementById('filter');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const tooltip = createTooltip();
const TITLE = 'Religion, education and politics in Togo and Benin, 1960–2010';
const CATEGORIES = ['Religion', 'Education', 'Politics'];

let events = [];
const initialCategory = new URLSearchParams(window.location.search).get('theme');
let category = CATEGORIES.includes(initialCategory) ? initialCategory : 'All';

try {
  events = normalizeTimeline(await loadJSON('data.json'));
  if (!events.length) throw new Error('The timeline dataset is empty.');
  const [min, max] = d3.extent(events, (d) => d.date);
  const byCountry = d3.rollup(events, (v) => v.length, (d) => d.country);
  desc.textContent = `${events.length} events from the book, ${min.getUTCFullYear()}–${max.getUTCFullYear()}: Benin (${byCountry.get('Benin')}) above the axis, Togo (${byCountry.get('Togo')}) below.`;
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `Timeline of ${events.length} events in Togo and Benin between ${min.getUTCFullYear()} and ${max.getUTCFullYear()}.`);
} catch (err) {
  showEmpty(plot, 'The timeline data could not be loaded.');
  throw err;
}

renderLegend(legendBox, ['Benin', 'Togo'].map((c) => ({ id: c, label: c, color: COUNTRY_COLORS[c], count: events.filter((e) => e.country === c).length })), { shape: 'dot' });
renderSegmented(filterBox, [{ id: 'All', label: 'All themes' }].concat(CATEGORIES.map((c) => ({ id: c, label: c }))), {
  value: category,
  label: 'Theme',
  onChange: (id) => { category = id; updateQueryState({ theme: id === 'All' ? null : id }); draw(); },
});

const svg = d3.select(plot).append('svg').attr('role', 'group').attr('aria-label', 'Interactive chart; the table provides the same values');
const formatDate = d3.utcFormat('%-d %B %Y');
const shortDate = d3.utcFormat('%-d %b %Y');
let firstDraw = true;

function visibleEvents() {
  return category === 'All' ? events : events.filter((e) => e.category === category);
}

function wrap(textSel, width) {
  textSel.each(function wrapOne() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    const y = text.attr('y');
    const x = text.attr('x') || 0;
    let line = [];
    let lineNumber = 0;
    let tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', '0em');
    let word = words.pop();
    while (word) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        lineNumber += 1;
        tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', `${lineNumber * 1.15}em`).text(word);
      }
      word = words.pop();
    }
  });
}

function draw() {
  const width = plot.clientWidth;
  if (!width) return;
  const focusedId = document.activeElement?.dataset.eventId;
  svg.selectAll('*').remove();
  const data = visibleEvents();
  if (width < 640) drawVertical(data, width); else drawHorizontal(data, width);
  firstDraw = false;
  desc.textContent = `${data.length} ${category === 'All' ? '' : `${category.toLowerCase()} `}events from the book, 1960–2010. ${width < 640 ? 'Chronological list with country and date; spacing does not represent elapsed time.' : 'Benin above the axis, Togo below.'}`;
  plot.setAttribute('aria-label', `${viewTitle()}. ${data.length} events.`);
  if (focusedId != null) svg.selectAll('g.event').filter((d) => String(d.id) === focusedId).node()?.focus();
  actionView.refresh();
}

function drawHorizontal(data, width) {
  const laneCount = 5;
  const laneStep = 38;   // room for a three-line label inside its own lane
  const laneBase = 22;
  const margin = { top: 14, right: 60, bottom: 14, left: 60 };
  const height = Math.max(availablePlotHeight(plot), margin.top + margin.bottom + 2 * (laneBase + laneCount * laneStep) + 8);
  plot.style.minHeight = `${height}px`;
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

  const x = d3.scaleUtc().domain(d3.extent(events, (d) => d.date)).nice(d3.utcYear.every(5)).range([margin.left, width - margin.right]);
  const axisY = height / 2;
  const labelWidth = Math.min(124, Math.max(96, (width - margin.left - margin.right) / 8.5));
  const minLabelGap = labelWidth + 6;
  const neighbourGap = 44;

  // Country bands
  svg.append('text').attr('class', 'axis-label').attr('x', margin.left).attr('y', margin.top - 2).text('Benin');
  svg.append('text').attr('class', 'axis-label').attr('x', margin.left).attr('y', height - margin.bottom + 10).text('Togo');

  const eventsLayer = svg.append('g');

  // Lane assignment per side
  const laneLastX = { Benin: new Array(laneCount).fill(-Infinity), Togo: new Array(laneCount).fill(-Infinity) };
  function assignLane(country, xPos) {
    const lanes = laneLastX[country];
    const dist = (i) => (i < 0 || i >= lanes.length ? Infinity : xPos - lanes[i]);
    // Prefer a lane whose neighbours are also clear, so labels step diagonally; when crowded, take the roomiest lane.
    let lane = lanes.findIndex((last, i) => dist(i) >= minLabelGap && dist(i - 1) >= neighbourGap && dist(i + 1) >= neighbourGap);
    if (lane === -1) lane = lanes.indexOf(Math.min(...lanes));
    lanes[lane] = xPos;
    return lane;
  }

  const groups = eventsLayer.selectAll('g.event').data(data, (d) => d.id).join('g')
    .attr('class', 'event')
    .attr('transform', (d) => `translate(${x(d.date)},${axisY})`)
    .attr('tabindex', 0).attr('role', 'img').attr('data-event-id', (d) => d.id)
    .attr('aria-label', (d) => `${formatDate(d.date)}, ${d.country}, ${d.category}: ${d.event}`);

  groups.each(function drawEvent(d) {
    const g = d3.select(this);
    const side = d.country === 'Benin' ? -1 : 1;
    const lane = assignLane(d.country, x(d.date));
    const labelY = side * (laneBase + lane * laneStep);
    const color = COUNTRY_COLORS[d.country] || '#888';
    // Dots sit just off the line on their country's side, so same-year events never overprint
    g.append('line').attr('class', 'event-line').attr('y1', side * 4).attr('y2', labelY).attr('stroke', color).attr('stroke-opacity', 0.55);
    g.append('circle').attr('class', 'event-dot').attr('cy', side * 4).attr('r', 4.5).attr('fill', color);
    g.append('circle').attr('class', 'rb-hit').attr('cy', side * 4).attr('r', 14);
    g.append('text').attr('class', 'event-text')
      .attr('y', labelY + (side < 0 ? -6 - 11 : 13))
      .attr('text-anchor', 'middle')
      .text(d.event)
      .call(wrap, labelWidth);
    // Multi-line labels above the axis grow upwards: shift them so the last line sits by the leader
    if (side < 0) {
      const lines = g.select('text').selectAll('tspan').size();
      g.select('text').attr('transform', `translate(0,${-(lines - 1) * 12.1})`);
    }
  });

  // Axis drawn last: year labels sit just below the line on white plates, over any leader lines
  const axis = svg.append('g').attr('class', 'rb-axis').attr('transform', `translate(0,${axisY})`)
    .call(d3.axisBottom(x).ticks(d3.utcYear.every(5)).tickSize(0).tickPadding(6).tickFormat(d3.utcFormat('%Y')));
  axis.selectAll('.tick text').each(function plate() {
    const bbox = this.getBBox();
    d3.select(this.parentNode).insert('rect', 'text').attr('x', bbox.x - 4).attr('y', bbox.y - 1)
      .attr('width', bbox.width + 8).attr('height', bbox.height + 2).attr('fill', '#fff');
  });

  attachHover(groups);

  if (firstDraw && !prefersReducedMotion()) {
    groups.attr('opacity', 0).transition().duration(500).delay((d, i) => i * 25).ease(d3.easeExpOut).attr('opacity', 1);
  }
}

function drawVertical(data, width) {
  // A chronological list: measured rows keep long event names clear of their date/country.
  const margin = { top: 12, right: 8, bottom: 12, left: 30 };
  const lineX = 12;
  const line = svg.append('line').attr('class', 'rb-grid')
    .attr('x1', lineX).attr('x2', lineX).attr('y1', margin.top).attr('stroke', 'var(--rb-axis)');
  const groups = svg.append('g').selectAll('g.event').data(data, (d) => d.id).join('g')
    .attr('class', 'event').attr('tabindex', 0).attr('role', 'img').attr('data-event-id', (d) => d.id)
    .attr('aria-label', (d) => `${formatDate(d.date)}, ${d.country}, ${d.category}: ${d.event}`);
  groups.append('rect').attr('class', 'rb-hit').attr('x', 0).attr('y', 0).attr('width', width);
  groups.append('circle').attr('class', 'event-dot').attr('cx', lineX).attr('cy', 13).attr('r', 5)
    .attr('fill', (d) => COUNTRY_COLORS[d.country]);
  groups.append('text').attr('class', 'event-text').attr('x', margin.left).attr('y', 17)
    .text((d) => d.event).call(wrap, Math.max(40, width - margin.left - margin.right));
  let nextY = margin.top;
  groups.each(function place(d) {
    const group = d3.select(this);
    const textHeight = group.select('text.event-text').node().getBBox().height;
    const metadataY = 20 + textHeight;
    const rowHeight = Math.max(64, metadataY + 20);
    group.attr('transform', `translate(0,${nextY})`);
    group.select('.rb-hit').attr('height', rowHeight);
    group.append('text').attr('class', 'event-date').attr('x', margin.left).attr('y', metadataY)
      .text(`${shortDate(d.date)} · ${d.country} · ${d.category}`);
    nextY += rowHeight;
  });
  const height = Math.max(availablePlotHeight(plot), nextY + margin.bottom);
  plot.style.minHeight = `${height}px`;
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  line.attr('y2', Math.max(margin.top, nextY - 30));
  attachHover(groups);
}

function attachHover(groups) {
  function show(event, d) {
    const [px, py] = event.type.startsWith('focus')
      ? (() => { const r = event.currentTarget.getBoundingClientRect(); return [r.left + r.width / 2, r.top]; })()
      : [event.clientX, event.clientY];
    groups.classed('is-dim', (o) => o !== d);
    tooltip.show({ title: d.event, sub: `${formatDate(d.date)} · ${d.country}`, rows: [{ key: 'Theme', value: d.category }] }, px, py);
  }
  function hide() {
    groups.classed('is-dim', false);
    tooltip.hide();
  }
  groups.on('pointerenter', show).on('pointermove', (event) => tooltip.move(event.clientX, event.clientY))
    .on('pointerleave', hide).on('focus', show).on('blur', hide);
}

function viewTitle() {
  return `${TITLE}${category === 'All' ? '' : ` — ${category}`}`;
}

const actionView = renderActions(actions, {
  filename: 'togo_benin_timeline',
  title: viewTitle,
  source: SOURCE_LINE,
  plot,
  getSvg: () => svg.node(),
  buildTable: () => buildTable([
    { key: 'date', label: 'Date', format: formatDate },
    { key: 'event', label: 'Event' },
    { key: 'country', label: 'Country' },
    { key: 'category', label: 'Theme' },
  ], visibleEvents(), `${viewTitle()}. ${SOURCE_LINE}`),
});

document.addEventListener('rb:prepare-export', () => { svg.selectAll('*').interrupt(); firstDraw = false; draw(); });
onResize(plot, draw);
