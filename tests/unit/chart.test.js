import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import { createChart, bindTooltip, roundedBarPath } from '../../assets/chart.js';

function withDOM(markup, run) {
  const dom = new JSDOM(markup, { pretendToBeVisual: true });
  dom.window.matchMedia = () => ({ matches: false });
  dom.window.ResizeObserver = class { observe() {} disconnect() {} };
  const keys = ['window', 'document', 'Node', 'Event', 'ResizeObserver'];
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

test('a redraw keeps keyboard focus on the same mark and plays the entrance only once', () => withDOM('<div id="plot"></div>', async () => {
  const plot = document.getElementById('plot');
  Object.defineProperty(plot, 'clientWidth', { value: 320 });
  const chart = createChart(d3.select(plot).append('svg'));
  assert.equal(chart.node().getAttribute('role'), 'group');
  const entrances = [];
  let refreshed = 0;
  chart.start(() => {
    entrances.push(chart.entrance);
    chart.svg.selectAll('*').remove();
    chart.svg.selectAll('rect').data(['a', 'b']).join('rect').attr('tabindex', 0).attr('data-key', (d) => d);
  }, { after: () => { refreshed += 1; } });
  chart.render();
  chart.svg.select('[data-key="b"]').node().focus();
  const before = document.activeElement;
  chart.render();
  assert.notEqual(document.activeElement, before, 'the focused node was replaced');
  assert.equal(document.activeElement.dataset.key, 'b');
  assert.deepEqual(entrances, [true, false]);
  assert.equal(refreshed, 2);
}));

test('export preparation redraws without motion', () => withDOM('<div id="plot"></div>', async () => {
  const plot = document.getElementById('plot');
  Object.defineProperty(plot, 'clientWidth', { value: 320 });
  const chart = createChart(d3.select(plot).append('svg'));
  const motion = [];
  chart.start(() => { motion.push(chart.motion); });
  document.dispatchEvent(new Event('rb:prepare-export'));
  chart.render();
  assert.deepEqual(motion, [false, true]);
}));

test('tooltips highlight a mark on hover and focus, and restore every mark on leave', () => withDOM('<svg><rect tabindex="0"/></svg>', () => {
  const calls = [];
  const tooltip = { show: (content, x, y) => calls.push(['show', content.title, x, y]), move() {}, hide: () => calls.push(['hide']) };
  const marks = d3.select('svg').selectAll('rect').data([{ name: 'Benin' }]);
  const highlighted = [];
  bindTooltip(marks, tooltip, { content: (d) => ({ title: d.name }), highlight: (d) => highlighted.push(d?.name ?? null), anchor: () => [5, 6] });
  const rect = document.querySelector('rect');
  rect.dispatchEvent(new window.FocusEvent('focus'));
  rect.dispatchEvent(new window.FocusEvent('blur'));
  assert.deepEqual(calls, [['show', 'Benin', 5, 6], ['hide']]);
  assert.deepEqual(highlighted, ['Benin', null]);
}));

test('bar paths are square at the baseline, rounded at the data end and safe at zero width', () => {
  assert.equal(roundedBarPath(0, 10, 100, 20), 'M0,10h96a4,4 0 0 1 4,4v12a4,4 0 0 1 -4,4h-96Z');
  assert.equal(roundedBarPath(0, 0, 3, 4), 'M0,0h1a2,2 0 0 1 2,2v0a2,2 0 0 1 -2,2h-1Z', 'radius is at most half the height');
  assert.ok(!roundedBarPath(0, 0, 0, 20).includes('NaN'));
  // Entrance animations interpolate between paths with identical structure.
  assert.equal(roundedBarPath(0, 0, 0, 20).match(/-?[\d.]+/g).length, roundedBarPath(0, 0, 80, 20).match(/-?[\d.]+/g).length);
});
