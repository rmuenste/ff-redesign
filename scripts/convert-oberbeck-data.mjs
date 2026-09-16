// Builds the Oberbeck spheroid-drag (D6.1) benchmark assets.
//
// Inputs (curated under scripts/source-data/):
//   oberbeck/runs.csv        one row per solver run: rung, orientation, rundir
//   oberbeck/rungs.csv       one row per rung of the ladder: level, mesh spacing, body scale
//   oberbeck/run_<id>.csv    the run's own time series, one line per time step
//   dns/dns_validation_datasheet.csv   the campaign's claim ledger
//
// run_<id>.csv is the merge of two solver protocol files from the campaign
// rundir — particle_force.log (the FBM wrench on the body) and bulk_flow.log
// (the cell's superficial velocity and imaged fluid fraction) — sample for
// sample, neither smoothed nor trimmed. Every number on the page is a statistic
// of those published series.
//
// Everything else is derived here, by the same procedure as the campaign's
// tools/d61_oberbeck_analysis.py (CASE_SPEC d61_oberbeck sections 2 and 5):
//
//   - Oberbeck / Kim-Karrila resistance functions X^A, Y^A at aspect ratio 2;
//   - the hydrodynamic radius R_h of each run from the self-consistent Hasimoto
//     inversion of the periodic-array drag, in the D1.1 convention
//     (F = f * V_cell whole-cell balance, U = superficial velocity);
//   - the d11 imaged-volume correction, taken from each run's own fluid
//     fraction rather than assumed;
//   - the gates: the anisotropy ratio, the per-orientation absolutes, and the
//     torque null, plus the trailing-window sensitivity of the ratio.
//
// src/data/oberbeck.test.ts pins the derived numbers against the campaign tool's
// own printed report, so the re-derivation cannot drift from it silently.
//
// Outputs:
//   public/benchmark-assets/oberbeck-spheroid-drag/   Plotly traces, downloads, manifest
//   src/data/generated/oberbeck.json                  resistance functions, rungs, gates
//   src/data/generated/oberbeck-validation.json       Validation-tab rows
//
// Run with: node scripts/convert-oberbeck-data.mjs
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parseCsvRecords } from "./lib/csv.mjs";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";
import { createStoredZip } from "./lib/zip.mjs";

const BENCHMARK = "oberbeck-spheroid-drag";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/oberbeck");
const outDir = resolve(root, `public/benchmark-assets/${BENCHMARK}`);
const generatedDir = resolve(root, "src/data/generated");

/**
 * The fixture, in campaign units. A triply periodic unit cube driven by a uniform
 * body force, with one body held fixed at the cell centre — the D1.1 Hasimoto
 * fixture with the sphere replaced by a prolate spheroid of the same volume.
 */
const CELL = {
  edge: 1,
  mu: 1,
  /** Body force per unit volume; at steady state |F| = f * V_cell in every component. */
  force: 1e-2,
  /** The d11 sphere this body is volume-matched to, and the V0 anchor's radius. */
  sphereRadius: 1 / 6,
  aspectRatio: 2
};

/** Certified d11 L3 drag coefficient the V0 sphere anchor must reproduce. */
const K_L3_CERTIFIED = 1.7404;

/** d11 sensitivity dlnK/dlnr, used to fold the imaged-volume error into R_h. */
const DLNK_DLNR = 1.87;

/** Trailing plateau windows the ratio is re-read over, in time units. */
const SENSITIVITY_WINDOWS = [0, 0.25, 0.5, 1, 2];

/**
 * Headline window. Zero means "the last sample", which is the reading every
 * recorded campaign number was taken at; the sensitivity table is what prices
 * that choice rather than leaving it implicit.
 */
const HEADLINE_WINDOW = 0;

const COLORS = {
  parallel: "#5fb8ff",
  perpendicular: "#f5b84b",
  target: "var(--fg1)",
  band: "var(--fg3)",
  balance: "var(--fg3)"
};

