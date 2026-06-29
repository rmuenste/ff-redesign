# React Migration Plan For FeatFloWer Redesign (Revised)

## Summary

The redesign is React, so the migration is a React/Vite/TypeScript implementation,
not an Angular component translation. The source of truth for **content and data**
remains `ff-angular`; `ff-redesign` becomes a real React app with structured
benchmark content, reusable design-system components, Plotly charts, MathJax
formulas, curated assets, and clean browser routes.

The redesign's defining idea is kept and promoted to a first-class feature: instead
of squashing a benchmark onto one long page, each benchmark is presented through a
**multi-series comparison component**. This is the centerpiece of the new detail
page, not an afterthought.

Decisions locked for v1:

- App stack: Vite + React + TypeScript.
- Routing: React Router browser routes, reusing the Angular slugs (e.g.
  `/benchmarks/bubble3`, `/benchmarks/2d-rising-bubble`, `/benchmarks/fac3`,
  `/benchmarks/particle-sedimentation`).
- First vertical slice: Rising Bubble 3D.
- Plot/formula stack: Plotly + modern MathJax (via `better-react-mathjax` or an
  equivalent MathJax v3+ React integration).
- Comparison component is a reusable, data-driven primitive shared by all benchmarks.
- Assets: curated copy from Angular assets into a stable redesign namespace.
- Text policy: preserve scientific content, light-edit typos/HTML defects.
- Existing prototype: archive a runnable copy before replacing it as the active app.
- **No synthetic series.** Every plotted trace comes from real migrated source
  data: Angular JSON assets, Angular text assets, or curated reference files.

Implementation status as of the final benchmark pass:

- Stage 0 through the final Particle Sedimentation migration pass are complete.
- The shared comparison engine now supports RB3 trace variants and RB2's explicit
  single-select level axis with multi-toggle code series.
- RB2 uses canonical copied assets under `public/benchmark-assets/rb2`, with the
  public manifest preserving Angular `oldPath` provenance.
- FeatFloWer is intentionally sparse in RB2: it appears only for Case 2 shape,
  circularity, and mass, matching the available Angular data.
- RB2 has no video asset or video block; Angular's `risingbubble2.mp4` belongs to
  the existing RB3 page and is not propagated to RB2.
- FAC is active at `/benchmarks/fac3`; its Drag/Lift result images were replaced
  by live Plotly plots derived from `BenchValues.txt`, while Z-Force remains
  download-only.
- Particle Sedimentation is active at `/benchmarks/particle-sedimentation`; its
  Angular static Velocity/Position images were replaced by live Plotly plots from
  converted simulation txt data and PIV references. The `sedimentation.zip`
  download is generated from the migrated simulation and PIV download files.

## Ground Truth About The Current Code (verified)

These facts shaped the revision and correct earlier assumptions:

- **The prototype is a static, runtime-compiled React prototype.**
  `FeatFloWer Redesign.html` loads React 18 and `@babel/standalone` from CDN and
  pulls each `.jsx` via `<script type="text/babel">`. Components are **global
  functions** (no `import`/`export`), routing is a `useState` string persisted to
  `localStorage` (`ff_route`), and there is an edit-mode "tweak" system
  (`/*EDITMODE-BEGIN*/`, `.mode-sheet`). Stage 0 is therefore a real conversion,
  not "add Vite alongside."
- **`BenchmarkDetail.jsx` is modeled on the 2D rising bubble, not RB3**, and its
  series are synthetic: metric `circularity(t)`, six codes
  (FeatFloWer/TP2D/MooNMD/NaSt3D/FreeFEM/Reference) generated with
  `Math.random()` via `generateSeries()`. The multi-code comparison UI is good; its
  data must be replaced with real Angular data.
- **RB3 has no competitor-code data.** It is FeatFloWer across **3 mesh levels**
  (L1/L2/L3) × **4 metrics** (sphericity, mass conservation, size, surface), with
  per-timestep checkboxes. Its "Reference Data" tab is a format description plus
  download links, not a code comparison.
