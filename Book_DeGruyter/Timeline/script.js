// Interactive timeline of the Book_DeGruyter events (data.json).
// Desktop: a horizontal axis with Benin above and Togo below, labels
// staggered in lanes. Phones: one vertical column, to scale where the
// dates allow and pushed apart where they crowd.
import * as d3 from '../../assets/d3.js';
import {
  COUNTRY_COLORS, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderSegmented, renderActions,
  buildTable, showEmpty, availablePlotHeight, updateQueryState,
} from '../../assets/remoboko.js';
import { createChart, bindTooltip } from '../../assets/chart.js';
import { normalizeTimeline } from '../../assets/data.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const filterBox = document.getElementById('filter');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const tooltip = createTooltip();
const TITLE = 'Religion, education and politics in Togo and Benin, 1960–2010';
const CATEGORIES = ['Religion', 'Education', 'Politics'];
const LABEL_LEADING = 1.1; // em; three wrapped lines fit one 38px lane

let events = [];
let years = '';
const initialCategory = new URLSearchParams(window.location.search).get('theme');
let category = CATEGORIES.includes(initialCategory) ? initialCategory : 'All';

try {
  events = normalizeTimeline(await loadJSON('data.json'));
  if (!events.length) throw new Error('The timeline dataset is empty.');
  const [min, max] = d3.extent(events, (d) => d.date);
  years = `${min.getUTCFullYear()}–${max.getUTCFullYear()}`;
  const byCountry = d3.rollup(events, (v) => v.length, (d) => d.country);
  desc.textContent = `${events.length} events from the book, ${years}: Benin (${byCountry.get('Benin')}) above the axis, Togo (${byCountry.get('Togo')}) below.`;
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `Timeline of ${events.length} events in Togo and Benin between ${min.getUTCFullYear()} and ${max.getUTCFullYear()}.`);
} catch (err) {
  showEmpty(plot, 'The timeline data could not be loaded.');
  throw err;
}

const chart = createChart(d3.select(plot).append('svg'));
const { svg } = chart;

renderLegend(legendBox, ['Benin', 'Togo'].map((c) => ({ id: c, label: c, color: COUNTRY_COLORS[c], count: events.filter((e) => e.country === c).length })), { shape: 'dot' });
renderSegmented(filterBox, [{ id: 'All', label: 'All themes' }].concat(CATEGORIES.map((c) => ({ id: c, label: c }))), {
  value: category,
  label: 'Theme',
  onChange: (id) => { category = id; updateQueryState({ theme: id === 'All' ? null : id }); chart.render(); },
});

const formatDate = d3.utcFormat('%-d %B %Y');
const shortDate = d3.utcFormat('%-d %b %Y');

function visibleEvents() {
  return category === 'All' ? events : events.filter((e) => e.category === category);
}

/** Five-year ticks; the spine ends at the last event, as in the print timeline. */
function timeDomain() {
  const [min, max] = d3.extent(events, (d) => d.date);
  const start = new Date(Date.UTC(Math.floor(min.getUTCFullYear() / 5) * 5, 0, 1));
  const tick = new Date(Date.UTC(Math.ceil(max.getUTCFullYear() / 5) * 5, 0, 1));
  return [start, tick > max ? tick : max];
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
        tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', `${lineNumber * LABEL_LEADING}em`).text(word);
      }
      word = words.pop();
    }
  });
}

function draw() {
  const width = plot.clientWidth;
  svg.selectAll('*').remove();
  const data = visibleEvents();
  if (width < 640) drawVertical(data, width); else drawHorizontal(data, width);
  desc.textContent = `${data.length} ${category === 'All' ? '' : `${category.toLowerCase()} `}events from the book, ${years}. ${width < 640 ? 'Chronological list with country and date; spacing does not represent elapsed time.' : 'Benin above the axis, Togo below.'}`;
  plot.setAttribute('aria-label', `${viewTitle()}. ${data.length} events.`);
}

