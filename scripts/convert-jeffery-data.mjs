// Builds the Jeffery-orbit (D6.2) benchmark assets.
//
// Inputs (curated under scripts/source-data/):
//   jeffery/runs.csv       one row per solver run: geometry, shear, mask, rundir
//   jeffery/run_<id>.csv   that run's own DNS_PART_AXIS trace, one line per step
//   dns/dns_validation_datasheet.csv   the campaign's claim ledger
//
// run_<id>.csv is the solver's per-step orientation record, extracted verbatim
// from the run log: the unit vector along the body's symmetry axis at every time
// step, neither smoothed nor resampled. The orbit runs are three 24 h segments
// each, concatenated with the overlap the restart replays trimmed away; the
// segment restart times travel in runs.csv as `seams`, because the body restarts
// a segment with zero angular velocity and spins back up within tau_rot, and
// that blip is not orbit physics.
//
// Everything else is derived here, by the same procedure as the campaign's
// tools/d62_jeffery_analysis.py (CASE_SPEC d62_jeffery section 1):
//
//   - the in-plane angle phi(t) = unwrap(atan2(a_z, a_x)), measured from the flow
//     axis and unwrapped modulo pi because the axis is headless;
//   - the period from successive pi-crossings, each half-turn taking exactly T/2
//     by the orbit's own symmetry;
//   - the rate waveform |dphi/dt| by centred differences, never differenced
//     across a masked gap, and its slow/fast modulation;
//   - the orientation-resolved waveform: the rate binned by phi mod pi against
//     Jeffery's closed form at the bin centres (the gate that distinguishes the
//     real orbit from one phase-shifted by pi/2);
//   - the in-plane residual max|a_y|, and for the sphere control the steady spin;
//   - the wall extrapolations: the two clearances fitted by an image-dipole
//     (a/l)^3 law and by an (a/l)^2 law, both read back at zero.
//
// src/data/jeffery.test.ts pins the derived numbers against the campaign tool's
// own printed report, so the re-derivation cannot drift from it silently.
//
// Outputs:
//   public/benchmark-assets/jeffery-orbit/   Plotly traces, downloads, manifest
//   src/data/generated/jeffery.json          runs, gates, wall models
//   src/data/generated/jeffery-validation.json   Validation-tab rows
//
// Run with: node scripts/convert-jeffery-data.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parseCsvRecords } from "./lib/csv.mjs";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";
import { createStoredZip } from "./lib/zip.mjs";

const BENCHMARK = "jeffery-orbit";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/jeffery");
const outDir = resolve(root, `public/benchmark-assets/${BENCHMARK}`);
const generatedDir = resolve(root, "src/data/generated");

/** Campaign box units: rho = 1, nu = 1, mu = 1 (d11/d61 conventions). */
const NU = 1;

/**
 * Samples within this long a window after a segment restart are dropped. The
 * body restarts with omega = 0 and recovers the Jeffery rate within tau_rot,
 * so the blip is a restart artefact rather than a reading of the orbit.
 */
const SEAM_WINDOW = 0.6;

/** Bins of phi mod pi used by the orientation-resolved gate. */
const ORIENT_BINS = 12;

/** The sphere control's spin is read as the mean over the settled tail. */
const CONTROL_STEADY_FROM = 6;

/**
 * Marker series are thinned to about this many points; the analytic lines stay
 * dense. A fixed stride would leave the ten-time-unit sphere control with a
 * handful of markers and the hundred-and-twenty-unit orbits with plenty.
 */
const MARKER_TARGET = 500;

const COLORS = {
  h8: "#5fb8ff",
  h4: "#f5b84b",
  ax: "#5fb8ff",
  az: "#f5b84b",
  axAlt: "#7bd88f",
  azAlt: "#c9a5f5",
  cubic: "#7bd88f",
  square: "#c9a5f5",
  theory: "var(--fg1)",
  band: "var(--fg3)"
};

/* ---------------- Jeffery's closed form ---------------- */

/**
 * Jeffery (1922) for an axis started in the shear plane: the orbit is a pure
 * tumble with tan(phi) = tan(psi) / r_e, psi advancing uniformly. `phi` is
 * measured from the FLOW axis, which is the convention the solver's axis record
 * and the campaign's analyser both use.
 */
