---
name: Remoboko figures
description: Plain editorial charts and maps at Datawrapper's craft level; the figure is the page.
colors:
  surface: "#ffffff"
  surface-2: "#f4f4f2"
  ink: "#1b1b1b"
  ink-2: "#4a4a4a"
  ink-3: "#6f6f6f"
  grid: "#e6e6e3"
  axis: "#bdbdb8"
  hairline: "rgba(27, 27, 27, 0.14)"
  hover: "rgba(27, 27, 27, 0.06)"
  link: "#0b5fad"
  selection: "#cfe3fb"
  benin: "#3388ff"
  togo: "#2ecc71"
  west-africa: "#e67e22"
  cat-1: "#2a78d6"
  cat-2: "#eb6834"
  cat-3: "#1baf7a"
  cat-4: "#eda100"
  cat-5: "#e87ba4"
  cat-6: "#008300"
  cat-7: "#4a3aa7"
  cat-8: "#e34948"
  other: "#9c9c98"
  seq: "#2a78d6"
typography:
  title:
    fontFamily: "Source Sans 3, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title-compact:
    fontFamily: "Source Sans 3, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Source Sans 3, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Source Sans 3, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.3
  small:
    fontFamily: "Source Sans 3, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
  column-head:
    fontFamily: "Source Sans 3, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.04em"
rounded:
  key: "2px"
  base: "4px"
  seg: "6px"
  logo: "8px"
  pill: "50%"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
components:
  action-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.small}"
    padding: "2px 0"
  action-link-hover:
    textColor: "{colors.ink}"
  action-link-pressed:
    textColor: "{colors.ink}"
  legend-key:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.key}"
    padding: "2px 4px 2px 0"
  legend-key-hover:
    textColor: "{colors.ink}"
  legend-key-off:
    textColor: "{colors.ink-3}"
  segmented:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.seg}"
    padding: "2px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "3px 10px"
  segmented-option-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  segmented-option-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "8px 10px"
    width: "300px"
  map-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "10px 12px"
    width: "min(92vw, 360px)"
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "8px 12px 8px 34px"
    width: "min(92vw, 300px)"
  map-popup:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "10px 14px 10px 12px"
  table-head:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    typography: "{typography.column-head}"
    padding: "5px 10px 5px 0"
---

# Design System: Remoboko figures

## Overview

**Creative North Star: "The Datawrapper Page"**

Every Remoboko figure is a whole page that happens to be embedded in an iframe: a title, one sentence of description, the plot filling the remaining height, and a hairline-topped footer carrying the source line and three text-link actions. Nothing around the figure competes with it. There is no site header, no card frame, no toolbar, no decorative device; the chart reads the way a Datawrapper embed reads inside a newspaper article, and it is judged by that bar.

The material is white paper and near-black ink. Two greys carry everything subordinate (descriptions, axis labels, sources); colour is spent only on data, and only from two fixed sources: the pinned country trio and an eight-slot categorical palette that never generates hues. Density is editorial rather than dashboard: one figure per page, 22px title, 15px body, 12px axis type, 4px rhythm.

Maps follow the same doctrine with a header strip and a full-bleed MapLibre body; the only floating surfaces are the legend card and the search/basemap tools, and on phones the legend collapses to a single "Show key" link so the data keeps the frame.

**Key Characteristics:**
- The figure is the page: 100dvh flex column, no chrome, embeds cleanly at any iframe height.
- White ground, one workhorse sans (Source Sans 3), hairline grid, crisp-edged axes.
- Near-black ink with exactly two greys; colour is reserved for data marks.
- Legends are text keys with 12px swatches; controls are underlined text links and one segmented toggle.
- Every value is reachable without hovering: labelled bars, tabular figures, and a "Show as table" view on every chart.
- Depth is a single soft shadow used only for surfaces that float over a map or over the plot (tooltip, cards, popups).

## Colors

A white page, an ink ramp of three steps, and colour spent only on data from two pinned sources.

### Primary
- **Series Blue** (`{colors.seq}`): the single-series mark colour. Bars in the collaborators chart, circles on the affiliation map, the size key. Identical to `cat-1`, so a one-series chart and the first series of a multi-series chart share a colour by design.
- **Reference Blue** (`{colors.link}`): links, the "Show key" toggle, breadcrumb buttons. Darker than Series Blue so text passes contrast on white; it never appears on a data mark.