- **2D rising bubble is the genuinely multi-series benchmark.**
  `benchmark-plot.service.ts` assembles Case 1 / Case 2 from multiple real files
  (`c2g1l7`, `c2g2l1`, `ff_`, `down_`, …); each series `name` lives in the JSON.
- **Angular JSON assets are already Plotly trace objects** (`x, y, type, mode,
  name, marker`). The 1,884-line `data.service.ts` is mostly fetching these
  pre-formatted traces and wrapping them in layouts — so the "transform" work is
  primarily **series assembly + theming**, not numeric computation. We extract only
  the per-benchmark assembly we need as small pure functions; we do not port the
  service.

## The Series / Comparison Model (new, central)

The redesign's comparison component is generalized so it can be reused across every
benchmark and is always backed by real data.

A **SeriesGroup** is the comparable unit shown to the user. Depending on the
benchmark, a group may represent a code, a mesh level, or a reference dataset. A
group can contain one or more Plotly traces. This distinction matters because RB3
files contain arrays of traces: for example, one level contains multiple
time-resolution traces, and the size metric contains paired size components.

The group's `kind` describes what is being compared:

- `code` — a different simulator/codebase (e.g. 2D rising bubble: FeatFloWer, TP2D,
  MooNMD, NaSt3D, FreeFEM).
- `level` — a mesh resolution of the same code (e.g. RB3: L1/L2/L3).
- `reference` — published/analytical reference data.

```ts
interface SeriesGroup {
  id: string;
  label: string;          // from the JSON `name` field where present
  kind: 'code' | 'level' | 'reference';
  color: string;          // design token; FeatFloWer/default level highlight uses --primary
  dash?: string;          // e.g. reference dashed
  source: PlotSource;     // real asset; never generated
  highlight?: boolean;    // FeatFloWer is highlighted
}

type PlotSource =
  | { kind: 'single-trace'; asset: AssetRef }
  | { kind: 'trace-array'; asset: AssetRef }
  | { kind: 'segmented-shape'; asset: AssetRef; segmentSize: number };

interface TraceVariant {
  id: string;
  label: string;          // e.g. dt label or component label
  sourceTraceIndex: number;
  defaultVisible: boolean;
}
```

The comparison component (`ComparisonPanel`) renders one metric across the selected
series groups, with:

- A `SeriesSelector` (toggle codes/levels/reference groups on and off).
- A `MetricSelector` (sphericity / mass / size / surface, circularity / rise
  velocity / etc.).
