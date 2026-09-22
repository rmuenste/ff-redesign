import type { DownloadItem, ValidationRow } from "../components";
import { benchmarkAssetPath } from "./assets";
import generated from "./generated/numerical-viscometer.json";
import generatedValidation from "./generated/numerical-viscometer-validation.json";
import type { PlotSource, PlotSpec, SeriesGroup } from "./types";

export type ViscometerMetricId = "torque" | "viscosity" | "pairs";

/** Plot-asset stems of the two lubrication pairs, in ladder order. */
const viscometerPairStems = ["phi10", "phi20"];

function source(metric: string, file: string): PlotSource {
  return {
    kind: "single-trace",
    asset: { path: benchmarkAssetPath("numerical-viscometer", `plots/${metric}/${file}.json`) }
  };
}

function group(
  metric: string,
  id: string,
  label: string,
  kind: SeriesGroup["kind"],
  color: string
): SeriesGroup {
  return { id, label, kind, color, source: source(metric, id), variantStrategy: { kind: "single-trace" } };
}

/**
 * Torque history. The suspension run restarts from the spun-up empty instrument's
 * own dump, so both share one time axis and the seeding shows up as a step; the
 * empty instrument continued from the same dump at the suspension time step — the
 * T(0) of every ratio on the page — is drawn from the restart as its own trace.
 * The y-range deliberately clips the start-up transient, which is two orders of
 * magnitude above the plateau and would flatten everything the plot is about.
 */
const torqueSpec: PlotSpec = {
  id: "viscometer-torque",
  title: "Torque history",
  metric: "torque",
  comparisonAxis: "code",
  seriesSelectorLabel: "Estimators & references",
  seriesGroups: [
    group("torque", "dna", "Volume-form estimator", "code", "#5fb8ff"),
    group("torque", "res", "Reaction estimator", "code", "#f5b84b"),
    group("torque", "res-corrected", "Reaction + transpose correction", "code", "#7bd88f"),
    group("torque", "baseline", "Empty instrument, suspension time step", "code", "#c9a5f5"),
    group("torque", "exact", "Exact analytic torque", "reference", "var(--fg1)"),
    group("torque", "insertion", "Particles inserted", "reference", "var(--fg3)")
  ],
  defaultSeriesGroupIds: ["dna", "res", "res-corrected", "baseline", "exact", "insertion"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "|T| [-]" },
  axisRanges: { x: [0, 270], y: [40, 110] }
};

/**
 * Relative viscosity against concentration, in the coordinates Einstein's law is
 * stated in. Two measured rungs, the composite target computed from the measured
 * concentration field, and the naive dilute line as a reference.
 */
const viscositySpec: PlotSpec = {
  id: "viscometer-viscosity",
  title: "Relative viscosity",
  metric: "viscosity",
  comparisonAxis: "code",
  seriesSelectorLabel: "Measurement, targets & closures",
  seriesGroups: [
    group("viscosity", "measured", "Measured, T(phi) / T(0)", "code", "#5fb8ff"),
    group("viscosity", "lubricated", "With sub-grid lubrication", "code", "#c9a5f5"),
    group("viscosity", "composite", "Composite target, measured field", "reference", "var(--fg1)"),
    group("viscosity", "einstein", "Einstein closure", "reference", "var(--fg3)"),
    group("viscosity", "batchelor", "Batchelor closure", "reference", "#f5b84b"),
    group("viscosity", "krieger-dougherty", "Krieger-Dougherty closure", "reference", "#ef6f6c")
  ],
  defaultSeriesGroupIds: ["measured", "composite", "einstein", "batchelor", "krieger-dougherty"],
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Particle volume fraction phi", y: "Relative viscosity eta" },
  axisRanges: { x: [0, 0.22], y: [0.95, 2] }
};

/**
 * What the lubrication model is acting on: the per-step count of near-contact
 * films inside its activation gap, and how many of those are saturated, over the
 * same plateau the viscosity is read from.
 */
