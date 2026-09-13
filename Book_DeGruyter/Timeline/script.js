// Interactive timeline of the Book_DeGruyter events (data.json).
// Desktop: a horizontal axis with Benin above and Togo below, labels
// staggered in lanes. Phones: one vertical column, to scale where the
// dates allow and pushed apart where they crowd.
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import {
  COUNTRY_COLORS, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderSegmented, renderActions,
  buildTable, onResize, showEmpty, prefersReducedMotion,
} from '../../assets/remoboko.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const filterBox = document.getElementById('filter');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const tooltip = createTooltip();
const TITLE = 'Religion, education and politics in Togo and Benin, 1960–2010';
const CATEGORIES = ['Religion', 'Education', 'Politics'];

let events = [];
let category = 'All';

try {
  const data = await loadJSON('data.json');
  const parse = d3.timeParse('%Y-%m-%d');
  events = data.map((d, i) => ({ ...d, id: i, date: parse(d.date) })).sort((a, b) => a.date - b.date);
  const [min, max] = d3.extent(events, (d) => d.date);
  const byCountry = d3.rollup(events, (v) => v.length, (d) => d.country);
  desc.textContent = `${events.length} events from the book, ${min.getFullYear()}–${max.getFullYear()}: Benin (${byCountry.get('Benin')}) above the axis, Togo (${byCountry.get('Togo')}) below.`;
  plot.setAttribute('role', 'img');
  plot.setAttribute('aria-label', `Timeline of ${events.length} events in Togo and Benin between ${min.getFullYear()} and ${max.getFullYear()}.`);
} catch (err) {
  showEmpty(plot, 'The timeline data could not be loaded.');
  throw err;
}

renderLegend(legendBox, ['Benin', 'Togo'].map((c) => ({ id: c, label: c, color: COUNTRY_COLORS[c], count: events.filter((e) => e.country === c).length })), { shape: 'dot' });
renderSegmented(filterBox, [{ id: 'All', label: 'All themes' }].concat(CATEGORIES.map((c) => ({ id: c, label: c }))), {
  value: category,
  label: 'Theme',
  onChange: (id) => { category = id; draw(); },
});

const svg = d3.select(plot).append('svg').attr('aria-hidden', 'true');
const formatDate = d3.timeFormat('%-d %B %Y');
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
  svg.selectAll('*').remove();
  const data = visibleEvents();
  if (width < 640) drawVertical(data, width); else drawHorizontal(data, width);
  firstDraw = false;
}

function drawHorizontal(data, width) {
  const laneCount = 5;
  const laneStep = 38;   // room for a three-line label inside its own lane
  const laneBase = 22;
  const margin = { top: 14, right: 60, bottom: 14, left: 60 };
  const height = Math.max(plot.clientHeight, margin.top + margin.bottom + 2 * (laneBase + laneCount * laneStep) + 8);
  plot.style.minHeight = `${height}px`;
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

  const x = d3.scaleTime().domain(d3.extent(events, (d) => d.date)).nice(d3.timeYear.every(5)).range([margin.left, width - margin.right]);
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
    .attr('tabindex', 0).attr('role', 'img')
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
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)).tickSize(0).tickPadding(6).tickFormat(d3.timeFormat('%Y')));
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
  // A list, not a scale: one row per event keeps the column compact on a phone
  const rowMin = 46;
  const margin = { top: 16, right: 12, bottom: 16, left: 64 };
  const positions = data.map((d, i) => margin.top + rowMin / 2 + i * rowMin);
  const height = Math.max(plot.clientHeight, margin.top + margin.bottom + data.length * rowMin);
  plot.style.minHeight = `${height}px`;
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  const lineX = margin.left - 18;

  svg.append('line').attr('class', 'rb-grid').attr('x1', lineX).attr('x2', lineX).attr('y1', margin.top).attr('y2', height - margin.bottom).attr('stroke', 'var(--rb-axis)');

  const groups = svg.append('g').selectAll('g.event').data(data, (d) => d.id).join('g')
    .attr('class', 'event')
    .attr('transform', (d, i) => `translate(0,${positions[i]})`)
    .attr('tabindex', 0).attr('role', 'img')
    .attr('aria-label', (d) => `${formatDate(d.date)}, ${d.country}, ${d.category}: ${d.event}`);

  groups.append('rect').attr('class', 'rb-hit').attr('x', 0).attr('y', -rowMin / 2).attr('width', width).attr('height', rowMin);
  groups.append('text').attr('class', 'event-date').attr('x', lineX - 10).attr('y', 0).attr('dy', '0.35em').attr('text-anchor', 'end').text((d) => d.date.getFullYear());
  groups.append('circle').attr('class', 'event-dot').attr('cx', lineX).attr('r', 5).attr('fill', (d) => COUNTRY_COLORS[d.country] || '#888');
  groups.append('text').attr('class', 'event-text').attr('x', margin.left).attr('y', 0).attr('dy', '0.35em').text((d) => d.event)
    .call(wrap, width - margin.left - margin.right);
  groups.select('text.event-text').each(function centre() {
    const lines = d3.select(this).selectAll('tspan').size();
    d3.select(this).attr('transform', `translate(0,${-(lines - 1) * 6.9})`);
  });

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

renderActions(actions, {
  filename: 'togo_benin_timeline',
  title: TITLE,
  source: SOURCE_LINE,
  plot,
  getSvg: () => svg.node(),
  buildTable: () => buildTable([
    { key: 'date', label: 'Date', format: formatDate },
    { key: 'event', label: 'Event' },
    { key: 'country', label: 'Country' },
    { key: 'category', label: 'Theme' },
  ], visibleEvents(), `${TITLE}. ${SOURCE_LINE}`),
});

onResize(plot, draw);
