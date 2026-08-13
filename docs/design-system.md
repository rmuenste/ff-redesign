# FeatFloWer Redesign Design System

This document captures the design system implied by the current `ff-redesign`
prototype. It is intended as a practical reference for migrating benchmark
content from `ff-angular` and extending the redesign later.

## Design Direction

The redesign uses a dark-first, technical research interface for a benchmark
catalogue. It should feel institutional, precise, and data-oriented rather than
marketing-led.

Core traits:

- Restrained surfaces with thin borders and low-radius cards.
- Dense but readable benchmark data, tables, controls, and plots.
- TU Dortmund green as the strongest brand marker.
- Petrol, orange, yellow, blue, and violet as supporting chart and status hues.
- Mono typography for measurement, metadata, status, filters, and code-like text.
- Serif typography only for editorial emphasis and large section headlines.
- Flow-field animation and mesh thumbnails as signature technical visuals.

Avoid:

- Decorative card stacks for entire page sections.
- Large rounded UI elements beyond pills/chips.
- One-off colors outside the token palette.
- Unverified status, build, DOI, or catalogue-count claims.
- Mock benchmark entries presented as real content.

## Token Sources

Primary token source:

- `assets/tokens.css`

Redesign-specific overrides and utility classes:

- `src/styles.css`

Runtime theme controls are applied with body data attributes:

```html
<body data-theme="dark" data-primary="green" data-density="comfortable">
```

## Color System

### Brand And Support Palettes

Use the named CSS variables from `assets/tokens.css`.

- TU green: `--tu-green-50` through `--tu-green-900`
- TU petrol: `--tu-petrol-50` through `--tu-petrol-900`
- Orange accent: `--tu-orange-300`, `--tu-orange-500`, `--tu-orange-700`
- Red warning/error: `--tu-red-300`, `--tu-red-500`, `--tu-red-700`
- Chart support: `--tu-yellow-500`, `--tu-blue-500`, `--tu-violet-500`
- Neutrals: `--neutral-0` through `--neutral-950`

### Semantic Colors

Components should prefer semantic variables over raw palette values:

- `--bg`: page background
- `--surface`: main panel/card/nav surface
- `--surface-alt`: secondary panel/control background
- `--surface-sunken`: inset or depressed surface
- `--fg1`: primary text
- `--fg2`: secondary text
- `--fg3`: muted/disabled text
- `--divider`: borders and separators
- `--primary`: current primary brand/action color
- `--primary-hover`: primary hover state
- `--primary-press`: primary pressed state
- `--on-primary`: text/icon color on primary
- `--accent`: secondary emphasis
- `--warn`: destructive/error state
- `--success`: positive status
- `--info`: informational status
- `--link`: link color
- `--link-visited`: visited link color

### Themes

Supported theme attributes:

- `data-theme="dark"`
- `data-theme="light"`

The prototype is dark-first. Light mode exists, but new components should be
checked against both modes.

### Primary Variants

Supported primary-color attributes:

- `data-primary="green"`
- `data-primary="petrol"`
- `data-primary="orange"`

Green should remain the default for FeatFloWer/TU Dortmund identity. Petrol and
orange are useful for previewing accents or future sub-brands, but should not be
used arbitrarily within a single page.

## Typography

Defined font stacks:

- Sans: `--font-sans` = Inter
- Serif: `--font-serif` = IBM Plex Serif
- Mono: `--font-mono` = JetBrains Mono

Type tokens:

- `--fs-display`: hero/display headlines
- `--fs-h1` through `--fs-h5`: heading scale
- `--fs-body`: default body text
- `--fs-body-sm`: compact body text
- `--fs-caption`: captions and small support text
- `--fs-overline`: overline labels

Line-height tokens:

- `--lh-tight`
- `--lh-snug`
- `--lh-normal`
- `--lh-loose`

Weight tokens:

- `--fw-light`
- `--fw-regular`
- `--fw-medium`
- `--fw-semibold`
- `--fw-bold`

Typography classes:

- `.display`: large sans display headline
- `.h-editorial`: serif editorial headline
- `.mono`: compact mono utility
- `.overline`: uppercase mono label
- `.measure`: muted uppercase mono measurement label
- `.num`: large numeric display with tabular numeric behavior

