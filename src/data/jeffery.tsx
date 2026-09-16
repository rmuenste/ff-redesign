import type { DownloadItem, ValidationRow } from "../components";
import { benchmarkAssetPath } from "./assets";
import generated from "./generated/jeffery.json";
import generatedValidation from "./generated/jeffery-validation.json";
import type { PlotSource, PlotSpec, SeriesGroup } from "./types";

export const JEFFERY_ID = "jeffery-orbit";

export type JefferyMetricId = "axis" | "rate" | "waveform" | "period" | "excess" | "spin";

function source(metric: string, file: string, kind: PlotSource["kind"] = "single-trace"): PlotSource {
  return { kind, asset: { path: benchmarkAssetPath(JEFFERY_ID, `plots/${metric}/${file}.json`) } };
}

function group(
  metric: string,
  id: string,
  label: string,
  kind: SeriesGroup["kind"],
  color: string,
  sourceKind: PlotSource["kind"] = "single-trace"
): SeriesGroup {
  return {
    id,
    label,
    kind,
    color,
    source: source(metric, id, sourceKind),
    variantStrategy: { kind: "single-trace" }
  };
}

/* ---------------- Measured numbers ---------------- */

/**
 * Periods, waveforms, orientation bins and the wall extrapolations, all generated
 * by scripts/convert-jeffery-data.mjs from the published orientation traces.
 * Never edit by hand — correct the source data and re-run the converter.
 */
export const jefferyClosedForm = generated.jeffery;
export const jefferySeamWindow = generated.seamWindow;
export const jefferyOrientBins = generated.orientBins;

export interface JefferyBin {
  bin: number;
  centre: number;
  measured: number;
  expected: number;
  count: number;
}

export interface JefferyAnalysis {
  samples: number;
  tStart: number;
  tEnd: number;
  halfTurns: number;
  /** −1 when phi decreases, which is what the +y vorticity requires. */
  sense: number;
  senseExpected: number;
  crossings: number[];
  halfPeriods: number[];
  period: number | null;
  periodGamma: number | null;
  periodGammaJeffery: number;
  periodDeviation: number | null;
  rate: {
    min: number;
    max: number;
    tAtMin: number;
    tAtMax: number;
    slowJeffery: number;
    fastJeffery: number;
    modulation: number;
    modulationJeffery: number;
    modulationDeviation: number;
  };
  orient: {
    bins: JefferyBin[];
    placement: number | null;
    placementJeffery: number;
    placementDeviation: number | null;
    rmsResidual: number;
  };
  maxAxisY: number;
}

export interface JefferyRun {
  id: string;
  label: string;
  short: string;
  role: string;
  /** Datasheet row this run's numbers are recorded under. */
  case: string;
  a: number;
  b: number;
  re: number;
  gammadot: number;
  dt: number;
  tmin: number;
  seams: number[];
  segments: number;
  box: { x: number; y: number; h: number };
  /** Wall-to-centre clearance, in length units. */
  clearance: number;
  /** The same clearance counted in semi-major axes. */
  clearanceAxes: number;
  /** a / l: the variable the wall systematic scales in. */
  imageParameter: number;
  /** Coarse-mesh kit the level-4 grid was refined from. */
  coarseBox: string;
  /** Finest cell spacing at the body, from the run's own DNS_RESOLUTION record. */
  hMin: number;
  /** Elements across the thin axis, 2b / h_min. */
  thinAxisResolution: number;
  /** Fluid degrees of freedom the alpha field marks as inside the body. */
  insideDofs: number;
  reynolds: number;
  wallSpeed: number;
  analysis: JefferyAnalysis;
}

export interface JefferyWallModel {
  id: string;
  label: string;
  exponent: number;
  slope: number;
  /** Period deviation extrapolated to zero image parameter. */
  intercept: number;
}

export const jefferyRuns = generated.runs as JefferyRun[];

const runById = (id: string) => {
  const run = jefferyRuns.find(entry => entry.id === id);
  if (!run) throw new Error(`no Jeffery run "${id}"`);
  return run;
};

/** The default-clearance orbit: the certified reading of the period gate. */
export const jefferyH8 = runById("v1b");
/** The required wall rung: the same body at half the clearance. */
export const jefferyH4 = runById("v2");
export const jefferyOrbits = [jefferyH8, jefferyH4];

