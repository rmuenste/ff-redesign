# Project State

Last updated: 2026-06-28

## Current Migration Status

- Migrated and active:
  - Rising Bubble 3D: `/benchmarks/bubble3`
  - Rising Bubble 2D: `/benchmarks/2d-rising-bubble`
  - Flow Around Cylinder 3D: `/benchmarks/fac3`
- Still planned:
  - Particle Sedimentation: `/benchmarks/particle-sedimentation`

The app foundation, shared comparison engine, MathJax setup, curated asset layout,
and active benchmark routes are in place. Tests and build were green after the FAC
review-fix pass.

## Particle Sedimentation Blocker

The old Angular particle sedimentation page uses static plot images for the result
plots. The plot data exists separately, but it still needs postprocessing into a
React/Plotly-friendly format before the benchmark should be migrated.

Do not migrate the particle sedimentation plots from the static images alone. When
work resumes, wait for the postprocessed plot data files and then build the page
around real data, following the same no-synthetic-data rule used for RB3, RB2, and
FAC.

Likely next step: create a sedimentation migration plan once the processed plot
data files are available.