Guidelines:

- Use `.display` for first-viewport or page-level titles only.
- Use `.h-editorial` for large narrative section headings.
- Use mono text for run metadata, tags, filters, plot axes, table labels, and
  status indicators.
- Do not scale font sizes directly with viewport width except for display/page
  titles that already use constrained `clamp(...)` patterns.

## Spacing, Radius, Shadow, Motion

Spacing tokens:

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px
- `--space-20`: 80px
- `--space-24`: 96px

Radius tokens:

- `--r-sm`: 2px
- `--r-md`: 4px
- `--r-lg`: 8px
- `--r-xl`: 12px
- `--r-pill`: 999px

Default UI radius is `4px`. Use pill radius only for chips, badges, and small
status capsules.

Shadow tokens:

- `--shadow-1`
- `--shadow-2`
- `--shadow-3`
- `--shadow-4`
- `--shadow-toolbar`

Shadows should be subtle. Most regular cards should rely on borders rather than
elevation.

Motion tokens:

- `--dur-fast`
- `--dur-base`
- `--dur-slow`
- `--ease-std`
- `--ease-in`
- `--ease-out`

Use motion for state changes and lightweight appearance transitions. Data views
should prioritize clarity over animation.

## Layout

Layout tokens:

- `--toolbar-h`: sticky nav height
- `--content-max`: primary content width
- `--content-narrow`: prose width

Layout classes:

- `.section`: standard constrained page section
- `.section-narrow`: constrained prose section
- `.rule`: horizontal divider
- `.v-rule`: vertical divider
- `.section-marker`: numbered/editorial section starter

Common page structure:

1. Sticky navigation.
2. Page header with overline, display title, short explanatory copy.
3. Optional sticky control bar for filters or benchmark controls.
4. Main content area with cards, tables, plots, media, and downloads.
5. Footer.

Benchmark detail pages should use:

- Header with breadcrumb, chips, title, summary, and KPIs.
- Tab row under the header.
- Main grid with left-side controls and right-side content for plot-heavy pages.
- Full-width prose/media/table sections for definition and reference-data tabs.

## Reusable Primitives

Current primitive components live in `src/Primitives.jsx`.

### `Icon`

Material Icons wrapper.

Use for:

- Navigation affordances.
- Buttons.
- Compact controls.

### `Chip`

Small uppercase mono badge.

Tones:

- `default`: muted surface badge.
- `solid`: primary filled badge.
- `ghost`: transparent badge.
- `accent`: orange/accent badge.

Use for:

- Benchmark tags.
- Dimensions.
- Physics/model labels.
- Status summaries.

### `Overline`

Uppercase mono label.

Use for:

- Section labels.
- Plot metadata.
- Control group labels.
- Small technical headers.

### `Btn`

Button primitive.

Variants:

- `primary`
- `stroked`
- `ghost`
- `accent`

Sizes:

- `sm`
- `md`
- `lg`

Guidelines:

- Use icons in buttons when the action is tool-like.
- Use primary buttons sparingly for the main action in a region.
- Use stroked buttons for secondary actions.
- Use ghost buttons for low-emphasis local actions.

### `FlowCanvas`

Animated flow-field background.

Use for:

- Homepage hero.
- Catalogue/page headers.
- Technical ambience behind a short header region.

Do not use as a heavy decorative background behind dense content or tables.

### `VerdictChip`

Semantic status badge for validation ledgers.

Verdicts:

- `PASS`: gate met.
- `RECORDED`: measured and kept, but not gated.
- `RESOLVED`: issue investigated and closed.
- `OPEN`: still under investigation.
- `FAIL`: gate not met.

Styling lives in `src/styles.css` as `.verdict-*` rather than inline, because the
bright brand hues need darker values in light mode. The badge always renders its
literal verdict word, so colour is never the only status signal.

### `ValidationLedger`

Table of validation claims: case, quantity, expected, measured, gate, verdict.

