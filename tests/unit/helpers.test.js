import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildTable, renderActions, updateQueryState, availablePlotHeight } from '../../assets/remoboko.js';
import { exportableSvg, tableToCSV, wrapExportText, layoutExportLegend } from '../../assets/export.js';

function withDOM(markup, run) {
  const dom = new JSDOM(markup, { url: 'https://example.org/figure.html?keep=value', pretendToBeVisual: true });
  const keys = ['window', 'document', 'Node', 'Event', 'XMLSerializer'];
  const originals = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  const restore = () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
  };
  return Promise.resolve().then(() => run(dom.window)).finally(restore);
}

test('an open table refreshes its data and preserves visibility, focus and scroll wrapper', () => withDOM('<div id="plot"><svg></svg></div><div id="actions"></div>', () => {
  let rows = [{ date: '2025-Q1', count: 3 }, { date: '2025-Q2', count: 4 }];
  const plot = document.querySelector('#plot');
  const actions = renderActions(document.querySelector('#actions'), {
    filename: 'test', title: 'Test', source: 'Source', plot,
    getSvg: () => plot.querySelector('svg'),
    buildTable: () => buildTable([{ key: 'date', label: 'Period' }, { key: 'count', label: 'Count' }], rows, 'Current data'),
  });
  actions.refresh();
  document.querySelector('#actions button').click();
  const wrapper = plot.querySelector('.rb-table-wrap');
  wrapper.focus();
  assert.equal(wrapper.querySelectorAll('tbody tr').length, 2);
  rows = [{ date: '2025', count: 7 }];
  actions.refresh();
  assert.equal(plot.querySelector('.rb-table-wrap'), wrapper);
  assert.equal(document.activeElement, wrapper);
  assert.equal(wrapper.querySelectorAll('tbody tr').length, 1);
  assert.match(wrapper.textContent, /20257/);
  assert.equal(plot.querySelector('svg').style.visibility, 'hidden');
  document.querySelector('#actions button').click();
  assert.equal(plot.querySelector('svg').style.visibility, '');
  assert.equal(plot.querySelector('.rb-table-wrap'), null);
}));

test('CSV quotes source text and protects formula-like labels without losing negative numbers', () => withDOM('', () => {
  const table = buildTable([{ key: 'name', label: 'Name' }, { key: 'n', label: 'Count' }], [
    { name: 'Lomé, "campus"\nBenin', n: 7 }, { name: '=HYPERLINK("test")', n: -2 },
  ], 'Not a CSV row');
  const csv = tableToCSV(table);
  assert.ok(csv.startsWith('"Name","Count"\r\n'));
  assert.ok(csv.includes('"Lomé, ""campus""\nBenin","7"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""test"")","-2"'));
  assert.ok(!csv.includes('Not a CSV row'));
}));

test('metadata wrapping contains long titles and unbroken source strings', () => {
  const measure = (text) => text.length * 5;
  const lines = wrapExportText('Religion, education and politics in Togo and Benin', 80, measure);
  assert.equal(lines.join(' '), 'Religion, education and politics in Togo and Benin');
  assert.ok(lines.length > 1 && lines.every((line) => measure(line) <= 80));
  assert.ok(wrapExportText('a'.repeat(100), 80, measure).every((line) => line.length <= 16));
});

test('SVG export resolves page-specific styles and removes transient/interaction state even in table mode', () => withDOM(`
  <style>.event-text{font-size:11px;fill:rgb(20,30,40)} .event-dot{stroke:white;stroke-width:2px} .is-dim{opacity:.25}</style>
  <div class="rb-plot"><svg width="200" height="100" style="visibility:hidden"><g class="event is-dim" tabindex="0"><circle class="event-dot"/><circle class="rb-hit"/><text class="event-text">Lomé</text></g></svg></div>`, async (window) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Offline'); };
  window.HTMLCanvasElement.prototype.getContext = () => ({ measureText: (text) => ({ width: text.length * 9 }) });
  try {
    const svg = document.querySelector('svg');
    const { root, width, height } = await exportableSvg(svg, { title: 'A very long title that must wrap inside a small figure', source: 'Remoboko source' });
    assert.equal(width, 232);
    assert.ok(height > 200);
    assert.equal(root.querySelector('.event-text').style.fontSize, '11px');
    assert.equal(root.querySelector('.event-text').style.fill, 'rgb(20, 30, 40)');
    assert.equal(root.querySelector('.event-dot').style.strokeWidth, '2px');
    assert.equal(root.querySelectorAll('.rb-hit, .is-dim, [tabindex]').length, 0);
    assert.notEqual(root.querySelector('svg').style.visibility, 'hidden');
    assert.equal(svg.style.visibility, 'hidden');
    assert.ok(svg.querySelector('.is-dim'));
    assert.equal(document.querySelectorAll('.rb-plot').length, 1);
  } finally { globalThis.fetch = originalFetch; }
}));

