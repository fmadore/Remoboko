// Publications and activities treemap: Type > Language > Year, zoomable by
// click with a breadcrumb, colour by type (seven named types plus "Other").
import * as d3 from '../assets/d3.js';
import {
  CATEGORICAL, OTHER_COLOR, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderActions,
  buildTable, showEmpty, formatCount, formatPct, el, availablePlotHeight, updateQueryState,
} from '../assets/remoboko.js';
import { createChart, bindTooltip } from '../assets/chart.js';
import { normalizePublications, outputSeries, readableInk } from '../assets/data.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const crumbs = document.getElementById('crumbs');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const notes = document.getElementById('notes');
const tooltip = createTooltip();
const TITLE = 'Publications and activities by type and language';
const LEVELS = ['type', 'language', 'year'];
const ZOOM_MS = 450;

let root;            // d3 hierarchy
let current;         // node currently zoomed to
let colorOfType = new Map();
let records;
let zoomOrigin = null; // the clicked cell's rectangle while a zoom animates

try {
  const normalized = normalizePublications(await loadJSON('Data/Publications_and_activities_data.json'));
  records = normalized.records;
  const skipped = normalized.issues.length;
  if (!records.length) throw new Error('No valid dated outputs are available.');

  // The same seven named types and grey "Other" as the activities chart.
  const series = outputSeries(records, CATEGORICAL, OTHER_COLOR);
  colorOfType = new Map(series.flatMap((s) => s.types.map((type) => [type, s.color])));
  const other = series.find((s) => s.id === 'other');

  root = d3.hierarchy(
    { name: 'All outputs', children: nest(records, LEVELS) },
    (d) => d.children,
  ).sum((d) => d.value || 0).sort((a, b) => b.value - a.value);
  current = root;
  try {
    const path = JSON.parse(new URLSearchParams(window.location.search).get('path') || '[]');
    if (Array.isArray(path)) {
      for (const name of path.slice(0, 2)) {
        const child = current.children?.find((node) => node.data.name === name && node.children);
        if (!child) break;
        current = child;
      }
    }
  } catch { /* Ignore malformed optional view state. */ }

  const langs = d3.rollups(records, (v) => v.length, (d) => d.language).sort((a, b) => d3.descending(a[1], b[1]));
  desc.textContent = `The project's ${formatCount(records.length)} outputs, sized by count: ${series[0].label.toLowerCase()}s lead with ${formatCount(series[0].count)}, `
    + `and ${langs.map(([l, c]) => `${formatCount(c)} are in ${l}`).join(', ')}. Click a type to break it down by language, then by year.`;
  if (skipped) notes.textContent += ` ${skipped} incomplete ${skipped === 1 ? 'record is' : 'records are'} not shown.`;
  if (other) notes.textContent += ` Grey cells: ${other.typeCounts.map(([t, c]) => `${t} (${c})`).join(', ')}.`;

  renderLegend(legendBox, series.map((s) => ({ id: s.id, label: s.label, color: s.color, count: s.count })));

  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', `Treemap of ${records.length} outputs by type, language and year.`);
} catch (err) {
  showEmpty(plot, records?.length === 0 ? 'No valid dated outputs are available.' : 'The publications data could not be loaded.');
  throw err;
}

function nest(rows, keys) {
  if (!keys.length) return undefined;
  const [key, ...rest] = keys;
  return d3.groups(rows, (d) => d[key]).map(([name, group]) => (
    rest.length
      ? { name, level: key, children: nest(group, rest) }
      : { name, level: key, value: group.length }
  ));
}

const chart = createChart(d3.select(plot).append('svg'));
const { svg } = chart;

function typeOf(node) {
  let n = node;
  while (n.depth > 1) n = n.parent;
  return n.depth === 1 ? n.data.name : null;
}

