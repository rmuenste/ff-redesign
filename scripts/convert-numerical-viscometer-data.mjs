// Builds the numerical-viscometer (D5.1) benchmark assets.
//
// Inputs (curated under scripts/source-data/):
//   numerical-viscometer/torque_spinup.csv     torque history, empty instrument spun up to its
//                                              steady state at dt = 0.05 (t = 0..200)
//   numerical-viscometer/torque_baseline.csv   torque history, empty instrument continued from
//                                              that state at the suspension time step dt = 0.005
//                                              (t = 200..): the T(0) reference of every rung
//   numerical-viscometer/torque_<rung>.csv     torque history of each loaded rung, also continued
//                                              from the spun-up state at dt = 0.005
//   numerical-viscometer/rungs.csv             one row per rung of the phi ladder
//   numerical-viscometer/velocity_profile.csv  the profile gate, measured off the VTK frame
//   dns/dns_validation_datasheet.csv           the campaign's claim ledger
//
// The torque histories are the VISC_TORQUE_DNA and VISC_TORQUE_RES records of
// each run's own solver protocol (_data/prot.txt in the campaign rundirs), one
// sample per time step and neither smoothed nor trimmed, so every plateau number
// on the site is a statistic of the published series rather than a transcription.
// rungs.csv carries only what the series cannot yield: the plateau windows, the
// cloud size, and the two PREDICTIONS the measurement is gated against — the
// composite-Einstein target computed by the campaign from the measured phi(r,z)
// field, and the naive dilute-limit value.
//
// Matched-window baseline
// -----------------------
// The relative viscosity is a ratio of two readings of the same instrument, and
// the level-3 discrete steady state of the empty cell depends on the time step:
// spun up at dt = 0.05 it plateaus 0.54% above the analytic torque, continued at
// the suspension time step dt = 0.005 it relaxes onto it. Every loaded rung is
// such a continuation, so T(0) is NOT a single constant of the spun-up cell but
// the empty cell continued the same way, averaged over the same window of time
// after the restart as the rung it normalises. rungs.csv states that window per
// rung (baseline_start, baseline_end): the rung's own plateau window wherever
// the empty control covers it, and the control's final window for the
// lubricated twins, whose plateaus lie beyond the control's end (their T(0) is
// then the fully relaxed cell, within 3e-5 of the analytic torque). The
// spun-up history is published and plotted for the start-up, but no ratio is
// formed against it.
//
// Everything else is derived here: the exact analytic torque, the transpose
// correction between the two estimators, the plateau statistics, the relative
// viscosity and its deviation from both predictions. The instrument constants
// below are the case definition, so the analytic reference cannot drift from the
// geometry the page describes.
//
// Outputs:
//   public/benchmark-assets/numerical-viscometer/      Plotly traces, downloads, manifest
//   src/data/generated/numerical-viscometer.json       instrument, rungs and fits
//   src/data/generated/numerical-viscometer-validation.json  Validation-tab rows
//
// Run with: node scripts/convert-numerical-viscometer-data.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parseCsvRecords } from "./lib/csv.mjs";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";
import { createStoredZip } from "./lib/zip.mjs";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/numerical-viscometer");
const outDir = resolve(root, "public/benchmark-assets/numerical-viscometer");
const generatedDir = resolve(root, "src/data/generated");

/**
 * The instrument, in campaign units (particle diameter d = 1). A Searle-type
 * Couette cell: the inner surface rotates, the outer one is static, and both ends
 * are free-slip symmetry planes, which makes the flow axially uniform and gives it
 * a closed-form torque.
 */
const INSTRUMENT = {
  rInner: 5,
  rOuter: 10,
  height: 10,
  nu: 0.2,
  rho: 1,
  omega: 0.1
};

const MU = INSTRUMENT.rho * INSTRUMENT.nu;

/** Exact annular-Couette torque: T = 4 pi mu Omega H / (r_i^-2 - r_a^-2). */
const TORQUE_EXACT =
  (4 * Math.PI * MU * INSTRUMENT.omega * INSTRUMENT.height) /
  (INSTRUMENT.rInner ** -2 - INSTRUMENT.rOuter ** -2);

/** The bob is an un-meshed hole through the full height of the cell. */
const HOLE_VOLUME = Math.PI * INSTRUMENT.rInner ** 2 * INSTRUMENT.height;

