// Publication exports are independent of chart libraries and page stylesheets.
import { FONT_FAMILY } from './tokens.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PRESENTATION = [
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-opacity', 'stroke-width',
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin',
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
  'font-variant-numeric', 'letter-spacing', 'word-spacing', 'text-anchor',
  'dominant-baseline', 'paint-order', 'shape-rendering', 'vector-effect',
  'opacity', 'display', 'color', 'clip-path',
];

// Properties that SVG descendants inherit; the others are written only when
// they differ from their initial value.
const NOT_INHERITED = { opacity: '1', display: 'inline', 'clip-path': 'none', 'vector-effect': 'none', 'dominant-baseline': 'auto' };
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap';
const FONT_TIMEOUT = 5000;

const svgElement = (name, attributes = {}) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
};

function parseUnicodeRange(value) {
  if (!value) return [[0, 0x10FFFF]];
  return value.split(',').map((part) => {
    const [start, end = start] = part.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(start.replace(/\?/g, '0'), 16), parseInt(end.replace(/\?/g, 'F'), 16)];
  }).filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end));
}

/**
 * One entry per font file in a font-service stylesheet. A variable font is
 * served once per requested weight from the same file; it is embedded once.
 */
export function fontFiles(css) {
  const files = new Map();
  for (const block of String(css || '').match(/@font-face\s*{[^}]*}/g) || []) {
    const url = block.match(/url\(['"]?(https:[^)'"\s]+)['"]?\)/)?.[1];
    if (!url) continue;
    const property = (name) => block.match(new RegExp(`${name}\\s*:\\s*([^;}]+)`))?.[1].trim();
    const weights = (property('font-weight') || '400').split(/\s+/).map(Number).filter(Number.isFinite);
    if (!files.has(url)) {
      const unicodeRange = property('unicode-range');
      files.set(url, {
        url, family: property('font-family'), style: property('font-style') || 'normal',
        unicodeRange, ranges: parseUnicodeRange(unicodeRange), weights: [],
      });
    }
    files.get(url).weights.push(...weights);
  }
  return [...files.values()].filter((file) => file.family && file.weights.length);
}

/** Files whose unicode-range covers at least one character of the exported text. */
export function fontFilesForText(files, text) {
  const codes = new Set([...String(text || '')].map((char) => char.codePointAt(0)));
  return files.filter((file) => [...codes].some((code) => file.ranges.some(([start, end]) => code >= start && code <= end)));
}

export function fontFaceRule(file, source) {
  const weight = `${Math.min(...file.weights)}${Math.max(...file.weights) > Math.min(...file.weights) ? ` ${Math.max(...file.weights)}` : ''}`;
  return `@font-face{font-family:${file.family};font-style:${file.style};font-weight:${weight};`
    + `src:url(${source}) format('woff2');${file.unicodeRange ? `unicode-range:${file.unicodeRange};` : ''}}`;
}

async function fetchBounded(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FONT_TIMEOUT);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Font resource unavailable: ${url}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

let fontFilesPromise;
const fontSources = new Map();

function fontSource(url) {
  if (!fontSources.has(url)) {
    const source = (async () => {
      const bytes = new Uint8Array(await (await fetchBounded(url)).arrayBuffer());
      const chunks = [];
      for (let i = 0; i < bytes.length; i += 32768) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
      return `data:font/woff2;base64,${btoa(chunks.join(''))}`;
    })();
    fontSources.set(url, source);
    source.catch(() => fontSources.delete(url));
  }
  return fontSources.get(url);
}

/** Embedded Source Sans 3 faces for the characters present in an export. */
async function fontFaceCss(text) {
  try {
    fontFilesPromise ||= fetchBounded(FONT_CSS_URL).then((response) => response.text()).then(fontFiles);
    const files = fontFilesForText(await fontFilesPromise, text);
    const sources = await Promise.all(files.map((file) => fontSource(file.url)));
    return files.map((file, index) => fontFaceRule(file, sources[index])).join('\n');
  } catch {
    // Retry on the next export; this one keeps the system-font fallback.
    fontFilesPromise = null;
    return '';
  }
}