Rows are **generated** from a campaign datasheet by the benchmark's converter
(`scripts/lib/validation-ledger.mjs`) and imported as JSON from
`src/data/generated/`. They are never hand-transcribed, so a corrected datasheet
reaches the site by re-running the converter. Internal scheduler job ids are
stripped during generation; everything else is kept verbatim as provenance.

### `MeshThumb`

SVG mesh/result thumbnail abstraction.

Use for:

- Benchmark cards.
- Gallery placeholders.
- Catalogue thumbnails when no real render is available.

When real benchmark images or videos exist, prefer the real asset for content
inspection and use `MeshThumb` as a fallback.

## CSS Utility Components

Current utility classes in `src/styles.css`:

- `.btn`, `.btn-primary`, `.btn-stroked`, `.btn-ghost`
- `.chip`, `.chip-solid`
- `.card`, `.card-interactive`
- `.tabs`, `.tab`
- `.focus-ring`
- `.bg-grid`
- `.flow-canvas`
- `.tt` (absolutely positioned **tooltip** — not an inline-code span)
- `.code-inline` (inline code span)
- `.verdict`, `.verdict-pass|recorded|resolved|open|fail`
- `.code-row`, `.code-dot`
- `.fade-up`

Future React components should wrap these patterns so new pages do not keep
adding large inline style blocks.

## Application Patterns

### Navigation

The nav is sticky, translucent, and blurred:

- Background: mixed `--bg` with transparency.
- Bottom border: `--divider`.
- Height: 64px.
- Active route uses `--surface-alt`.

The brand lockup uses the circular green technical mark and TU Dortmund/LS3
metadata.

### Page Headers

Use:

- Overline.
- Large display title.
- Short copy in `--fg2`.
- Optional subtle `FlowCanvas` behind the header.
- Border bottom for separation.

### Cards

Cards are:

- `--surface` background.
- `1px` `--divider` border.
- `4px` radius.
- No default heavy shadow.
- Primary border on hover for interactive cards.

Cards should be used for repeated items, contained tools, or modal-like content.
Do not wrap whole page sections in decorative cards.

### Tabs

Tabs are text tabs with a thin active underline:

- Inactive: `--fg2`.
- Hover/active: `--fg1`.
- Active underline: `--primary`.

Use tabs for benchmark-detail sections such as:

- Introduction
- Definition
- Results
- Contact Model
- Validation
- Simulation
- Reference Data
- References
- Conclusion

### Tables

Table style:

- Full-width.
- Collapsed borders.
- Mono uppercase headers.
- Thin divider rows.
- Numeric columns right-aligned.
- Status values shown as chips or color-coded mono values.

Tables should prioritize scanability over decoration.

### Forms And Controls

Patterns already present:

- Search input with icon inside surface-alt field.
- Segmented controls for filters, views, and plot modes.
- Range slider with `.tu`.
- Checkbox-like square toggles for code/compare selection.
- Sticky filter bar for catalogue controls.

Controls should use mono labels and compact sizing.

### Plots

Current prototype plots use hand-built SVG with **synthetic data**
(`generateSeries()` / `Math.random()`). The migrated site uses Plotly for parity
with `ff-angular`, fed only by real Angular JSON assets (which are already in
Plotly trace format: `x, y, type, mode, name, marker`).

Plot styling should preserve:

- Dark technical background (transparent plot area over `--surface`).
- Thin gridlines using `--divider`.
- Mono axis labels.
- Series colors from token palette.
- Primary highlight for FeatFloWer.
- Series (code or level), metric, baseline, and export controls adjacent to the plot.

### Comparison Model

The signature improvement over the original single-page layout is a reusable
**comparison component** (`ComparisonPanel`) that plots one metric across several
selectable **series**. A series has a `kind`:

- `code` — a different simulator/codebase (e.g. 2D rising bubble: FeatFloWer,
  TP2D, MooNMD, NaSt3D, FreeFEM).
- `level` — a mesh resolution of the same code (e.g. Rising Bubble 3D: L1/L2/L3).
- `reference` — published or analytical reference data (typically dashed).

This single component compares codes for benchmarks that have multi-code data, and
mesh levels for those that do not, degrading gracefully to a single series. Series
are **always backed by real assets** — never generated. FeatFloWer is highlighted
with `--primary`. Compare modes (`overlay`, `diff` vs. a baseline,
`small-multiples`) are offered only where the data supports them.