function jefferyPhi(times, t0, phi0, sign, re, gammadot) {
  let psi0 = Math.atan2(re * Math.sin(phi0), Math.cos(phi0));
  psi0 += Math.PI * Math.round((phi0 - psi0) / Math.PI);
  return times.map(t => {
    const psi = psi0 + (sign * gammadot * re * (t - t0)) / (re * re + 1);
    const p = Math.atan2(Math.sin(psi), re * Math.cos(psi));
    return p + Math.PI * Math.round((psi - p) / Math.PI);
  });
}

/** |dphi/dt|: slow at flow alignment, fast through the gradient direction. */
function jefferyRate(phi, re, gammadot) {
  const r2 = re * re;
  return (gammadot * (Math.cos(phi) ** 2 + r2 * Math.sin(phi) ** 2)) / (r2 + 1);
}

/** T gammadot = 2 pi (r_e + 1/r_e); 15.70796 at r_e = 2, shear-rate free. */
function jefferyPeriodGamma(re) {
  return 2 * Math.PI * (re + 1 / re);
}

/* ---------------- the analysis ---------------- */

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
/** Non-negative remainder; JS `%` keeps the sign of the dividend, Python's does not. */
const modPositive = (value, m) => ((value % m) + m) % m;

function readTrace(run) {
  return parseCsvRecords(readFileSync(resolve(srcDir, `run_${run}.csv`), "utf-8")).map(record => ({
    t: Number(record.time),
    ax: Number(record.axis_x),
    ay: Number(record.axis_y),
    az: Number(record.axis_z)
  }));
}

/**
 * Reduce one orientation trace to the gate quantities.
 *
 * The angle is unwrapped modulo pi rather than 2 pi: a body axis is headless, so
 * a and -a are the same orientation and a full turn of the body is a half turn
 * of phi.
 */
