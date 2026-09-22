// Converts the FSI benchmark (Turek & Hron) reference data into the site's assets.
//
// Source: the legacy featflow.de pages (en/benchmarks/cfdbenchmarking/fsi_benchmark*),
// whose reference files and figures are curated under scripts/source-data/fsi/:
//
//   data/ref_fsi2.point, data/ref_fsi3.point   FSI2 / FSI3 reference runs
//   data/csm/csm3_l{2,3,4}{,_0p01,_t0p005}.point CSM3 on three levels and three time steps
//   media/                                      geometry, structure, integration path, mesh,
//                                               and the two CFD3 plots (no data behind them);
//                                               the three PNGs had transparent backgrounds and
//                                               were flattened onto white when curated, so
//                                               their dark lines stay visible on the dark theme
//
// A .point file has 12 whitespace-separated columns. The legacy Reference Values
// page documents 1 (time), 5 / 6 (drag / lift on the beam), 7 / 8 (drag / lift on
// the cylinder), 11 / 12 (x / y displacement of point A). Column 2 is the time step;
// the others are not documented and are passed through untouched in the downloads.
//
// Writes:
//   public/benchmark-assets/fsi/    Plotly traces, figures, downloads, fsi.zip, manifest
//   src/data/generated/fsi.json     last-period statistics of every published run
//
// Run by hand: node scripts/convert-fsi-data.mjs

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { createStoredZip } from "./lib/zip.mjs";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "scripts/source-data/fsi");
const outDir = resolve(root, "public/benchmark-assets/fsi");
const generatedPath = resolve(root, "src/data/generated/fsi.json");
const LEGACY = "featflow.de media/fsi";

const COL = { time: 0, dt: 1, dragBeam: 4, liftBeam: 5, dragCyl: 6, liftCyl: 7, ux: 10, uy: 11 };

function readPoint(path) {
  const rows = readFileSync(path, "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const values = line.split(/\s+/).map(Number);
      if (values.length !== 12 || values.some(Number.isNaN)) {
        throw new Error(`${basename(path)} row ${index + 1}: expected 12 numeric columns`);
      }
      return values;
    });
  for (let i = 1; i < rows.length; i++) {
    if (!(rows[i][COL.time] > rows[i - 1][COL.time])) throw new Error(`${basename(path)}: time not increasing at row ${i + 1}`);
  }
  return rows;
}

/** The quantities of interest, as the legacy gnuplot recipes build them. */
function quantities(rows) {
  return {
    t: rows.map(r => r[COL.time]),
    ux: rows.map(r => r[COL.ux]),
    uy: rows.map(r => r[COL.uy]),
    drag: rows.map(r => r[COL.dragBeam] + r[COL.dragCyl]),
    lift: rows.map(r => r[COL.liftBeam] + r[COL.liftCyl])
  };
}

/** Upward crossings of the series' mid level, linearly interpolated in time. */
function upCrossings(t, y) {
  let max = -Infinity;
  let min = Infinity;
  for (const value of y) {
    if (value > max) max = value;
    if (value < min) min = value;
  }
  const mid = (max + min) / 2;
  const crossings = [];
  for (let i = 0; i < y.length - 1; i++) {
    if (y[i] < mid && y[i + 1] >= mid) crossings.push(t[i] + ((mid - y[i]) * (t[i + 1] - t[i])) / (y[i + 1] - y[i]));
  }
  return crossings;
}

/**
 * Mean, amplitude and frequency as the legacy "Quantities for Comparison" page
 * defines them: max and min over the last full period of the oscillation,
 * mean = (max + min) / 2, amplitude = (max - min) / 2, frequency = 1 / T.
 *
 * The period is that of the fundamental (`base`: lift for FSI, u_y for CSM). The
 * in-line quantities (u_x and drag in FSI) swing twice per period, so their
 * frequency is twice the fundamental, which is how the legacy tables report it.
 */
function lastPeriodStats(series, base, doubled) {
  const crossings = upCrossings(series.t, series[base]);
  if (crossings.length < 3) throw new Error(`fewer than two full periods of ${base}`);
  const start = crossings.at(-2);
  const end = crossings.at(-1);
  const frequency = 1 / (end - start);
  const stats = { window: [round(start, 6), round(end, 6)] };
  for (const key of ["ux", "uy", "drag", "lift"]) {
    if (!series[key]) continue;
    let max = -Infinity;
    let min = Infinity;
    series.t.forEach((time, i) => {
      if (time < start || time > end) return;
      max = Math.max(max, series[key][i]);
      min = Math.min(min, series[key][i]);
    });
    stats[key] = {
      mean: round((max + min) / 2, 7),
      amplitude: round((max - min) / 2, 7),
      frequency: round(doubled.includes(key) ? 2 * frequency : frequency, 5)
    };
  }
  return stats;
}

function round(value, digits) {
  return Number(value.toPrecision(digits));
}

const entries = [];

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value) + "\n");
}

function copy(from, newPath, entry) {
  const target = resolve(outDir, newPath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(sourceDir, from), target);
  entries.push({ newPath, ...entry });
}

/** One Plotly line trace; displacements are plotted in mm, forces in N. */
function trace(t, y, name, { stride = 1, scale = 1 } = {}) {
  const x = [];
  const values = [];
  for (let i = 0; i < t.length; i += stride) {
    x.push(round(t[i], 7));
    values.push(round(y[i] * scale, 6));
  }
  return { x, y: values, type: "scatter", mode: "lines", name };
}