export const jefferyControl = generated.control;
export const jefferyWall = generated.wall as { shift: number; models: JefferyWallModel[] };

export function jefferyWallModel(id: string) {
  const model = jefferyWall.models.find(entry => entry.id === id);
  if (!model) throw new Error(`no Jeffery wall model "${id}"`);
  return model;
}

/** Signed percentage, as the page quotes every deviation. */
export function percent(value: number, digits = 2) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)}%`;
}

/** Signed percentage points, for the difference between two deviations. */
export function points(value: number, digits = 2) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)} pp`;
}

/* ---------------- Plots ---------------- */

const SERIES_COLORS = {
  h8: "#5fb8ff",
  h8Alt: "#f5b84b",
  h4: "#7bd88f",
  h4Alt: "#c9a5f5"
};

/**
 * The headline. Jeffery's closed form as continuous curves, the DNS samples as
 * markers on top of them. The analytic curve is anchored at the first sample and
 * then runs on Jeffery's own theoretical period, so a period error accumulates
 * into a visible phase lag instead of being absorbed by a refit — which is what
 * makes the half-clearance run's larger excess legible next to the default one.
 */
const axisSpec: PlotSpec = {
  id: "jeffery-axis",
  title: "Orientation",
  metric: "axis",
  comparisonAxis: "level",
  seriesSelectorLabel: "Clearance & references",
  seriesGroups: [
    group("axis", "jeffery-ax", "Jeffery a_x", "reference", "var(--fg1)"),
    group("axis", "jeffery-az", "Jeffery a_z", "reference", "var(--fg1)"),
    group("axis", "h8-ax", "DNS a_x, clearance 8a", "level", SERIES_COLORS.h8),
    group("axis", "h8-az", "DNS a_z, clearance 8a", "level", SERIES_COLORS.h8Alt),
    group("axis", "h4-ax", "DNS a_x, clearance 4a", "level", SERIES_COLORS.h4),
    group("axis", "h4-az", "DNS a_z, clearance 4a", "level", SERIES_COLORS.h4Alt)
  ],
  defaultSeriesGroupIds: ["jeffery-ax", "jeffery-az", "h8-ax", "h8-az"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "Axis component" },
  axisRanges: { y: [-1.15, 1.15] }
};

const rateSpec: PlotSpec = {
  id: "jeffery-rate",
  title: "Rotation rate",
  metric: "rate",
  comparisonAxis: "level",
  seriesSelectorLabel: "Clearance & reference",
  seriesGroups: [
    group("rate", "jeffery", "Jeffery", "reference", "var(--fg1)"),
    group("rate", "h8", "DNS, clearance 8a", "level", SERIES_COLORS.h8),
    group("rate", "h4", "DNS, clearance 4a", "level", SERIES_COLORS.h8Alt)
  ],
  defaultSeriesGroupIds: ["jeffery", "h8", "h4"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "Rotation rate, |dphi/dt| / gammadot" },
  axisRanges: { y: [0, 0.88] }
};

/**
 * The same rate, plotted against where the body is pointing instead of against
 * the clock. The period drops out entirely here, so a run that is late in time
 * still lands on Jeffery's curve — which is exactly the separation the wall
 * result needs.
 */