async function waitForDocumentFonts() {
  if (!document.fonts?.ready) return;
  let timeout;
  try {
    await Promise.race([
      Promise.resolve(document.fonts.ready).catch(() => {}),
      new Promise((resolve) => { timeout = setTimeout(resolve, 5000); }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

/** Wrap metadata using measured glyph widths, including unbroken long words. */
export function wrapExportText(text, maxWidth, measure) {
  const lines = [];
  let line = '';
  for (const word of String(text || '').trim().split(/\s+/).filter(Boolean)) {
    if (line && measure(`${line} ${word}`) <= maxWidth) { line += ` ${word}`; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const char of word) {
      if (line && measure(line + char) > maxWidth) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function metadataLines(text, width, fontSize, weight) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`;
  return wrapExportText(text, width, (value) => ctx ? ctx.measureText(value).width : value.length * fontSize * 0.6);
}

function visibleLegend(svg) {
  const figure = svg.closest('.rb-figure');
  if (!figure) return [];
  return [...figure.querySelectorAll('.rb-legend .rb-key')]
    .filter((key) => key.getAttribute('aria-pressed') !== 'false' && !key.closest('[hidden]')
      && window.getComputedStyle(key).display !== 'none' && window.getComputedStyle(key).visibility !== 'hidden')
    .map((key) => {
      const swatch = key.querySelector('.rb-swatch');
      return {
        label: key.textContent.trim(),
        color: swatch ? window.getComputedStyle(swatch).getPropertyValue('--swatch').trim() || swatch.style.getPropertyValue('--swatch') : '',
        shape: swatch?.classList.contains('rb-swatch--dot') ? 'dot' : swatch?.classList.contains('rb-swatch--line') ? 'line' : 'square',
      };
    }).filter((item) => item.label && item.color);
}

/** Lay out legend items within the export width, wrapping long labels as needed. */
export function layoutExportLegend(items, width, measure) {
  const gap = 16;
  const lineHeight = 16;
  const labelInset = 18;
  const placed = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const item of items) {
    const lines = wrapExportText(item.label, Math.max(1, width - labelInset), measure);
    const itemWidth = Math.min(width, labelInset + Math.max(0, ...lines.map(measure)));
    const itemHeight = Math.max(lineHeight, lines.length * lineHeight);
    if (x && x + itemWidth > width) { y += rowHeight + 6; x = 0; rowHeight = 0; }
    placed.push({ ...item, lines, x, y });
    rowHeight = Math.max(rowHeight, itemHeight);
    x += itemWidth + gap;
  }
  return { items: placed, height: placed.length ? y + rowHeight : 0 };
}

function legendLayout(svg, width) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.font = `400 12px ${FONT_FAMILY}`;
  return layoutExportLegend(visibleLegend(svg), width, (value) => ctx ? ctx.measureText(value).width : value.length * 7.2);
}

function appendLegend(root, layout, x, y) {
  if (!layout.items.length) return;
  const group = svgElement('g', { class: 'rb-export-legend', role: 'group', 'aria-label': 'Legend' });
  for (const item of layout.items) {
    const left = x + item.x;
    const top = y + item.y;
    const swatch = item.shape === 'dot'
      ? svgElement('circle', { cx: left + 6, cy: top + 7, r: 5, fill: item.color })
      : svgElement('rect', { x: left, y: top + (item.shape === 'line' ? 5 : 1), width: 12, height: item.shape === 'line' ? 3 : 12, rx: item.shape === 'line' ? 0 : 2, fill: item.color });
    swatch.setAttribute('aria-hidden', 'true');
    group.append(swatch);
    appendLines(group, item.lines, { x: left + 18, y: top + 12, size: 12, leading: 16, weight: 400, fill: '#4a4a4a' });
  }
  root.append(group);
}

function appendLines(root, lines, { x, y, size, leading, weight, fill }) {
  if (!lines.length) return;
  const text = svgElement('text', { x, y, 'font-size': size, 'font-weight': weight, fill, 'font-family': FONT_FAMILY });
  for (const [index, line] of lines.entries()) {
    const span = svgElement('tspan', { x, dy: index ? leading : 0 });
    span.textContent = line;
    text.append(span);
  }
  root.append(text);
}

/** Snapshot resolved styles, including per-chart and active media-query rules. */
function styledClone(svg, width, height) {
  const clone = svg.cloneNode(true);
  clone.removeAttribute('style');
  clone.removeAttribute('aria-hidden');
  for (const node of [clone, ...clone.querySelectorAll('*')]) {
    node.classList.remove('is-dim');
    node.removeAttribute('tabindex');
    node.style?.removeProperty('transition');
    node.style?.removeProperty('animation');
  }
  clone.querySelectorAll('.rb-hit').forEach((node) => node.remove());
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  // Place the clone in the same CSS context, outside the viewport. The ancestor
  // opacity is not inherited, so presentation values remain the published ones.
  const stage = document.createElement('div');
  stage.className = svg.parentElement?.className || '';
  stage.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;height:${height}px;opacity:0;pointer-events:none;`;
  stage.append(clone);
  document.body.append(stage);
  try {
    const nodes = [clone, ...clone.querySelectorAll('*')];
    const values = new Map(nodes.map((node) => {
      const computed = window.getComputedStyle(node);
      return [node, Object.fromEntries(PRESENTATION.map((property) => [property, computed.getPropertyValue(property)]))];
    }));
    // The root carries every value; descendants only what they do not inherit
    // unchanged. A presentation attribute is always overridden, because the
    // export has no stylesheet to correct it.
    for (const node of nodes) {
      const own = values.get(node);
      const parent = node === clone ? null : values.get(node.parentElement);
      for (const property of PRESENTATION) {
        const value = own[property];
        if (!value) continue;
        if (parent && !node.hasAttribute(property)) {
          const implied = Object.hasOwn(NOT_INHERITED, property) ? NOT_INHERITED[property] : parent[property];
          if (value === implied) continue;
        }
        node.style.setProperty(property, value);
      }
    }
  } finally {
    stage.remove();
  }
  return clone;
}

export async function exportableSvg(svg, { title = '', source = '' } = {}) {
  if (!svg) throw new Error('No chart is available to export');
  await waitForDocumentFonts();
  document.dispatchEvent(new Event('rb:prepare-export'));
  const width = svg.clientWidth || svg.viewBox?.baseVal.width || Number(svg.getAttribute('width'));
  const height = svg.clientHeight || svg.viewBox?.baseVal.height || Number(svg.getAttribute('height'));
  if (!(width > 0 && height > 0)) throw new Error('The chart has no exportable dimensions');
  const clone = styledClone(svg, width, height);
  const titleLines = metadataLines(title, width, 18, 700);
  const sourceLines = metadataLines(source, width, 11, 400);
  const legend = legendLayout(svg, width);
  const legendBand = legend.height ? legend.height + 12 : 0;
  const titleBand = titleLines.length ? titleLines.length * 22 + 12 : 0;
  const footBand = sourceLines.length ? sourceLines.length * 14 + 12 : 0;
  const pad = 16;
  const totalW = width + pad * 2;
  const totalH = height + titleBand + legendBand + footBand + pad * 2;
  const root = svgElement('svg', { width: totalW, height: totalH, viewBox: `0 0 ${totalW} ${totalH}`, role: 'img' });
  const accessibleTitle = svgElement('title');
  accessibleTitle.textContent = title || 'Remoboko figure';
  root.append(accessibleTitle);
  if (source) {
    const desc = svgElement('desc');
    desc.textContent = source;
    root.append(desc);
  }
  const style = svgElement('style');
  root.append(style, svgElement('rect', { width: totalW, height: totalH, fill: '#ffffff' }));
  appendLines(root, titleLines, { x: pad, y: pad + 18, size: 18, leading: 22, weight: 700, fill: '#1b1b1b' });
  appendLegend(root, legend, pad, pad + titleBand);
  clone.setAttribute('x', pad);
  clone.setAttribute('y', pad + titleBand + legendBand);
  root.append(clone);
  appendLines(root, sourceLines, { x: pad, y: pad + titleBand + legendBand + height + 23, size: 11, leading: 14, weight: 400, fill: '#6f6f6f' });
  // Embed only the font subsets that the visible text needs.
  const text = [...root.querySelectorAll('text')].map((node) => node.textContent).join('');
  style.textContent = await fontFaceCss(text);
  return { root, width: totalW, height: totalH };
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  try { anchor.click(); } finally {
    anchor.remove();
    // Allow the browser's download task to acquire the blob before revocation.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function downloadSVG(svg, filename, meta) {
  const { root } = await exportableSvg(svg, meta);
  saveBlob(new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`);
}

export async function downloadPNG(svg, filename, meta, scale = 2) {
  const { root, width, height } = await exportableSvg(svg, meta);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('The exported SVG could not be rendered'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PNG export is not supported by this browser');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed')), 'image/png'));
    saveBlob(blob, `${filename}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** CSV contains the current table's headers and rows, with unambiguous quoting. */
export function tableToCSV(table) {
  return [...table.querySelectorAll('thead tr, tbody tr')].map((row) => [...row.cells].map((cell) => {
    let value = cell.textContent.trim();
    // Treat source text as text when opened in a spreadsheet, not a formula.
    if (/^[=+@\t\r]/.test(value) || /^-(?!\d+(?:\.\d+)?$)/.test(value)) value = `'${value}`;
    return `"${value.replace(/"/g, '""')}"`;
  }).join(',')).join('\r\n') + '\r\n';
}

export function downloadCSV(table, filename) {
  saveBlob(new Blob(['\uFEFF', tableToCSV(table)], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
}