/**
 * Oberbeck (1876) resistance functions in the Kim & Karrila form, for a prolate
 * spheroid of aspect ratio r_e = a/b:
 *
 *   F_parallel = 6 pi mu a U X^A,   F_perpendicular = 6 pi mu a U Y^A
 *
 * with a the semi-MAJOR axis. Both tend to 1 as the eccentricity vanishes, i.e.
 * the sphere is the e -> 0 limit of the same expression.
 */
function resistanceFunctions(aspectRatio) {
  const e = Math.sqrt(1 - 1 / aspectRatio ** 2);
  const L = Math.log((1 + e) / (1 - e));
  return {
    e,
    L,
    XA: ((8 / 3) * e ** 3) / (-2 * e + (1 + e * e) * L),
    YA: ((16 / 3) * e ** 3) / (2 * e + (3 * e * e - 1) * L)
  };
}

/** Hasimoto's simple-cubic periodic-array drag factor at solid fraction phi. */
function hasimotoK(phi) {
  return 1 / (1 - 1.7601 * phi ** (1 / 3) + phi - 1.5593 * phi * phi);
}

/**
 * Hydrodynamic radius from the periodic drag, by the same fixed point the d11
 * analysis used: solve F / (6 pi mu R U) = K_H(phi(R)) with phi the solid
 * fraction of a sphere of radius R in this cell.
 */
function invertRh(F, U) {
  let R = CELL.sphereRadius;
  for (let i = 0; i < 200; i += 1) {
    const phi = ((4 / 3) * Math.PI * R ** 3) / CELL.edge ** 3;
    const next = F / (6 * Math.PI * CELL.mu * U * hasimotoK(phi));
    if (Math.abs(next - R) < 1e-14) return next;
    R = 0.5 * (R + next);
  }
  return R;
}

function readSeries(run) {
  return parseCsvRecords(readFileSync(resolve(srcDir, `run_${run}.csv`), "utf-8")).map(record => ({
    t: Number(record.time),
    F: [Number(record.F_x), Number(record.F_y), Number(record.F_z)],
    T: [Number(record.T_x), Number(record.T_y), Number(record.T_z)],
    U: Number(record.U_sup),
    fluidFraction: Number(record.fluid_fraction)
  }));
}

const norm = vector => Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Trailing-window mean of `pick`; a window of zero reads the last sample alone. */
function windowMean(series, window, pick) {
  if (window <= 0) return pick(series[series.length - 1]);
  const tEnd = series[series.length - 1].t;
  return mean(series.filter(point => point.t > tEnd - window - 1e-12).map(pick));
}

/**
 * Reduce one run to its steady wrench, superficial velocity and hydrodynamic
 * radius over a trailing window.
 *
 * `R_h` is the raw inversion; `R_h_corrected` folds in the discrete-volume error
 * the run reports itself — the alpha field images a body of slightly the wrong
 * volume, and the d11 collapse says the drag responds to the implied radius error
 * with exponent dlnK/dlnr.
 */
function reduce(series, window, solidNominal) {
  const F = [0, 1, 2].map(axis => windowMean(series, window, point => point.F[axis]));
  const T = [0, 1, 2].map(axis => windowMean(series, window, point => point.T[axis]));
  const U = windowMean(series, window, point => point.U);
  const fluidFraction = windowMean(series, window, point => point.fluidFraction);
  const Fmag = norm(F);
  const radiusError = ((1 - fluidFraction) / solidNominal) ** (1 / 3) - 1;
  return {
    t: series[series.length - 1].t,
    F,
    T,
    Fmag,
    Tmag: norm(T),
    U,
    fluidFraction,
    radiusError,
    rh: invertRh(Fmag, U),
    rhCorrected: invertRh(Fmag / (1 + radiusError) ** DLNK_DLNR, U)
  };
}