### Benchmark Catalogue

Catalogue pattern:

- Header with benchmark count and explanation.
- Sticky filter/search bar.
- Grid/table view toggle.
- Compare tray for selected benchmarks.
- Benchmark cards with thumbnail, tags, title, model, Re, levels, suite, and
  status.

Catalogue facets are **Suite**, **Model** and **Dim**. `suite` groups benchmarks
by the programme that produced them (currently `Core benchmarks` and
`DNS validation`); its filter options are derived from the registry via
`benchmarkSuites`, so adding a new suite requires no filter edit.

During migration, only real benchmarks from `ff-angular` should appear as
production entries.

### Benchmark Detail

Detail pattern:

- Breadcrumb back to catalogue.
- Benchmark chips.
- Title and technical summary.
- KPI grid.
- Tabs.
- Left control rail for plot-heavy result views.
- Main content region for plot, table, prose, figures, downloads, and references.

The current `BenchmarkDetail.jsx` is modeled on the **2D rising bubble** (metric
`circularity(t)`, six codes FeatFloWer/TP2D/MooNMD/NaSt3D/FreeFEM/Reference) and
uses **synthetic data** (`generateSeries()`). It should become a data-driven
benchmark page shell whose plots are the real-data `ComparisonPanel` (see
[Comparison Model](#comparison-model)). The first migrated benchmark is Rising
Bubble 3D, which compares mesh **levels** rather than codes.

### Gallery

Gallery pattern:

- Header with title and summary.
- Tag filters.
- Masonry-style cards.
- Modal detail view.

Use actual benchmark imagery when available. Mesh thumbnails are acceptable as
fallbacks.

## Benchmark Migration Components To Add

To support migrated `ff-angular` content, add these reusable components:

- `BenchmarkPage`
- `PageHeader`
- `BenchmarkTabs`
- `KpiGrid` / `KpiBox`
- `DataTable`
- `DownloadTable`
- `ReferenceList`
- `Equation`
- `Figure`
- `VideoBlock`
- `ComparisonPanel` (real-data, series-based; see Comparison Model)
- `PlotPanel`
- `SeriesSelector` (toggles series of kind code/level/reference)
- `MetricSelector`
- `LevelSelector`
- `ReferenceDataSection`

These should consume structured data modules instead of page-specific inline
markup whenever possible.

## Content Rules

Use structured content modules for:

- Benchmark registry metadata.
- Page summaries.
- Introduction and definition sections.
- Table schemas and rows.
- Download lists.
- References and bibliography.
- Image/video assets.
- Plot data mappings.

Keep prose exact when preserving scientific benchmark definitions, but fix
obvious typos only as an intentional migration decision.

Math should be rendered through MathJax (via `better-react-mathjax`, with AMS
support to match `ff-angular`). Do not leave formulas as fragile plain text.

## Accessibility And Interaction

Required behavior for production components:

- All interactive controls must be keyboard reachable.
- Use visible focus via `--ring`.
- Tabs must have keyboard behavior and ARIA roles.
- Icon-only buttons need accessible labels or tooltips.
- Color cannot be the only indicator of status.
- Tables need semantic headers.
- Plot controls need labels and clear selected states.
- Reduced-motion preferences should disable or reduce `FlowCanvas` animation.

## Known Gaps

The design system is currently implicit and prototype-oriented.

Gaps to close:

- Many layout and component styles are inline in JSX.
- Primitive component APIs are not fully documented in code.
- Responsive behavior is not centralized.
- Real data visualization styling is not finalized.
- Some mock catalogue entries and fake run metadata must be removed or replaced.
- Light theme needs visual QA.
- Accessibility behavior for tabs, compare tray, and custom controls needs work.

## Recommended Next Steps

1. Move repeated inline styles into reusable components.
2. Create structured benchmark content/data modules.
3. Replace the hardcoded detail page with a generic benchmark page shell.
4. Add MathJax or KaTeX support.
5. Add real plot components and port the Angular plot-data transformations.
6. Audit dark/light themes and responsive layouts.
7. Keep this document updated as components become formalized.
