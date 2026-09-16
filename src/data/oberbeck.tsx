import type { DownloadItem, ValidationRow } from "../components";
import { benchmarkAssetPath } from "./assets";
import generated from "./generated/oberbeck.json";
import generatedValidation from "./generated/oberbeck-validation.json";
import type { PlotSource, PlotSpec, SeriesGroup } from "./types";

export const OBERBECK_ID = "oberbeck-spheroid-drag";

export type OberbeckMetricId = "ratio" | "absolutes" | "force" | "velocity";
export type OberbeckOrientationId = "parallel" | "perpendicular";

function source(metric: string, file: string, kind: PlotSource["kind"] = "single-trace"): PlotSource {
  return { kind, asset: { path: benchmarkAssetPath(OBERBECK_ID, `plots/${metric}/${file}.json`) } };
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
 * Resistance functions, ladder rungs, gates and window sensitivity, all generated
 * by scripts/convert-oberbeck-data.mjs from the published run series. Never edit
 * by hand — correct the source data and re-run the converter.
 */
export const oberbeckCell = generated.cell;
export const oberbeckResistance = generated.resistance;
export const oberbeckHeadlineWindow = generated.headlineWindow;

export interface OberbeckOrientation {
  id: OberbeckOrientationId;
  run: string;
  rh: number;
  rhCorrected: number;
  target: number;
  deviation: number;
  deviationCorrected: number;
  radiusError: number;
  /** |T| / (a |F|): the dimensionless torque null of this run. */
  torqueNull: number;
  force: number;
  /** Departure of the steady drag from the momentum balance f V_cell. */
  balance: number;
  velocity: number;
  /** Drift of the drag over the final time unit, relative to the one before it. */
  trend: number;
}

export interface OberbeckWindow {
  window: number;
  ratio: number;
  ratioCorrected: number;
  deviation: number;
  deviationCorrected: number;
}

export interface OberbeckRung {
  id: string;
  label: string;
  short: string;
  level: string;
  h: number;
  scale: number;
  a: number;
  b: number;
  /** Elements across the thin axis, the resolution that governs this fixture. */
  thinAxisResolution: number;
  /** Long-axis extent as a fraction of the cell edge: how close the images sit. */
  imageParameter: number;
  solidFraction: number;
  ratio: number;
  ratioCorrected: number;
  deviation: number;
  deviationCorrected: number;
  orientations: OberbeckOrientation[];
  sensitivity: OberbeckWindow[];
}

export const oberbeckRungs = generated.rungs as OberbeckRung[];

const rungById = (id: string) => {
  const rung = oberbeckRungs.find(entry => entry.id === id);
  if (!rung) throw new Error(`no Oberbeck rung "${id}"`);
  return rung;
};

export const oberbeckL3Full = rungById("l3-full");
export const oberbeckL4Full = rungById("l4-full");
export const oberbeckL4Half = rungById("l4-half");

/** The rung that closes the primary gate. */
export const oberbeckClosingRung = oberbeckL4Half;

export const oberbeckAnchor = generated.anchor;
export const oberbeckOblique = generated.oblique;

export function oberbeckOrientation(rung: OberbeckRung, id: OberbeckOrientationId) {
  const entry = rung.orientations.find(candidate => candidate.id === id);
  if (!entry) throw new Error(`rung ${rung.id} has no ${id} orientation`);
  return entry;
}

/** Signed percentage, as the page quotes every deviation. */
export function percent(value: number, digits = 2) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)}%`;
}

/** Orientation label in the words the page uses for it. */
export const orientationLabel: Record<OberbeckOrientationId, string> = {
  parallel: "Axis parallel to the force",
  perpendicular: "Axis perpendicular to the force"
};

/* ---------------- Plots ---------------- */

const RUNG_COLORS = { parallel: "#5fb8ff", perpendicular: "#f5b84b" };

/**
 * The headline. Plotted against the long-axis image parameter 2a/L, because that
 * is the axis the result actually moves along: the two full-size rungs share it at
 * two resolutions and land on top of each other, and the rung that halves it drops
 * into the band. The Oberbeck target and its two-per-cent band are the references.
 */
const ratioSpec: PlotSpec = {
  id: "oberbeck-ratio",
  title: "Anisotropy ratio",
  metric: "ratio",
  comparisonAxis: "level",
  seriesSelectorLabel: "Resolution & references",
  seriesGroups: [
    group(
      "ratio",
      "res-9",
      `Thin axis 2b/h = ${oberbeckL3Full.thinAxisResolution.toFixed(1)}`,
      "level",
      RUNG_COLORS.parallel
    ),
    group(
      "ratio",
      "res-19",
      `Thin axis 2b/h = ${oberbeckL4Full.thinAxisResolution.toFixed(1)}`,
      "level",
      RUNG_COLORS.perpendicular
    ),
    group("ratio", "oberbeck", "Oberbeck Y^A / X^A", "reference", "var(--fg1)"),
    group("ratio", "band", "Primary gate band, +/- 2%", "reference", "var(--fg3)", "trace-array")
  ],
  defaultSeriesGroupIds: ["res-9", "res-19", "oberbeck", "band"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Body length in the cell, 2a / L", y: "R_h(perp) / R_h(par)" },
  axisRanges: { x: [0, 0.62], y: [1.11, 1.185] }
};

/**
 * The secondary gate. Same abscissa as the ratio plot so the two read together;
 * the ordinate is a deviation in per cent because the half-size body's radii are
 * half the full-size ones and the raw values would not share a scale.
 */
const absolutesSpec: PlotSpec = {
  id: "oberbeck-absolutes",
  title: "Absolute hydrodynamic radii",
  metric: "absolutes",
  comparisonAxis: "level",
  seriesSelectorLabel: "Orientation, resolution & references",
  seriesGroups: [
    group("absolutes", "parallel-9", "Parallel, 2b/h = 9.5", "level", RUNG_COLORS.parallel),
    group("absolutes", "perpendicular-9", "Perpendicular, 2b/h = 9.5", "level", RUNG_COLORS.perpendicular),
    group("absolutes", "parallel-19", "Parallel, 2b/h = 19.0", "level", "#7bd88f"),
    group("absolutes", "perpendicular-19", "Perpendicular, 2b/h = 19.0", "level", "#c9a5f5"),
    group("absolutes", "exact", "a X^A / a Y^A", "reference", "var(--fg1)"),
    group("absolutes", "band", "Secondary gate band, +/- 3%", "reference", "var(--fg3)", "trace-array")
  ],
  defaultSeriesGroupIds: [
    "parallel-9",
    "perpendicular-9",
    "parallel-19",
    "perpendicular-19",
    "exact",
    "band"
  ],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Body length in the cell, 2a / L", y: "Deviation from a X^A, a Y^A [%]" },
  axisRanges: { x: [0, 0.62], y: [-5, 4] }
};

const rungLevelAxis = {
  id: "rung",
  label: "Ladder rung",
  options: oberbeckRungs.map(rung => ({
    id: rung.id,
    label: rung.short,
    detail: `2b/h = ${rung.thinAxisResolution.toFixed(1)}, 2a/L = ${rung.imageParameter.toFixed(3)}`
  })),
  defaultLevelId: oberbeckClosingRung.id
};

function historyGroup(metric: string, id: OberbeckOrientationId | "balance", label: string, color: string): SeriesGroup {
  return {
    id,
    label,
    kind: id === "balance" ? "reference" : "code",
    color,
    levelSources: Object.fromEntries(
      oberbeckRungs.map(rung => [rung.id, source(metric, `${rung.id}-${id}`)])
    ),
    variantStrategy: { kind: "single-trace" }
  };
}

/**
 * The two halves of the momentum-balance statement. The drag runs to f V_cell
 * whatever the body's orientation, because a steady periodic cell can do nothing
 * else; the superficial velocity does not, and that is where the anisotropy lives.
 */
const forceSpec: PlotSpec = {
  id: "oberbeck-force",
  title: "Drag history",
  metric: "force",
  comparisonAxis: "code",
  seriesSelectorLabel: "Orientation",
  seriesGroups: [
    historyGroup("force", "parallel", "Axis parallel to the force", RUNG_COLORS.parallel),
    historyGroup("force", "perpendicular", "Axis perpendicular to the force", RUNG_COLORS.perpendicular),
    historyGroup("force", "balance", "Momentum balance, f V_cell", "var(--fg3)")
  ],
  defaultSeriesGroupIds: ["parallel", "perpendicular", "balance"],
  levelAxis: rungLevelAxis,
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "F_z [-]" },
  axisRanges: { y: [0, 0.012] }
};

const velocitySpec: PlotSpec = {
  id: "oberbeck-velocity",
  title: "Superficial velocity",
  metric: "velocity",
  comparisonAxis: "code",
  seriesSelectorLabel: "Orientation",
  seriesGroups: [
    historyGroup("velocity", "parallel", "Axis parallel to the force", RUNG_COLORS.parallel),
    historyGroup("velocity", "perpendicular", "Axis perpendicular to the force", RUNG_COLORS.perpendicular)
  ],
  defaultSeriesGroupIds: ["parallel", "perpendicular"],
  levelAxis: rungLevelAxis,
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "U [-]" }
};

export const oberbeckRatioSpecs: Record<string, PlotSpec> = { ratio: ratioSpec };
export const oberbeckAbsolutesSpecs: Record<string, PlotSpec> = { absolutes: absolutesSpec };
export const oberbeckHistorySpecs: Record<string, PlotSpec> = { force: forceSpec, velocity: velocitySpec };

/* ---------------- Case definition ---------------- */

export interface OberbeckParameterRow {
  symbol: string;
  quantity: string;
  value: string;
}

export const oberbeckParameterRows: OberbeckParameterRow[] = [
  { symbol: "L", quantity: "Periodic cell edge, triply periodic", value: String(oberbeckCell.edge) },
  { symbol: "r_e", quantity: "Aspect ratio a / b of the prolate spheroid", value: String(oberbeckCell.aspectRatio) },
  {
    symbol: "a, b = c",
    quantity: "Semi-axes, full-size body",
    value: `${oberbeckL3Full.a.toFixed(6)}, ${oberbeckL3Full.b.toFixed(6)}`
  },
  {
    symbol: "a, b = c",
    quantity: "Semi-axes, half-size body",
    value: `${oberbeckL4Half.a.toFixed(6)}, ${oberbeckL4Half.b.toFixed(6)}`
  },
  {
    symbol: "R_s",
    quantity: "Volume-matched sphere radius (the D1.1 body)",
    value: String(oberbeckCell.sphereRadius.toFixed(6))
  },
  { symbol: "f", quantity: "Uniform driving body force, +z", value: oberbeckCell.force.toExponential(0) },
  { symbol: "mu", quantity: "Dynamic viscosity", value: String(oberbeckCell.mu) },
  { symbol: "Re", quantity: "Reynolds number", value: "~3e-3 (Stokes)" },
  {
    symbol: "2b/h",
    quantity: "Elements across the thin axis, L3 / L4",
    value: `${oberbeckL3Full.thinAxisResolution.toFixed(1)} / ${oberbeckL4Full.thinAxisResolution.toFixed(1)}`
  },
  { symbol: "dt", quantity: "Time step, 400 steps to t = 4", value: "1e-2" },
  { symbol: "-", quantity: "Body motion", value: "Held fixed at the cell centre" },
  { symbol: "-", quantity: "Orientations", value: "Parallel, perpendicular, 45 degrees" }
];

export interface OberbeckGateRow {
  gate: string;
  quantity: string;
  band: string;
  measured: string;
  verdict: string;
}

/**
 * The gates as the case specification states them, each with the value the closing
 * rung returned. Every measured entry is the generated one, so the table cannot
 * drift from the series it summarises.
 */
export const oberbeckGateRows: OberbeckGateRow[] = [
  {
    gate: "Anisotropy ratio (primary)",
    quantity: "R_h(perp) / R_h(par) vs Y^A / X^A",
    band: "+/- 2%",
    measured: `${oberbeckClosingRung.ratio.toFixed(5)} (${percent(oberbeckClosingRung.deviation)})`,
    verdict: "PASS"
  },
  {
    gate: "Absolute radii (secondary)",
    quantity: "R_h vs a X^A and a Y^A",
    band: "+/- 3%",
    measured: oberbeckClosingRung.orientations
      .map(entry => percent(entry.deviationCorrected))
      .join(" / "),
    verdict: "PASS"
  },
  {
    gate: "Torque null",
    quantity: "|T| / (a |F|), every run",
    band: "< 1e-3",
    measured: oberbeckClosingRung.orientations
      .map(entry => entry.torqueNull.toExponential(1))
      .join(" / "),
    verdict: "PASS"
  },
  {
    gate: "Sphere regression anchor",
    quantity: "Drag coefficient K of the volume-matched sphere",
    band: "5 digits",
    measured: `${oberbeckAnchor.K.toFixed(4)} (${percent(oberbeckAnchor.deviation, 3)})`,
    verdict: "PASS"
  }
];

/* ---------------- Validation ---------------- */

/**
 * Generated from the DNS validation datasheet by scripts/convert-oberbeck-data.mjs.
 * Never edit by hand — correct the datasheet and re-run the converter.
 */
export const oberbeckValidationRows = generatedValidation.rows as ValidationRow[];
export const oberbeckValidationSource = generatedValidation.source;

/* ---------------- References and downloads ---------------- */

export const oberbeckReferences = [
  {
    id: "oberbeck-1876",
    text:
      "A. Oberbeck; Ueber stationare Flussigkeitsbewegungen mit Berucksichtigung der inneren Reibung. Journal fur die reine und angewandte Mathematik 81, 62-80, 1876."
  },
  {
    id: "hasimoto-1959",
    text:
      "H. Hasimoto; On the periodic fundamental solutions of the Stokes equations and their application to viscous flow past a cubic array of spheres. Journal of Fluid Mechanics 5 (2), 317-328, 1959. doi:10.1017/S0022112059000222"
  },
  {
    id: "kim-karrila-1991",
    text:
      "S. Kim, S. J. Karrila; Microhydrodynamics: Principles and Selected Applications. Butterworth-Heinemann, 1991, section 3.3 (resistance functions of a spheroid)."
  }
];

const runDescriptions: Record<string, string> = {
  v0: "sphere regression anchor at L3",
  v1: "axis parallel to the force, L3, full-size body",
  v2: "axis perpendicular to the force, L3, full-size body",
  v3b: "axis at 45 degrees, L3, full-size body",
  v4a: "axis parallel to the force, L4, full-size body",
  v4b: "axis perpendicular to the force, L4, full-size body",
  v5a: "axis parallel to the force, L4, half-size body",
  v5b: "axis perpendicular to the force, L4, half-size body"
};

const dataFiles: Array<{ name: string; description: string }> = [
  ...Object.entries(runDescriptions).map(([run, detail]) => ({
    name: `run_${run}.csv`,
    description: `Wrench and superficial-velocity history of the ${detail}, every time step`
  })),
  { name: "runs.csv", description: "Which solver run supplied which orientation of which rung" },
  { name: "rungs.csv", description: "Refinement level, mesh spacing and body scale per rung of the ladder" },
  {
    name: "gates.csv",
    description: "Hydrodynamic radii, Oberbeck targets, deviations and torque nulls, per orientation"
  },
  {
    name: "window_sensitivity.csv",
    description: "The anisotropy ratio re-read over trailing plateau windows of 0 to 2 time units"
  },
  {
    name: "oberbeck_validation_rows.csv",
    description: "The datasheet rows this page's validation ledger publishes, verbatim"
  }
];

export const oberbeckDownloads: DownloadItem[] = [
  {
    label: `${OBERBECK_ID}.zip`,
    href: benchmarkAssetPath(OBERBECK_ID, `downloads/${OBERBECK_ID}.zip`),
    description: "All run series, the derived gate tables and the validation datasheet"
  },
  {
    label: "dns_validation_datasheet.csv",
    href: benchmarkAssetPath(OBERBECK_ID, "downloads/dns_validation_datasheet.csv"),
    description: "Complete DNS campaign claim ledger, one row per quantitative claim"
  },
  ...dataFiles.map(file => ({
    label: file.name,
    href: benchmarkAssetPath(OBERBECK_ID, `downloads/${file.name}`),
    description: file.description
  }))
];

export const oberbeckReferenceRows = [
  {
    fileType: "Run history",
    pattern: "run_*.csv",
    columns: "time, F_x, F_y, F_z, T_x, T_y, T_z, U_sup, U_fluid, fluid_fraction"
  },
  { fileType: "Run table", pattern: "runs.csv", columns: "run, rung, orientation, label, rundir" },
  { fileType: "Ladder table", pattern: "rungs.csv", columns: "rung, label, short, level, h, scale" },
  {
    fileType: "Gate report",
    pattern: "gates.csv",
    columns: "rung, level, thin_axis_resolution, image_parameter, orientation, R_h, target, deviation, torque_null, ratio"
  },
  {
    fileType: "Window sensitivity",
    pattern: "window_sensitivity.csv",
    columns: "rung, window, ratio, ratio_volume_corrected, deviation"
  },
  {
    fileType: "Ledger extract",
    pattern: "oberbeck_validation_rows.csv",
    columns: "suite, case, quantity, expected, expected_source, measured, rel_error, tolerance, verdict"
  }
];
