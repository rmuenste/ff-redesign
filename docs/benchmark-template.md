# Benchmark Template Specification

How a benchmark is built in this site, and what a new one has to provide. Read
this before adding a benchmark; `docs/project_state.md` records what exists and
what is next, and `docs/design-system.md` covers the visual tokens.

Two existing pages are the reference implementations:

- **Flow Around Cylinder 3D** (`/benchmarks/fac3`) — the classical benchmark
  presentation: a problem definition, cross-code and cross-level result tables,
  a reference time series to download. Use it for any benchmark in the DFG /
  CFD Benchmarking Project tradition.
- **Hindered Settling** (`/benchmarks/hindered-settling`) — the smallest complete
  DNS-validation page: a generated data pipeline, a validation ledger, a gallery
  still. Use it for anything from the DNS campaign.

The most recent end-to-end addition, commit `e142bd8` (Jeffery Orbit), shows
every file a new benchmark touches.

---

## 1. Page structure: the tabs

A benchmark page is a hero followed by a row of **tabs** (the `Tabs` component
plus the `useTabParam` hook, both in `src/components/layout.tsx`). Each tab is
rendered by its own function in the page file (`IntroductionTab`,
`DefinitionTab`, ...), and the active tab is mirrored in the URL as `?tab=<id>`,
so every tab is deep-linkable.

### Required tabs

Every benchmark page has at least these four tabs, in this order:

| Order | Label | Tab id | Purpose |
|---|---|---|---|
| 1 | **Introduction** | `introduction` | What the benchmark is, why it matters, what question it answers. Default tab. |
| 2 | **Definition** | `definition` | Everything needed to reproduce the benchmark: geometry, governing equations, parameters, boundary and initial conditions, measured quantities, mesh levels / discretisation. |
| 3 | **Results** (or a result-specific label) | `results` or descriptive | Where the results are shown: live plots, result tables, comparison against the reference. |
| last | **Reference Data** | `reference-data` | The published data files: a file-format table and the download table. |

Rules:

- **Introduction**, **Definition** and **Reference Data** use exactly these
  labels and ids.
- The **Reference Data** tab id must be `reference-data`. The aggregate
  `/reference-data` page links into every benchmark with
  `?tab=reference-data`, and `src/data/reference-data.test.ts` checks that link.
- The results tab may carry a more specific label when that reads better, for
  example *The Orbit* (Jeffery), *Ratio Ladder* (Oberbeck), *Baseline* +
  *Concentration Ladder* (Viscometer), or *FSI Tests* next to the FSI page's
  *CFD Tests* and *CSM Tests*. There must be at least one tab whose job
  is to display results.
- The default tab is `introduction`.

### Optional tabs

These go between the results tab(s) and **Reference Data**, except
*Conclusion and Bibliography*, which goes last:

| Label | When to use | Example |
|---|---|---|
| Further result tabs | One tab per distinct study or experiment: a sensitivity, a control run, a second physical effect. | *Lubrication* (SED, NV), *Contact Model* (DKT), *Confinement* (HS), *Wall Clearance*, *Sphere Control* (JEF), *Absolute Drag*, *Steadiness* (OBK) |
| **Validation** | Every benchmark with rows in the DNS campaign datasheet. Holds the `ValidationLedger` generated from it. | all *DNS validation* pages, and SED (a core benchmark that carries campaign metrology) |
| **Conclusion and Bibliography** | Classical benchmarks with a closing discussion and a longer bibliography. Goes last, after Reference Data. | FAC3 |

Current tab sets, for orientation:

```
FAC3   Introduction · Definition · Results · Reference Data · Conclusion and Bibliography
RB3    Introduction · Definition · Results · Reference Data
FSI    Introduction · Definition · FSI Tests · CFD Tests · CSM Tests · Reference Data
SED    Introduction · Definition · Results · Lubrication · Validation · Reference Data
HS     Introduction · Definition · Results · Confinement · Validation · Reference Data
JEF    Introduction · Definition · The Orbit · Wall Clearance · Sphere Control · Validation · Reference Data
```

The `tabs` array in the registry entry (section 3) is not read by the page, which
declares its own tab list. Keep the two in sync by hand; no test checks it yet.

### What goes in each tab

