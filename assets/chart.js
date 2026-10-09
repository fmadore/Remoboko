// Lifecycle shared by the D3 chart pages (ES module, no build step). Pages pass
// their own D3 selection, so this module needs no D3 import and runs in tests.
import { onResize, prefersReducedMotion } from './remoboko.js';

const FONT_WAIT = 800; // ms before drawing with fallback-font metrics

/**
 * Wrap a chart SVG: redraw on resize and before exports, keep keyboard focus
 * on the same mark (matched by `data-key`) across redraws, and let the first
 * drawing animate unless motion is reduced or an export is being prepared.
 */
export function createChart(svg) {
  const plot = svg.node().parentNode;
  svg.attr('role', 'group').attr('aria-label', 'Interactive chart; the table provides the same values');
  let draw = null;
  let afterDraw = () => {};
  let drawn = false;
  let exporting = false;

  const chart = {
    svg,
    node: () => svg.node(),
    /** Transitions are allowed: no reduced motion and no export in progress. */
    get motion() { return !exporting && !prefersReducedMotion(); },
    /** The first drawing may play its entrance animation. */
    get entrance() { return !drawn && chart.motion; },
    render() {
      if (!draw || !plot.clientWidth) return;
      const active = document.activeElement;
      const key = svg.node().contains(active) ? active.dataset.key : undefined;
      draw();
      drawn = true;
      if (key !== undefined) {
        svg.selectAll('[data-key]').filter(function sameKey() { return this.dataset.key === key; }).node()?.focus();
      }
      afterDraw();
    },
    /** Start drawing once the page has created everything draw() uses. */
    start(drawChart, { after } = {}) {
      draw = drawChart;
      if (after) afterDraw = after;
      document.addEventListener('rb:prepare-export', () => {
        svg.selectAll('*').interrupt();
        exporting = true;
        try { chart.render(); } finally { exporting = false; }
      });
      // Labels are measured, so wait briefly for the web font before the first
      // drawing, and redraw once if it arrives after all.
      const fonts = Promise.resolve(document.fonts?.ready).catch(() => {});
      fonts.then(() => { if (drawn) chart.render(); });
      document.fonts?.addEventListener?.('loadingdone', () => { if (drawn) chart.render(); });
      Promise.race([fonts, new Promise((resolve) => { setTimeout(resolve, FONT_WAIT); })])
        .then(() => onResize(plot, chart.render));
    },
  };
  return chart;
}

/**
 * Pointer and keyboard tooltips for chart marks. `highlight(d)` emphasises a
 * datum and `highlight(null)` restores every mark.
 */
export function bindTooltip(selection, tooltip, {
  content, highlight = () => {}, anchor = (box) => [box.left + box.width / 2, box.top],
}) {
  function show(event, d) {
    const [x, y] = event.type.startsWith('focus')
      ? anchor(event.currentTarget.getBoundingClientRect(), d)
      : [event.clientX, event.clientY];
    highlight(d);
    tooltip.show(content(d), x, y);
  }
  function hide() {
    highlight(null);
    tooltip.hide();
  }
  return selection.on('pointerenter', show)
    .on('pointermove', (event) => tooltip.move(event.clientX, event.clientY))
    .on('pointerleave', hide).on('focus', show).on('blur', hide);
}

/** A bar that is square at its baseline (x) and rounded at its data end. */
export function roundedBarPath(x, y, width, height, radius = 4) {
  const r = Math.max(0, Math.min(radius, width, height / 2));
  return `M${x},${y}h${width - r}a${r},${r} 0 0 1 ${r},${r}v${height - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${r - width}Z`;
}