/**
 * Analytic offset between the two torque estimators. The volume-form estimator
 * integrates the deformation stress and the reaction estimator does not carry the
 * transpose term over the enclosed hole, so they differ by exactly 2 mu Omega V:
 * a property of the geometry, independent of what is suspended in the gap.
 */
const TRANSPOSE_CORRECTION = 2 * MU * INSTRUMENT.omega * HOLE_VOLUME;

/** Plot sampling per run, chosen so each history contributes ~1000 points. */
const PLOT_SAMPLE = { spinup: 5, einstein: 10, baseline: 10 };

const SERIES_COLORS = {
  dna: "#5fb8ff",
  res: "#f5b84b",
  "res-corrected": "#7bd88f"
};

function readTorque(name) {
  return parseCsvRecords(readFileSync(resolve(srcDir, `torque_${name}.csv`), "utf-8")).map(record => ({
    t: Number(record.time),
    dna: Number(record.T_dna),
    res: Number(record.T_res)
  }));
}

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Closed window test; the end carries the tolerance the printed times need. */
const inWindow = (t, [start, end]) => t >= start && t <= end + 1e-6;

function pstdev(values) {
  const m = mean(values);
  return Math.sqrt(mean(values.map(value => (value - m) ** 2)));
}

/** Least-squares slope of y against t, in units of y per time unit. */
function slope(times, values) {
  const tBar = mean(times);
  const yBar = mean(values);
  const sxx = times.reduce((sum, t) => sum + (t - tBar) ** 2, 0);
  const sxy = times.reduce((sum, t, index) => sum + (t - tBar) * (values[index] - yBar), 0);
  return sxy / sxx;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function lineTrace(x, y, { name, color, dash }) {
  return { x, y, type: "scatter", mode: "lines", name, line: { color, ...(dash ? { dash } : {}) }, marker: { color } };
}

/**
 * The three closures the ladder walks through, each valid in its own concentration
 * range. Evaluated at a single volume fraction, these are the textbook curves; the
 * gate targets are the same closures composed over the MEASURED concentration
 * field, which the campaign computes and composites.csv carries.
 */
const CLOSURES = {
  einstein: { label: "Einstein, 1 + 2.5 phi", eta: phi => 1 + 2.5 * phi },
  batchelor: { label: "Batchelor, + 6.2 phi^2", eta: phi => 1 + 2.5 * phi + 6.2 * phi ** 2 },
  "krieger-dougherty": {
    label: "Krieger-Dougherty, phi_m = 0.64",
    eta: phi => (1 - phi / 0.64) ** -1.6
  }
};

// ---- plateau statistics -----------------------------------------------------
// Torques come out of the solver as signed about the axis of rotation; the page
// reads magnitudes throughout, which is also how the analytic reference is quoted.

/**
 * Composite targets from the measured concentration field, one row per closure
 * evaluated at a rung. Exactly one is the gate at each concentration — the closure
 * still inside its validity range there; the others are carried because a ladder
 * that outgrows a closure is part of the result.
 */
const composites = parseCsvRecords(readFileSync(resolve(srcDir, "composites.csv"), "utf-8")).map(
  record => ({
    phi: Number(record.phi),
    closure: record.closure,
    eta: Number(record.eta_composite),
    gate: record.gate === "yes"
  })
);
for (const entry of composites) {
  if (!CLOSURES[entry.closure]) throw new Error(`composites.csv names an unknown closure: ${entry.closure}`);
}

const rungs = parseCsvRecords(readFileSync(resolve(srcDir, "rungs.csv"), "utf-8")).map(record => {
  const run = record.run;
  const history = readTorque(run);
  if (!history.length) throw new Error(`rungs.csv names a run with no torque history: ${run}`);

  // The plateau of a loaded rung runs from `plateau_start` to the end of the run,
  // which is how the campaign quotes every plateau statistic; the empty control
  // runs on past the ladder's windows, so its own plateau is the window matched
  // to the first rung. `run_end` is carried for the reader and checked against
  // the series rather than used to trim it.
  const window = [Number(record.plateau_start), Number(record.plateau_end)];
  const runEnd = Number(record.run_end);
  const plateau = history.filter(point => inWindow(point.t, window));
  if (plateau.length < 100) throw new Error(`${run}: only ${plateau.length} samples in the plateau window`);
  if (Math.abs(history[history.length - 1].t - runEnd) > 1e-2) {
    throw new Error(`${run}: history ends at ${history[history.length - 1].t}, not the declared ${runEnd}`);
  }
  if (window[1] > runEnd + 1e-2) throw new Error(`${run}: plateau window ends after the run`);
  // The window of the empty control that serves as this rung's T(0); see the
  // header. Blank for the control itself, whose reference is its own plateau.
  const baselineWindow =
    record.baseline_start === "" ? null : [Number(record.baseline_start), Number(record.baseline_end)];

  const dna = plateau.map(point => Math.abs(point.dna));
  const res = plateau.map(point => Math.abs(point.res));
  const times = plateau.map(point => point.t);

  return {
    run,
    label: record.label,
    phi: Number(record.phi),
    particles: Number(record.particles),
    window,
    runEnd,
    baselineWindow,
    samples: plateau.length,
    torqueDna: mean(dna),
    torqueDnaPstd: pstdev(dna),
    torqueRes: mean(res),
    torqueResPstd: pstdev(res),
    /** DNA - RES over the plateau: the measured transpose offset. */
    gap: mean(dna) - mean(res),
    /** Scatter of the plateau relative to its own mean. */
    scatter: pstdev(dna) / mean(dna),
    /** Drift of the plateau torque, per time unit, relative to its mean. */
    drift: slope(times, dna) / mean(dna),
    lubrication: record.lubrication === "on",
    closure: record.closure
  };
});

const baseline = rungs.find(rung => rung.run === "baseline");
if (!baseline) throw new Error("rungs.csv carries no baseline rung");
if (baseline.baselineWindow) throw new Error("the baseline rung is its own reference; leave its baseline window blank");
baseline.baselineWindow = baseline.window;

const control = readTorque("baseline");
const controlEnd = control[control.length - 1].t;

/**
 * T(0) for one rung: the empty control averaged over the window rungs.csv
 * matches to it. The window is the rung's own plateau wherever the control
 * covers it; only a plateau that starts after the control ends may fall back to
 * the control's final window, and that window must run to the control's end.
 */
function emptyReference(rung) {
  const window = rung.baselineWindow;
  if (!window) throw new Error(`${rung.run}: rungs.csv states no baseline window`);
  const matched = window[0] === rung.window[0] && window[1] === rung.window[1];
  if (!matched) {
    if (rung.window[0] < controlEnd) {
      throw new Error(`${rung.run}: the empty control covers the plateau window, so T(0) must be read over it`);
    }
    if (Math.abs(window[1] - controlEnd) > 1e-2) {
      throw new Error(`${rung.run}: a fallback baseline window must run to the control's end (${controlEnd})`);
    }
  }
  const samples = control.filter(point => inWindow(point.t, window));
  if (samples.length < 100) throw new Error(`${rung.run}: only ${samples.length} control samples in the baseline window`);
  return {
    dna: mean(samples.map(point => Math.abs(point.dna))),
    res: mean(samples.map(point => Math.abs(point.res))),
    samples: samples.length
  };
}

// The empty instrument defines T(0), so every rung's relative viscosity is a ratio
// of two measurements made in the same cell, with the same estimator, at the same
// time step, over the same window of time after the restart.
for (const rung of rungs) {
  const reference = emptyReference(rung);
  rung.torqueReference = reference.dna;
  rung.torqueReferenceRes = reference.res;
  rung.referenceSamples = reference.samples;
  rung.eta = rung.torqueDna / reference.dna;
  rung.etaPstd = rung.torqueDnaPstd / reference.dna;
  /** The same ratio read off the corrected reaction estimator, as a cross-check. */
  rung.etaCorrected = (rung.torqueRes + TRANSPOSE_CORRECTION) / (reference.res + TRANSPOSE_CORRECTION);
  rung.gapDeviation = rung.gap / TRANSPOSE_CORRECTION - 1;

  // Every composite offered at this concentration, with the gate flagged. The
  // empty rung has none: its reference is the analytic torque, not a closure.
  rung.composites = composites
    .filter(entry => Math.abs(entry.phi - rung.phi) < 1e-9)
    .map(entry => ({ ...entry, deviation: rung.eta / entry.eta - 1 }));
  const gate = rung.composites.find(entry => entry.gate);
  rung.etaComposite = gate?.eta ?? null;
  rung.deviationComposite = gate ? rung.eta / gate.eta - 1 : null;
  // The same closure read straight off the global volume fraction, with no
  // account of the particle-free wall layers — orientation, never a gate.
  rung.etaClosure = CLOSURES[rung.closure]?.eta(rung.phi) ?? null;
  rung.etaNaive = CLOSURES.einstein.eta(rung.phi);
  rung.deviationNaive = rung.eta / rung.etaNaive - 1;
}

const einstein = rungs.find(rung => rung.run === "einstein");
if (!einstein) throw new Error("rungs.csv carries no einstein rung");

/**
 * The lubrication pairs: single-variable twins that differ only by the rigid-body
 * engine's lubrication switch. Pair counts come from the solver's own per-step
 * lubrication diagnostics over the same plateau window as the torque.
 */
const pairs = rungs
  .filter(rung => rung.lubrication)
  .map(rung => {
    const twin = rungs.find(other => !other.lubrication && Math.abs(other.phi - rung.phi) < 1e-9);
    if (!twin) throw new Error(`${rung.run}: no lubrication-off twin at phi = ${rung.phi}`);

    const activity = parseCsvRecords(
      readFileSync(resolve(srcDir, `lubpairs_${rung.run.replace("_lub", "")}.csv`), "utf-8")
    )
      .map(record => ({ t: Number(record.time), pairs: Number(record.n_pairs), saturated: Number(record.n_saturated) }))
      .filter(point => point.t >= rung.window[0]);
    if (activity.length !== rung.samples) {
      throw new Error(`${rung.run}: ${activity.length} lubrication samples against ${rung.samples} torque samples`);
    }

    return {
      phi: rung.phi,
      particles: rung.particles,
      run: rung.run,
      twin: twin.run,
      etaWithout: twin.eta,
      etaWith: rung.eta,
      delta: rung.eta / twin.eta - 1,
      activePairs: mean(activity.map(point => point.pairs)),
      saturatedPairs: mean(activity.map(point => point.saturated)),
      samples: activity.length
    };
  })
  .sort((a, b) => a.phi - b.phi);

if (pairs.length !== 2) throw new Error(`expected two lubrication pairs, found ${pairs.length}`);
// The headline: the contribution decays with concentration, tracking the pair count.
const pairDecay = {
  eta: pairs[1].delta / pairs[0].delta,
  pairs: pairs[1].activePairs / pairs[0].activePairs
};

const profile = Object.fromEntries(
  parseCsvRecords(readFileSync(resolve(srcDir, "velocity_profile.csv"), "utf-8")).map(record => [
    record.quantity,
    Number(record.value)
  ])
);

/** The four acceptance gates of the empty instrument, as measured. */
const baselineGates = {
  torque: baseline.torqueDna / TORQUE_EXACT - 1,
  correctedTorque: baseline.torqueRes + TRANSPOSE_CORRECTION,
  correctedDeviation: (baseline.torqueRes + TRANSPOSE_CORRECTION) / TORQUE_EXACT - 1,
  gapDeviation: baseline.gapDeviation,
  profileMeanError: profile.mean_rel_error,
  profileMaxError: profile.max_rel_error,
  scatter: baseline.scatter
};

// ---- assets -----------------------------------------------------------------
// The gallery stills under media/ and their manifest entries are not built here
// (they are rendered offline and land with the gallery); only what this script
// owns is rebuilt from scratch.
const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId: "numerical-viscometer" });