const pairsSpec: PlotSpec = {
  id: "viscometer-pairs",
  title: "Near-contact films",
  metric: "pairs",
  comparisonAxis: "code",
  seriesSelectorLabel: "Films",
  seriesGroups: [
    {
      id: "active",
      label: "Active lubrication pairs",
      kind: "code",
      color: "#7bd88f",
      levelSources: Object.fromEntries(
        viscometerPairStems.map(stem => [stem, source("pairs", `${stem}-active`)])
      ),
      variantStrategy: { kind: "single-trace" }
    },
    {
      id: "saturated",
      label: "Saturated pairs",
      kind: "code",
      color: "#f5b84b",
      levelSources: Object.fromEntries(
        viscometerPairStems.map(stem => [stem, source("pairs", `${stem}-saturated`)])
      ),
      variantStrategy: { kind: "single-trace" }
    }
  ],
  defaultSeriesGroupIds: ["active", "saturated"],
  levelAxis: {
    id: "concentration",
    label: "Concentration",
    options: viscometerPairStems.map(stem => ({
      id: stem,
      label: `phi = ${(Number(stem.replace("phi", "")) / 100).toFixed(2)}`
    })),
    defaultLevelId: viscometerPairStems[viscometerPairStems.length - 1]
  },
  compareModes: ["overlay"],
  defaultCompareMode: "overlay",
  preserveSourceColorsWhenSingleGroup: false,
  axisLabels: { x: "Time t [-]", y: "Films per step" }
};

export const viscometerTorqueSpecs: Record<string, PlotSpec> = { torque: torqueSpec };
export const viscometerViscositySpecs: Record<string, PlotSpec> = { viscosity: viscositySpec };
export const viscometerPairsSpecs: Record<string, PlotSpec> = { pairs: pairsSpec };

/* ---------------- Measured numbers ---------------- */

/**
 * Instrument constants, plateau statistics and gate deviations, all generated by
 * scripts/convert-numerical-viscometer-data.mjs from the curated torque histories.
 * Never edit by hand — correct the source data and re-run the converter.
 */
export const viscometerInstrument = generated.instrument;
export const viscometerGates = generated.baselineGates;
export const viscometerProfile = generated.profile;
/** The instant every continued run — the suspensions and the empty control — starts from. */
export const viscometerRestart = generated.restart;

export interface ViscometerComposite {
  phi: number;
  closure: string;
  eta: number;
  gate: boolean;
  deviation: number;
}

export interface ViscometerRung {
  run: string;
  label: string;
  phi: number;
  particles: number;
  lubrication: boolean;
  closure: string;
  composites: ViscometerComposite[];
  etaClosure: number | null;
  window: number[];
  runEnd: number;
  /** The window of the empty control that serves as this rung's T(0). */
  baselineWindow: number[];
  samples: number;
  referenceSamples: number;
  torqueDna: number;
  torqueDnaPstd: number;
  torqueRes: number;
  torqueResPstd: number;
  gap: number;
  gapDeviation: number;
  scatter: number;
  drift: number;
  /** T(0): the empty control over `baselineWindow`, both estimators. */
  torqueReference: number;
  torqueReferenceRes: number;
  eta: number;
  etaPstd: number;
  etaCorrected: number;
  etaComposite: number | null;
  etaNaive: number;
  deviationComposite: number | null;
  deviationNaive: number;
}

export interface ViscometerPair {
  phi: number;
  particles: number;
  run: string;
  twin: string;
  etaWithout: number;
  etaWith: number;
  delta: number;
  activePairs: number;
  saturatedPairs: number;
  samples: number;
}

export const viscometerRungs = generated.rungs as ViscometerRung[];

/** The concentration ladder proper: one rung per concentration, lubrication off. */
export const viscometerLadder = viscometerRungs.filter(rung => !rung.lubrication);
export const viscometerLoadedRungs = viscometerRungs.filter(rung => rung.phi > 0);

export const viscometerPairs = generated.pairs as ViscometerPair[];
export const viscometerPairDecay = generated.pairDecay;
export const viscometerClosures = generated.closures as Record<string, { label: string }>;

/** A loaded rung, which always carries the closure gate valid at its concentration. */
export interface ViscometerGatedRung extends ViscometerRung {
  etaComposite: number;
  deviationComposite: number;
}

const isGated = (rung: ViscometerRung): rung is ViscometerGatedRung =>
  rung.etaComposite !== null && rung.deviationComposite !== null;

/** The gated ladder: every loaded rung measured without lubrication. */
export const viscometerGatedLadder = viscometerLadder.filter(isGated);

