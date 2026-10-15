# Project State

Last updated: 2026-10-15

## Current Migration Status

- Migrated and active:
  - Rising Bubble 3D: `/benchmarks/bubble3`
  - Rising Bubble 2D: `/benchmarks/2d-rising-bubble`
  - Flow Around Cylinder 3D: `/benchmarks/fac3`
  - Particle Sedimentation: `/benchmarks/particle-sedimentation`
  - FSI Benchmark: `/benchmarks/fsi-benchmark`
  - Drafting-Kissing-Tumbling: `/benchmarks/drafting-kissing-tumbling`
  - Hindered Settling: `/benchmarks/hindered-settling`
  - Numerical Viscometer: `/benchmarks/numerical-viscometer`
  - Oberbeck Spheroid Drag: `/benchmarks/oberbeck-spheroid-drag`
  - Jeffery Orbit: `/benchmarks/jeffery-orbit`
- Still planned: none
- Site-wide pages: catalogue `/benchmarks`, gallery `/gallery`, aggregate
  reference data `/reference-data`

The app foundation, shared comparison engine, MathJax setup, curated asset
layout and all benchmark routes are in place. The unit suite (`npm run test`)
was green on 2026-09-22. How to add a benchmark is
specified in [benchmark-template.md](benchmark-template.md).

## Site-wide Features

- **Reference data index** (`/reference-data`): every benchmark's downloads in
  one page, derived from the asset manifests by
  `scripts/build-reference-index.mjs`, which runs as the first step of
  `npm run build`. Files that are byte-identical across benchmarks, such as the
  DNS datasheet, are listed once as shared assets.
- **Gallery** (`/gallery`): the rendered stills of the six particulate
  benchmarks (Particle Sedimentation plus the five DNS-validation pages), from
  the registry in `src/data/gallery.ts`, with family filters and a lightbox. Each
  of those benchmarks' Introduction tab opens with its still and links back into
  the gallery. RB3, RB2 and FAC3 have no still yet.
- **Mobile layout**: every route, and every tab of every benchmark page, fits
  390px and 768px without horizontal overflow. Until 2026-09-22 the e2e check
  loaded only each route's default tab, and ten other tabs overflowed unnoticed,
  all for one reason: a wide table inside an inline `display: grid` wrapper with
  no column track, which let the table stretch the column. Every such wrapper in
  the benchmark pages now uses the `.stack` class (one `minmax(0, 1fr)` track),
  and the e2e check clicks through every tab. `src/responsive.test.ts` guards the source patterns, and
  `e2e/mobile-layout.spec.ts` measures the rendered pages in Chromium as the
  `mobile-layout` CI job, which gates the Pages deploy. Block equations scroll
  inside their box, and plot legends move under the chart on narrow columns.
- **Deep links**: `scripts/prerender-routes.mjs` writes an `index.html` for
  every route, so GitHub Pages returns 200 for deep links. Benchmark tabs are
  deep-linkable with `?tab=<id>`.

## 2026-10-15: Validation tabs dropped from the DNS pages

The owner reviewed the Oberbeck page and found its Validation tab read like an
internal document published by accident: raw datasheet rows plus method narrative
("controlled comparison", "how the numbers were derived"). The tab is gone from all
six pages that had one (SED, DKT, HS, NV, OBK, JEF), together with the
Lubrication tab's embedded ledger on SED, the run table's "Validation ledger"
button and every prose pointer to the tab. Old `?tab=validation` links fall back to
the Introduction tab; `e2e/mobile-layout.spec.ts` checks that.

- SED's convergence reading, the Table II reference note, the time-step study and
  the fitted error split moved onto the Results tab in plain language; the
  `stepsize_` configuration note and the earlier stability-floor history were
  dropped as procedure.
- The controlled-comparison and how-derived subsections were dropped everywhere;
  their visitor-facing facts were already on the Introduction, Definition or
  results tabs.