- A `TraceVariantSelector` when a selected source contains multiple traces per group
  (RB3's time-step/component filters).
- Compare modes carried over from the prototype where data supports them:
  `overlay`, `diff` (vs. a chosen baseline), `small-multiples`.
- FeatFloWer always highlighted via `--primary`.

This lets RB3 compare **levels** (real) and 2D rising bubble compare **codes**
(real) through the *same* component, with graceful degradation to a single series
and **no synthetic curves**.

## Stages And Stage Goals

### Stage 0: App Foundation

Goal: make `ff-redesign` a maintainable React app without losing the prototype
reference.

- Add Vite + React + TypeScript project structure: `package.json`, `index.html`,
  `src/main.tsx`, `src/App.tsx`.
- **Convert the prototype's global components to ES modules** (`import`/`export`),
  replace CDN React + `@babel/standalone` with bundled dependencies, and replace the
  `localStorage` route switch with React Router browser routes.
- **Drop the edit-mode / tweak system** (`EDITMODE` markers, `.mode-sheet`,
  density tweaker) for v1; it is a design-prototyping tool, not product. Keep a
  simple theme toggle only.
- Archive a runnable copy of the current prototype under `legacy-static/` so its
  visual design stays inspectable.
- Keep `assets/tokens.css`, `src/styles.css`, and `docs/design-system.md` as the
  design-system baseline.
- Dependencies: `react`, `react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`,
  `react-router-dom`, `plotly.js-dist-min`, `react-plotly.js`, `better-react-mathjax`.
- Browser routes:
  - `/`
  - `/benchmarks`
  - `/benchmarks/:benchmarkId`
  - `/gallery`
- Preserve dark theme defaults with `data-theme="dark"`, `data-primary="green"`.
  Pick one density default (the prototype is inconsistent: body says `comfortable`,
  tweaks say `compact`) — use `compact`.
- Configure Vite `base` from `VITE_BASE_PATH`, defaulting to `/`. Production deploys
  set this to the final TU/LS3 subpath; local development and tests use `/`.
- Configure SPA `index.html` fallback so browser routes refresh.

### Stage 1: Design-System Component Layer (interleaved with Stage 3)

Goal: turn the redesign's implicit UI patterns into reusable React components —
**built on demand as the RB3 slice needs them**, not speculatively up front. The RB3
slice defines the component APIs.

Build up front (needed by every page):

- App shell: `Nav`, `Footer`, `PageHeader`, `Section`, `Tabs`.
- Primitives: `Button`, `Chip`, `Icon`, `Overline`, `Card`, `Metric`, `KpiBox`.

Build while doing Stage 3 (RB3 drives the API):

- Benchmark UI: `BenchmarkCard`, `BenchmarkTable`, `BenchmarkPage`, `BenchmarkHero`,
  `DownloadTable`, `ReferenceList`, `DataTable`, `Figure`, `VideoBlock`.
- Scientific UI: `Equation`, `ComparisonPanel`, `PlotPanel`, `SeriesSelector`,
  `MetricSelector`, `TraceVariantSelector`, `LevelSelector`, `ContentRenderer`.

Defer to Stage 5 (built as later benchmarks demand): compare-mode `diff` /
`small-multiples`, `CodeSelector` specialization, gallery components.

Component behavior:

- Use design tokens and CSS classes from the extracted design system; reduce repeated
  inline styles into components.
- Keyboard focus with visible focus rings; ARIA roles for tabs and selectors.
- Icon-only buttons receive accessible labels.

### Stage 2: Data And Content Architecture

Goal: define stable data contracts before migrating content.

Typed data modules:

- Benchmark registry.
- Benchmark content sections.
- Tables.
- Figures/videos.
- Downloads.
- References.
- **Series group + plot definitions** (see the SeriesGroup model above).

Important public TypeScript shapes:

- `BenchmarkMeta`: id, slug, title, shortTitle, tag, model, dimension, reynolds,
  levels, summary, heroAsset, routes, tabs.
- `BenchmarkContent`: benchmark id, tab definitions, intro/definition/results/
  reference sections.
- `ContentBlock`: paragraph, heading, equation, table, figure, video, download
  table, reference list, callout.
- `ContentRenderer`: renders `ContentBlock[]` into the design-system components so
  benchmark tab content is not hand-coded repeatedly.
- `DataTableSpec`: columns with labels/render type plus row data.
- `SeriesGroup`: as defined above (`kind` = code | level | reference).
- `PlotSource`: describes whether a JSON asset is one trace, a trace array, or
  segmented shape data.
- `TraceVariant`: per-trace selector metadata for trace-array sources.
- `PlotSpec`: id, title, metric, comparisonAxis (`code` | `level`),
  seriesGroups[], traceVariants[], default selection, default baseline (for diff
  mode).
- `AssetRef`: stable path, alt text, caption, source benchmark.

Content rules:

- Preserve scientific meaning from Angular; light-edit obvious typos and broken HTML.
- Remove mock claims (run dates, DOIs, build status, catalogue counts) unless backed
  by real data.
- Only show production catalogue entries for migrated real benchmarks.

Asset loading:

- Serve curated JSON as **static assets fetched at runtime** from `public/`
  (mirrors Angular's `HttpClient` pattern), rather than importing JSON into bundles.
- All plot series groups resolve to real assets; no plot source may be generated in
  application code.
- Formula rendering uses modern MathJax v3+ configuration. Legacy Angular MathJax v2
  `Hub.Config` behavior is not preserved; formulas are either normalized during
  migration or supported through explicit MathJax macro configuration.

#### Asset Naming Cleanup And Manifest

The Angular data files are inconsistently named and must be renamed during the
curated copy. `ff-angular` keeps its original names (it stays the source of truth);
the renaming happens only on the copy into the redesign namespace, mediated by a
checked-in manifest so the mapping is reviewable and reproducible. File **contents
are unchanged** — only paths change (the series label lives in each file's internal
`name` field, not the filename).

Observed problems to fix:

- Synonym metrics for the same quantity: `rise_velocity` vs `rise_vel`,
  `mass` / `bubble_mass` (plot data) vs `mass_conservation` (download copy).
- Mixed casing: `bubbleMass` / `bubbleShape` (camelCase) vs `bubble_mass` (snake).
- Opaque names: trailing-`s` shape files (`c2g1l4s.json`), `cir1..cir5.json`,
  `c1g1s.json`, `down_*`, and the group index `g1/g2/g3` whose code identity is only
  recoverable from each file's `name` field.

Canonical convention (kebab-case throughout):

```
public/benchmark-assets/{slug}/
  plots/{metric}/{seriesGroupId}.json # one source file per comparable group/metric
  downloads/{name}.json|.txt|.zip     # user-facing download copies
  media/{descriptive-name}.{png,mp4}
```

- `metric` ids come from a **canonical vocabulary** that collapses synonyms:
  `mass` (covers `bubble_mass`, `mass`, `mass_conservation`), `rise-velocity`
  (covers `rise_velocity`, `rise_vel`), `center-of-mass` (`com`), `shape` (the
  trailing-`s` / `bubbleShape` files), plus the distinct quantities `circularity`
  (2D), `sphericity` (3D), `size`, `surface`.
- `seriesGroupId` encodes the comparison axis: levels as `l1`/`l2`/`l3`;
  codes/groups as a slug **derived from the file's `name` field** plus needed
  disambiguators (e.g. `featflower-l3`, `tp2d-l7`), never invented.
- A checked-in curated `manifest.json` per benchmark records `oldPath -> newPath`,
  plus the derived `metric`, `seriesGroupId`, `kind`, `label`, and source shape
  (`single-trace`, `trace-array`, or `segmented-shape`). A small copy script consumes
  and validates the manifest so copying/renaming is reproducible. Helper scripts may
  propose manifest entries, but the manifest is reviewed source of truth.

### Stage 3: Rising Bubble 3D Vertical Slice

Goal: migrate one benchmark end-to-end, and prove the **comparison-first** detail
page on real data.

Migrate `/benchmarks/bubble3` first.

Content:

- Port Introduction, Definition, Results, and Reference Data tabs.
- Port mesh and physical-parameter tables.
- Port formulas through `Equation` using modern MathJax. Normalize legacy formula
  shorthand or add explicit macros where needed; do not preserve the old Angular
  MathJax v2 implementation.
- Port `geometry3D.png` and `risingbubble2.mp4`.
- Port reference-data documentation and JSON download links.

Comparison component on RB3:

- RB3 has **only FeatFloWer data** — there are no competitor codebases and no
  reference dataset to compare against. The comparison axis is therefore
  `comparisonAxis = 'level'`, and the only series groups are the **mesh levels
  L1/L2/L3** (all `kind: 'level'`, all FeatFloWer). No `code` or `reference` series
  groups exist here.
- Metrics: sphericity, mass conservation, bubble size, bubble surface.
- Preserve Angular parity first: one selected level group at a time, with
  per-timestep/component filters inside that level, matching `FilterablePlotComponent`.
  Multi-level overlay can be added later for a selected trace variant, but it is not
  part of the RB3 vertical-slice acceptance target.
- This validates the comparison UI, selectors, and theming **without** taking on 2D's
  multi-case transforms.

Plots:

- Extract **only** the RB3 assembly from Angular as small pure functions (input: the
  Plotly-trace JSON files keyed `RB3sphericityL{1..3}`, `RB3bubble_massL{1..3}`,
  `RB3sizeL{1..3}`, `RB3surfaceL{1..3}`; output: the active level's themed Plotly
  traces + layout, filtered by selected trace variants). Do not port
  `data.service.ts`.
- Apply redesign theme to Plotly: transparent plot background, token-based grid/text
  colors, series colors from design tokens, FeatFloWer in `--primary`.
- Lazy-load Plotly and the benchmark-detail route (Plotly is ~3–4 MB) so the
  homepage and catalogue do not pay its cost.

Assets (copy only what this slice needs) into `public/benchmark-assets/rb3/`, applying
the naming convention. Old → new for RB3:

```
data/RB3sphericityL{1,2,3}.json   -> plots/sphericity/l{1,2,3}.json
data/RB3bubble_massL{1,2,3}.json  -> plots/mass/l{1,2,3}.json
data/RB3sizeL{1,2,3}.json         -> plots/size/l{1,2,3}.json
data/RB3surfaceL{1,2,3}.json      -> plots/surface/l{1,2,3}.json
files/bubble3/sphericity.json         -> downloads/sphericity.json
files/bubble3/mass_conservation.json  -> downloads/mass.json   # unify metric id
files/bubble3/size.json               -> downloads/size.json
files/bubble3/surface.json            -> downloads/surface.json
geometry3D.png                    -> media/geometry-3d.png
risingbubble2.mp4                 -> media/rising-bubble.mp4
```

RB3 is the simplest case (only a `level` axis), so it also serves as the first
exercise of the rename manifest before the harder 2D set.

Acceptance for Stage 3:

- `/benchmarks/bubble3` is fully navigable from the benchmark index and refreshes
  directly (SPA fallback works).
- Prose, tables, formulas, figures, video, downloads, and the comparison panel render.
- Comparison data comes from real JSON assets, not generated mock curves.
- RB3 plot count, trace labels, trace filtering behavior, mesh table rows, and
  physical-parameter table rows match the Angular source.
- Plotly is lazy-loaded with the benchmark-detail route and is not in the initial
  homepage chunk.
- Every copied RB3 asset is referenced through the manifest, and every manifest entry
  resolves to a file.
- No fake run date, DOI, build status, catalogue size, or synthetic benchmark status
  remains on the RB3 page.

### Stage 4: Catalogue And Homepage Cleanup

Goal: make navigation and entry points truthful.

Benchmark index:

- Replace the mock catalogue with real registry-driven entries.
- Initially show only migrated RB3 as active.
- Show the remaining real Angular benchmarks (2D rising bubble, FAC 3D, particle
  sedimentation) as "planned," only if a non-production planned state is visually
  distinct.
- Keep filters and grid/table toggle, operating on registry data.
- The catalogue card may surface each benchmark's comparison axis (codes vs. levels)
  so the comparison feature is visible at the index level.

Homepage:

- Retain redesign visual structure (FlowCanvas, mesh thumbnails, restrained cards).
- Replace unverified metrics and latest-run widgets with real content or neutral copy.
  Most synthetic metadata lives in `Home.jsx` and `BenchmarksIndex.jsx`.
- Feature only real benchmark entries.

Gallery:

- Treat the current gallery as placeholder. Either hide it from primary nav until
  real assets are mapped, or clearly mark entries as visual placeholders.
- Do not present synthetic gallery entries as real simulation output.

### Stage 5: Remaining Benchmark Migration

Goal: repeat the proven pattern, and prove the comparison component on its **second
axis (codes)**.

Completed in this order:

1. **2D Rising Bubble** — promoted earlier in the order because it is the real
   multi-**code** comparison (Case 1 / Case 2; series from `c2g*`, `ff_`, `down_`
   files with `name` labels). This validates `comparisonAxis = 'code'`, the
   `diff`/`small-multiples` modes, and case switching. It carries the most complex
   assembly, so do it with the comparison machinery already battle-tested on RB3.
2. **Flow Around Cylinder 3D** — prose-heavy: tables, figures, reference-data table,
   conclusion/bibliography.
3. **Particle Sedimentation** — content, tables, setup image, generated
   Velocity/Position Plotly data, PIV references, per-case downloads, and a
   converter-generated `sedimentation.zip` built from the available migrated
   downloads.

For each benchmark:

- Add registry metadata (with the existing Angular slug).
- Add structured content tabs.
- Copy curated assets into `public/benchmark-assets/{slug}/` using the naming
  convention and manifest. For 2D rising bubble specifically, decode the opaque
  `c{case}g{group}l{level}` files by reading each file's internal `name` field to
  derive a meaningful `seriesGroupId`/`label` and its `kind` (code vs. reference),
  rather than guessing the `g1/g2/g3` identity from the filename.
- Port tables and downloads.
- Add formulas through modern MathJax, normalizing legacy formulas/macros as needed.
- Define `SeriesGroup` and `PlotSource` from real JSON only; wire into
  `ComparisonPanel`.
- Add route `/benchmarks/{slug}`.
- Add index card and table row.

### Stage 6: Parity QA And Hardening

Goal: verify the migrated site is usable and faithful.

- Compare each migrated page against its Angular source for content presence.
- Verify all downloads resolve.
- Verify all images/videos have alt text or captions.
- Verify formulas render without MathJax errors using the modern MathJax integration
  and any configured macros.
- Verify Plotly charts and the comparison panel render at desktop and mobile widths,
  and that Plotly is lazy-loaded (not in the initial homepage bundle).
- Verify keyboard access for nav, tabs, filters, series/metric selectors, compare-mode
  controls, and downloads.
- Verify browser routes refresh correctly with static-host fallback and
  `VITE_BASE_PATH=/` plus one non-root test subpath.
- Run production build and preview.

## Test Plan

- TypeScript build passes.
- Vite production build passes.
- Unit tests for benchmark registry validity and content schema completeness.
- Unit tests for the RB3 plot-assembly functions using representative JSON fixtures.
- Unit test asserting **no series group has a generated/synthetic source** (every
  `SeriesGroup` resolves to a real asset).
- Manifest validation: every registry/`SeriesGroup` path resolves to a file in
  `public/benchmark-assets/`, every copied file is referenced by the registry (no
  orphans), and each manifest entry has a canonical `metric` id and a
  `seriesGroupId`.
- Component tests for tabs, data tables, download tables, `SeriesSelector`,
  `TraceVariantSelector`, `MetricSelector`, and `ComparisonPanel` (overlay mode,
  single-series-group degradation).

Manual acceptance scenarios:

- Load `/`, `/benchmarks`, `/benchmarks/bubble3`, and `/gallery`.
- Refresh directly on `/benchmarks/bubble3`.
- Switch RB3 tabs.
- In the RB3 comparison panel, toggle levels L1/L2/L3, switch metrics, and change
  time-step filters.
- Open/download each RB3 reference-data file.
- Toggle light/dark theme.
- Check mobile layout for nav, benchmark index, and the RB3 detail/comparison page.

## Assumptions

- The deployment host serves `index.html` as a fallback for browser routes. The app
  uses `VITE_BASE_PATH`, default `/`, and production deployment supplies the final
  subpath value.
- The prototype is a useful visual archive but should not remain the active app.
- RB3 is the first vertical slice and proves the comparison component on the **level**
  axis; 2D rising bubble proves it on the **code** axis.
- The comparison component is the redesign's signature improvement over the original
  single-page layout, and is always backed by real data.
- Angular JSON assets are already Plotly traces, so plot work is series assembly +
  theming; only the needed per-benchmark assembly is extracted as pure functions.
- Modern MathJax v3+ is preferred over KaTeX and over Angular's old MathJax v2
  integration. Legacy formulas may be rewritten or supported with explicit macros.
- Curated asset copying is preferred over linking into `ff-angular`.
- Only the four Angular-backed benchmarks are production content until additional real
  benchmark content exists.