function draw() {
  const width = plot.clientWidth;
  const height = Math.max(280, availablePlotHeight(plot));
  plot.style.minHeight = '280px';
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

  // Lay out the current node's children only, so zooming re-tiles the whole area.
  const layoutRoot = d3.hierarchy(current.data, (d) => d.children).sum((d) => d.value || 0).sort((a, b) => b.value - a.value);
  d3.treemap().size([width, height]).paddingInner(2).paddingOuter(0).round(true)(layoutRoot);
  const leaves = layoutRoot.children || [];
  const total = layoutRoot.value;
  const baseType = current.depth >= 1 ? typeOf(current) : null;

  // Ordinal lightness steps within one type once zoomed in (language, year)
  const fillFor = (d, i) => {
    const hue = d3.color(baseType ? colorOfType.get(baseType) : colorOfType.get(d.data.name));
    if (!baseType) return hue.formatHex();
    const steps = leaves.length;
    const t = steps > 1 ? i / (steps - 1) : 0;
    return d3.color(d3.interpolateLab(hue, '#ffffff')(0.55 * t)).formatHex();
  };

  const cells = svg.selectAll('g.cell').data(leaves, (d) => d.data.name);
  cells.exit().remove();
  const enter = cells.enter().append('g').attr('class', 'cell').attr('tabindex', 0);
  enter.append('rect');
  enter.append('text').attr('class', 'name');
  enter.append('text').attr('class', 'count');
  const all = enter.merge(cells).order();

  // Only zooming animates: new cells grow out of the clicked cell (or fade in
  // when zooming out) and their labels appear once the cells have settled.
  const animate = Boolean(zoomOrigin) && chart.motion;
  const transition = animate ? d3.transition().duration(ZOOM_MS).ease(d3.easeExpOut) : null;

  all.attr('role', (d) => d.children ? 'button' : 'img').attr('data-key', (d) => d.data.name);
  all.attr('aria-label', (d) => `${d.data.name}: ${d.value} (${formatPct(d.value / total)})`);
  const rects = all.select('rect').attr('fill', fillFor);
  const place = (selection) => selection
    .attr('x', (d) => d.x0).attr('y', (d) => d.y0)
    .attr('width', (d) => Math.max(0, d.x1 - d.x0)).attr('height', (d) => Math.max(0, d.y1 - d.y0));
  if (animate) {
    const origin = zoomOrigin.rect;
    if (origin) {
      rects.attr('x', origin.x).attr('y', origin.y).attr('width', origin.width).attr('height', origin.height);
    } else {
      place(rects);
      all.attr('opacity', 0).transition(transition).attr('opacity', 1);
    }
    place(rects.transition(transition));
  } else {
    place(rects);
    all.attr('opacity', null);
  }

  // Labels only when they fit with padding; ink chosen by the fill's luminance.
  all.each(function labelCell(d, i) {
    const g = d3.select(this);
    const w = d.x1 - d.x0;
    const h = d.y1 - d.y0;
    const fill = d3.color(fillFor(d, i));
    const ink = readableInk(fill.formatHex());
    const name = g.select('text.name').attr('fill', ink).text(d.data.name);
    name.selectAll('tspan').remove();
    const count = g.select('text.count').text(formatCount(d.value)).attr('fill', ink);
    const nameW = name.node().getComputedTextLength();
    const countW = count.node().getComputedTextLength();
    let nameLines = 0;
    if (w >= nameW + 16 && h >= 22) {
      nameLines = 1;
    } else if (h >= 38) {
      // Try two lines, breaking at a space or slash
      const parts = d.data.name.split(/(?<=[ /])/);
      for (let k = 1; k < parts.length && !nameLines; k += 1) {
        const a = parts.slice(0, k).join('').trim();
        const b = parts.slice(k).join('').trim();
        name.text(null);
        name.append('tspan').attr('x', d.x0 + 8).text(a);
        const second = name.append('tspan').attr('x', d.x0 + 8).attr('dy', '1.15em').text(b);
        const wa = name.node().firstChild.getComputedTextLength();
        const wb = second.node().getComputedTextLength();
        if (Math.max(wa, wb) + 16 <= w) nameLines = 2;
      }
      if (!nameLines) { name.selectAll('tspan').remove(); name.text(d.data.name); }
    }
    const countY = nameLines ? d.y0 + 17 + nameLines * 15 : d.y0 + 17;
    const fitsCount = w >= countW + 16 && h >= countY - d.y0 + 6;
    name.attr('x', d.x0 + 8).attr('y', d.y0 + 17);
    name.selectAll('tspan').attr('x', d.x0 + 8);
    count.attr('x', d.x0 + 8).attr('y', countY);
    for (const [label, visible] of [[name, nameLines > 0], [count, fitsCount]]) {
      if (animate && visible) label.attr('opacity', 0).transition().delay(ZOOM_MS * 0.6).duration(200).attr('opacity', 1);
      else label.attr('opacity', visible ? 1 : 0);
    }
  });

  function content(d) {
    const rows = d.children
      ? d.children.slice().sort((a, b) => b.value - a.value).slice(0, 6).map((c) => ({ key: c.data.name, value: formatCount(c.value) }))
      : [];
    const parentLabel = current === root ? 'of all outputs' : `of ${current.data.name}`;
    return {
      title: d.data.name,
      sub: `${formatCount(d.value)} ${d.value === 1 ? 'output' : 'outputs'} · ${formatPct(d.value / total)} ${parentLabel}`,
      rows,
      note: d.children ? (d.children.length > 6 ? `and ${d.children.length - 6} more` : 'Click to zoom in') : null,
    };
  }
  bindTooltip(all, tooltip, {
    content,
    highlight: (d) => all.classed('is-dim', (o) => d !== null && o !== d),
    anchor: (box) => [box.left + 20, box.top + 20],
  });
  all.on('click', (event, d) => { if (d.children) zoomTo(findNode(current, d.data.name), event.currentTarget); })
    .on('keydown', (event, d) => {
      if ((event.key === 'Enter' || event.key === ' ') && d.children) {
        event.preventDefault();
        zoomTo(findNode(current, d.data.name), event.currentTarget);
      }
    });

  renderCrumbs();
  plot.setAttribute('aria-label', `${viewTitle()}. ${total} outputs; ${leaves.length} ${LEVELS[current.depth]} groups.`);
}