const entries = [];
const zipEntries = [];

function emitPlot(metric, id, traces, { seriesGroupId, label, shape, oldPath }) {
  const newPath = `plots/${metric}/${id}.json`;
  writeJson(resolve(outDir, newPath), traces);
  entries.push({
    oldPath,
    newPath,
    metric,
    seriesGroupId,
    kind: "code",
    label,
    sourceShape: shape,
    derived: true
  });
}

// ---- torque: the whole experiment on one time axis ---------------------------
// The suspension run is a same-level restart from the spun-up empty instrument's
// own dump at t = 200, so spin-up and suspension are one continuous measurement
// and are plotted as one trace per estimator; the step at t = 200 is the
// particles arriving. The empty control continues from the same dump at the
// suspension time step and is drawn from t = 200 as its own trace: the T(0) the
// ratios are formed against.
const spinup = readTorque("spinup");
const restart = Number(spinup[spinup.length - 1].t.toFixed(2));
if (control[0].t <= restart || control[0].t - restart > 1e-2) {
  throw new Error(`the empty control starts at ${control[0].t}, not at the spin-up's end ${restart}`);
}
const einsteinHistory = readTorque("einstein");
if (einsteinHistory[0].t <= restart || einsteinHistory[0].t - restart > 1e-2) {
  throw new Error(`the einstein rung starts at ${einsteinHistory[0].t}, not at the spin-up's end ${restart}`);
}

