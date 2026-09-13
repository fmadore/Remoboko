// Publications and activities treemap: Type > Language > Year, zoomable by
// click with a breadcrumb, colour by type (seven named types plus "Other").
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import {
  CATEGORICAL, OTHER_COLOR, SOURCE_LINE, loadJSON, createTooltip, renderLegend, renderActions,
  buildTable, onResize, showEmpty, formatCount, formatPct, el, prefersReducedMotion,
} from '../assets/remoboko.js';

const plot = document.getElementById('plot');
const legendBox = document.getElementById('legend');
const crumbs = document.getElementById('crumbs');
const actions = document.getElementById('actions');
const desc = document.getElementById('desc');
const notes = document.getElementById('notes');
const tooltip = createTooltip();
const TITLE = 'Publications and activities by type and language';
const MAX_NAMED = 7;
const LEVELS = ['type', 'language', 'year'];

let root;            // d3 hierarchy
let current;         // node currently zoomed to
let colorOfType = new Map();
let labelOfType = new Map();
let records = [];

try {
  const data = await loadJSON('Data/Publications_and_activities_data.json');
  const skipped = data.rows.filter((r) => !(r.Type && r.Language && r.Date)).length;
  records = data.rows.filter((r) => r.Type && r.Language && r.Date)
    .map((r) => ({ type: r.Type, language: r.Language, year: r.Date.slice(0, 4) }));

  const byType = d3.rollups(records, (v) => v.length, (d) => d.type)
    .sort((a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0]));
  byType.forEach(([type], i) => {
    colorOfType.set(type, i < MAX_NAMED ? CATEGORICAL[i] : OTHER_COLOR);
    labelOfType.set(type, type);
  });
  const folded = byType.slice(MAX_NAMED);

  root = d3.hierarchy(
    { name: 'All outputs', children: nest(records, LEVELS) },
    (d) => d.children,
  ).sum((d) => d.value || 0).sort((a, b) => b.value - a.value);
  current = root;

  const langs = d3.rollups(records, (v) => v.length, (d) => d.language).sort((a, b) => d3.descending(a[1], b[1]));
  desc.textContent = `The project's ${formatCount(records.length)} outputs, sized by count: ${byType[0][0].toLowerCase()}s lead with ${formatCount(byType[0][1])}, `
    + `and ${langs.map(([l, c]) => `${formatCount(c)} are in ${l}`).join(', ')}. Click a type to break it down by language, then by year.`;
  if (skipped) notes.textContent += ` ${skipped} incomplete ${skipped === 1 ? 'record is' : 'records are'} not shown.`;
  if (folded.length) notes.textContent += ` Grey cells: ${folded.map(([t, c]) => `${t} (${c})`).join(', ')}.`;

  renderLegend(legendBox, byType.slice(0, MAX_NAMED).map(([type, count]) => ({ id: type, label: type, color: colorOfType.get(type), count }))
    .concat(folded.length ? [{ id: 'Other', label: `Other (${folded.length} types)`, color: OTHER_COLOR, count: d3.sum(folded, ([, c]) => c) }] : []));

  plot.setAttribute('role', 'img');
  plot.setAttribute('aria-label', `Treemap of ${records.length} outputs by type, language and year.`);
} catch (err) {
  showEmpty(plot, 'The publications data could not be loaded.');
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

const svg = d3.select(plot).append('svg').attr('aria-hidden', 'true');
let firstDraw = true;

function typeOf(node) {
  let n = node;
  while (n.depth > 1) n = n.parent;
  return n.depth === 1 ? n.data.name : null;
}

function draw() {
  const width = plot.clientWidth;
  const height = Math.max(280, plot.clientHeight);
  if (!width) return;
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
  const enter = cells.enter().append('g').attr('class', 'cell')
    .attr('tabindex', 0).attr('role', current.children?.[0]?.children ? 'button' : 'img');
  enter.append('rect');
  enter.append('text').attr('class', 'name');
  enter.append('text').attr('class', 'count');
  cells.exit().remove();
  const all = enter.merge(cells);

  const animate = !prefersReducedMotion() && !firstDraw;
  const t = animate ? d3.transition().duration(450).ease(d3.easeExpOut) : null;

  all.attr('aria-label', (d) => `${d.data.name}: ${d.value} (${formatPct(d.value / total)})`);
  const rects = all.select('rect').attr('fill', fillFor);
  (animate ? rects.transition(t) : rects)
    .attr('x', (d) => d.x0).attr('y', (d) => d.y0)
    .attr('width', (d) => Math.max(0, d.x1 - d.x0)).attr('height', (d) => Math.max(0, d.y1 - d.y0));

  // Labels only when they fit with padding; ink chosen by the fill's luminance.
  all.each(function labelCell(d, i) {
    const g = d3.select(this);
    const w = d.x1 - d.x0;
    const h = d.y1 - d.y0;
    const fill = d3.color(fillFor(d, i));
    const dark = d3.hsl(fill).l < 0.62;
    const ink = dark ? '#ffffff' : '#1b1b1b';
    const name = g.select('text.name').attr('fill', ink).text(d.data.name);
    name.selectAll('tspan').remove();
    const count = g.select('text.count').text(formatCount(d.value)).attr('fill', ink).attr('opacity', dark ? 0.85 : 0.75);
    const nameW = name.node().getComputedTextLength();
    const countW = count.node().getComputedTextLength();
    let nameLines = 0;
    if (w >= nameW + 16 && h >= 22) {
      nameLines = 1;
    } else if (h >= 38) {
      // Try two lines, breaking at a space or slash
      const parts = d.data.name.split(/(?<=[ /])/);
      for (let i = 1; i < parts.length && !nameLines; i += 1) {
        const a = parts.slice(0, i).join('').trim();
        const b = parts.slice(i).join('').trim();
        name.text(null);
        name.append('tspan').attr('x', d.x0 + 8).text(a);
        const t2 = name.append('tspan').attr('x', d.x0 + 8).attr('dy', '1.15em').text(b);
        const wa = name.node().firstChild.getComputedTextLength();
        const wb = t2.node().getComputedTextLength();
        if (Math.max(wa, wb) + 16 <= w) nameLines = 2;
      }
      if (!nameLines) { name.selectAll('tspan').remove(); name.text(d.data.name); }
    }
    const countY = nameLines ? d.y0 + 17 + nameLines * 15 : d.y0 + 17;
    const fitsCount = w >= countW + 16 && h >= countY - d.y0 + 6;
    name.attr('opacity', nameLines ? 1 : 0).attr('x', d.x0 + 8).attr('y', d.y0 + 17);
    name.selectAll('tspan').attr('x', d.x0 + 8);
    count.attr('opacity', fitsCount ? 1 : 0).attr('x', d.x0 + 8).attr('y', countY);
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
  all.on('pointerenter', (event, d) => { all.classed('is-dim', (o) => o !== d); tooltip.show(content(d), event.clientX, event.clientY); })
    .on('pointermove', (event) => tooltip.move(event.clientX, event.clientY))
    .on('pointerleave', () => { all.classed('is-dim', false); tooltip.hide(); })
    .on('focus', (event, d) => { const r = event.target.getBoundingClientRect(); tooltip.show(content(d), r.left + 20, r.top + 20); })
    .on('blur', () => tooltip.hide())
    .on('click', (event, d) => { if (d.children) zoomTo(findNode(current, d.data.name)); })
    .on('keydown', (event, d) => { if ((event.key === 'Enter' || event.key === ' ') && d.children) { event.preventDefault(); zoomTo(findNode(current, d.data.name)); } });

  firstDraw = false;
  renderCrumbs();
}

function findNode(parent, name) {
  return parent.children.find((c) => c.data.name === name);
}

function zoomTo(node) {
  current = node;
  tooltip.hide();
  draw();
}

function renderCrumbs() {
  const path = current.ancestors().reverse();
  crumbs.replaceChildren(...path.map((node, i) => {
    const last = i === path.length - 1;
    const label = node === root ? 'All outputs' : node.data.name;
    return el('li', { 'aria-current': last ? 'true' : null }, last ? label : el('button', { type: 'button', onclick: () => zoomTo(node) }, label));
  }));
}

renderActions(actions, {
  filename: 'publications_treemap',
  title: TITLE,
  source: SOURCE_LINE,
  plot,
  getSvg: () => svg.node(),
  buildTable: () => {
    const langs = Array.from(new Set(records.map((r) => r.language))).sort();
    const rows = d3.rollups(records, (v) => v, (d) => d.type)
      .map(([type, group]) => {
        const row = { type, total: group.length };
        for (const l of langs) row[l] = group.filter((r) => r.language === l).length;
        return row;
      })
      .sort((a, b) => d3.descending(a.total, b.total));
    const cols = [{ key: 'type', label: 'Type' }]
      .concat(langs.map((l) => ({ key: l, label: l, numeric: true, format: formatCount })))
      .concat([{ key: 'total', label: 'Total', numeric: true, format: formatCount }]);
    return buildTable(cols, rows, `${TITLE}. ${SOURCE_LINE}`);
  },
});

onResize(plot, draw);
