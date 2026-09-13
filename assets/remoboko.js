// Remoboko figures: shared helpers (ES module, no build step).
// Imported by every chart and map page with a relative path.

export const COUNTRY_COLORS = {
  Benin: '#3388ff',
  Togo: '#2ecc71',
  'West Africa': '#e67e22',
};

// Fixed-order categorical palette (see assets/remoboko.css). Series past
// the eighth fold into "Other"; hues are never generated.
export const CATEGORICAL = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948',
];
export const OTHER_COLOR = '#9c9c98';
export const SEQ_COLOR = '#2a78d6';

export const FONT_FAMILY = '"Source Sans 3", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// OpenFreeMap vector styles: no API key, no usage limits.
export const BASEMAPS = {
  detailed: { label: 'Detailed', style: 'https://tiles.openfreemap.org/styles/liberty' },
  light: { label: 'Light', style: 'https://tiles.openfreemap.org/styles/positron' },
  dark: { label: 'Dark', style: 'https://tiles.openfreemap.org/styles/dark' },
};
export const BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const SOURCE_LINE = 'Source: Remoboko project data (CC BY 4.0)';

// Font Awesome Free 6.7.2 solid icons (CC BY 4.0, https://fontawesome.com/license/free)
export const ICONS = {
  mosque: { viewBox: '0 0 640 512', d: 'M400 0c5 0 9.8 2.4 12.8 6.4c34.7 46.3 78.1 74.9 133.5 111.5c0 0 0 0 0 0s0 0 0 0c5.2 3.4 10.5 7 16 10.6c28.9 19.2 45.7 51.7 45.7 86.1c0 28.6-11.3 54.5-29.8 73.4l-356.4 0c-18.4-19-29.8-44.9-29.8-73.4c0-34.4 16.7-66.9 45.7-86.1c5.4-3.6 10.8-7.1 16-10.6c0 0 0 0 0 0s0 0 0 0C309.1 81.3 352.5 52.7 387.2 6.4c3-4 7.8-6.4 12.8-6.4zM288 512l0-72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 72-48 0c-17.7 0-32-14.3-32-32l0-128c0-17.7 14.3-32 32-32l416 0c17.7 0 32 14.3 32 32l0 128c0 17.7-14.3 32-32 32l-48 0 0-72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 72-64 0 0-58c0-19-8.4-37-23-49.2L400 384l-25 20.8C360.4 417 352 435 352 454l0 58-64 0zM70.4 5.2c5.7-4.3 13.5-4.3 19.2 0l16 12C139.8 42.9 160 83.2 160 126l0 2L0 128l0-2C0 83.2 20.2 42.9 54.4 17.2l16-12zM0 160l160 0 0 136.6c-19.1 11.1-32 31.7-32 55.4l0 128c0 9.6 2.1 18.6 5.8 26.8c-6.6 3.4-14 5.2-21.8 5.2l-64 0c-26.5 0-48-21.5-48-48L0 176l0-16z' },
  church: { viewBox: '0 0 640 512', d: 'M344 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 24-32 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l32 0 0 46.4L183.3 210c-14.5 8.7-23.3 24.3-23.3 41.2L160 512l96 0 0-96c0-35.3 28.7-64 64-64s64 28.7 64 64l0 96 96 0 0-260.8c0-16.9-8.8-32.5-23.3-41.2L344 142.4 344 96l32 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-32 0 0-24zM24.9 330.3C9.5 338.8 0 354.9 0 372.4L0 464c0 26.5 21.5 48 48 48l80 0 0-238.4L24.9 330.3zM592 512c26.5 0 48-21.5 48-48l0-91.6c0-17.5-9.5-33.6-24.9-42.1L512 273.6 512 512l80 0z' },
  school: { viewBox: '0 0 640 512', d: 'M337.8 5.4C327-1.8 313-1.8 302.2 5.4L166.3 96 48 96C21.5 96 0 117.5 0 144L0 464c0 26.5 21.5 48 48 48l208 0 0-96c0-35.3 28.7-64 64-64s64 28.7 64 64l0 96 208 0c26.5 0 48-21.5 48-48l0-320c0-26.5-21.5-48-48-48L473.7 96 337.8 5.4zM96 192l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16zm400 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64zM96 320l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16zm400 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64zM232 176a88 88 0 1 1 176 0 88 88 0 1 1 -176 0zm88-48c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-16 0 0-16c0-8.8-7.2-16-16-16z' },
  university: { viewBox: '0 0 512 512', d: 'M243.4 2.6l-224 96c-14 6-21.8 21-18.7 35.8S16.8 160 32 160l0 8c0 13.3 10.7 24 24 24l400 0c13.3 0 24-10.7 24-24l0-8c15.2 0 28.3-10.7 31.3-25.6s-4.8-29.9-18.7-35.8l-224-96c-8-3.4-17.2-3.4-25.2 0zM128 224l-64 0 0 196.3c-.6 .3-1.2 .7-1.8 1.1l-48 32c-11.7 7.8-17 22.4-12.9 35.9S17.9 512 32 512l448 0c14.1 0 26.5-9.2 30.6-22.7s-1.1-28.1-12.9-35.9l-48-32c-.6-.4-1.2-.7-1.8-1.1L448 224l-64 0 0 192-40 0 0-192-64 0 0 192-48 0 0-192-64 0 0 192-40 0 0-192zM256 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64z' },
  landmark: { viewBox: '0 0 384 512', d: 'M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z' },
  search: { viewBox: '0 0 512 512', d: 'M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z' },
  download: { viewBox: '0 0 512 512', d: 'M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z' },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function iconSvg(name, className = '') {
  const icon = ICONS[name];
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', icon.viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (className) svg.setAttribute('class', className);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', icon.d);
  svg.appendChild(path);
  return svg;
}