### Secondary: the country trio (pinned identity; mirrored in `viz_common.py`)
- **Benin Blue** (`{colors.benin}`): every Benin pin, dot, and legend swatch.
- **Togo Green** (`{colors.togo}`): every Togo pin, dot, and legend swatch.
- **West Africa Orange** (`{colors.west-africa}`): the regional-context pins (Abidjan, Dakar).

### Tertiary: the categorical palette (fixed order)
- **cat-1 to cat-8** (`{colors.cat-1}` through `{colors.cat-8}`): assigned to series in rank order (largest series gets cat-1). Validated for adjacent colour-vision separation; the order is the system, not the individual hues.
- **Other Grey** (`{colors.other}`): the fold bucket. Series past the seventh named one collapse into a single "Other (n types)" series drawn in this grey, listed in the footer note.

### Neutral
- **Paper** (`{colors.surface}`): the page, cards, tooltips, popups, the exported SVG background.
- **Paper 2** (`{colors.surface-2}`): a reserved second surface; declared in the tokens, not yet used by any shipped page.
- **Ink** (`{colors.ink}`): titles, category labels, value labels, focus ring, the active segmented option's fill.
- **Ink 2** (`{colors.ink-2}`): descriptions, legend key text, segmented option text, tooltip keys.
- **Ink 3** (`{colors.ink-3}`): axis labels, source line, footer actions, table headers, muted counts, placeholder text. 5.3:1 on white; this is the lightest text allowed.
- **Grid** (`{colors.grid}`): horizontal gridlines, table row rules, the footer's top rule, the map header's bottom rule.
- **Axis** (`{colors.axis}`): the baseline and the timeline spine; one step darker than grid.
- **Hairline** (`{colors.hairline}`): borders on the segmented control, tooltip and search input; the ring around size-key circles.
- **Hover Wash** (`{colors.hover}`): row hover in tables and charts, option hover in the segmented control and search results.
- **Selection** (`{colors.selection}`): text selection only.