/** Least-squares-free plateau trend: the last time unit against the one before it. */
function trend(series) {
  const tEnd = series[series.length - 1].t;
  const between = (lo, hi) => mean(series.filter(p => p.t > lo && p.t <= hi).map(p => p.F[2]));
  return between(tEnd - 1, tEnd) / between(tEnd - 2, tEnd - 1) - 1;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function lineTrace(x, y, { name, color, dash, mode = "lines", symbol, size }) {
  return {
    x,
    y,
    type: "scatter",
    mode,
    name,
    line: { color, ...(dash ? { dash } : {}) },
    marker: { color, ...(symbol ? { symbol } : {}), ...(size ? { size } : {}) }
  };
}

// ---- the ladder --------------------------------------------------------------

const { XA, YA } = resistanceFunctions(CELL.aspectRatio);
const RATIO_TARGET = YA / XA;

const runRecords = parseCsvRecords(readFileSync(resolve(srcDir, "runs.csv"), "utf-8"));
const series = Object.fromEntries(runRecords.map(record => [record.run, readSeries(record.run)]));
for (const [run, points] of Object.entries(series)) {
  if (points.length < 100) throw new Error(`${run}: only ${points.length} samples`);
}

/**
 * Body geometry at a given size scale. The spheroid is volume-matched to the d11
 * sphere, so b = r / 2^(1/3) and a = 2b at aspect ratio 2; halving the scale
 * halves both semi-axes and so halves the long-axis image parameter 2a/L.
 */
function geometry(scale) {
  const b = (scale * CELL.sphereRadius) / Math.cbrt(CELL.aspectRatio);
  const a = CELL.aspectRatio * b;
  return { a, b, solidFraction: ((4 / 3) * Math.PI * a * b * b) / CELL.edge ** 3 };
}

const rungs = parseCsvRecords(readFileSync(resolve(srcDir, "rungs.csv"), "utf-8")).map(record => {
  const scale = Number(record.scale);
  const h = Number(record.h);
  const { a, b, solidFraction } = geometry(scale);

  const runsOf = orientation => {
    const found = runRecords.find(
      entry => entry.rung === record.rung && entry.orientation === orientation
    );
    if (!found) throw new Error(`rung ${record.rung} has no ${orientation} run`);
    return found.run;
  };
  const parallelRun = runsOf("parallel");
  const perpendicularRun = runsOf("perpendicular");

  const at = window => {
    const par = reduce(series[parallelRun], window, solidFraction);
    const perp = reduce(series[perpendicularRun], window, solidFraction);
    return {
      window,
      ratio: perp.rh / par.rh,
      ratioCorrected: perp.rhCorrected / par.rhCorrected,
      deviation: perp.rh / par.rh / RATIO_TARGET - 1,
      deviationCorrected: perp.rhCorrected / par.rhCorrected / RATIO_TARGET - 1,
      par,
      perp
    };
  };

  const headline = at(HEADLINE_WINDOW);
  const orientation = (id, run, reduced, coefficient) => ({
    id,
    run,
    rh: reduced.rh,
    rhCorrected: reduced.rhCorrected,
    target: a * coefficient,
    deviation: reduced.rh / (a * coefficient) - 1,
    deviationCorrected: reduced.rhCorrected / (a * coefficient) - 1,
    radiusError: reduced.radiusError,
    torqueNull: reduced.Tmag / (a * reduced.Fmag),
    force: reduced.Fmag,
    /** Departure of the steady drag from the momentum balance f * V_cell. */
    balance: reduced.Fmag / (CELL.force * CELL.edge ** 3) - 1,
    velocity: reduced.U,
    trend: trend(series[run])
  });

  return {
    id: record.rung,
    label: record.label,
    short: record.short,
    level: record.level,
    h,
    scale,
    a,
    b,
    /** Elements across the thin axis: the resolution that governs this fixture. */
    thinAxisResolution: (2 * b) / h,
    /** Long-axis extent as a fraction of the cell edge: the image proximity. */
    imageParameter: (2 * a) / CELL.edge,
    solidFraction,
    ratio: headline.ratio,
    ratioCorrected: headline.ratioCorrected,
    deviation: headline.deviation,
    deviationCorrected: headline.deviationCorrected,
    orientations: [
      orientation("parallel", parallelRun, headline.par, XA),
      orientation("perpendicular", perpendicularRun, headline.perp, YA)
    ],
    sensitivity: SENSITIVITY_WINDOWS.map(window => {
      const entry = at(window);
      return {
        window,
        ratio: entry.ratio,
        ratioCorrected: entry.ratioCorrected,
        deviation: entry.deviation,
        deviationCorrected: entry.deviationCorrected
      };
    })
  };
});

const byId = Object.fromEntries(rungs.map(rung => [rung.id, rung]));
for (const id of ["l3-full", "l4-full", "l4-half"]) {
  if (!byId[id]) throw new Error(`rungs.csv is missing the ${id} rung`);
}

/** The V0 sphere control: the certified d11 L3 drag coefficient, re-measured. */
const anchorRun = runRecords.find(record => record.rung === "anchor");
if (!anchorRun) throw new Error("runs.csv carries no sphere anchor run");
const anchorSphere = (4 / 3) * Math.PI * CELL.sphereRadius ** 3;
const anchorReduced = reduce(series[anchorRun.run], HEADLINE_WINDOW, anchorSphere);
const anchor = {
  run: anchorRun.run,
  force: anchorReduced.Fmag,
  velocity: anchorReduced.U,
  K: anchorReduced.Fmag / (6 * Math.PI * CELL.mu * CELL.sphereRadius * anchorReduced.U),
  certified: K_L3_CERTIFIED,
  radiusError: anchorReduced.radiusError,
  torqueNull: anchorReduced.Tmag / (CELL.sphereRadius * anchorReduced.Fmag)
};
anchor.deviation = anchor.K / K_L3_CERTIFIED - 1;

/**
 * The 45-degree run. Its steady drag direction is structurally uninformative —
 * momentum balance pins |F| to f * V_cell in every component — so the run is kept
 * for the record and for the transverse mean flow, which is where the
 * off-diagonal mobility actually appears.
 */
const obliqueRun = runRecords.find(record => record.rung === "oblique");
const obliqueReduced = obliqueRun ? reduce(series[obliqueRun.run], HEADLINE_WINDOW, null) : null;
const oblique = obliqueRun
  ? {
      run: obliqueRun.run,
      force: obliqueReduced.Fmag,
      balance: obliqueReduced.Fmag / (CELL.force * CELL.edge ** 3) - 1,
      velocity: obliqueReduced.U,
      /** Unbounded-Stokes prediction for the tilt of the mean flow toward the axis. */
      predictedTilt: (Math.atan((YA - XA) / (YA + XA)) * 180) / Math.PI
    }
  : null;

// ---- assets -----------------------------------------------------------------
rmSync(outDir, { recursive: true, force: true });

const entries = [];
const zipEntries = [];

function emitPlot(metric, id, traces, { seriesGroupId, label, shape, oldPath }) {
  const newPath = `plots/${metric}/${id}.json`;
  writeJson(resolve(outDir, newPath), traces);
  entries.push({ oldPath, newPath, metric, seriesGroupId, kind: "code", label, sourceShape: shape, derived: true });
}

const SERIES_SOURCE = "scripts/source-data/oberbeck/run_*.csv";

// ---- ratio: the headline ladder ---------------------------------------------
// Plotted against the long-axis image parameter 2a/L, because that is the axis
// the result moves along: two rungs share it at different resolutions and do not
// separate, the third halves it and collapses. One series per thin-axis
// resolution therefore reads as the whole two-factor design in one frame.
const ratioSeries = [
  { id: "res-9", rungs: ["l3-full", "l4-half"], color: COLORS.parallel },
  { id: "res-19", rungs: ["l4-full"], color: COLORS.perpendicular }
];

for (const group of ratioSeries) {
  const points = group.rungs.map(id => byId[id]).sort((a, b) => a.imageParameter - b.imageParameter);
  emitPlot(
    "ratio",
    group.id,
    lineTrace(
      points.map(rung => rung.imageParameter),
      points.map(rung => rung.ratio),
      {
        name: `2b/h = ${points[0].thinAxisResolution.toFixed(1)}`,
        color: group.color,
        mode: points.length > 1 ? "lines+markers" : "markers",
        symbol: "circle",
        size: 12
      }
    ),
    {
      seriesGroupId: group.id,
      label: `Anisotropy ratio at 2b/h = ${points[0].thinAxisResolution.toFixed(1)}`,
      shape: "single-trace",
      oldPath: SERIES_SOURCE
    }
  );
}

const imageAxis = [0, Math.max(...rungs.map(rung => rung.imageParameter)) * 1.15];

emitPlot(
  "ratio",
  "oberbeck",
  lineTrace(imageAxis, [RATIO_TARGET, RATIO_TARGET], {
    name: `Oberbeck Y^A/X^A = ${RATIO_TARGET.toFixed(5)}`,
    color: COLORS.target,
    dash: "dash"
  }),
  {
    seriesGroupId: "oberbeck",
    label: "Unbounded Oberbeck anisotropy",
    shape: "single-trace",
    oldPath: "generated from the Oberbeck resistance functions"
  }
);

emitPlot(
  "ratio",
  "band",
  [1.02, 0.98].map(edge =>
    lineTrace(imageAxis, [RATIO_TARGET * edge, RATIO_TARGET * edge], {
      name: `${edge > 1 ? "+" : "−"}2%`,
      color: COLORS.band,
      dash: "dot"
    })
  ),
  {
    seriesGroupId: "band",
    label: "Primary gate band, +/- 2%",
    shape: "trace-array",
    oldPath: "generated from the Oberbeck resistance functions"
  }
);

// ---- absolutes: each orientation against its own resistance function ---------
// The same abscissa as the ratio plot, so the two read together; the ordinate is
// the deviation in per cent, because the half-size body's radii are half the
// full-size ones and the raw values would not share a scale.
for (const orientation of ["parallel", "perpendicular"]) {
  for (const group of ratioSeries) {
    const points = group.rungs
      .map(id => byId[id])
      .sort((a, b) => a.imageParameter - b.imageParameter);
    const suffix = group.id.replace("res-", "");
    emitPlot(
      "absolutes",
      `${orientation}-${suffix}`,
      lineTrace(
        points.map(rung => rung.imageParameter),
        points.map(
          rung => rung.orientations.find(entry => entry.id === orientation).deviationCorrected * 100
        ),
        {
          name: `${orientation === "parallel" ? "Parallel" : "Perpendicular"}, 2b/h = ${points[0].thinAxisResolution.toFixed(1)}`,
          color: COLORS[orientation],
          dash: suffix === "19" ? "dot" : undefined,
          mode: points.length > 1 ? "lines+markers" : "markers",
          symbol: suffix === "19" ? "diamond" : "circle",
          size: 12
        }
      ),
      {
        seriesGroupId: `${orientation}-${suffix}`,
        label: `${orientation} absolute deviation at 2b/h = ${points[0].thinAxisResolution.toFixed(1)}`,
        shape: "single-trace",
        oldPath: SERIES_SOURCE
      }
    );
  }
}

emitPlot(
  "absolutes",
  "exact",
  lineTrace(imageAxis, [0, 0], { name: "a X^A / a Y^A", color: COLORS.target, dash: "dash" }),
  {
    seriesGroupId: "exact",
    label: "Oberbeck absolute targets",
    shape: "single-trace",
    oldPath: "generated from the Oberbeck resistance functions"
  }
);

emitPlot(
  "absolutes",
  "band",
  [3, -3].map(edge =>
    lineTrace(imageAxis, [edge, edge], {
      name: `${edge > 0 ? "+" : "−"}3%`,
      color: COLORS.band,
      dash: "dot"
    })
  ),
  {
    seriesGroupId: "band",
    label: "Secondary gate band, +/- 3%",
    shape: "trace-array",
    oldPath: "generated from the Oberbeck resistance functions"
  }
);

// ---- force and velocity: the approach to the plateau ------------------------
// The two halves of the same statement. The drag runs to f * V_cell whatever the
// body is doing, because momentum balance fixes it; the superficial velocity does
// not, and that is where the anisotropy lives.
for (const rung of rungs) {
  for (const orientation of rung.orientations) {
    const points = series[orientation.run];
    for (const [metric, pick, unit] of [
      ["force", point => point.F[2], "F_z"],
      ["velocity", point => point.U, "U"]
    ]) {
      emitPlot(
        metric,
        `${rung.id}-${orientation.id}`,
        lineTrace(points.map(point => point.t), points.map(pick), {
          name: `${unit}, axis ${orientation.id} (${rung.short})`,
          color: COLORS[orientation.id]
        }),
        {
          seriesGroupId: orientation.id,
          label: `${metric === "force" ? "Drag" : "Superficial velocity"} history, ${orientation.id}, ${rung.short}`,
          shape: "single-trace",
          oldPath: `scripts/source-data/oberbeck/run_${orientation.run}.csv`
        }
      );
    }
  }

  const tEnd = series[rung.orientations[0].run].slice(-1)[0].t;
  emitPlot(
    "force",
    `${rung.id}-balance`,
    lineTrace([0, tEnd], [CELL.force * CELL.edge ** 3, CELL.force * CELL.edge ** 3], {
      name: "Momentum balance, f V_cell",
      color: COLORS.balance,
      dash: "dash"
    }),
    {
      seriesGroupId: "balance",
      label: `Momentum-balance drag, ${rung.short}`,
      shape: "single-trace",
      oldPath: "generated from the driving force and the cell volume"
    }
  );
}

// ---- downloads --------------------------------------------------------------
const sourceDownloads = [...runRecords.map(record => `run_${record.run}.csv`), "runs.csv", "rungs.csv"];

for (const name of sourceDownloads) {
  const newPath = `downloads/${name}`;
  mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
  copyFileSync(resolve(srcDir, name), resolve(outDir, newPath));
  entries.push({
    oldPath: `scripts/source-data/oberbeck/${name}`,
    newPath,
    kind: "download",
    label: name
  });
  zipEntries.push({ name: `${BENCHMARK}/${name}`, data: readFileSync(resolve(outDir, newPath)) });
}

function emitCsv(name, header, rows, { oldPath, label }) {
  const newPath = `downloads/${name}`;
  const text = [header.join(","), ...rows.map(row => row.join(","))].join("\n").concat("\n");
  mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
  writeFileSync(resolve(outDir, newPath), text);
  entries.push({ oldPath, newPath, kind: "download", label });
  zipEntries.push({ name: `${BENCHMARK}/${name}`, data: Buffer.from(text) });
}

emitCsv(
  "gates.csv",
  [
    "rung",
    "level",
    "thin_axis_resolution",
    "image_parameter",
    "orientation",
    "R_h",
    "R_h_volume_corrected",
    "target",
    "deviation",
    "deviation_volume_corrected",
    "torque_null",
    "ratio",
    "ratio_deviation"
  ],
  rungs.flatMap(rung =>
    rung.orientations.map(orientation => [
      rung.id,
      rung.level,
      rung.thinAxisResolution.toFixed(3),
      rung.imageParameter.toFixed(6),
      orientation.id,
      orientation.rh.toExponential(8),
      orientation.rhCorrected.toExponential(8),
      orientation.target.toExponential(8),
      orientation.deviation.toExponential(6),
      orientation.deviationCorrected.toExponential(6),
      orientation.torqueNull.toExponential(6),
      rung.ratio.toFixed(6),
      rung.deviation.toExponential(6)
    ])
  ),
  { oldPath: "derived from the run series by scripts/convert-oberbeck-data.mjs", label: "gates.csv" }
);

emitCsv(
  "window_sensitivity.csv",
  ["rung", "window", "ratio", "ratio_volume_corrected", "deviation", "deviation_volume_corrected"],
  rungs.flatMap(rung =>
    rung.sensitivity.map(entry => [
      rung.id,
      entry.window.toFixed(2),
      entry.ratio.toFixed(6),
      entry.ratioCorrected.toFixed(6),
      entry.deviation.toExponential(6),
      entry.deviationCorrected.toExponential(6)
    ])
  ),
  {
    oldPath: "derived from the run series by scripts/convert-oberbeck-data.mjs",
    label: "window_sensitivity.csv"
  }
);

// ---- validation ledger ------------------------------------------------------
// Generated from the datasheet, never hand-written.
//
// Selection policy
// ----------------
// Published: the two implementation gates that had to pass before any production
// run (the rigid-body library fix and the case setup, both certified by
// byte-identical sphere twins), the sphere regression anchor, the in-situ check
// that the imaged body really is a spheroid, the three rungs of the ratio ladder,
// the off-diagonal observable, and the review that priced the plateau window.
// That is every row carrying a number this page quotes. The datasheet download
// under Reference Data carries the campaign's wider record.
const PUBLISHED = [
  "pe_ellfix_twin",
  "d61_setup_twin",
  "d61_v0_anchor",
  "d61_g0b_pass",
  "d61_v123_l3",
  "d61_v4_resolution",
  "d61_v3b_transverse",
  "d61_v5_halfsize",
  "d61_review_corrections"
];
const published = new Set(PUBLISHED);

const datasheetName = "dns_validation_datasheet.csv";
const datasheetSource = `scripts/source-data/dns/${datasheetName}`;
const records = readDatasheet(resolve(root, datasheetSource));
const ledger = buildLedger(records, record => published.has(record.case.trim()));
if (ledger.length !== PUBLISHED.length) {
  throw new Error(`ledger selected ${ledger.length} rows, expected ${PUBLISHED.length}`);
}

copyFileSync(resolve(root, datasheetSource), resolve(outDir, `downloads/${datasheetName}`));
entries.push({ oldPath: datasheetSource, newPath: `downloads/${datasheetName}`, kind: "download", label: datasheetName });
zipEntries.push({ name: `${BENCHMARK}/${datasheetName}`, data: readFileSync(resolve(outDir, `downloads/${datasheetName}`)) });

// The page's own ledger as a standalone file: the same rows, in the same order,
// straight out of the datasheet without the sanitiser's run-id stripping.
const datasheetRows = parseCsvRecords(readFileSync(resolve(root, datasheetSource), "utf-8"));
const header = ["suite", "case", "quantity", "expected", "expected_source", "measured", "rel_error", "tolerance", "verdict"];
const quote = value => `"${String(value).replace(/"/g, '""')}"`;
emitCsv(
  "oberbeck_validation_rows.csv",
  header,
  PUBLISHED.map(id => {
    const record = datasheetRows.find(entry => entry.case.trim() === id);
    if (!record) throw new Error(`datasheet has no row for ${id}`);
    return header.map(field => quote(record[field]));
  }),
  { oldPath: datasheetSource, label: "oberbeck_validation_rows.csv" }
);

writeFileSync(resolve(outDir, `downloads/${BENCHMARK}.zip`), createStoredZip(zipEntries));
entries.push({
  oldPath: `generated from ${BENCHMARK} downloads`,
  newPath: `downloads/${BENCHMARK}.zip`,
  kind: "download",
  label: `${BENCHMARK}.zip`
});

writeJson(resolve(outDir, "manifest.json"), { benchmarkId: BENCHMARK, entries });

writeJson(resolve(generatedDir, "oberbeck.json"), {
  source: "scripts/source-data/oberbeck",
  generatedBy: "scripts/convert-oberbeck-data.mjs",
  cell: CELL,
  resistance: { ...resistanceFunctions(CELL.aspectRatio), ratio: RATIO_TARGET },
  headlineWindow: HEADLINE_WINDOW,
  anchor,
  oblique,
  rungs
});

writeJson(resolve(generatedDir, "oberbeck-validation.json"), {
  source: datasheetSource,
  generatedBy: "scripts/convert-oberbeck-data.mjs",
  rows: ledger
});

console.log(
  `Generated ${entries.length} ${BENCHMARK} manifest entries in ${relative(root, outDir)}, ` +
    `X^A = ${XA.toFixed(6)}, Y^A = ${YA.toFixed(6)}, Y/X = ${RATIO_TARGET.toFixed(5)}, ` +
    `V0 anchor K = ${anchor.K.toFixed(4)} (${(anchor.deviation * 100).toFixed(3)}%), ` +
    `ladder ${rungs
      .map(rung => `${rung.short} ${rung.ratio.toFixed(5)} (${(rung.deviation * 100).toFixed(2)}%)`)
      .join(", ")}, ` +
    `closing absolutes ${byId["l4-half"].orientations
      .map(entry => `${entry.id} ${(entry.deviationCorrected * 100).toFixed(2)}%`)
      .join(" / ")}, ` +
    `and ${ledger.length} validation rows`
);
