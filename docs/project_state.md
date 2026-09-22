# Project State

Last updated: 2026-09-22

## Current Migration Status

- Migrated and active:
  - Rising Bubble 3D: `/benchmarks/bubble3`
  - Rising Bubble 2D: `/benchmarks/2d-rising-bubble`
  - Flow Around Cylinder 3D: `/benchmarks/fac3`
  - Particle Sedimentation: `/benchmarks/particle-sedimentation`
  - Drafting-Kissing-Tumbling: `/benchmarks/drafting-kissing-tumbling`
  - Hindered Settling: `/benchmarks/hindered-settling`
  - Numerical Viscometer: `/benchmarks/numerical-viscometer`
  - Oberbeck Spheroid Drag: `/benchmarks/oberbeck-spheroid-drag`
  - Jeffery Orbit: `/benchmarks/jeffery-orbit`
- Still planned: none

The app foundation, shared comparison engine, MathJax setup, curated asset layout,
and active benchmark routes are in place. Tests and build were green after the
particle sedimentation migration.

## Particle Sedimentation Migration

Particle Sedimentation is now the fourth migrated benchmark. The Angular static
velocity and position result images were replaced by live Plotly plots generated
from migrated simulation txt files and PIV reference files. The generated
`sedimentation.zip` is built by the converter from the available migrated
downloads, including simulation and PIV source files.

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

## DKT Migration (first DNS validation benchmark)

Drafting-Kissing-Tumbling is the first benchmark from the DNS validation campaign
rather than from `ff-angular`. It introduced three things the remaining DNS
benchmarks reuse:

- A `suite` facet on the benchmark registry, so DNS entries are filterable
  alongside Model and Dim.
- `VerdictChip` and `ValidationLedger`, plus a `Validation` tab pattern.
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
  campaign caught it) belongs in that page's Validation ledger.
- **Beetstra drag correlation** — needs surface-plot support, or a decomposition
  into per-solid-fraction line families, before it fits the comparison model.