const sampled = Object.fromEntries(
  Object.keys(PLOT_SAMPLE).map(run => [
    run,
    readTorque(run).filter((_, index) => (index + 1) % PLOT_SAMPLE[run] === 0)
  ])
);

const timeline = [...sampled.spinup, ...sampled.einstein];
const torqueOf = {
  dna: point => Math.abs(point.dna),
  res: point => Math.abs(point.res),
  "res-corrected": point => Math.abs(point.res) + TRANSPOSE_CORRECTION
};
const TORQUE_LABELS = {
  dna: "Volume-form estimator",
  res: "Reaction estimator",
  "res-corrected": `Reaction + ${TRANSPOSE_CORRECTION.toFixed(3)}`
};

for (const [id, value] of Object.entries(torqueOf)) {
  emitPlot(
    "torque",
    id,
    lineTrace(timeline.map(point => point.t), timeline.map(value), {
      name: TORQUE_LABELS[id],
      color: SERIES_COLORS[id]
    }),
    {
      seriesGroupId: id,
      label: `Torque history, ${TORQUE_LABELS[id].toLowerCase()}`,
      shape: "single-trace",
      oldPath: "scripts/source-data/numerical-viscometer/torque_*.csv"
    }
  );
}

emitPlot(
  "torque",
  "baseline",
  lineTrace(sampled.baseline.map(point => point.t), sampled.baseline.map(torqueOf.dna), {
    name: "Empty instrument, suspension time step",
    color: "#c9a5f5"
  }),
  {
    seriesGroupId: "baseline",
    label: "Torque history, empty instrument continued at the suspension time step (volume-form estimator)",
    shape: "single-trace",
    oldPath: "scripts/source-data/numerical-viscometer/torque_baseline.csv"
  }
);