function analyse(trace, { tmin, seams, re, gammadot }) {
  const kept = trace.filter(
    point =>
      point.t >= tmin && !seams.some(seam => seam <= point.t && point.t < seam + SEAM_WINDOW)
  );
  if (kept.length < 10) throw new Error(`only ${kept.length} samples survive the mask`);

  const t = kept.map(point => point.t);
  const phi = [Math.atan2(kept[0].az, kept[0].ax)];
  for (let i = 1; i < kept.length; i += 1) {
    let p = Math.atan2(kept[i].az, kept[i].ax);
    const prev = phi[i - 1];
    while (p - prev > Math.PI / 2) p -= Math.PI;
    while (p - prev < -Math.PI / 2) p += Math.PI;
    phi.push(p);
  }

  const turned = Math.abs(phi[phi.length - 1] - phi[0]);
  const sense = phi[phi.length - 1] - phi[0] < 0 ? -1 : 1;

  // Period from the pi-crossings. By the orbit's symmetry each advance of phi by
  // pi takes exactly T/2, which a mean-rate estimate over a non-integer number of
  // half-turns would get wrong.
  const folded = phi.map(value => sense * value);
  let base = Math.floor(folded[0] / Math.PI);
  const crossings = [];
  for (let i = 1; i < folded.length; i += 1) {
    while (folded[i] - (base + 1) * Math.PI >= 0) {
      base += 1;
      const f = (base * Math.PI - folded[i - 1]) / (folded[i] - folded[i - 1]);
      crossings.push(t[i - 1] + f * (t[i] - t[i - 1]));
    }
  }
  const halfPeriods = crossings.slice(1).map((value, index) => value - crossings[index]);
  const periodGammaJeffery = jefferyPeriodGamma(re);
  const period = halfPeriods.length ? 2 * mean(halfPeriods) : null;
  const periodGamma = period === null ? null : period * gammadot;

  // Rate waveform: centred differences, never taken across a masked gap.
  const steps = t.slice(1).map((value, index) => value - t[index]).sort((a, b) => a - b);
  const stepMedian = steps[Math.floor(steps.length / 2)];
  const rates = [];
  const rateAngles = [];
  const rateTimes = [];
  for (let i = 1; i < t.length - 1; i += 1) {
    const span = t[i + 1] - t[i - 1];
    if (span <= 0 || span > 3 * stepMedian) continue;
    rates.push(Math.abs((phi[i + 1] - phi[i - 1]) / span));
    rateAngles.push(phi[i]);
    rateTimes.push(t[i]);
  }
  const rateMin = Math.min(...rates);
  const rateMax = Math.max(...rates);

  // Orientation-resolved waveform: the bin means against Jeffery at the bin
  // centres. Extrema alone accept an orbit phase-shifted by pi/2 — one that is
  // fastest where Jeffery is slowest — so the placement is gated explicitly.
  const sums = new Array(ORIENT_BINS).fill(0);
  const counts = new Array(ORIENT_BINS).fill(0);
  rates.forEach((rate, index) => {
    const k = Math.floor((modPositive(rateAngles[index], Math.PI) / Math.PI) * ORIENT_BINS) % ORIENT_BINS;
    sums[k] += rate;
    counts[k] += 1;
  });
  const bins = [];
  let residual = 0;
  for (let k = 0; k < ORIENT_BINS; k += 1) {
    if (!counts[k]) continue;
    const centre = ((k + 0.5) * Math.PI) / ORIENT_BINS;
    const measured = sums[k] / counts[k];
    const expected = jefferyRate(centre, re, gammadot);
    residual += (measured - expected) ** 2;
    bins.push({ bin: k, centre, measured, expected, count: counts[k] });
  }
  const rmsResidual = Math.sqrt(residual / bins.length) / gammadot;

  const binMean = keys => {
    const values = keys.map(k => bins.find(entry => entry.bin === k)).filter(Boolean);
    return values.length ? mean(values.map(entry => entry.measured)) : null;
  };
  const aligned = binMean([0, ORIENT_BINS - 1]);
  const gradient = binMean([ORIENT_BINS / 2 - 1, ORIENT_BINS / 2]);
  const centreAligned = (0.5 * Math.PI) / ORIENT_BINS;
  const centreGradient = ((ORIENT_BINS / 2 - 0.5) * Math.PI) / ORIENT_BINS;
  const placementJeffery =
    jefferyRate(centreAligned, re, gammadot) / jefferyRate(centreGradient, re, gammadot);
  const placement = aligned !== null && gradient ? aligned / gradient : null;

  return {
    samples: kept.length,
    tStart: t[0],
    tEnd: t[t.length - 1],
    halfTurns: turned / Math.PI,
    sense,
    /** With u = gammadot z x^ the vorticity is +gammadot y^, so phi decreases. */
    senseExpected: gammadot > 0 ? -1 : 1,
    crossings,
    halfPeriods,
    period,
    periodGamma,
    periodGammaJeffery,
    periodDeviation: periodGamma === null ? null : periodGamma / periodGammaJeffery - 1,
    rate: {
      min: rateMin,
      max: rateMax,
      tAtMin: rateTimes[rates.indexOf(rateMin)],
      tAtMax: rateTimes[rates.indexOf(rateMax)],
      slowJeffery: jefferyRate(0, re, gammadot),
      fastJeffery: jefferyRate(Math.PI / 2, re, gammadot),
      modulation: rateMax / rateMin,
      modulationJeffery: re * re,
      modulationDeviation: rateMax / rateMin / (re * re) - 1
    },
    orient: {
      bins,
      placement,
      placementJeffery,
      placementDeviation: placement === null ? null : placement / placementJeffery - 1,
      rmsResidual
    },
    maxAxisY: Math.max(...kept.map(point => Math.abs(point.ay))),
    series: { t, phi, rates, rateTimes, rateAngles, ax: kept.map(p => p.ax), az: kept.map(p => p.az) }
  };
}

/* ---------------- the runs ---------------- */

const runRecords = parseCsvRecords(readFileSync(resolve(srcDir, "runs.csv"), "utf-8"));

