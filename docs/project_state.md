# Project State

Last updated: 2026-08-13

## Current Migration Status

- Migrated and active:
  - Rising Bubble 3D: `/benchmarks/bubble3`
  - Rising Bubble 2D: `/benchmarks/2d-rising-bubble`
  - Flow Around Cylinder 3D: `/benchmarks/fac3`
  - Particle Sedimentation: `/benchmarks/particle-sedimentation`
  - Drafting-Kissing-Tumbling: `/benchmarks/drafting-kissing-tumbling`
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