test('query updates preserve unrelated parameters and remove default state', () => withDOM('', () => {
  updateQueryState({ theme: 'Religion', period: 'year' });
  assert.equal(new URL(window.location.href).searchParams.get('keep'), 'value');
  assert.equal(new URL(window.location.href).searchParams.get('theme'), 'Religion');
  updateQueryState({ theme: null, period: '' });
  assert.equal(window.location.search, '?keep=value');
}));

test('available height does not reuse an old plot min-height', () => withDOM('<figure class="rb-figure" style="padding:10px;row-gap:5px"><header></header><div id="plot" style="min-height:1734px"></div><footer></footer></figure>', () => {
  Object.defineProperty(window, 'innerHeight', { value: 700 });
  document.querySelector('header').getBoundingClientRect = () => ({ height: 80 });
  document.querySelector('footer').getBoundingClientRect = () => ({ height: 40 });
  const height = availablePlotHeight(document.querySelector('#plot'));
  assert.equal(height, 550);
}));


test('export legend wraps inside the figure width and retains swatch labels', () => {
  const measure = (value) => value.length * 6;
  const layout = layoutExportLegend([
    { label: 'Conference paper 80', color: '#2a78d6', shape: 'square' },
    { label: 'Lecture/presentation 34', color: '#eb6834', shape: 'square' },
    { label: 'Very long publication category name', color: '#1baf7a', shape: 'square' },
  ], 180, measure);
  assert.equal(layout.items.length, 3);
  assert.ok(layout.height > 16);
  for (const item of layout.items) {
    assert.ok(item.x + 18 + Math.max(...item.lines.map(measure)) <= 180);
  }
});

test('SVG exports include the visible legend and omit hidden series', () => withDOM(`
  <figure class="rb-figure"><ul class="rb-legend">
    <li><button class="rb-key" aria-pressed="true"><span class="rb-swatch" style="--swatch:#2a78d6"></span>Conference paper 80</button></li>
    <li><button class="rb-key" aria-pressed="false"><span class="rb-swatch" style="--swatch:#eb6834"></span>Hidden series</button></li>
  </ul><div class="rb-plot"><svg width="200" height="100"><rect width="20" height="20"/></svg></div></figure>`, async (window) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Offline'); };
  window.HTMLCanvasElement.prototype.getContext = () => ({ measureText: (text) => ({ width: text.length * 6 }) });
  try {
    const { root, height } = await exportableSvg(document.querySelector('.rb-plot svg'), { title: 'Outputs' });
    const legend = root.querySelector('.rb-export-legend');
    assert.ok(legend.textContent.includes('Conference paper 80'));
    assert.ok(!legend.textContent.includes('Hidden series'));
    assert.equal(legend.querySelector('rect').getAttribute('fill'), '#2a78d6');
    assert.equal(legend.querySelectorAll('button').length, 0);
    assert.ok(height > 166);
    assert.ok(Number(root.querySelector('svg').getAttribute('y')) > 50);
  } finally { globalThis.fetch = originalFetch; }
}));


test('SVG export continues with fallback fonts when document fonts never settle', () => withDOM('<div class="rb-plot"><svg width="200" height="100"></svg></div>', async (window) => {
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) } });
  window.HTMLCanvasElement.prototype.getContext = () => ({ measureText: (text) => ({ width: text.length * 6 }) });
  const originalTimeout = globalThis.setTimeout;
  const originalFetch = globalThis.fetch;
  let boundedWait = false;
  globalThis.fetch = async () => { throw new Error('Offline'); };
  globalThis.setTimeout = (callback, delay) => {
    if (delay === 5000) boundedWait = true;
    return originalTimeout(callback, 0);
  };
  try {
    const { root } = await exportableSvg(document.querySelector('svg'), { title: 'Fallback fonts' });
    assert.ok(boundedWait);
    assert.ok(root.textContent.includes('Fallback fonts'));
  } finally {
    globalThis.setTimeout = originalTimeout;
    globalThis.fetch = originalFetch;
  }
}));