function findNode(parent, name) {
  return parent.children.find((c) => c.data.name === name);
}

/** Zoom to a node; `cell` is the clicked cell when zooming in. */
function zoomTo(node, cell = null) {
  current = node;
  tooltip.hide();
  updateQueryState({ path: current === root ? null : JSON.stringify(current.ancestors().reverse().slice(1).map((item) => item.data.name)) });
  const rect = cell?.querySelector('rect');
  zoomOrigin = { rect: rect && { x: rect.getAttribute('x'), y: rect.getAttribute('y'), width: rect.getAttribute('width'), height: rect.getAttribute('height') } };
  svg.selectAll('g.cell').remove(); // Every cell belongs to the new level.
  try { chart.render(); } finally { zoomOrigin = null; }
  svg.select('g.cell').node()?.focus();
}

function viewTitle() {
  return `${TITLE}${current === root ? '' : ` — ${current.ancestors().reverse().slice(1).map((node) => node.data.name).join(' / ')}`}`;
}

function renderCrumbs() {
  const focusedLabel = crumbs.contains(document.activeElement) ? document.activeElement.textContent : null;
  const path = current.ancestors().reverse();
  crumbs.replaceChildren(...path.map((node, i) => {
    const last = i === path.length - 1;
    const label = node === root ? 'All outputs' : node.data.name;
    return el('li', { 'aria-current': last ? 'true' : null }, last ? label : el('button', { type: 'button', onclick: () => zoomTo(node) }, label));
  }));
  if (focusedLabel) Array.from(crumbs.querySelectorAll('button')).find((button) => button.textContent === focusedLabel)?.focus();
}

const actionView = renderActions(actions, {
  filename: 'publications_treemap',
  title: viewTitle,
  source: SOURCE_LINE,
  plot,
  getSvg: chart.node,
  buildTable: () => {
    const rows = (current.children || []).map((node) => ({
      name: node.data.name, count: node.value, share: node.value / current.value,
    }));
    const level = LEVELS[current.depth];
    return buildTable([
      { key: 'name', label: level.charAt(0).toUpperCase() + level.slice(1) },
      { key: 'count', label: 'Outputs', numeric: true, format: formatCount },
      { key: 'share', label: 'Share of selection', numeric: true, format: formatPct },
    ], rows, `${viewTitle()}. ${SOURCE_LINE}`);
  },
});

chart.start(draw, { after: actionView.refresh });
