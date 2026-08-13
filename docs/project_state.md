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

The converter deliberately withholds the earlier timestep-ladder points and the
temporal term fitted from them. Those runs were measured while the rigid-body
solver integrated at its own configured stepsize rather than the CFD timestep, so
they measured a coupling artifact; the "added-mass stability floor" read from
them was refuted. The datasheet rows that found and refuted the defect are
published in their place. See the selection policy comment in
`scripts/convert-sedimentation-validation.mjs`.

## Next

- Refit the combined spatial/temporal error budget once the synced timestep
  ladder is complete, then publish it on the sedimentation Validation tab.
- Remaining DNS candidates: sphere-wall lubrication crossover, Hasimoto periodic
  array drag (blocked on an open solver issue), Beetstra drag correlation (needs
  surface-plot support).