const METRICS = [
  { id: "ux", label: "x-displacement of A", scale: 1e3 },
  { id: "uy", label: "y-displacement of A", scale: 1e3 },
  { id: "drag", label: "Drag", scale: 1 },
  { id: "lift", label: "Lift", scale: 1 }
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// ---- FSI2 / FSI3 --------------------------------------------------------------

const FSI_RUNS = [
  { id: "fsi2", file: "data/ref_fsi2.point", legacy: "data/fsi2/0p0005/ref_fsi2.point" },
  { id: "fsi3", file: "data/ref_fsi3.point", legacy: "data/fsi3/0p00025/ref_fsi3.point" }
];

const generated = { source: "scripts/convert-fsi-data.mjs", runs: {} };

for (const run of FSI_RUNS) {
  const rows = readPoint(resolve(sourceDir, run.file));
  const series = quantities(rows);
  // The reference runs are sampled every 5e-4 s (FSI2) and 2.5e-4 s (FSI3); every
  // second sample still resolves each oscillation with well over a hundred points.
  for (const metric of METRICS) {
    const newPath = `plots/${run.id}/${metric.id}.json`;
    writeJson(resolve(outDir, newPath), trace(series.t, series[metric.id], "FeatFloWer", { stride: 2, scale: metric.scale }));
    entries.push({
      oldPath: `${LEGACY}/${run.legacy}`,
      newPath,
      metric: metric.id,
      seriesGroupId: "featflower",
      kind: "reference",
      label: `${run.id.toUpperCase()} ${metric.label}`,
      sourceShape: "single-trace",
      derived: true
    });
  }
  generated.runs[run.id] = {
    file: basename(run.file),
    samples: rows.length,
    timeStep: rows[0][COL.dt],
    span: [series.t[0], series.t.at(-1)],
    ...lastPeriodStats(series, "lift", ["ux", "drag"])
  };
  copy(run.file, `downloads/${basename(run.file)}`, {
    oldPath: `${LEGACY}/${run.legacy}`,
    kind: "download",
    label: basename(run.file)
  });
}

// ---- CSM3 ---------------------------------------------------------------------

const CSM_LEVELS = ["l2", "l3", "l4"];
const CSM_STEPS = [
  { id: "dt0p02", suffix: "", dt: 0.02 },
  { id: "dt0p01", suffix: "_0p01", dt: 0.01 },
  { id: "dt0p005", suffix: "_t0p005", dt: 0.005 }
];

generated.runs.csm3 = {};
for (const level of CSM_LEVELS) {
  for (const step of CSM_STEPS) {
    const name = `csm3_${level}${step.suffix}.point`;
    const rows = readPoint(resolve(sourceDir, "data/csm", name));
    if (rows[0][COL.dt] !== step.dt) throw new Error(`${name}: time step ${rows[0][COL.dt]}, expected ${step.dt}`);
    const series = quantities(rows);
    for (const metric of METRICS.slice(0, 2)) {
      const newPath = `plots/csm3/${metric.id}/${level}-${step.id}.json`;
      writeJson(resolve(outDir, newPath), trace(series.t, series[metric.id], level.toUpperCase(), { scale: metric.scale }));
      entries.push({
        oldPath: `${LEGACY}/data/csm/${name}`,
        newPath,
        metric: metric.id,
        seriesGroupId: level,
        kind: "level",
        label: `CSM3 ${metric.label}, ${level.toUpperCase()}, dt = ${step.dt}`,
        sourceShape: "single-trace",
        derived: true
      });
    }
    const { ux, uy, window } = lastPeriodStats({ t: series.t, ux: series.ux, uy: series.uy }, "uy", []);
    generated.runs.csm3[`${level}-${step.id}`] = { file: name, samples: rows.length, timeStep: step.dt, window, ux, uy };
    copy(`data/csm/${name}`, `downloads/${name}`, { oldPath: `${LEGACY}/data/csm/${name}`, kind: "download", label: name });
  }
}

// ---- Figures ------------------------------------------------------------------

const FIGURES = [
  ["fig1.jpg", "media/geometry.jpg", "Computational domain"],
  ["fig2.jpg", "media/structure.jpg", "Detail of the structure part"],
  ["fig3.jpg", "media/integration-path.jpg", "Integration path for the forces"],
  ["bench_fs_coarse.png", "media/coarse-mesh.png", "Coarse mesh"],
  ["cfd3_3_0_2_drag_zoom.png", "media/cfd3-drag.png", "CFD3 drag (legacy plot, no data published)"],
  ["cfd3_3_0_2_lift_zoom.png", "media/cfd3-lift.png", "CFD3 lift (legacy plot, no data published)"]
];
for (const [from, newPath, label] of FIGURES) {
  copy(`media/${from}`, newPath, { oldPath: `${LEGACY}/${from}`, kind: "media", label });
}

// ---- Bundle, manifest, derived numbers ------------------------------------------

const downloads = entries.filter(entry => entry.kind === "download");
writeFileSync(
  resolve(outDir, "downloads/fsi.zip"),
  createStoredZip(downloads.map(entry => ({ name: `fsi/${basename(entry.newPath)}`, data: readFileSync(resolve(outDir, entry.newPath)) })))
);
entries.push({ oldPath: "generated from the fsi downloads", newPath: "downloads/fsi.zip", kind: "download", label: "fsi.zip" });

writeJson(resolve(outDir, "manifest.json"), { benchmarkId: "fsi", entries });
mkdirSync(dirname(generatedPath), { recursive: true });
writeFileSync(generatedPath, JSON.stringify(generated, null, 2) + "\n");

const { fsi2, fsi3 } = generated.runs;
console.log(
  `Generated ${entries.length} fsi manifest entries in ${relative(root, outDir)}; ` +
    `FSI2 drag ${fsi2.drag.mean} ± ${fsi2.drag.amplitude} [${fsi2.drag.frequency}], ` +
    `FSI3 drag ${fsi3.drag.mean} ± ${fsi3.drag.amplitude} [${fsi3.drag.frequency}]`
);