function drawHorizontal(data, width) {
  const minLanes = 5;
  const laneStep = 38;   // room for a two-line label inside its own lane
  const laneBase = 22;
  const labelWidth = Math.min(124, Math.max(96, (width - 120) / 8.5));
  // The spine ends at the last event, so the right margin holds half a label.
  const margin = { top: 14, right: Math.ceil(labelWidth / 2) + 4, bottom: 14, left: 60 };
  const height = Math.max(availablePlotHeight(plot), margin.top + margin.bottom + 2 * (laneBase + minLanes * laneStep) + 8);
  plot.style.minHeight = `${height}px`;
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

  const x = d3.scaleUtc().domain(timeDomain()).range([margin.left, width - margin.right]);
  const axisY = height / 2;
  // Taller embeds get more lanes, up to eight per side, and so fewer crowded labels.
  const laneCount = Math.max(minLanes, Math.min(8, Math.floor((axisY - margin.top - laneBase - 52) / laneStep) + 1));
  const minLabelGap = labelWidth + 6;
  const neighbourGap = 44;

  // Country names head the two sides of the axis, left of its first year.
  svg.append('text').attr('class', 'axis-label').attr('x', 0).attr('y', axisY - 10).text('Benin');
  svg.append('text').attr('class', 'axis-label').attr('x', 0).attr('y', axisY + 19).text('Togo');

  const eventsLayer = svg.append('g');

  // Lane assignment per side. A label of three or more lines reaches into
  // the next lane outwards, so that lane must be clear for a full label width.
  const emptyLane = () => ({ x: -Infinity, lines: 1 });
  const laneLast = { Benin: Array.from({ length: laneCount }, emptyLane), Togo: Array.from({ length: laneCount }, emptyLane) };
  function assignLane(country, xPos, lines) {
    const lanes = laneLast[country];
    const dist = (i) => (i < 0 || i >= lanes.length ? Infinity : xPos - lanes[i].x);
    const tall = (count) => count >= 3;
    // Room left in lane i: its own label gap and both neighbours' clearances.
    const slack = (i) => Math.min(dist(i) - minLabelGap,
      dist(i - 1) - (tall(lanes[i - 1]?.lines) ? minLabelGap : neighbourGap),
      dist(i + 1) - (tall(lines) ? minLabelGap : neighbourGap));
    // Overlapping area if lane i is used: a shared lane overlaps by a full
    // label height, a tall neighbour's reach by a few pixels.
    const short = (i) => Math.max(0, minLabelGap - dist(i));
    const cost = (i) => short(i) * 30 + (tall(lanes[i - 1]?.lines) ? short(i - 1) * 6 : 0) + (tall(lines) ? short(i + 1) * 6 : 0);
    // Prefer the innermost clear lane, so labels step diagonally; when crowded, overlap the least.
    let lane = lanes.findIndex((last, i) => slack(i) >= 0);
    if (lane === -1) lane = lanes.reduce((best, last, i) => (cost(i) < cost(best) ? i : best), 0);
    lanes[lane] = { x: xPos, lines };
    return lane;
  }

  const groups = eventsLayer.selectAll('g.event').data(data, (d) => d.id).join('g')
    .attr('class', 'event')
    .attr('transform', (d) => `translate(${x(d.date)},${axisY})`)
    .attr('tabindex', 0).attr('role', 'img').attr('data-key', (d) => d.id)
    .attr('aria-label', (d) => `${formatDate(d.date)}, ${d.country}, ${d.category}: ${d.event}`);

  // Leader lines sit beneath every label, so a crowded decade never strikes through text.
  const leaders = eventsLayer.insert('g', ':first-child');
  const plates = eventsLayer.insert('g', 'g.event');
  groups.each(function drawEvent(d) {
    const g = d3.select(this);
    const side = d.country === 'Benin' ? -1 : 1;
    const color = COUNTRY_COLORS[d.country] || '#888';
    // Dots sit just off the line on their country's side, so same-year events never overprint
    g.append('circle').attr('class', 'event-dot').attr('cy', side * 4).attr('r', 4.5).attr('fill', color);
    g.append('circle').attr('class', 'rb-hit').attr('cy', side * 4).attr('r', 14);
    const text = g.append('text').attr('class', 'event-text').attr('text-anchor', 'middle').text(d.event).call(wrap, labelWidth);
    const lines = text.selectAll('tspan').size();
    const lane = assignLane(d.country, x(d.date), lines);
    const labelY = side * (laneBase + lane * laneStep);
    text.attr('y', labelY + (side < 0 ? -6 - 11 : 13)).selectAll('tspan').attr('y', labelY + (side < 0 ? -6 - 11 : 13));
    // Multi-line labels above the axis grow upwards: shift them so the last line sits by the leader
    const lineHeight = LABEL_LEADING * parseFloat(window.getComputedStyle(text.node()).fontSize);
    if (side < 0) text.attr('transform', `translate(0,${-(lines - 1) * lineHeight})`);
    // Paper plates, beneath every label, mask other events' leaders, including between words.
    const box = text.node().getBBox();
    plates.append('rect').attr('class', 'event-plate')
      .attr('transform', `translate(${x(d.date)},${axisY}) ${text.attr('transform') || ''}`)
      .attr('x', box.x - 2).attr('y', box.y).attr('width', box.width + 4).attr('height', box.height);
    leaders.append('line').attr('class', 'event-line').datum(d)
      .attr('transform', `translate(${x(d.date)},${axisY})`)
      .attr('y1', side * 4).attr('y2', labelY).attr('stroke', color).attr('stroke-opacity', 0.55);
  });

  // Axis drawn last: year labels sit just below the line on white plates, over any leader lines
  const axis = svg.append('g').attr('class', 'rb-axis').attr('transform', `translate(0,${axisY})`)
    .call(d3.axisBottom(x).ticks(d3.utcYear.every(5)).tickSize(0).tickPadding(6).tickFormat(d3.utcFormat('%Y')));
  axis.selectAll('.tick text').each(function plate() {
    const bbox = this.getBBox();
    d3.select(this.parentNode).insert('rect', 'text').attr('x', bbox.x - 4).attr('y', bbox.y - 1)
      .attr('width', bbox.width + 8).attr('height', bbox.height + 2).attr('fill', '#fff');
  });

  attachHover(groups, leaders.selectAll('line'));

  if (chart.entrance) {
    for (const layer of [groups, leaders.selectAll('line')]) {
      layer.attr('opacity', 0).transition().duration(500).delay((d, i) => i * 25).ease(d3.easeExpOut).attr('opacity', 1);
    }
  }
}