export const viscometerBaseline = viscometerRungs.find(rung => rung.run === "baseline")!;
export const viscometerEinstein = viscometerGatedLadder.find(rung => rung.run === "einstein")!;
export const viscometerPhi10 = viscometerGatedLadder.find(rung => rung.run === "phi10")!;
export const viscometerPhi20 = viscometerGatedLadder.find(rung => rung.run === "phi20")!;

/** Human label for a closure id, e.g. "krieger-dougherty" -> "Krieger-Dougherty". */
export function closureName(id: string) {
  return id
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

/** Signed percentage, as the page quotes deviations everywhere. */
export function percent(value: number, digits = 2) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)}%`;
}

/* ---------------- Case definition ---------------- */

export interface ViscometerParameterRow {
  symbol: string;
  quantity: string;
  value: string;
}

export const viscometerParameterRows: ViscometerParameterRow[] = [
  { symbol: "d", quantity: "Sphere diameter", value: "1 (nondimensional)" },
  { symbol: "r_i", quantity: "Rotating inner surface (bob)", value: String(viscometerInstrument.rInner) },
  { symbol: "r_a", quantity: "Static outer wall", value: String(viscometerInstrument.rOuter) },
  { symbol: "H", quantity: "Cell height, symmetry planes at both ends", value: String(viscometerInstrument.height) },
  { symbol: "Omega", quantity: "Angular velocity of the bob", value: String(viscometerInstrument.omega) },
  { symbol: "nu", quantity: "Kinematic viscosity", value: String(viscometerInstrument.nu) },
  { symbol: "rho_f", quantity: "Fluid density", value: String(viscometerInstrument.rho) },
  { symbol: "rho_p / rho_f", quantity: "Density ratio, gravity-free", value: "1.1" },
  { symbol: "Re_p", quantity: "Particle Reynolds number", value: "~0.5" },
  { symbol: "Ta", quantity: "Taylor number (subcritical)", value: "156" },
  { symbol: "D/h", quantity: "Elements per particle diameter", value: "8-9" },
  { symbol: "-", quantity: "Mesh", value: "18,800-hex O-grid, 108 subdomains" },
  { symbol: "dt", quantity: "Time step", value: "5e-3 (spin-up of the empty cell at 5e-2)" }
];

export interface ViscometerGateRow {
  gate: string;
  reference: string;
  measured: string;
  deviation: string;
  tolerance: string;
}

/**
 * The four acceptance gates of the empty instrument. Every reference and every
 * measured value is the generated one, so the table cannot drift from the series.
 */
export const viscometerGateRows: ViscometerGateRow[] = [
  {
    gate: "Analytic torque",
    reference: viscometerInstrument.torqueExact.toFixed(4),
    measured: viscometerBaseline.torqueDna.toFixed(4),
    deviation: percent(viscometerGates.torque, 3),
    tolerance: "+/- 3%"
  },
  {
    gate: "Azimuthal velocity profile",
    reference: "exact Couette",
    measured: `mean ${(viscometerProfile.mean_rel_error * 100).toFixed(2)}%, max ${(
      viscometerProfile.max_rel_error * 100
    ).toFixed(1)}%`,
    // An error magnitude, not a signed deviation, so it carries no sign.
    deviation: `${(viscometerProfile.mean_rel_error * 100).toFixed(2)}%`,
    tolerance: "pointwise agreement"
  },
  {
    gate: "Estimator concordance",
    reference: viscometerInstrument.transposeCorrection.toFixed(4),
    measured: viscometerBaseline.gap.toFixed(4),
    deviation: percent(viscometerBaseline.gapDeviation, 3),
    tolerance: "+/- 3%"
  },
  {
    gate: "Corrected reaction estimator",
    reference: viscometerInstrument.torqueExact.toFixed(4),
    measured: viscometerGates.correctedTorque.toFixed(4),
    deviation: percent(viscometerGates.correctedDeviation, 4),
    tolerance: "+/- 3%"
  }
];

export interface ViscometerLadderRow {
  label: string;
  status: string;
  detail: string;
}

/** The concentration ladder: the exact empty rung and the three measured ones. */
export const viscometerLadderRows: ViscometerLadderRow[] = [
  {
    label: "phi = 0",
    status: "Exact analytic torque",
    detail: "Empty instrument, calibrated against the closed-form annular-Couette torque"
  },
  ...viscometerGatedLadder.map(rung => ({
    label: `phi = ${rung.phi.toFixed(2)}`,
    status: closureName(rung.closure),
    detail: `${rung.particles} spheres, against the ${closureName(rung.closure)} composite`
  }))
];

/* ---------------- Validation ---------------- */

/**
 * Generated from the DNS validation datasheet by
 * scripts/convert-numerical-viscometer-data.mjs. Never edit by hand — correct the
 * datasheet and re-run the converter.
 */
export const viscometerValidationRows = generatedValidation.rows as ValidationRow[];
export const viscometerValidationSource = generatedValidation.source;

/* ---------------- References and downloads ---------------- */

export const viscometerReferences = [
  {
    id: "einstein-1906",
    text:
      "A. Einstein; Eine neue Bestimmung der Molekuldimensionen. Annalen der Physik 324 (2), 289-306, 1906. doi:10.1002/andp.19063240204"
  },
  {
    id: "einstein-1911",
    text:
      "A. Einstein; Berichtigung zu meiner Arbeit: Eine neue Bestimmung der Molekuldimensionen. Annalen der Physik 339 (3), 591-592, 1911. doi:10.1002/andp.19113390313"
  },
  {
    id: "taylor-1923",
    text:
      "G. I. Taylor; Stability of a viscous liquid contained between two rotating cylinders. Philosophical Transactions of the Royal Society A 223, 289-343, 1923. doi:10.1098/rsta.1923.0008"
  }
];

const rungFileDescriptions: Record<string, string> = {
  baseline: "empty instrument continued at the suspension time step, the T(0) of every reading",
  einstein: "phi = 0.05 suspension",
  phi10: "phi = 0.10 suspension",
  phi20: "phi = 0.20 suspension",
  phi10_lub: "phi = 0.10 suspension with sub-grid lubrication",
  phi20_lub: "phi = 0.20 suspension with sub-grid lubrication"
};

const dataFiles: Array<{ name: string; description: string }> = [
  {
    name: "torque_spinup.csv",
    description:
      "Torque history of the empty instrument spun up to its steady state at the coarse time step, both estimators, every time step"
  },
  ...viscometerRungs.map(rung => ({
    name: `torque_${rung.run}.csv`,
    description: `Torque history of the ${rungFileDescriptions[rung.run] ?? rung.label}, both estimators, every time step`
  })),
  ...viscometerPairs.map(pair => ({
    name: `lubpairs_${pair.run.replace("_lub", "")}.csv`,
    description: `Per-step near-contact film counts at phi = ${pair.phi.toFixed(2)}`
  })),
  { name: "rungs.csv", description: "Plateau window, cloud size, lubrication switch and governing closure per rung" },
  { name: "composites.csv", description: "Closure targets composed over the measured concentration field" },
  { name: "velocity_profile.csv", description: "Azimuthal velocity profile gate against the exact Couette solution" }
];

export const viscometerDownloads: DownloadItem[] = [
  {
    label: "numerical-viscometer.zip",
    href: benchmarkAssetPath("numerical-viscometer", "downloads/numerical-viscometer.zip"),
    description: "All torque histories, run tables and the validation datasheet"
  },
  {
    label: "dns_validation_datasheet.csv",
    href: benchmarkAssetPath("numerical-viscometer", "downloads/dns_validation_datasheet.csv"),
    description: "Complete DNS campaign claim ledger, one row per quantitative claim"
  },
  ...dataFiles.map(file => ({
    label: file.name,
    href: benchmarkAssetPath("numerical-viscometer", `downloads/${file.name}`),
    description: file.description
  }))
];

export const viscometerReferenceRows = [
  {
    fileType: "Torque history",
    pattern: "torque_*.csv",
    columns: "time, T_dna, T_res"
  },
  {
    fileType: "Lubrication activity",
    pattern: "lubpairs_*.csv",
    columns: "time, n_pairs, n_saturated"
  },
  {
    fileType: "Run table",
    pattern: "rungs.csv",
    columns: "run, label, phi, particles, plateau_start, plateau_end, run_end, baseline_start, baseline_end, lubrication, closure"
  },
  {
    fileType: "Closure targets",
    pattern: "composites.csv",
    columns: "phi, closure, eta_composite, gate"
  },
  {
    fileType: "Profile gate",
    pattern: "velocity_profile.csv",
    columns: "quantity, value"
  }
];