export async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

export const fmtInt = new Intl.NumberFormat('en-GB');
export const formatCount = (n) => fmtInt.format(n);
export const formatPct = (p) => `${(p * 100).toFixed(p * 100 < 10 ? 1 : 0)}%`;

/** Build an element with attributes and children (strings become text nodes). */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (val == null) continue;
        if (prop.startsWith('--')) node.style.setProperty(prop, val); else node.style[prop] = val;
      }
    }
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Show an error in the plot area instead of a blank figure. */
export function showEmpty(container, message) {
  container.replaceChildren(el('p', { class: 'rb-empty', role: 'status' }, message));
}

/** Single tooltip per page. Rows are rendered with textContent, never HTML. */
export function createTooltip() {
  const node = el('div', { class: 'rb-tooltip', role: 'tooltip', 'aria-hidden': 'true' });
  document.body.append(node);
  let raf = 0;

  function position(x, y) {
    const pad = 12;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    let left = x + pad;
    let top = y + pad;
    if (left + w > window.innerWidth - 8) left = x - w - pad;
    if (top + h > window.innerHeight - 8) top = y - h - pad;
    node.style.left = `${Math.max(8, left)}px`;
    node.style.top = `${Math.max(8, top)}px`;
  }

  document.addEventListener('rb:hide-tooltips', () => { node.dataset.open = 'false'; node.setAttribute('aria-hidden', 'true'); });

  return {
    /**
     * @param {{title?:string, sub?:string, rows?:Array<{key:string,value:string,color?:string,muted?:boolean}>, list?:string[], note?:string}} content
     */
    show(content, x, y) {
      const parts = [];
      if (content.title) parts.push(el('p', { class: 'rb-tooltip-title' }, content.title));
      if (content.sub) parts.push(el('p', { class: 'rb-tooltip-sub' }, content.sub));
      if (content.rows?.length) {
        parts.push(el('div', { class: 'rb-tooltip-rows' }, content.rows.map((r) => [
          el('span', { class: 'rb-swatch rb-swatch--line', style: { '--swatch': r.color || 'transparent', visibility: r.color ? 'visible' : 'hidden' } }),
          el('span', { class: r.muted ? 'k muted' : 'k' }, r.key),
          el('span', { class: r.muted ? 'v muted' : 'v' }, r.value),
        ])));
      }
      if (content.list?.length) parts.push(el('ul', {}, content.list.map((item) => el('li', {}, item))));
      if (content.note) parts.push(el('p', { class: 'rb-tooltip-sub', style: { margin: '4px 0 0' } }, content.note));
      node.replaceChildren(...parts);
      node.dataset.open = 'true';
      node.setAttribute('aria-hidden', 'false');
      position(x, y);
    },
    move(x, y) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => position(x, y));
    },
    hide() {
      node.dataset.open = 'false';
      node.setAttribute('aria-hidden', 'true');
    },
  };
}

/**
 * Legend with optional toggles. items: [{id, label, color, count, shape}].
 * onToggle(id, visible) is called when the user toggles an item.
 */
export function renderLegend(container, items, { onToggle, shape = 'square' } = {}) {
  const list = el('ul', { class: 'rb-legend', 'aria-label': 'Legend' });
  for (const item of items) {
    const swatch = el('span', { class: `rb-swatch${shape === 'dot' ? ' rb-swatch--dot' : ''}`, style: { '--swatch': item.color } });
    const label = el('span', {}, item.label);
    const count = item.count != null ? el('span', { class: 'rb-count' }, ` ${formatCount(item.count)}`) : null;
    const key = onToggle
      ? el('button', { type: 'button', class: 'rb-key', 'aria-pressed': 'true', title: 'Show or hide this series' }, swatch, label, count)
      : el('span', { class: 'rb-key' }, swatch, label, count);
    if (onToggle) {
      key.addEventListener('click', () => {
        const visible = key.getAttribute('aria-pressed') !== 'true';
        key.setAttribute('aria-pressed', String(visible));
        onToggle(item.id, visible);
      });
    }
    list.append(el('li', {}, key));
  }
  container.replaceChildren(list);
  return list;
}

