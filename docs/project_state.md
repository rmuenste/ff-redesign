# Project State

Last updated: 2026-06-29

## Current Migration Status

- Migrated and active:
  - Rising Bubble 3D: `/benchmarks/bubble3`
  - Rising Bubble 2D: `/benchmarks/2d-rising-bubble`
  - Flow Around Cylinder 3D: `/benchmarks/fac3`
  - Particle Sedimentation: `/benchmarks/particle-sedimentation`
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