**Introduction** (`<Section narrow>`)
- Benchmarks with a gallery still (all particulate pages so far):
  `<GalleryFigure id="<id>" />` comes first, before the first
  `<ContentRenderer>`. `src/pages/gallery-page.test.ts` checks this.
- Two or three paragraphs: the physical problem, the question the benchmark
  answers, and (for a comparison) which codes or methods are compared.
- Optionally the one governing law as an `Equation`, a short table (for example
  Hindered Settling's "Three regimes"), a video (FAC3's `VideoBlock`), and a
  `ReferenceList` if there is no Conclusion tab.

**Definition** (`<Section narrow>`). Everything needed to reproduce the
benchmark, in this order. Classical benchmarks follow the DFG pages on
featflow.de (see section 8) and FAC3; DNS pages use their own headings for the
same steps (Jeffery: *Fixture* = 1, *The observable* = 4, *Segments* = 5).
1. *Geometry, governing equations and scales*: domain, obstacle, fluid
   properties, the equations as block `Equation`s, and how Re and any other
   characteristic scale are defined. Include a geometry `Figure` or a schematic
   component. Re comes here because the case table uses it.
2. *Test cases*: if there is more than one case, a case table (FAC3's
   `CaseTable`: inflow, U_m, Re, simulated time, compared quantities, reference).
3. *Boundary and initial conditions*, with the inflow profile(s) as numbered
   equations, labelled with the case they belong to.
4. *Measured quantities*: how each compared quantity is defined (FAC3: drag and
   lift integrals and the c_D / c_L normalisation) and when it is measured.
5. *Discretisation*: mesh levels and DOF table, time step, and for cross-code
   benchmarks each code's discretisation and solver settings.
- Parameters that fit a table go into a `DataTable` (symbol · quantity · value).

**Results** (`<Section>`, full width)
- An introductory paragraph (max width ~900px) that says what is compared and
  against what.
- Multi-case benchmarks, two layouts:
  - **Stacked sections** when the cases differ in setup or in what is compared
    (FAC3: a steady case judged on c_D / c_L, an unsteady one on peaks and error
    norms). One block per case, each introduced by a divider heading; FAC3 uses a
    local `CaseHeading` (an `Overline` "Case 1" plus an `h2`). Each block holds a
    short setup recap, the reference values, the findings, then tables and plots.
  - **A case selector** when every case is compared on the same metrics (RB2:
    one button per case above one `ComparisonPanel`).
- Live plots go in `<ComparisonPanel specs={...} defaultMetric="..." />`, never
  as static images.
- Result tables go in `DataTable`s with typed row interfaces. Numeric columns
  use `align: "right"`.
- End with the finding stated in one sentence, not only with the table.

**Reference Data** (`<Section narrow>`)
- One paragraph on what the files contain and their units / nondimensionalisation.
- A file-format table (quantity · pattern · columns). FAC3 uses column · quantity.
- `<DownloadTable items={<id>Downloads} />`, where the zip bundle comes first.

**Validation** (`<Section>`, full width; benchmarks with campaign datasheet rows)
- A paragraph on how the ledger is gated, `<ValidationLedger rows={...} />`,
  then short subsections on the controlled comparison and how the numbers were
  derived.

### The hero

Every page opens with the same hero block; copy it from a page of the same
suite. How a benchmark is named in the hero depends on its suite:

- **Core benchmarks** (RB3, RB2, FAC3, SED) are the established, widely accepted
  community benchmarks, and are known by their short tag.
- **DNS validation** pages (DKT, HS, NV, OBK, JEF) are known by their title.

| Element | Core benchmarks | DNS validation |
|---|---|---|
| Back button to `/benchmarks` | `Catalogue / <model> / <tag>` (`… / FAC`) | `Catalogue / <model> / <shortTitle>` (`… / Jeffery Orbit`) |
| Solid chip (`tone="solid"`) | `<tag>` (`FAC`) | `<shortTitle>` in sentence case (`Jeffery orbit`) |
| Further chips, in order | `<model>` · `<dimension>` · `<suite>` | same |

All values come from the registry entry (section 3). The last chip is always the
suite (`Core benchmarks` or `DNS validation`), never a feature label.

The **title** is an `h1` with `className="display display-md"`, split into two
parts: one in the default foreground colour (white on the dark theme), the other
in the serif-italic primary span, the design green. There is exactly one green
part. The split is a design decision, made on what reads well; the pattern that
works best is *Name: subtitle*, with the name white and the subtitle green:

- *Name: subtitle*: Jeffery: **Tumbling Orbit**, Oberbeck: **Anisotropic Drag**,
  Numerical Viscometer: **Suspension Viscosity**
- a phrase ending in green: Hindered Settling of a **Particle Cloud**,
  Drafting, Kissing and **Tumbling**
- a name whose last word is green: Flow Around **Cylinder**, Rising Bubble **3D**

Below the title:

- a one-sentence lede
- a `kpi-grid` of `KpiBox`es: a collection of quantities of (possible) interest
  from the case. There is no fixed set, because what matters differs too much
  between benchmarks. For a core benchmark the choice is usually clear (cases,
  Re, mesh levels, codes, compared metrics, time interval, as on FAC3); a DNS
  page mixes setup values with its key results (Jeffery: aspect ratio, Re_a,
  *Period vs Jeffery*). The Reynolds number is a good choice in most cases, but
  it is not required, and existing pages without it stay as they are. Use
  `good` on a box that states a passed result.

---

## 2. Files a benchmark consists of

```
scripts/source-data/<id>/                 raw curated inputs (csv, dat, txt)        [DNS / converted benchmarks]
scripts/convert-<id>-data.mjs             converter: source-data -> public + generated
public/benchmark-assets/<id>/
    manifest.json                         authoritative list of every file (oldPath -> newPath)
    plots/<metric>/<series>.json          Plotly trace JSON, one trace or an array
    downloads/                            the files offered on Reference Data, plus <id>.zip
                                          (or only the zip, as RB3 and FSI do; deflate a
                                          bundle of text files with createDeflatedZip)
    media/                                figures, videos, media/gallery/*.webp stills
src/data/generated/<id>.json              derived numbers (fits, tables) — never edited by hand
src/data/generated/<id>-validation.json   ledger rows (DNS)                          — never edited by hand
src/data/<id>.tsx                         data module: PlotSpecs, table rows, downloads, references
src/data/<id>.test.ts                     pins the data and derived numbers
src/pages/<Name>Page.tsx                  the page
src/components/<id>-schematic.tsx         optional schematic SVG
```

`<id>` is the benchmark id from the registry. It is also the asset directory
name, which `src/data/benchmarks.test.ts` checks. Only the asset directory and the
`generated/` files must use the full id. The data module, its test, the converter
and the schematic may use a short name, and several do: `oberbeck.tsx` and
`jeffery.tsx` (ids `oberbeck-spheroid-drag`, `jeffery-orbit`),
`convert-fac-benchvalues.mjs`, `viscometer-schematic.tsx`. A benchmark with one
file per metric may also keep its plots flat (FAC3: `plots/drag.json`).

Classical benchmarks such as FAC3 can keep their tables as hand-written rows in
`src/data/<id>.tsx` when the numbers come from a publication. When a converter
derives numbers from data, as on the DNS pages, it writes them to
`src/data/generated/` and never into source by hand.

---

## 3. Registry entry — `src/data/benchmarks.ts`

One `BenchmarkMeta` object (type in `src/data/types.ts`):

```ts
{
  id: "my-benchmark",            // asset dir name, data-module key
  slug: "my-benchmark",          // URL: /benchmarks/<slug>; keep the `slug: "..."` line format
  title: "Full Title of the Benchmark",
  shortTitle: "Short Title",     // breadcrumb, route label, cards
  tag: "MB",                     // 2–4 letter chip
  suite: "Core benchmarks",      // or "DNS validation" — drives the catalogue facet
  model: "Newtonian",            // Newtonian | Two-Phase | Particulate | ...
  dimension: "3D",
  reynolds: "20 / 100",          // number or display string
  levels: 4,                     // optional: mesh levels
  summary: "One sentence for the catalogue card.",
  thumb: "cylinder",             // a MeshShape motif
  tabs: ["Introduction", "Definition", "Results", "Reference Data"],
  comparisonAxis: "code",        // "code" | "level"
  status: "active"
}
```

The following read this list, so they need no edit:

- the catalogue (`src/BenchmarksIndex.jsx`), including its suite facet
- the Home page benchmark list
- the Pages prerender (`scripts/prerender-routes.mjs` reads the `slug:` lines
  with a regex)