function drawVertical(data, width) {
  // A chronological list: measured rows keep long event names clear of their date/country.
  const margin = { top: 12, right: 8, bottom: 12, left: 30 };
  const lineX = 12;
  const line = svg.append('line').attr('class', 'event-spine')
    .attr('x1', lineX).attr('x2', lineX).attr('y1', margin.top);
  const groups = svg.append('g').selectAll('g.event').data(data, (d) => d.id).join('g')
    .attr('class', 'event').attr('tabindex', 0).attr('role', 'img').attr('data-key', (d) => d.id)
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

function attachHover(groups, leaders = null) {
  bindTooltip(groups, tooltip, {
    content: (d) => ({ title: d.event, sub: `${formatDate(d.date)} · ${d.country}`, rows: [{ key: 'Theme', value: d.category }] }),
    highlight: (d) => {
      groups.classed('is-dim', (o) => d !== null && o !== d);
      leaders?.classed('is-dim', (o) => d !== null && o !== d);
    },
  });
}

function viewTitle() {
  return `${TITLE}${category === 'All' ? '' : ` — ${category}`}`;
}

const actionView = renderActions(actions, {
  filename: 'togo_benin_timeline',
  title: viewTitle,
  source: SOURCE_LINE,
  plot,
  getSvg: chart.node,
  buildTable: () => buildTable([
    { key: 'date', label: 'Date', format: formatDate },
    { key: 'event', label: 'Event' },
    { key: 'country', label: 'Country' },
    { key: 'category', label: 'Theme' },
  ], visibleEvents(), `${viewTitle()}. ${SOURCE_LINE}`),
});

chart.start(draw, { after: actionView.refresh });