const waveformSpec: PlotSpec = {
  id: "jeffery-waveform",
  title: "Rate against orientation",
  metric: "waveform",
  comparisonAxis: "level",
  seriesSelectorLabel: "Clearance & reference",
  seriesGroups: [
    group("waveform", "jeffery", "Jeffery", "reference", "var(--fg1)"),
    group("waveform", "h8", "DNS, clearance 8a", "level", SERIES_COLORS.h8),
    group("waveform", "h4", "DNS, clearance 4a", "level", SERIES_COLORS.h8Alt)
  ],
  defaultSeriesGroupIds: ["jeffery", "h8", "h4"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Orientation phi mod pi, from the flow axis [rad]", y: "|dphi/dt| / gammadot" },
  axisRanges: { x: [0, Math.PI], y: [0, 0.88] }
};

/**
 * The clearance ladder. The abscissa is the body's semi-major axis over its
 * clearance from the wall, so zero is the unbounded fluid and reading the frame
 * right to left is the extrapolation the two rungs support.
 */
const periodSpec: PlotSpec = {
  id: "jeffery-period",
  title: "Period against clearance",
  metric: "period",
  comparisonAxis: "level",
  seriesSelectorLabel: "Measurement, references & extrapolations",
  seriesGroups: [
    group("period", "dns", "DNS, both clearances", "level", SERIES_COLORS.h8),
    group("period", "cubic", "Image dipole, (a/l)^3", "reference", SERIES_COLORS.h4),
    group("period", "square", "Conservative, (a/l)^2", "reference", SERIES_COLORS.h4Alt),
    group("period", "jeffery", "Jeffery, unbounded", "reference", "var(--fg1)"),
    group("period", "band", "Period gate band, +/- 3%", "reference", "var(--fg3)", "trace-array")
  ],
  defaultSeriesGroupIds: ["dns", "cubic", "square", "jeffery", "band"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Semi-major axis over wall clearance, a / l", y: "T gammadot" },
  axisRanges: { x: [0, 0.28], y: [15.2, 16.25] }
};

const excessSpec: PlotSpec = {
  id: "jeffery-excess",
  title: "Period excess, zoomed",
  metric: "excess",
  comparisonAxis: "level",
  seriesSelectorLabel: "Measurement, reference & extrapolations",
  seriesGroups: [
    group("excess", "dns", "DNS, both clearances", "level", SERIES_COLORS.h8),
    group("excess", "cubic", "Image dipole, (a/l)^3", "reference", SERIES_COLORS.h4),
    group("excess", "square", "Conservative, (a/l)^2", "reference", SERIES_COLORS.h4Alt),
    group("excess", "jeffery", "Jeffery, unbounded", "reference", "var(--fg1)")
  ],
  defaultSeriesGroupIds: ["dns", "cubic", "square", "jeffery"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Semi-major axis over wall clearance, a / l", y: "Period excess over Jeffery [%]" },
  axisRanges: { x: [0, 0.28], y: [-0.2, 1.05] }
};

const spinSpec: PlotSpec = {
  id: "jeffery-spin",
  title: "Sphere spin control",
  metric: "spin",
  comparisonAxis: "level",
  seriesSelectorLabel: "Measurement & references",
  seriesGroups: [
    group("spin", "dns", "DNS sphere spin", "level", SERIES_COLORS.h8),
    group("spin", "exact", "Exact −1/2", "reference", "var(--fg1)"),
    group("spin", "band", "Control band, +/- 1%", "reference", "var(--fg3)", "trace-array")
  ],
  defaultSeriesGroupIds: ["dns", "exact", "band"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "(dphi/dt) / gammadot" },
  axisRanges: { y: [-0.509, -0.492] }
};

export const jefferyOrbitSpecs: Record<string, PlotSpec> = {
  axis: axisSpec,
  rate: rateSpec,
  waveform: waveformSpec
};
export const jefferyClearanceSpecs: Record<string, PlotSpec> = {
  period: periodSpec,
  excess: excessSpec
};
export const jefferyControlSpecs: Record<string, PlotSpec> = { spin: spinSpec };

/* ---------------- Case definition ---------------- */

export interface JefferyParameterRow {
  symbol: string;
  quantity: string;
  value: string;
}

export const jefferyParameterRows: JefferyParameterRow[] = [
  {
    symbol: "r_e",
    quantity: "Aspect ratio a / b of the prolate spheroid",
    value: String(jefferyH8.re)
  },
  {
    symbol: "a, b = c",
    quantity: "Semi-axes of the body",
    value: `${jefferyH8.a}, ${jefferyH8.b}`
  },
  {
    symbol: "L_x x L_y x H",
    quantity: "Planar Couette box, periodic in x and y",
    value: `${jefferyH8.box.x} x ${jefferyH8.box.y} x ${jefferyH8.box.h} and ${jefferyH4.box.h}`
  },
  {
    symbol: "gammadot",
    quantity: "Shear rate, walls at z = +/- H/2 moving at +/- gammadot H / 2",
    value: String(jefferyH8.gammadot)
  },
  {
    symbol: "U",
    quantity: "Wall speed, default clearance / half clearance",
    value: `${jefferyH8.wallSpeed} / ${jefferyH4.wallSpeed}`
  },
  {
    symbol: "Re_a",
    quantity: "Shear Reynolds number, gammadot a^2 / nu",
    value: String(jefferyH8.reynolds)
  },
  { symbol: "nu = mu", quantity: "Kinematic and dynamic viscosity", value: "1" },
  {
    symbol: "l / a",
    quantity: "Wall-to-centre clearance in semi-major axes, the two rungs",
    value: `${jefferyH8.clearanceAxes} and ${jefferyH4.clearanceAxes}`
  },
  {
    symbol: "h_min",
    quantity: "Finest cell spacing at the body, the two rungs",
    value: `${jefferyH8.hMin} and ${jefferyH4.hMin}`
  },
  {
    symbol: "2b/h",
    quantity: "Elements across the thin axis, the two rungs",
    value: `${jefferyH8.thinAxisResolution.toFixed(1)} and ${jefferyH4.thinAxisResolution.toFixed(1)}`
  },
  {
    symbol: "-",
    quantity: "Fluid degrees of freedom inside the body, the two rungs",
    value: `${jefferyH8.insideDofs} and ${jefferyH4.insideDofs}`
  },
  { symbol: "dt", quantity: "Time step", value: String(jefferyH8.dt) },
  {
    symbol: "-",
    quantity: "Body motion",
    value: "Translation locked, rotation free"
  },
  {
    symbol: "-",
    quantity: "Duration per orbit run",
    value: `t = 0 to ${jefferyH8.analysis.tEnd.toFixed(0)}, ${(
      jefferyH8.analysis.halfTurns / 2
    ).toFixed(2)} orbits, ${jefferyH8.segments} segments`
  }
];

export interface JefferyGateRow {
  gate: string;
  quantity: string;
  band: string;
  measured: string;
  verdict: string;
}

/**
 * The gates as the case specification states them, each with the value the
 * default-clearance orbit returned. Every measured entry is the generated one,
 * so the table cannot drift from the traces it summarises.
 */
export const jefferyGateRows: JefferyGateRow[] = [
  {
    gate: "Sphere spin (control)",
    quantity: "(dphi/dt) / gammadot of a sphere in the same box, vs −1/2",
    band: "+/- 1%",
    measured: `${jefferyControl.spin.toFixed(5)} (${percent(jefferyControl.deviation)})`,
    verdict: "PASS"
  },
  {
    gate: "Period (primary)",
    quantity: `T gammadot vs 2 pi (r_e + 1/r_e) = ${jefferyClosedForm.periodGamma.toFixed(5)}`,
    band: "+/- 3%",
    measured: `${jefferyH8.analysis.periodGamma!.toFixed(4)} (${percent(
      jefferyH8.analysis.periodDeviation!
    )})`,
    verdict: "PASS"
  },
  {
    gate: "Waveform",
    quantity: "Fast/slow modulation of |dphi/dt| vs r_e^2",
    band: "+/- 5%",
    measured: `${jefferyH8.analysis.rate.modulation.toFixed(3)} (${percent(
      jefferyH8.analysis.rate.modulationDeviation
    )})`,
    verdict: "PASS"
  },
  {
    gate: "Orientation-resolved rate",
    quantity: "rate(phi~0) / rate(phi~pi/2) vs 1 / r_e^2, and the rms bin residual",
    band: "+/- 10%, rms < 3%",
    measured: `${percent(jefferyH8.analysis.orient.placementDeviation!)}, rms ${(
      jefferyH8.analysis.orient.rmsResidual * 100
    ).toFixed(2)}%`,
    verdict: "PASS"
  },
  {
    gate: "Orbit plane",
    quantity: "max |a_y| over the whole trace",
    band: "< 0.02",
    measured: jefferyH8.analysis.maxAxisY.toExponential(1),
    verdict: "PASS"
  },
  {
    gate: "Wall clearance (required)",
    quantity: "Period shift between the two clearances, monotone toward Jeffery",
    band: "measured",
    measured: `${points(jefferyWall.shift)} at half the clearance`,
    verdict: "PASS"
  }
];

/* ---------------- Validation ---------------- */

/**
 * Generated from the DNS validation datasheet by scripts/convert-jeffery-data.mjs.
 * Never edit by hand — correct the datasheet and re-run the converter.
 */
export const jefferyValidationRows = generatedValidation.rows as ValidationRow[];
export const jefferyValidationSource = generatedValidation.source;

/* ---------------- References and downloads ---------------- */

export const jefferyReferences = [
  {
    id: "jeffery-1922",
    text:
      "G. B. Jeffery; The motion of ellipsoidal particles immersed in a viscous fluid. Proceedings of the Royal Society of London A 102 (715), 161-179, 1922. doi:10.1098/rspa.1922.0078"
  },
  {
    id: "kim-karrila-1991",
    text:
      "S. Kim, S. J. Karrila; Microhydrodynamics: Principles and Selected Applications. Butterworth-Heinemann, 1991 (resistance functions of a spheroid and its motion in linear flows)."
  }
];

const runDescriptions: Record<string, string> = {
  v0b: "sphere spin control in the default box",
  v1b: "tumbling orbit at wall clearance 8a",
  v2: "tumbling orbit at wall clearance 4a"
};

const dataFiles: Array<{ name: string; description: string }> = [
  ...jefferyRuns.map(run => ({
    name: `run_${run.id}.csv`,
    description: `Body-axis orientation of the ${runDescriptions[run.id]}, every time step`
  })),
  { name: "runs.csv", description: "Geometry, shear, segment seams and mask of each run" },
  {
    name: "gates.csv",
    description: "Period, waveform, orientation placement and orbit-plane residual, per run"
  },
  {
    name: "crossings.csv",
    description: "The pi-crossing times the period is read from, and the half-periods between them"
  },
  {
    name: "waveform_bins.csv",
    description: "Measured and Jeffery rotation rate in each of the twelve orientation bins"
  },
  {
    name: "wall_extrapolation.csv",
    description: "The two wall laws fitted to the clearance ladder and read back at zero clearance"
  },
  {
    name: "jeffery_validation_rows.csv",
    description: "The datasheet rows this page's validation ledger publishes, verbatim"
  }
];

export const jefferyDownloads: DownloadItem[] = [
  {
    label: `${JEFFERY_ID}.zip`,
    href: benchmarkAssetPath(JEFFERY_ID, `downloads/${JEFFERY_ID}.zip`),
    description: "All orientation traces, the derived gate tables and the validation datasheet"
  },
  {
    label: "dns_validation_datasheet.csv",
    href: benchmarkAssetPath(JEFFERY_ID, "downloads/dns_validation_datasheet.csv"),
    description: "Complete DNS campaign claim ledger, one row per quantitative claim"
  },
  ...dataFiles.map(file => ({
    label: file.name,
    href: benchmarkAssetPath(JEFFERY_ID, `downloads/${file.name}`),
    description: file.description
  }))
];

export const jefferyReferenceRows = [
  {
    fileType: "Orientation trace",
    pattern: "run_*.csv",
    columns: "time, axis_x, axis_y, axis_z"
  },
  {
    fileType: "Run table",
    pattern: "runs.csv",
    columns:
      "run, label, short, role, case, a, b, re, gammadot, box_x, box_y, box_h, coarse_box, h_min, inside_dofs, dt, tmin, seams, segments, rundir"
  },
  {
    fileType: "Gate report",
    pattern: "gates.csv",
    columns:
      "run, case, aspect_ratio, box_height, clearance_semi_major_axes, h_min, thin_axis_resolution, inside_dofs, T_gammadot, period_deviation, modulation, orientation_placement, rms_waveform_residual, max_axis_y"
  },
  {
    fileType: "Period crossings",
    pattern: "crossings.csv",
    columns: "run, index, crossing_time, half_period"
  },
  {
    fileType: "Waveform bins",
    pattern: "waveform_bins.csv",
    columns: "run, bin, phi_centre, measured_rate, jeffery_rate, samples"
  },
  {
    fileType: "Wall extrapolation",
    pattern: "wall_extrapolation.csv",
    columns: "model, exponent, slope, clearance_free_period_deviation"
  },
  {
    fileType: "Ledger extract",
    pattern: "jeffery_validation_rows.csv",
    columns: "suite, case, quantity, expected, expected_source, measured, rel_error, tolerance, verdict"
  }
];