- the e2e mobile-layout test

A new `thumb` motif needs a new `MeshShape` member in `src/data/types.ts`, plus a
`MESH_SEEDS` entry and an SVG branch in `MeshThumb` (`src/Primitives.jsx`).

---

## 4. Plots — `PlotSpec` and the comparison engine

Plot files are Plotly traces (`{x, y, name, type, mode, line, marker}`), either
one per file or an array per file. A `PlotSpec` describes one metric:

```ts
const dragSpec: PlotSpec = {
  id: "mb-drag",
  title: "Drag coefficient",
  metric: "drag",
  comparisonAxis: "code",
  seriesSelectorLabel: "Code",
  seriesGroups: [
    {
      id: "featflower", label: "FeatFloWer", kind: "code", color: "var(--primary)",
      source: { kind: "single-trace", asset: { path: benchmarkAssetPath("my-benchmark", "plots/drag/featflower.json") } },
      variantStrategy: { kind: "single-trace" }
    },
    { id: "reference", label: "Reference", kind: "reference", color: "var(--fg3)", /* ... */ }
  ],
  defaultSeriesGroupIds: ["featflower", "reference"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time [s]", y: "c_D" },
  axisRanges: { x: [0, 8] }                  // optional
};
export const mbPlotSpecs: Record<"drag" | "lift", PlotSpec> = { drag: dragSpec, lift: liftSpec };
```

- `kind` on a group is `code`, `level` or `reference`.
- `source.kind` describes the file: `single-trace`, `trace-array`, or
  `segmented-shape` (one trace split into segments).
- `variantStrategy` sets how a file's traces become toggleable variants:
  `single-trace`, `paired-traces`, or `all-traces`. Variant labels come from the
  JSON `name` fields.
- `levelSources` in place of `source`, together with a `levelAxis`, gives a
  per-mesh-level selector (RB3).
- The page renders the specs with `<ComparisonPanel specs={mbPlotSpecs} defaultMetric="drag" />`.
- Always build asset URLs with `benchmarkAssetPath(id, path)`, which respects the
  Vite base path.

---

## 5. Converter — `scripts/convert-<id>-data.mjs`

Template: `scripts/convert-hindered-settling-data.mjs`. A converter:

1. reads `scripts/source-data/<id>/` and validates the input (fails loudly on
   unexpected sizes or non-numeric values)
2. resets `public/benchmark-assets/<id>/` with `resetGeneratedOutputs(outDir,
   ownedPaths, { benchmarkId })` from `scripts/lib/output-dir.mjs`, declaring
   the paths it writes (`plots`, `downloads`, any named `media/` file); the
   gallery stills under `media/gallery/` are never a converter's to delete
3. writes plot JSON, copies downloads, builds `downloads/<id>.zip` with
   `scripts/lib/zip.mjs`
4. writes `manifest.json` with `writeManifest(outDir, benchmarkId, entries,
   preserved)`, which carries the entries it does not own; one entry per file:
   `{ oldPath, newPath, metric?, seriesGroupId?, kind, label, sourceShape?, derived? }`,
   where `kind` is `code | level | reference | media | download`
5. writes `src/data/generated/<id>.json` (derived numbers)
6. DNS only: appends the benchmark's rows to
   `scripts/source-data/dns/dns_validation_datasheet.csv` (append, do not
   replace), then writes `src/data/generated/<id>-validation.json` via
   `buildLedger(records, predicate)` from `scripts/lib/validation-ledger.mjs`. A
   `PUBLISHED` set of case ids selects which rows are shown, with a comment that
   explains the selection.

Run it by hand with `node scripts/convert-<id>-data.mjs`; the build does not run
converters. Commit what it generates.

Gallery stills (`media/gallery/*.webp`, a width ladder, no PNG masters) are
recorded in the manifest as `kind: "media"` with an `oldPath` of
`generated from blender_viz/website_assets/...`.

---

## 6. Wiring checklist