const runs = runRecords.map(record => {
  const a = Number(record.a);
  const b = Number(record.b);
  const re = Number(record.re);
  const gammadot = Number(record.gammadot);
  const height = Number(record.box_h);
  const seams = record.seams
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .map(Number);
  const analysis = analyse(readTrace(record.run), { tmin: Number(record.tmin), seams, re, gammadot });

  return {
    id: record.run,
    label: record.label,
    short: record.short,
    role: record.role,
    case: record.case,
    a,
    b,
    re,
    gammadot,
    dt: Number(record.dt),
    tmin: Number(record.tmin),
    seams,
    segments: Number(record.segments),
    box: { x: Number(record.box_x), y: Number(record.box_y), h: height },
    /** Wall-to-centre clearance, in length units and in semi-major axes. */
    clearance: height / 2,
    clearanceAxes: height / 2 / a,
    /** The image parameter the wall systematic scales in: a / l. */
    imageParameter: a / (height / 2),
    coarseBox: record.coarse_box,
    /** Finest cell spacing at the body, from the run's own DNS_RESOLUTION record. */
    hMin: Number(record.h_min),
    /**
     * Elements across the thin axis, derived from that spacing rather than from
     * the case specification's pre-mesh estimate: 2b / h_min.
     */
    thinAxisResolution: (2 * b) / Number(record.h_min),
    /** Fluid degrees of freedom the alpha field marks as inside the body. */
    insideDofs: Number(record.inside_dofs),
    /** Shear Reynolds number on the semi-major axis, gammadot a^2 / nu. */
    reynolds: (gammadot * a * a) / NU,
    wallSpeed: (gammadot * height) / 2,
    analysis
  };
});

const byId = Object.fromEntries(runs.map(run => [run.id, run]));
for (const id of ["v0b", "v1b", "v2"]) {
  if (!byId[id]) throw new Error(`runs.csv is missing the ${id} run`);
}

/**
 * The sphere control. At r_e = 1 Jeffery degenerates to uniform spin at half the
 * vorticity, so the trace has no orbit to measure — the observable is the steady
 * rate over the settled tail, signed the way the physical spin is.
 */
const control = (() => {
  const run = byId.v0b;
  const { rates, rateTimes } = run.analysis.series;
  const tail = rates.filter((_, index) => rateTimes[index] >= CONTROL_STEADY_FROM);
  const spin = (run.analysis.sense * mean(tail)) / run.gammadot;
  return {
    run: run.id,
    steadyFrom: CONTROL_STEADY_FROM,
    samples: tail.length,
    /** (dphi/dt)/gammadot; the exact value is -1/2, i.e. omega_y = +gammadot/2. */
    spin,
    exact: -0.5,
    deviation: Math.abs(spin) / 0.5 - 1,
    band: 0.01,
    modulation: run.analysis.rate.modulation,
    maxAxisY: run.analysis.maxAxisY
  };
})();

const orbits = runs.filter(run => run.role === "orbit");

/**
 * The wall systematic, extrapolated to infinite clearance.
 *
 * Two clearances give two points, so each law is a straight line through them in
 * its own variable and the clearance-free period is the intercept. The two
 * exponents bracket the plausible scalings: an image dipole falls as (a/l)^3, a
 * slower (a/l)^2 law is the conservative reading. The bracket is the honest
 * statement — not a fit, a bound.
 */
function extrapolate(exponent) {
  const [near, far] = [...orbits].sort((p, q) => q.imageParameter - p.imageParameter);
  const xNear = near.imageParameter ** exponent;
  const xFar = far.imageParameter ** exponent;
  const slope =
    (near.analysis.periodDeviation - far.analysis.periodDeviation) / (xNear - xFar);
  return {
    exponent,
    slope,
    /** Period deviation at zero image parameter: the clearance-free residual. */
    intercept: far.analysis.periodDeviation - slope * xFar
  };
}

const wall = {
  /** Period lengthening from halving the clearance, in percentage points. */
  shift: byId.v2.analysis.periodDeviation - byId.v1b.analysis.periodDeviation,
  models: [
    { id: "cubic", label: "Image dipole, (a/l)^3", ...extrapolate(3) },
    { id: "square", label: "Conservative, (a/l)^2", ...extrapolate(2) }
  ]
};

/* ---------------- assets ---------------- */
const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId: BENCHMARK });