const tEnd = Math.max(timeline[timeline.length - 1].t, controlEnd);

emitPlot(
  "torque",
  "exact",
  lineTrace([0, tEnd], [TORQUE_EXACT, TORQUE_EXACT], {
    name: `Exact analytic torque ${TORQUE_EXACT.toFixed(2)}`,
    color: "var(--fg1)",
    dash: "dash"
  }),
  {
    seriesGroupId: "exact",
    label: "Exact annular-Couette torque",
    shape: "single-trace",
    oldPath: "generated from the instrument definition"
  }
);

// The suspension run restarts from the spun-up cell's final dump, so the seeding
// instant is the end of the spin-up.
const insertion = restart;
emitPlot(
  "torque",
  "insertion",
  lineTrace([insertion, insertion], [0, 2 * TORQUE_EXACT], {
    name: `Particles inserted, t = ${insertion}`,
    color: "var(--fg3)",
    dash: "dot"
  }),
  {
    seriesGroupId: "insertion",
    label: "Instant the suspension is seeded",
    shape: "single-trace",
    oldPath: "generated from the instrument definition"
  }
);

// ---- viscosity: eta against phi ---------------------------------------------
// The ladder in the coordinates the closures are stated in: four measured rungs
// without lubrication, the two lubricated twins, the gate targets composed from
// the measured concentration field, and the plain closure curves for orientation.
const ladder = rungs.filter(rung => !rung.lubrication);
const lubricated = rungs.filter(rung => rung.lubrication);

function markerSeries(entries, { name, color, symbol, size, mode = "markers", errors }) {
  return {
    x: entries.map(entry => entry.phi),
    y: entries.map(entry => entry.eta),
    ...(errors ? { error_y: { type: "data", array: entries.map(errors), visible: true } } : {}),
    type: "scatter",
    mode,
    name,
    marker: { color, symbol, size },
    line: { color }
  };
}