/** Segmented control. options: [{id, label}]. Returns a setter for the active id. */
export function renderSegmented(container, options, { value, label, onChange }) {
  const group = el('div', { class: 'rb-seg', role: 'group', 'aria-label': label });
  const buttons = new Map();
  for (const opt of options) {
    const btn = el('button', { type: 'button', 'aria-pressed': String(opt.id === value) }, opt.label);
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-pressed') === 'true') return;
      set(opt.id);
      onChange(opt.id);
    });
    buttons.set(opt.id, btn);
    group.append(btn);
  }
  function set(id) {
    for (const [key, btn] of buttons) btn.setAttribute('aria-pressed', String(key === id));
  }
  container.replaceChildren(group);
  return set;
}

// --- Export ---------------------------------------------------------------

async function fontFaceCss() {
  // Embed Source Sans 3 into the exported SVG so PNG/SVG downloads keep the
  // page's typeface. Falls back silently to the system stack when offline.
  try {
    const cssUrl = 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap';
    const css = await (await fetch(cssUrl)).text();
    const faces = [];
    const blocks = css.match(/@font-face\s*{[^}]*}/g) || [];
    for (const block of blocks) {
      if (!/unicode-range:\s*U\+0000-00FF/.test(block) && /unicode-range/.test(block)) continue; // latin only
      const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
      if (!url) continue;
      const buf = await (await fetch(url)).arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
      const dataUrl = `data:font/woff2;base64,${btoa(bin)}`;
      faces.push(block.replace(/src:[^;]+;/, `src: url(${dataUrl}) format('woff2');`).replace(/unicode-range:[^;]+;/, ''));
    }
    return faces.join('\n');
  } catch {
    return '';
  }
}

function collectCssRules() {
  // Copy every stylesheet rule that targets SVG marks so the serialized SVG
  // carries its own styling (classes, tokens). Cross-origin sheets are skipped.
  const rules = [];
  for (const sheet of document.styleSheets) {
    let list;
    try { list = sheet.cssRules; } catch { continue; }
    for (const rule of list) {
      const text = rule.cssText;
      if (/^:root/.test(text) || /\.rb-(axis|grid|cat-label|value|annotation|mark|hit)/.test(text) || /^svg text/.test(text)) {
        rules.push(text);
      }
    }
  }
  return rules.join('\n');
}

/** Clone an SVG with inline styles, title and white background, ready to serialize. */
export async function exportableSvg(svg, { title, source } = {}) {
  const clone = svg.cloneNode(true);
  const width = svg.clientWidth || svg.viewBox.baseVal.width;
  const height = svg.clientHeight || svg.viewBox.baseVal.height;
  const titleBand = title ? 44 : 0;
  const footBand = source ? 28 : 0;
  const pad = 16;
  const totalW = width + pad * 2;
  const totalH = height + titleBand + footBand + pad * 2;

  const root = document.createElementNS(SVG_NS, 'svg');
  root.setAttribute('xmlns', SVG_NS);
  root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  root.setAttribute('width', totalW);
  root.setAttribute('height', totalH);
  root.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = `${await fontFaceCss()}\n${collectCssRules()}\ntext{font-family:${FONT_FAMILY};}`;
  root.append(style);

  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', totalW);
  bg.setAttribute('height', totalH);
  bg.setAttribute('fill', '#ffffff');
  root.append(bg);

  if (title) {
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', pad);
    t.setAttribute('y', pad + 22);
    t.setAttribute('font-size', '18');
    t.setAttribute('font-weight', '700');
    t.setAttribute('fill', '#1b1b1b');
    t.textContent = title;
    root.append(t);
  }

  clone.removeAttribute('style');
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  clone.setAttribute('x', pad);
  clone.setAttribute('y', pad + titleBand);
  clone.querySelectorAll('.rb-hit').forEach((n) => n.remove());
  root.append(clone);

  if (source) {
    const s = document.createElementNS(SVG_NS, 'text');
    s.setAttribute('x', pad);
    s.setAttribute('y', totalH - pad);
    s.setAttribute('font-size', '11');
    s.setAttribute('fill', '#6f6f6f');
    s.textContent = source;
    root.append(s);
  }
  return { root, width: totalW, height: totalH };
}