| File | Change |
|---|---|
| `src/data/benchmarks.ts` | registry entry |
| `src/App.tsx` | import the page, add `<Route path="/benchmarks/<slug>" element={...} />`, add a `routeLabels` entry and renumber the entries after it (`src/pages/gallery-page.test.ts` pins the Gallery label) |
| `src/data/reference-data.tsx` | import `<id>Downloads` and add it to the `curatedDownloads` map |
| `src/data/gallery.ts` | optional: gallery item (id, family, caption, provenance, aspect, focal, sources) |
| `src/data/types.ts`, `src/Primitives.jsx` | only for a new thumbnail motif |
| `docs/project_state.md` | a section for the benchmark; remove it from *Next* |
| `node scripts/build-reference-index.mjs` | regenerate `src/data/generated/reference-index.json` (the build also runs it, but the committed file is checked) |

`scripts/prerender-routes.mjs` and `e2e/mobile-layout.spec.ts` pick up the new
slug from the registry without an edit.

---

## 7. Tests to update or add

These tests list benchmarks explicitly and fail until the new one is added:

| Test | What to add |
|---|---|
| `src/data/benchmarks.test.ts` | thumb map entry, `getBenchmarkBySlug` case, id in the ordered active list, suite list if a new suite |
| `src/data/reference-data.test.ts` | `PAGE_FILES` entry (id → page file); bump the minimum group count |
| `src/pages/hero.test.ts` | `PAGE_FILES` entry; it then checks the breadcrumb, chips and title split against the hero rules (section 1) |
| `src/data/assets.test.ts` | a manifest `describe` block (every `newPath` exists, every file on disk is mapped, metric set); if there is a gallery still, add it to the "gallery stills" list |
| `src/data/gallery.test.ts` | if there is a gallery still: order, families, neighbours |
| `src/pages/gallery-page.test.ts` | if there is a gallery still: the cross-link list |

Add these:

- `src/data/<id>.test.ts` checks the converted data: row counts, signs and
  trends, and every derived number against the campaign's or publication's own
  printed values (see `jeffery.test.ts`, `oberbeck.test.ts`). This is what stops
  the site's implementation drifting from the source.

These pass with no edit if the rules above are followed:

- `routes.test.ts`: the route in App.tsx matches the registry slug
- `responsive.test.ts`: no fixed multi-column inline grids. Use the
  `styles.css` classes (`split`, `kpi-grid`, `stack`), let tables scroll, and use
  no hard-coded gutters.

Before committing, run:

```bash
npm run test
npm run build
npm run test:e2e      # needs a build; checks 390px and 768px widths for overflow
```

The e2e check opens every route and clicks through every tab of each benchmark
page, reading the tabs from the page's own tab row, so a new benchmark and its
tabs are covered without an edit.

---

## 8. Heritage: the legacy featflow.de pages

The original site (www.featflow.de, local copy in `~/code/ffweb`) presented
benchmarks in two shapes, and the tab structure above is their merge.

**Single-page DFG 2D benchmarks** (`en/benchmarks/cfdbenchmarking/flow/dfg_benchmark{1,2,3}_*.html`)
used one page with these sections (2D-1 has no *Test configuration* or
*Exemplary Results*, and 2D-2 adds *New reference results*):

```
Geometry and flow configuration
  Boundary conditions
  Reynolds number
Important numerical quantities        (drag/lift definition, coefficients)
Setup of the test and data measurement (how and when quantities are measured)
Test configuration                    (discretisation, time steps, level/DOF table)
Exemplary Results                     (figures)
Reference results                     (zip downloads + gnuplot script)
References
```

**The multi-page 3D FAC benchmark** (`flow/dfg_flow3d.html` + `dfg_flow3d/*`)
had an abstract page and then *Benchmark configuration*, *Used CFD Software
Packages*, *Results*, *Conclusions and Bibliography*, and *Reference Values*
(the BenchValues.txt column table and download, plus gnuplot commands).

How that maps onto the tabs:

| Legacy section | Tab |
|---|---|
| Abstract / page lead | Introduction |
| Geometry and flow configuration, Boundary conditions, Reynolds number, Important numerical quantities, Setup of the test and data measurement, Test configuration, Used CFD Software Packages | Definition |
| Exemplary Results, Results | Results (live `ComparisonPanel` in place of static PNGs) |
| Reference results / Reference Values | Reference Data |
| Conclusions and Bibliography | Conclusion and Bibliography (or a `ReferenceList` on Introduction) |

A legacy benchmark being migrated should keep all of that content. Its static
result images become Plotly JSON generated from the original data files.