emitPlot(
  "viscosity",
  "measured",
  markerSeries(ladder, {
    name: "Measured, T(phi) / T(0)",
    color: SERIES_COLORS.dna,
    symbol: "circle",
    size: 11,
    mode: "lines+markers",
    errors: rung => rung.etaPstd
  }),
  {
    seriesGroupId: "measured",
    label: "Measured relative viscosity",
    shape: "single-trace",
    oldPath: "scripts/source-data/numerical-viscometer/torque_*.csv"
  }
);

emitPlot(
  "viscosity",
  "lubricated",
  markerSeries(lubricated, {
    name: "With sub-grid lubrication",
    color: "#c9a5f5",
    symbol: "circle-open",
    size: 13,
    errors: rung => rung.etaPstd
  }),
  {
    seriesGroupId: "lubricated",
    label: "Relative viscosity with sub-grid lubrication",
    shape: "single-trace",
    oldPath: "scripts/source-data/numerical-viscometer/torque_*.csv"
  }
);

// Gate targets: the valid closure at each concentration, composed over the
// measured field. The empty rung is exact by construction and anchors the set.
const gateTargets = [
  { phi: 0, eta: 1 },
  ...composites.filter(entry => entry.gate).map(entry => ({ phi: entry.phi, eta: entry.eta }))
].sort((a, b) => a.phi - b.phi);

emitPlot(
  "viscosity",
  "composite",
  markerSeries(gateTargets, {
    name: "Composite target from the measured field",
    color: "var(--fg1)",
    symbol: "diamond-open",
    size: 13
  }),
  {
    seriesGroupId: "composite",
    label: "Composite targets from the measured concentration field",
    shape: "single-trace",
    oldPath: "scripts/source-data/numerical-viscometer/composites.csv"
  }
);

const phiMax = Math.max(...rungs.map(rung => rung.phi)) * 1.1;
const phiGrid = Array.from({ length: 61 }, (_, index) => (index / 60) * phiMax);
const CLOSURE_COLORS = { einstein: "var(--fg3)", batchelor: "#f5b84b", "krieger-dougherty": "#ef6f6c" };

for (const [id, closure] of Object.entries(CLOSURES)) {
  emitPlot(
    "viscosity",
    id,
    lineTrace(phiGrid, phiGrid.map(closure.eta), {
      name: closure.label,
      color: CLOSURE_COLORS[id],
      dash: "dash"
    }),
    {
      seriesGroupId: id,
      label: `${closure.label} (plain closure)`,
      shape: "single-trace",
      oldPath: "generated from the closure relation"
    }
  );
}

// ---- pairs: what the lubrication model is actually doing ---------------------
// The per-step count of near-contact films the model acts on, and how many of
// them are saturated, over the same plateau the viscosity is read from.
for (const pair of pairs) {
  const stem = pair.run.replace("_lub", "");
  const oldPath = `scripts/source-data/numerical-viscometer/lubpairs_${stem}.csv`;
  const activity = parseCsvRecords(readFileSync(resolve(srcDir, `lubpairs_${stem}.csv`), "utf-8"))
    .map(record => ({ t: Number(record.time), pairs: Number(record.n_pairs), saturated: Number(record.n_saturated) }))
    .filter((_, index) => (index + 1) % 5 === 0);

  for (const [id, key, label, color] of [
    ["active", "pairs", "Active lubrication pairs", "#7bd88f"],
    ["saturated", "saturated", "Saturated pairs", "#f5b84b"]
  ]) {
    emitPlot(
      "pairs",
      `${stem}-${id}`,
      lineTrace(activity.map(point => point.t), activity.map(point => point[key]), {
        name: `phi = ${pair.phi.toFixed(2)} ${label.toLowerCase()}`,
        color
      }),
      {
        seriesGroupId: id,
        label: `${label}, phi = ${pair.phi.toFixed(2)}`,
        shape: "single-trace",
        oldPath
      }
    );
  }
}

// ---- downloads --------------------------------------------------------------
const downloadNames = [
  "torque_spinup.csv",
  ...rungs.map(rung => `torque_${rung.run}.csv`),
  ...pairs.map(pair => `lubpairs_${pair.run.replace("_lub", "")}.csv`),
  "rungs.csv",
  "composites.csv",
  "velocity_profile.csv"
];

for (const name of downloadNames) {
  const newPath = `downloads/${name}`;
  mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
  copyFileSync(resolve(srcDir, name), resolve(outDir, newPath));
  entries.push({
    oldPath: `scripts/source-data/numerical-viscometer/${name}`,
    newPath,
    kind: "download",
    label: name
  });
  zipEntries.push({ name: `numerical-viscometer/${name}`, data: readFileSync(resolve(outDir, newPath)) });
}