function triggerDownload(href, filename) {
  const a = el('a', { href, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
}

export async function downloadSVG(svg, filename, meta) {
  const { root } = await exportableSvg(svg, meta);
  const text = new XMLSerializer().serializeToString(root);
  const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${filename}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPNG(svg, filename, meta, scale = 2) {
  const { root, width, height } = await exportableSvg(svg, meta);
  const text = new XMLSerializer().serializeToString(root);
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  const canvas = el('canvas', { width: Math.round(width * scale), height: Math.round(height * scale) });
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  triggerDownload(canvas.toDataURL('image/png'), `${filename}.png`);
}

/**
 * Footer actions: table toggle plus PNG/SVG download.
 * getSvg() returns the live chart SVG; buildTable() returns a <table>.
 */
export function renderActions(container, { filename, title, source, getSvg, buildTable, plot }) {
  const tableBtn = el('button', { type: 'button', 'aria-pressed': 'false' }, 'Show as table');
  const pngBtn = el('button', { type: 'button' }, iconSvg('download'), 'Download PNG');
  const svgBtn = el('button', { type: 'button' }, iconSvg('download'), 'Download SVG');
  let tableWrap = null;

  tableBtn.addEventListener('click', () => {
    document.dispatchEvent(new Event('rb:hide-tooltips'));
    const showing = tableBtn.getAttribute('aria-pressed') === 'true';
    if (showing) {
      tableWrap?.remove();
      tableWrap = null;
      plot.querySelectorAll(':scope > svg').forEach((n) => { n.style.visibility = ''; });
      tableBtn.setAttribute('aria-pressed', 'false');
      tableBtn.textContent = 'Show as table';
    } else {
      tableWrap = el('div', { class: 'rb-table-wrap', tabindex: '0' }, buildTable());
      plot.querySelectorAll(':scope > svg').forEach((n) => { n.style.visibility = 'hidden'; });
      plot.append(tableWrap);
      tableBtn.setAttribute('aria-pressed', 'true');
      tableBtn.textContent = 'Show as chart';
    }
  });
  pngBtn.addEventListener('click', () => downloadPNG(getSvg(), filename, { title, source }));
  svgBtn.addEventListener('click', () => downloadSVG(getSvg(), filename, { title, source }));

  container.replaceChildren(tableBtn, pngBtn, svgBtn);
}

/** Build a plain <table> from column definitions and rows. */
export function buildTable(columns, rows, caption) {
  const table = el('table', { class: 'rb-table' });
  if (caption) table.append(el('caption', {}, caption));
  table.append(el('thead', {}, el('tr', {}, columns.map((c) => el('th', { scope: 'col', class: c.numeric ? 'num' : null }, c.label)))));
  table.append(el('tbody', {}, rows.map((r) => el('tr', {}, columns.map((c) => el('td', { class: c.numeric ? 'num' : null }, c.format ? c.format(r[c.key], r) : r[c.key]))))));
  return table;
}

/** Re-run draw() whenever the container's size changes (debounced to a frame). */
export function onResize(node, draw) {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  });
  ro.observe(node);
  return ro;
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isNarrow = () => window.innerWidth < 640;

/**
 * fitBounds padding that keeps the data clear of the floating cards: the
 * legend occupies the left strip on desktop and a collapsed pill at the
 * bottom on phones; the tools card occupies the top band.
 */
export function cardPadding({ legendCard, toolsCard, base = 24 } = {}) {
  const narrow = isNarrow();
  const NAV = { width: 44, height: 100 }; // MapLibre's top-left zoom and fullscreen group
  return {
    top: base + Math.max(toolsCard?.offsetHeight || 0, NAV.height),
    right: base,
    bottom: base + (narrow ? (legendCard?.offsetHeight || 0) : 0),
    left: base + Math.max(!narrow ? (legendCard?.offsetWidth || 0) : 0, NAV.width),
  };
}

/** On phones the card starts collapsed behind a "Show key" toggle. */
export function makeCollapsible(card, { label = 'key' } = {}) {
  const toggle = el('button', { type: 'button', class: 'rb-card-toggle', 'aria-expanded': 'false' }, `Show ${label}`);
  const apply = () => {
    const open = card.dataset.open === 'true';
    toggle.textContent = open ? `Hide ${label}` : `Show ${label}`;
    toggle.setAttribute('aria-expanded', String(open));
  };
  card.dataset.open = isNarrow() ? 'false' : 'true';
  toggle.addEventListener('click', () => { card.dataset.open = card.dataset.open === 'true' ? 'false' : 'true'; apply(); });
  card.prepend(toggle);
  apply();
  let wasNarrow = isNarrow();
  window.addEventListener('resize', () => {
    if (isNarrow() !== wasNarrow) { wasNarrow = isNarrow(); card.dataset.open = wasNarrow ? 'false' : 'true'; apply(); }
  });
  return toggle;
}

/** Measure rendered text width in an SVG (for label fitting). */
export function measureText(svgSel, text, className) {
  const t = svgSel.append('text').attr('class', className).attr('visibility', 'hidden').text(text);
  const w = t.node().getComputedTextLength();
  t.remove();
  return w;
}