const entries = [];
const zipEntries = [];

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function trace(x, y, { name, color, dash, mode = "lines", symbol, size }) {
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

function emitPlot(metric, id, traces, { seriesGroupId, label, shape = "single-trace", oldPath }) {
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

const thin = values => {
  const stride = Math.max(1, Math.floor(values.length / MARKER_TARGET));
  return values.filter((_, index) => index % stride === 0);
};
const TRACE_SOURCE = run => `scripts/source-data/jeffery/run_${run}.csv`;
const CLOSED_FORM = "generated from Jeffery's closed-form solution";

// ---- the orbit: axis components, rate against time, rate against orientation --
// The analytic curve is anchored on the FIRST sample and then runs on Jeffery's
// own theoretical period. A period error therefore shows as a phase lag that
// grows across the trace, which is what separates a period error from a waveform
// error — the two are indistinguishable on a curve refitted to the measurement.
const anchor = byId.v1b;
const span = [anchor.analysis.tStart, anchor.analysis.tEnd];
const analyticTimes = Array.from({ length: 2000 }, (_, index) =>
  span[0] + ((span[1] - span[0]) * index) / 1999
);
const analyticPhi = jefferyPhi(
  analyticTimes,
  anchor.analysis.tStart,
  anchor.analysis.series.phi[0],
  anchor.analysis.sense,
  anchor.re,
  anchor.gammadot
);

for (const [id, pick, name, color, dash] of [
  ["jeffery-ax", Math.cos, "Jeffery a_x", COLORS.theory, "dash"],
  ["jeffery-az", Math.sin, "Jeffery a_z", COLORS.theory, "dot"]
]) {
  emitPlot("axis", id, trace(analyticTimes, analyticPhi.map(pick), { name, color, dash }), {
    seriesGroupId: id,
    label: name,
    oldPath: CLOSED_FORM
  });
}

for (const run of orbits) {
  const key = run.id === "v1b" ? "h8" : "h4";
  for (const [component, values, color] of [
    ["ax", run.analysis.series.ax, run.id === "v1b" ? COLORS.ax : COLORS.axAlt],
    ["az", run.analysis.series.az, run.id === "v1b" ? COLORS.az : COLORS.azAlt]
  ]) {
    emitPlot(
      "axis",
      `${key}-${component}`,
      trace(thin(run.analysis.series.t), thin(values), {
        name: `DNS a_${component.slice(1)} (${run.short})`,
        color,
        mode: "markers",
        symbol: component === "ax" ? "circle" : "square",
        size: 5
      }),
      {
        seriesGroupId: `${key}-${component}`,
        label: `Axis component a_${component.slice(1)}, ${run.short}`,
        oldPath: TRACE_SOURCE(run.id)
      }
    );
  }
}

emitPlot(
  "rate",
  "jeffery",
  trace(
    analyticTimes,
    analyticPhi.map(p => jefferyRate(p, anchor.re, anchor.gammadot) / anchor.gammadot),
    { name: "Jeffery", color: COLORS.theory, dash: "dash" }
  ),
  { seriesGroupId: "jeffery", label: "Jeffery rate against time", oldPath: CLOSED_FORM }
);

const phiAxis = Array.from({ length: 400 }, (_, index) => (Math.PI * index) / 399);
emitPlot(
  "waveform",
  "jeffery",
  trace(phiAxis, phiAxis.map(p => jefferyRate(p, anchor.re, anchor.gammadot) / anchor.gammadot), {
    name: "Jeffery",
    color: COLORS.theory,
    dash: "dash"
  }),
  { seriesGroupId: "jeffery", label: "Jeffery rate against orientation", oldPath: CLOSED_FORM }
);

for (const run of orbits) {
  const key = run.id === "v1b" ? "h8" : "h4";
  const color = run.id === "v1b" ? COLORS.h8 : COLORS.h4;
  const { rates, rateTimes, rateAngles } = run.analysis.series;
  const normalised = rates.map(value => value / run.gammadot);

  emitPlot(
    "rate",
    key,
    trace(thin(rateTimes), thin(normalised), {
      name: `DNS (${run.short})`,
      color,
      mode: "markers",
      symbol: "circle",
      size: 5
    }),
    {
      seriesGroupId: key,
      label: `Rotation rate against time, ${run.short}`,
      oldPath: TRACE_SOURCE(run.id)
    }
  );

  emitPlot(
    "waveform",
    key,
    trace(thin(rateAngles.map(p => modPositive(p, Math.PI))), thin(normalised), {
      name: `DNS (${run.short})`,
      color,
      mode: "markers",
      symbol: "circle",
      size: 5
    }),
    {
      seriesGroupId: key,
      label: `Rotation rate against orientation, ${run.short}`,
      oldPath: TRACE_SOURCE(run.id)
    }
  );
}

// ---- the clearance ladder ----------------------------------------------------
// Plotted against a / l, the body's semi-major axis over its clearance from the
// wall, because that is the variable the wall systematic scales in and zero is
// the unbounded fluid. Reading the plot right to left is the extrapolation.
const IMAGE_AXIS_MAX = 0.28;
const modelAxis = Array.from({ length: 200 }, (_, index) => (IMAGE_AXIS_MAX * index) / 199);
const periodJeffery = jefferyPeriodGamma(byId.v1b.re);

const ladderPoints = [...orbits].sort((p, q) => p.imageParameter - q.imageParameter);

for (const [metric, toY, name] of [
  ["period", deviation => periodJeffery * (1 + deviation), "T gammadot"],
  ["excess", deviation => deviation * 100, "Period excess [%]"]
]) {
  emitPlot(
    metric,
    "dns",
    trace(
      ladderPoints.map(run => run.imageParameter),
      ladderPoints.map(run => toY(run.analysis.periodDeviation)),
      { name: "DNS, both clearances", color: COLORS.h8, mode: "markers", symbol: "circle", size: 13 }
    ),
    {
      seriesGroupId: "dns",
      label: `${name} at the two clearances`,
      oldPath: "scripts/source-data/jeffery/run_*.csv"
    }
  );

  emitPlot(
    metric,
    "jeffery",
    trace([0, IMAGE_AXIS_MAX], [toY(0), toY(0)], {
      name: `Jeffery ${periodJeffery.toFixed(5)}`,
      color: COLORS.theory,
      dash: "dash"
    }),
    { seriesGroupId: "jeffery", label: "Unbounded Jeffery period", oldPath: CLOSED_FORM }
  );

  // The band belongs on the absolute-period frame only: on the zoomed excess
  // frame, where the whole result spans one percentage point, a +/- 3% band is
  // off the scale and a half-drawn band would read as a gate it is not.
  if (metric === "period") {
    emitPlot(
      metric,
      "band",
      [0.03, -0.03].map(edge =>
        trace([0, IMAGE_AXIS_MAX], [toY(edge), toY(edge)], {
          name: `${edge > 0 ? "+" : "−"}3%`,
          color: COLORS.band,
          dash: "dot"
        })
      ),
      {
        seriesGroupId: "band",
        label: "Period gate band, +/- 3%",
        shape: "trace-array",
        oldPath: CLOSED_FORM
      }
    );
  }

  for (const model of wall.models) {
    emitPlot(
      metric,
      model.id,
      trace(
        modelAxis,
        modelAxis.map(u => toY(model.intercept + model.slope * u ** model.exponent)),
        {
          name: model.label,
          color: model.id === "cubic" ? COLORS.cubic : COLORS.square,
          dash: model.id === "cubic" ? "dashdot" : "dot"
        }
      ),
      {
        seriesGroupId: model.id,
        label: `${model.label} extrapolation to zero clearance`,
        oldPath: "derived from the two measured clearances by scripts/convert-jeffery-data.mjs"
      }
    );
  }
}

// ---- the sphere control ------------------------------------------------------
{
  const run = byId.v0b;
  const { rates, rateTimes } = run.analysis.series;
  emitPlot(
    "spin",
    "dns",
    trace(thin(rateTimes), thin(rates.map(value => (run.analysis.sense * value) / run.gammadot)), {
      name: "DNS sphere spin",
      color: COLORS.h8,
      mode: "markers",
      symbol: "circle",
      size: 5
    }),
    { seriesGroupId: "dns", label: "Sphere spin history", oldPath: TRACE_SOURCE(run.id) }
  );

  const tSpan = [run.analysis.tStart, run.analysis.tEnd];
  emitPlot(
    "spin",
    "exact",
    trace(tSpan, [-0.5, -0.5], { name: "Exact −1/2", color: COLORS.theory, dash: "dash" }),
    { seriesGroupId: "exact", label: "Exact half-vorticity spin", oldPath: CLOSED_FORM }
  );

  emitPlot(
    "spin",
    "band",
    [1.01, 0.99].map(edge =>
      trace(tSpan, [-0.5 * edge, -0.5 * edge], {
        name: `${edge > 1 ? "−" : "+"}1%`,
        color: COLORS.band,
        dash: "dot"
      })
    ),
    {
      seriesGroupId: "band",
      label: "Sphere control band, +/- 1%",
      shape: "trace-array",
      oldPath: CLOSED_FORM
    }
  );
}

// ---- downloads ---------------------------------------------------------------
const sourceDownloads = [...runRecords.map(record => `run_${record.run}.csv`), "runs.csv"];

for (const name of sourceDownloads) {
  const newPath = `downloads/${name}`;
  mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
  copyFileSync(resolve(srcDir, name), resolve(outDir, newPath));
  entries.push({
    oldPath: `scripts/source-data/jeffery/${name}`,
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

const DERIVED = "derived from the axis traces by scripts/convert-jeffery-data.mjs";

emitCsv(
  "gates.csv",
  [
    "run",
    "case",
    "aspect_ratio",
    "box_height",
    "clearance_semi_major_axes",
    "h_min",
    "thin_axis_resolution",
    "inside_dofs",
    "T_gammadot",
    "T_gammadot_jeffery",
    "period_deviation",
    "modulation",
    "modulation_deviation",
    "orientation_placement",
    "placement_deviation",
    "rms_waveform_residual",
    "max_axis_y"
  ],
  runs.map(run => [
    run.id,
    run.case,
    run.re,
    run.box.h,
    run.clearanceAxes,
    run.hMin,
    run.thinAxisResolution.toFixed(3),
    run.insideDofs,
    run.analysis.periodGamma === null ? "n/a" : run.analysis.periodGamma.toFixed(6),
    run.analysis.periodGammaJeffery.toFixed(6),
    run.analysis.periodDeviation === null ? "n/a" : run.analysis.periodDeviation.toExponential(6),
    run.analysis.rate.modulation.toFixed(4),
    run.analysis.rate.modulationDeviation.toExponential(6),
    run.analysis.orient.placement === null ? "n/a" : run.analysis.orient.placement.toFixed(6),
    run.analysis.orient.placementDeviation === null
      ? "n/a"
      : run.analysis.orient.placementDeviation.toExponential(6),
    run.analysis.orient.rmsResidual.toExponential(6),
    run.analysis.maxAxisY.toExponential(6)
  ]),
  { oldPath: DERIVED, label: "gates.csv" }
);

emitCsv(
  "crossings.csv",
  ["run", "index", "crossing_time", "half_period"],
  orbits.flatMap(run =>
    run.analysis.crossings.map((crossing, index) => [
      run.id,
      index,
      crossing.toFixed(4),
      index === 0 ? "" : run.analysis.halfPeriods[index - 1].toFixed(4)
    ])
  ),
  { oldPath: DERIVED, label: "crossings.csv" }
);

emitCsv(
  "waveform_bins.csv",
  ["run", "bin", "phi_centre", "measured_rate", "jeffery_rate", "samples"],
  orbits.flatMap(run =>
    run.analysis.orient.bins.map(bin => [
      run.id,
      bin.bin,
      bin.centre.toFixed(6),
      bin.measured.toFixed(8),
      bin.expected.toFixed(8),
      bin.count
    ])
  ),
  { oldPath: DERIVED, label: "waveform_bins.csv" }
);

emitCsv(
  "wall_extrapolation.csv",
  ["model", "exponent", "slope", "clearance_free_period_deviation"],
  wall.models.map(model => [
    model.id,
    model.exponent,
    model.slope.toExponential(6),
    model.intercept.toExponential(6)
  ]),
  { oldPath: DERIVED, label: "wall_extrapolation.csv" }
);

// ---- validation ledger -------------------------------------------------------
// Generated from the datasheet, never hand-written.
//
// Selection policy
// ----------------
// Published: the structural smoke test that had to pass before any production
// run, the sphere spin control, the orbit itself, the wall-clearance rung that
// closes the family, and the row that pins the thin-axis resolution from the
// runs' own records. That last one is here because the ledger renders the
// campaign's rows verbatim: the clearance row's own caveat quotes the case
// specification's pre-mesh estimate, and the resolution row is what supersedes
// it. Together they are every row carrying a number this page quotes. The
// datasheet download under Reference Data carries the campaign's wider record.
const PUBLISHED = [
  "d62_g0_smoke",
  "d62_v0b_spin",
  "d62_v1b_orbit",
  "d62_v2_clearance",
  "d62_resolution_pinned"
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
entries.push({
  oldPath: datasheetSource,
  newPath: `downloads/${datasheetName}`,
  kind: "download",
  label: datasheetName
});
zipEntries.push({
  name: `${BENCHMARK}/${datasheetName}`,
  data: readFileSync(resolve(outDir, `downloads/${datasheetName}`))
});

// The page's own ledger as a standalone file: the same rows, in the same order,
// straight out of the datasheet without the sanitiser's run-id stripping.
const datasheetRows = parseCsvRecords(readFileSync(resolve(root, datasheetSource), "utf-8"));
const header = [
  "suite",
  "case",
  "quantity",
  "expected",
  "expected_source",
  "measured",
  "rel_error",
  "tolerance",
  "verdict"
];
const quote = value => `"${String(value).replace(/"/g, '""')}"`;
emitCsv(
  "jeffery_validation_rows.csv",
  header,
  PUBLISHED.map(id => {
    const record = datasheetRows.find(entry => entry.case.trim() === id);
    if (!record) throw new Error(`datasheet has no row for ${id}`);
    return header.map(field => quote(record[field]));
  }),
  { oldPath: datasheetSource, label: "jeffery_validation_rows.csv" }
);

writeFileSync(resolve(outDir, `downloads/${BENCHMARK}.zip`), createStoredZip(zipEntries));
entries.push({
  oldPath: `generated from ${BENCHMARK} downloads`,
  newPath: `downloads/${BENCHMARK}.zip`,
  kind: "download",
  label: `${BENCHMARK}.zip`
});

writeManifest(outDir, BENCHMARK, entries, preserved);

// The per-step series stay in the published CSVs; the JSON module carries only
// the reductions, so the app bundle does not swallow 24 000 orientation samples.
const stripSeries = run => ({ ...run, analysis: { ...run.analysis, series: undefined } });

writeJson(resolve(generatedDir, "jeffery.json"), {
  source: "scripts/source-data/jeffery",
  generatedBy: "scripts/convert-jeffery-data.mjs",
  seamWindow: SEAM_WINDOW,
  orientBins: ORIENT_BINS,
  markerTarget: MARKER_TARGET,
  jeffery: {
    periodGamma: periodJeffery,
    modulation: byId.v1b.re ** 2,
    slow: jefferyRate(0, byId.v1b.re, byId.v1b.gammadot),
    fast: jefferyRate(Math.PI / 2, byId.v1b.re, byId.v1b.gammadot)
  },
  control,
  wall,
  runs: runs.map(stripSeries)
});

writeJson(resolve(generatedDir, "jeffery-validation.json"), {
  source: datasheetSource,
  generatedBy: "scripts/convert-jeffery-data.mjs",
  rows: ledger
});

console.log(
  `Generated ${entries.length} ${BENCHMARK} manifest entries in ${relative(root, outDir)}, ` +
    `Jeffery T gammadot = ${periodJeffery.toFixed(5)}, ` +
    `sphere control spin ${control.spin.toFixed(5)} (${(control.deviation * 100).toFixed(2)}%), ` +
    `ladder ${orbits
      .map(
        run =>
          `${run.short} ${run.analysis.periodGamma.toFixed(4)} (${(
            run.analysis.periodDeviation * 100
          ).toFixed(2)}%)`
      )
      .join(", ")}, ` +
    `wall shift ${(wall.shift * 100).toFixed(2)} pp, ` +
    `clearance-free ${wall.models
      .map(model => `${model.label} ${(model.intercept * 100).toFixed(2)}%`)
      .join(" / ")}, ` +
    `and ${ledger.length} validation rows`
);