const datasheetName = "dns_validation_datasheet.csv";
const datasheetSource = `scripts/source-data/dns/${datasheetName}`;
copyFileSync(resolve(root, datasheetSource), resolve(outDir, `downloads/${datasheetName}`));
entries.push({
  oldPath: datasheetSource,
  newPath: `downloads/${datasheetName}`,
  kind: "download",
  label: datasheetName
});
zipEntries.push({
  name: `numerical-viscometer/${datasheetName}`,
  data: readFileSync(resolve(outDir, `downloads/${datasheetName}`))
});

writeFileSync(resolve(outDir, "downloads/numerical-viscometer.zip"), createStoredZip(zipEntries));
entries.push({
  oldPath: "generated from numerical-viscometer downloads",
  newPath: "downloads/numerical-viscometer.zip",
  kind: "download",
  label: "numerical-viscometer.zip"
});

writeManifest(outDir, "numerical-viscometer", entries, preserved);

// ---- instrument, rungs and gates --------------------------------------------
writeJson(resolve(generatedDir, "numerical-viscometer.json"), {
  source: "scripts/source-data/numerical-viscometer",
  generatedBy: "scripts/convert-numerical-viscometer-data.mjs",
  instrument: {
    ...INSTRUMENT,
    mu: MU,
    bobSpeed: INSTRUMENT.omega * INSTRUMENT.rInner,
    torqueExact: TORQUE_EXACT,
    holeVolume: HOLE_VOLUME,
    transposeCorrection: TRANSPOSE_CORRECTION
  },
  closures: Object.fromEntries(
    Object.entries(CLOSURES).map(([id, closure]) => [id, { label: closure.label }])
  ),
  restart,
  rungs,
  pairs,
  pairDecay,
  baselineGates,
  profile
});

// ---- validation ledger ------------------------------------------------------
// Generated from the datasheet, never hand-written.
//
// Selection policy
// ----------------
// Published: the empty cell continued at the suspension time step, which is the
// T(0) of every ratio on the page and certifies the instrument against the
// analytic torque; the restated concentration ladder, whose three rungs are read
// against that matched-window baseline; and the two lubrication pairs in their
// settled form. Withheld: the spun-up cell's own gate row and the three original
// rung rows, which the ladder row supersedes as absolute viscosities, and the
// first-segment readings of both pairs, whose windows were taken before the
// lubricated microstructure had relaxed and which the settled rows supersede.
// The datasheet download under Reference Data carries every row of the campaign,
// superseded ones included.
// Listed in the order the page reads them: instrument, ladder, pairs.
const PUBLISHED = [
  "d52_v26e_dt_control",
  "d52_l3_ladder_restated",
  "d52_v22L_settled",
  "d52_v23L_settled"
];

const records = readDatasheet(resolve(root, datasheetSource));
const ledger = buildLedger(records, record => PUBLISHED.includes(record.case.trim())).sort(
  (a, b) => PUBLISHED.indexOf(a.case) - PUBLISHED.indexOf(b.case)
);

writeJson(resolve(generatedDir, "numerical-viscometer-validation.json"), {
  source: datasheetSource,
  generatedBy: "scripts/convert-numerical-viscometer-data.mjs",
  rows: ledger
});

console.log(
  `Generated ${entries.length} numerical-viscometer manifest entries in ${relative(root, outDir)}, ` +
    `T_exact = ${TORQUE_EXACT.toFixed(4)}, transpose correction = ${TRANSPOSE_CORRECTION.toFixed(4)}, ` +
    `baseline ${(baselineGates.torque * 100).toFixed(2)}%, ` +
    `ladder ${ladder
      .filter(rung => rung.phi > 0)
      .map(rung => `phi=${rung.phi.toFixed(2)} eta=${rung.eta.toFixed(4)} (${(rung.deviationComposite * 100).toFixed(2)}%)`)
      .join(", ")}, ` +
    `lubrication delta ${pairs.map(pair => `${(pair.delta * 100).toFixed(2)}%`).join(" / ")} ` +
    `(decay ${pairDecay.eta.toFixed(1)}x vs pair count ${pairDecay.pairs.toFixed(1)}x), ` +
    `and ${ledger.length} validation rows`
);