- On OBK the results captions lost their datasheet case ids and the
  gate/certified/rundir/binary wording; on JEF the case ids.
- `src/data/generated/{dkt,hindered-settling,numerical-viscometer,oberbeck,jeffery}-validation.json`
  and the converter code that wrote them are removed, since nothing else read
  them. `sedimentation-validation.json` stays: it also carries the time-step study
  and the error split. The datasheet downloads, the OBK and JEF extract CSVs and
  every zip are byte-identical.
- `src/pages/hero.test.ts` now checks each page's tab row against the registry
  and that no page renders a ledger.

## 2026-10-15: visitor-language sweep of the DNS pages

- 2026-10-15: one sweep of internal campaign vocabulary across every tab of SED,
  DKT, HS, NV, OBK and JEF, plus their registry summaries and gallery captions
  (rule in benchmark-template.md, "Visitor language"). The Gates tables on NV,
  OBK and JEF became *What is compared, and the tolerance* tables (Quantity,
  Reference, Tolerance, Result); NV's *Concentration Ladder* tab is now
  *Concentration Series* (id `ladder` kept, so old links still work); OBK's
  sphere regression-anchor paragraph and table row, its review/twin sentence and
  the DKT schematic's solver-defect history were dropped as bookkeeping, and with
  them the only two numbers removed (the anchor's K and the defect-era 4° stall).
  Every other measured number, reference and tolerance is unchanged; downloads and
  generated data are untouched. `src/pages/visitor-language.test.ts` keeps the vocabulary
  out.
- 2026-10-15, after owner feedback on PR #22: OBK's Introduction and Definition
  now stand alone. The hydrodynamic radius is explained at first use (Hasimoto's
  closed-form periodic-array drag solved for an equivalent sphere radius), the
  three runs are described by cells across the thin axis and by 2a/L instead of
  "production resolution" and "closing rung", and a, U, X^A, Y^A, 2b/h, the solid
  fraction and the superficial velocity are defined where they first appear.
  *Rung* and *ladder* on OBK are confined to the Ratio Ladder tab (elsewhere:
  *configuration*), and the test checks that.

## Particle Sedimentation Migration

Particle Sedimentation is now the fourth migrated benchmark. The Angular static
velocity and position result images were replaced by live Plotly plots of the
simulation series against the PIV reference files.

### 2026-10-15: campaign curves at three mesh levels

Every simulation curve on the page is now a DNS-campaign run, at L2, L3 and L4,
the runs the campaign datasheet quotes. `scripts/convert-sedimentation-data.mjs`
reads `scripts/source-data/sedimentation/campaign/` (`vel<CASE>_L<n>.txt`,
`pos<CASE>_L<n>.txt`, `campaign_runs.csv`) and no longer needs a sibling checkout;
the setup figure's source moved to `scripts/source-data/sedimentation/` for the same
reason.

- The ladder is complete: all four cases at all three levels, 12 runs. A
  case/level pair is published once both of its series exist; a pair that is not
  exported is logged and skipped, and the page then shows that case at the levels
  it has (the per-case panel, the all-cases panel, the run table and the
  downloads all follow `src/data/generated/sedimentation-runs.json`). Exporting
  the two files and the `campaign_runs.csv` row and re-running the converter is
  all a new run needs; E1 at L2 arrived that way.
- Each published series is checked against its `campaign_runs.csv` row (step
  count, end time, peak settling velocity and its time). The rules live in
  `scripts/lib/sedimentation-campaign.mjs` and are tested on a fixture folder in
  `src/data/sedimentation-campaign.test.ts`; the run table on the Results tab is
  generated from the same file.
- Results opens with a per-case refinement panel: case selector, velocity or
  position, L2/L3/L4 overlaid on the PIV points. Levels use the site's refinement
  vocabulary (petrol, orange, green coarse to fine, as on RB3 and FSI CSM3) plus
  one dash per level (dot, dash, solid), which the all-cases panel reuses so a
  level reads the same in both. The all-cases panel defaults to L4.
- `ComparisonPanel` drops a series group that has no source at the selected
  level-axis option (`availableSeriesGroups` in `src/lib/comparison.ts`) instead
  of failing the whole panel; that is what lets a ladder have a missing rung.
- Downloads are named `vel<CASE>_L<n>.txt` / `pos<CASE>_L<n>.txt` throughout, plus
  `campaign_runs.csv`; `sedimentation.zip` is now deflated (`scripts/lib/zip.mjs`).
- The core converter now owns only `plots/velocity`, `plots/position`, the files
  directly under `downloads/` and the setup figure, so it no longer deletes the
  lubrication companion's output; the two converters can be re-run in either order.

### 2026-10-15: FEAT3 alongside FeatFloWer

The same four cases at L2, L3 and L4, computed with FEAT3 on the same meshes (so
a level is the same D/h, 11.4 / 23.9 / 49.1, for both codes), now share the Results
charts and run table with FeatFloWer.

- `scripts/convert-sedimentation-feat3-data.mjs` reads
  `scripts/source-data/sedimentation/feat3/` (`vel<CASE>_L<n>.txt`,
  `pos<CASE>_L<n>.txt`, `feat3_runs.csv`) under the campaign rules of
  `scripts/lib/sedimentation-campaign.mjs` (now taking the runs CSV's name; it also
  checks `D_over_h` against the level). It owns `plots/{velocity,position}/feat3-*.json`
  and `downloads/feat3/` (`feat3_vel*`/`feat3_pos*` series, `feat3_runs.csv`,
  `sedimentation-feat3.zip`) and writes `src/data/generated/sedimentation-feat3.json`.
  The core converter now owns its curves by file (`<CASE>-*.json`) rather than the
  whole curve folders; core, lubrication and FEAT3 converters produce an identical
  manifest in any run order. Not wired into `package.json`: the build does not run
  converters.
- Encoding: colour and dash stay the level on the per-case panel, and colour the
  case plus dash the level on the all-cases panel (PR #20). The code is the marker,
  as on the rising bubble pages (FeatFloWer diamond, FEAT3 triangle), sampled about
  twenty times per curve with FEAT3's half an interval later so the two interleave.
  New `PlotSource.markerSampleOffset` and `markerInLegend` (a one-point legend proxy,
  so a legend entry shows line, dash and marker together; Plotly omits data-less
  traces from the legend).
- The per-case panel shows both codes at all three levels by default (seven legend
  entries, level-major: FeatFloWer L2, FEAT3 L2, ...). Each level is a same-coloured
  pair, so the code gap reads inside a pair and refinement across colours, on one
  chart. Both gaps are 1-3 % at the peak here, so neither swamps the other; a split
  into a codes mode and a levels mode was not needed (it would also have needed a
  second selector beside the case selector). The series checkboxes thin the chart.
  The all-cases panel has twelve entries (each case's two codes, then the PIV).
- Phone legends (all panels, site-wide): pinned to the figure bottom in container
  coordinates, exactly two entries a row (entry width from the measured figure
  width), and the figure grows by the legend rows so the plot area keeps its height.
  Before, a long legend overlapped the x-axis title and squashed the plot.
- Copy: a short "Two codes" paragraph on Results, the run table gains Code and
  "Cells across diameter" columns (24 rows), hero names both codes, the "Metrics"
  KPI became "Codes", the catalogue summary mentions two codes, and the Reference
  Data tab describes the FEAT3 files. The convergence discussion and the
  lubrication baselines are scoped to FeatFloWer, which they are about.
- No quantitative comparison with ten Cate's lattice-Boltzmann results (owner
  decision): those were single-resolution runs with a calibrated hydrodynamic
  radius, a different kind of computation from an uncalibrated refinement study.
  The E1 paragraph on Results now says only, qualitatively, that the paper's own
  simulation also fell short of its measurement; the one-per-cent agreement claim
  and "as much a reference as its measurements" are gone, and the Introduction no
  longer says the page validates against those simulations. Guarded in
  `src/pages/visitor-language.test.ts`.

## Flow Around Cylinder 3D: the two cases made explicit

The FAC3 page always carried both DFG 3D problems, but only Re = 20 was named;
the unsteady problem appeared as "the second benchmark". Checked against the
legacy `ffweb` pages (`dfg_flow3d*.html`), the page now labels them
"Case 1: steady, Re = 20" and "Case 2: unsteady, Re_max = 100", without new tabs:

- Definition gains a case table (U_m 0.45 / 2.25 m/s, mean velocity 4/9 U_m,
  Re, simulated time, compared quantities, reference), the geometry dimensions,
  boundary conditions, inflow equations tagged per case, the force notation, the
  per-code DOF rules, and the content of the legacy "Used CFD Software Packages"
  page (OpenFOAM and CFX settings tables, FeatFlow Q2/P1 description).
- Results is split into a Case 1 and a Case 2 section. Case 1 states its
  reference values (Braack and Richter); Case 2 carries the earlier reference
  intervals, the fixed-time-step rationale, the hardware notes and the live plots.
- The c_D / c_L normalization is taken from Schaefer and Turek (1996); the legacy
  page refers to it but never printed it.
- Fixed the OpenFOAM L4 cell count (was the velocity DOF count, 9437184).
- The Results grid overflowed a phone by 189px (already true on master); it now
  uses the new `.stack` class, a single `minmax(0, 1fr)` track.

The legacy FeatFlow level-convergence PNGs stay dropped, as `assets.test.ts`
requires. The DFG 2D benchmarks (2D-1, 2D-2, 2D-3) are not migrated yet.

## FSI Benchmark (first version, migrated from featflow.de)

The Turek and Hron fluid-structure interaction benchmark, a core benchmark, at
`/benchmarks/fsi-benchmark`. Unlike the other core benchmarks it comes from the
legacy featflow.de pages (`en/benchmarks/cfdbenchmarking/fsi_benchmark*`, local
copy in `~/code/ffweb`), not from `ff-angular`. The tabs follow the template:
Introduction (abstract, introduction, bibliography), Definition (definitions,
quantities for comparison, the FSI mesh), FSI Tests (FSI1-3), CFD Tests, CSM Tests,
Reference Data.

- The reference files and figures are curated under `scripts/source-data/fsi/`;
  `scripts/convert-fsi-data.mjs` turns them into Plotly traces (displacements in
  mm; drag and lift as beam + cylinder), the manifest, and the last period of
  every file in `src/data/generated/fsi.json`. The reference files are published
  only as `downloads/fsi.zip`, deflated: 1.2 MB against 4.8 MB of loose files.
  `createDeflatedZip` in `scripts/lib/zip.mjs` is new; the other benchmarks keep
  their stored zips until someone regenerates them.
- The published tables in `src/data/fsi.tsx` were extracted from the visible
  HTML tables by script, not retyped. Tables the legacy pages kept inside HTML
  comments were not migrated.
- `src/data/fsi.test.ts` holds the site's evaluation of each reference file to the
  published rows: FSI2 to its level 4, dt 0.0005 row, and all nine CSM3 runs.
- Live plots replace the legacy PNGs for FSI2, FSI3 and CSM3. CFD3 has no
  published data, so its two original plots are kept as figures.
- New: the `Fluid-Structure` model, the `cylinder-flag` thumbnail motif, and the
  catalogue's model filter derived from the registry (`benchmarkModels`).

Open questions on the legacy data, stated on the page rather than resolved:

- `ref_fsi3.point` sits in a `0p00025` folder and records dt = 0.00025, but its
  last period reproduces the published dt = 0.0005 row, not the dt = 0.00025 row.
- The legacy geometry table puts B at (0.2, 0.2), the cylinder centre; its text
  and figure put it at (0.15, 0.2). The page follows the text.
- The legacy fluid-material table is shown under the solid table's header; its
  LaTeX source gives the real columns, which the page uses.

## DKT Migration (first DNS validation benchmark)

Drafting-Kissing-Tumbling is the first benchmark from the DNS validation campaign
rather than from `ff-angular`. It introduced three things the remaining DNS
benchmarks reuse:

- A `suite` facet on the benchmark registry, so DNS entries are filterable
  alongside Model and Dim.
- `VerdictChip` and `ValidationLedger`, plus a `Validation` tab pattern (retired
  2026-10-15, see below).
- A generated validation ledger: `scripts/lib/validation-ledger.mjs` reads the
  curated campaign datasheet (`scripts/source-data/dns/`) and emits
  `src/data/generated/<id>-validation.json`. Ledger rows are never hand-written.

Series data comes from `tools/dkt_export_series.py` in the FeatFloWer repository,
which reduces the solver's per-step particle log to two-column series curated
under `scripts/source-data/dkt/`.

The comparison axis is the **contact model** (dry friction vs frictionless)
rather than a code or a level. Only the frictional run exists at both rungs of
the resolution ladder; the others are declared level-independent with a plain
`source`, the same idiom the sedimentation page uses for PIV references.

## Particle Sedimentation Convergence Material

Particle Sedimentation gained a Validation tab carrying the campaign's ten Cate
metrology: the spatial ladder across three levels and four cases, the reference
audit, and the comparison against ten Cate's own simulations, all as generated
ledger rows plus a short visitor-facing reading.

The timestep study was measured twice. The first pass ran while the rigid-body
solver integrated at its own configured stepsize rather than the CFD timestep, so
those runs measured a coupling artifact and the "added-mass stability floor" read
from them was refuted. Every dt != 1 ms point was re-run synchronised.

The converter withholds the first-pass points and publishes the synced ladder
plus the fitted spatial/temporal split, parsed from the curated output of
`tools/tencate_error_decomposition.py` in the FeatFloWer repository rather than
re-implemented, so the site cannot drift from the campaign's own fit. See the
selection policy comment in `scripts/convert-sedimentation-validation.mjs`; a
test pins withheld-vs-published and asserts every published dt point is synced.

Note for whoever next touches the datasheet: its `e4_l3_dt_ladder_sync` row still
carries a "refit pending" note in `expected_source`, which the decomposition tool
has since superseded.

## Oberbeck Spheroid Drag (D6.1, first non-spherical benchmark)

The campaign's first non-spherical result, published 2026-09-15 at
`/benchmarks/oberbeck-spheroid-drag`. A prolate spheroid of aspect ratio 2 held
fixed in the periodic Stokes cell the Hasimoto case uses, gated on the anisotropy
ratio `R_h(perp)/R_h(par)` against Oberbeck's `Y^A/X^A = 1.14532`.

`scripts/convert-oberbeck-data.mjs` re-derives the resistance functions, the
Hasimoto fixed-point inversion, the imaged-volume correction and the window
sensitivity in JavaScript, from per-run series curated under
`scripts/source-data/oberbeck/` (the merge of each rundir's `particle_force.log`
and `bulk_flow.log`). `src/data/oberbeck.test.ts` pins every derived number
against the printed report of `tools/d61_oberbeck_analysis.py` in the FeatFloWer
repository, so the site's own implementation cannot drift from the campaign's.

The page's shape is a two-factor ladder rather than a single measurement: two
rungs hold the body size and vary the mesh, one holds the mesh and halves the
body. Plotting the ratio against `2a/L` — how much of the cell the body spans —
is what makes that design legible in one frame.

Two things added along the way:

- A `spheroid` motif for `MeshThumb` (`src/Primitives.jsx`, `MeshShape` in
  `src/data/types.ts`) and a matching `OberbeckSchematic`.
- A fix in `scripts/lib/validation-ledger.mjs`: the bare-scheduler-id strip had
  no lookbehind, and a word boundary sits after a decimal point too, so it ate
  the fraction of a quoted semi-axis (`a=0.132283` became `a=0.`). No existing
  ledger row changed; `src/data/oberbeck.test.ts` guards the case.

## Jeffery Orbit (D6.2, second non-spherical benchmark)

The campaign's second non-spherical family and the first live test of free
rotation, published 2026-09-16 at `/benchmarks/jeffery-orbit`. A prolate spheroid
of aspect ratio 2 tumbling in a planar Couette box, gated on Jeffery's (1922)
closed-form period `T gammadot = 15.70796`, on the 4:1 rate modulation, and on
the orientation-resolved waveform.

`scripts/convert-jeffery-data.mjs` re-derives the unwrapped in-plane angle, the
period from its pi-crossings, the rate waveform and its orientation bins, the
in-plane residual and the two wall extrapolations in JavaScript, from the
per-step `DNS_PART_AXIS` traces curated under `scripts/source-data/jeffery/`.
`src/data/jeffery.test.ts` pins every derived number against the printed report
of `tools/d62_jeffery_analysis.py` in the FeatFloWer repository — down to the
individual pi-crossing times — so the site's own implementation cannot drift from
the campaign's.

Two structural points worth keeping:

- The page's shape is the wall-clearance ladder, not a single measurement. The
  default box (walls eight semi-major axes out) gives `+0.30%` and the
  half-clearance rung `+0.81%`; the `+0.51 pp` shift is the wall systematic,
  extrapolated to zero clearance as a bracket, `+0.23%` on an `(a/l)^3` image
  law and `+0.13%` on `(a/l)^2`.
- The analytic overlay is anchored at the first sample and then runs on the
  THEORETICAL period rather than a refit, so a period error accumulates into a
  visible phase lag. That is what lets the clock effect (period) be told apart
  from a physics error (waveform), and it is the reason the rate-against-time and
  rate-against-orientation frames are offered side by side in one panel.

Also added: a `spheroid-shear` motif for `MeshThumb` (`src/Primitives.jsx`,
`MeshShape` in `src/data/types.ts`) and a matching `JefferySchematic` drawing the
box at both clearances to scale.

Thin-axis resolution comes from each run's own `DNS_RESOLUTION` record (`2b /
h_min`, 10.4 at H=8 and 10.2 at H=4), not from the case specification's pre-mesh
estimate of 9.5, which the campaign corrected in row `d62_resolution_pinned`. The
two boxes therefore differ by 1.6% rather than 7%, and in the other direction.
That row is published in the ledger alongside the four gate rows, because the
ledger renders the campaign's prose verbatim and the clearance row's own caveat
still quotes the superseded figure.

The five D6.2 rows were APPENDED to
`scripts/source-data/dns/dns_validation_datasheet.csv` rather than refreshing the
whole curated copy, which remains a subset of the campaign's datasheet rather
than a mirror of it.

## Next

Remaining DNS candidates, in rough order of readiness:

- **Sphere-wall lubrication crossover** — smallest job; a single curve against
  Brenner's analytic solution, with a committed generator already in the
  FeatFloWer repository.
- **Hasimoto periodic array drag** — publishable. The periodic-coupling defect
  that blocked it was fixed on 2026-08-03 and the benchmark is closed; the
  post-fix ladder converges to Hasimoto's analytic value within -0.4 to -0.6%.
  The defect itself (periodic faces silently solved traction-free until the
  campaign caught it) belongs in the campaign datasheet, not in the page prose.
- **Beetstra drag correlation** — needs surface-plot support, or a decomposition
  into per-solid-fraction line families, before it fits the comparison model.