### Named Rules
**The Two Sources Rule.** Data colour comes from exactly two places: the country trio when the encoding is country, the categorical palette in rank order otherwise. Hues are never generated, interpolated toward another hue, or picked per page. (The treemap's lighter descendant tints are a lightness ramp toward white of an assigned palette colour, not a new hue.)

**The Seventh Fold Rule.** A multi-series chart names at most seven series; everything past that folds into one "Other" series in Other Grey and is enumerated in the footer note.

**The Grey Is Text Rule.** The three inks are for text and rules only. No data mark is drawn in ink-2 or ink-3; the only grey data mark is Other Grey.

## Typography

**Display Font:** Source Sans 3 (with system-ui, Segoe UI, Roboto, Helvetica Neue, Arial)
**Body Font:** Source Sans 3 (same family)
**Label/Mono Font:** none; numerals use `font-variant-numeric: tabular-nums` wherever they align.

**Character:** One workhorse humanist sans at three weights (400, 600, 700), loaded from Google Fonts and embedded as woff2 into exported SVGs so downloads keep the typeface. Nothing is set in a second face; hierarchy comes from size, weight, and the three inks.

### Hierarchy
- **Title** (700, 22px / 1.375rem, 1.2, -0.01em, `text-wrap: balance`): the figure's H1, top-left. Drops to 19px (1.1875rem) under 640px.
- **Title, compact** (700, 17px / 1.0625rem): the H1 in the map header strip, where the map body needs the height.
- **Body** (400, 15px / 0.9375rem, 1.45, ink-2, `text-wrap: pretty`): the one-sentence description under the title, capped at 72ch (80ch on maps).
- **Label** (400, 13px / 0.8125rem, 1.3): legend keys, segmented options, tooltip body, table cells, category labels inside SVG, map cards and popups.
- **Small** (400, 12px / 0.75rem): axis tick labels, value labels on marks (600 weight), source line, footer actions, tooltip sub-lines.
- **Column head** (600, 12px, uppercase, 0.04em, ink-3): table `<th>`, legend-card section headings, index section headings (0.06em on the index).

### Named Rules
**The Four Steps Rule.** Interface type uses only the four size tokens (22 / 15 / 13 / 12). Weight and ink, not extra sizes, carry emphasis: 700 for the title, 600 for values, table heads and tooltip titles, 400 elsewhere.

**The Tabular Numbers Rule.** Any number that sits in a column, an axis, or a legend count is set with tabular numerals.

## Layout

A chart page is a single flex column pinned to the viewport: `min-height: 100dvh`, padding 24px top / 32px sides / 16px bottom, 16px gap between head, controls, plot and footer. The head is capped at 72ch. The controls row (legend left, segmented toggle pushed right with `margin-left: auto`) wraps freely. The plot is `flex: 1 1 auto` with `min-height: 0`, and its SVG fills it at `width: 100%; height: 100%`, so the figure takes whatever height the iframe gives and redraws on resize via ResizeObserver. The footer is a hairline-topped row (`border-top: 1px solid grid`, 12px padding-top), source line left and actions right, both in Small / ink-3.

A map page is `position: fixed; inset: 0`, a flex column with a header strip (12px 16px 10px padding, hairline bottom rule) over a map body that takes the rest. Floating cards sit 12px from the edges: legend bottom-left, tools (search above basemap toggle) top-right, and `cardPadding()` adds their measured size to `fitBounds` so pins never hide under a card.

Under 640px: page padding tightens to 16px sides / 12px bottom with a 12px gap; the title drops one size; the map header tightens to 10px 12px 8px; the legend card collapses to a "Show key" link, is capped at 42% height and 60vw width; the search box narrows to `min(60vw, 260px)`. Charts also switch internally at their own width thresholds (bars stack their labels above the mark below 480px).

Spacing rhythm is the 4px scale (4, 8, 12, 16, 24, 32). Bar marks are capped at 24px thick; rows adapt between 20 and 30px on desktop and 42 and 48px on phones so hit targets stay finger-sized.

## Elevation & Depth

The system is flat. Charts, tables, legends and the segmented control sit directly on the page and are separated by hairlines, not by shadows. One shadow exists, and it means "this surface is floating over something else": the tooltip over the plot, the legend and tools cards, the search dropdown, MapLibre's control group and popups, and the logo markers over the map. Pins use a 1px drop-shadow filter for the same reason.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 2px rgba(27,27,27,0.08), 0 6px 16px rgba(27,27,27,0.10)`): the only box shadow. Applied to any white surface layered over the map or the plot.
- **Pin lift** (`filter: drop-shadow(0 1px 1px rgba(0,0,0,0.25))`): map pins only.

### Named Rules
**The Float Rule.** A shadow is permitted only on a surface that overlaps a map or a plot. Anything in the page's flow (title, legend, controls, footer, table) is flat and hairline-ruled.

## Shapes

Corners are near-square. The base radius is 4px (tooltip, cards, popups, search input, segmented options, logo thumbnails); keys and focus rings use 2px; the segmented control's outer frame is 6px; the 48px university logo marker is 8px. Legend swatches are 12px squares with 2px corners, 12px dots for point marks, or 16 by 3px lines for line series. Bars are square at the baseline and rounded 4px at the data end only (clip-path), so the rounding reads as a mark end, not a pill. Map circles carry a 2px white stroke; timeline dots a 2px paper stroke; treemap cells a 2px paper stroke. Every rule is 1px and rendered with `shape-rendering: crispEdges`. Focus is a 2px ink outline offset 2px.

## Components

### Buttons
The system has no filled button. Actions are text.
- **Action link** (footer): Small / ink-3, `padding: 2px 0`, no background, no border, underline that is transparent at rest and becomes `currentColor` on hover as the text turns ink. The pressed state (`aria-pressed="true"`, e.g. "Show as chart") is ink at 600. Download actions carry a 12px inline SVG arrow.
- **Card toggle** ("Show key"/"Hide key"): Label / Reference Blue, underlined, shown only under 640px.
- **Breadcrumb** (treemap): Reference Blue text buttons separated by "›" in ink-3; the current level is ink at 600 with no link.

### Chips
- **Legend key**: 12px swatch plus Label text in ink-2, optional count in ink-3 tabular. As a toggle (`<button>`) it turns ink on hover; when hidden (`aria-pressed="false"`) the text drops to ink-3 with a 1px line-through and the swatch to 25% opacity. Keys never take a background or a border.

### Segmented control
- **Frame**: inline-flex, 2px padding, 1px hairline border, 6px radius, paper background. Over a map it also takes the Float shadow.
- **Option**: Label / ink-2, `3px 10px`, 4px radius. Hover: ink text on Hover Wash. Active: paper text on ink fill. Used for basemap (Detailed / Light / Dark) and granularity (By quarter / By year); an optional leading label sits in ink-3.

### Cards / Containers
- **Map card**: absolute, paper, 4px radius, Float shadow, `10px 12px` padding, Label size, `max-width: min(92vw, 360px)`. The legend card stacks Column-head headings ("Country", "Type", size key) with 10px between blocks and lays its keys vertically. The tools card is a transparent, shadowless stack; only its children (search, segmented) carry the shadow.
- **Tooltip**: fixed, paper, 1px hairline border, 4px radius, Float shadow, `8px 10px`, max 300px. Title at 600, sub-line in Small / ink-3, then a three-column grid (swatch line, key in ink-2, value right-aligned at 600 tabular) or a plain list. One tooltip per page, positioned 12px from the pointer and flipped at the viewport edge; content is text only.
- **Map popup**: MapLibre's popup restyled to paper, 4px radius, Float shadow, Label size; title at Body size 600, sub-lines in Small / ink-3, an optional 56px image with 4px corners.

### Inputs / Fields
- **Search**: `min(92vw, 300px)`, paper, 1px hairline border, 4px radius, Float shadow, `8px 12px 8px 34px` with a 14px ink-3 magnifier SVG at left; placeholder in ink-3. Results drop 4px below in a paper, 4px-radius, Float-shadow list; rows are Label size with a muted country at right; hover and `aria-selected` take Hover Wash. Focus uses the global 2px ink outline.

### Navigation
There is none inside a figure. The index (`index.html`) is a 72ch single column: 28px H1, ink-2 lede, uppercase Column-head section headings ruled beneath, and a hairline-ruled list of links at 600 with ink-2 descriptions.

### Data table
- "Show as table" replaces the SVG with a full-width table in Label size, tabular numerals. Caption above in Small / ink-3. Sticky paper header row in Column-head style; cells `5px 10px 5px 0` with a 1px grid rule beneath; numeric columns right-aligned; rows take Hover Wash.

### Chart marks (signature)
Shared SVG classes carry the whole chart vocabulary: axis text in Small / ink-3 tabular; axis lines and gridlines 1px crisp in Axis and Grid; category labels in Label / ink; value labels in Small / ink at 600; annotations in Small / ink with 1px ink-3 leader lines; a transparent row-wide hit rectangle that takes Hover Wash; marks that dim to 35% opacity when a sibling is hovered. First draw animates 400 to 700ms with `easeExpOut` and per-item stagger, and is skipped entirely under `prefers-reduced-motion`.

### Map markers (signature)
- **Pin**: 30 by 38px teardrop, body filled with the country colour via `--pin`, a white 16px Font Awesome type icon (mosque / church / school / university / landmark) centred in the head, Pin lift shadow, scales 1.12 on hover and focus from its tip.
- **Logo marker**: 48px square, 8px radius, 2px white border, Float shadow, scales 1.08 on hover.
- **Bubble**: MapLibre circle in Series Blue at 80% opacity (100% on hover), 2px white stroke, radius `7 + 4 * sqrt(n - 1)`; the legend's size key repeats the exact radii.

Motion across all components is one easing, `cubic-bezier(0.16, 1, 0.3, 1)`, at 120 to 150ms for state changes.

## Do's and Don'ts

### Do:
- **Do** build every new figure as the head / controls / plot / footer column with the source line in the footer and "Show as table", "Download PNG", "Download SVG" as text actions.
- **Do** take colour from the country trio or the categorical palette in rank order, and fold the eighth-and-beyond series into Other Grey.
- **Do** keep axis and source type at 12px / ink-3 and never lighter than ink-3 (5.3:1).
- **Do** label values on the mark, keep the table view, and make every hit target row-wide or at least 42px tall on phones.
- **Do** reserve the Float shadow for surfaces that overlap a map or a plot.
- **Do** honour `prefers-reduced-motion` by skipping the first-draw animation, and embed Source Sans 3 into any exported SVG.

### Don't:
- **Don't** add site chrome, card frames around the plot, or a toolbar; the figure is the page.
- **Don't** generate, interpolate, or hand-pick a new hue for a series; the palette order is fixed and validated.
- **Don't** render a filled button; actions are underlined text links and the one segmented toggle.
- **Don't** put a shadow on anything in the page flow, or a border on a legend key.
- **Don't** use CARTO raster tiles or any keyed basemap; basemaps are OpenFreeMap Liberty / Positron / Dark via MapLibre.
- **Don't** introduce a second typeface, a fifth interface size, or non-tabular numerals in a column.
