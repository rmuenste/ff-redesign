import type { DownloadItem, ValidationRow } from "../components";
import { benchmarkAssetPath } from "./assets";
import generatedValidation from "./generated/dkt-validation.json";
import type { PlotSource, PlotSpec, SeriesGroup } from "./types";

export type DktMetricId = "tilt" | "separation" | "trajectory" | "velocity-leader" | "velocity-trailer";
/** The comparison axis here is the contact model, not a code and not a level. */
export type DktRunId = "fric" | "nofric" | "axisym";
export type DktLevelId = "l3" | "l4";

export const dktMetrics: Array<{ id: DktMetricId; label: string; x: string; y: string }> = [
  { id: "tilt", label: "Tilt angle", x: "Time t [-]", y: "Pair-axis tilt from vertical [deg]" },
  { id: "separation", label: "Centre separation", x: "Time t [-]", y: "Centre distance [d]" },
  { id: "trajectory", label: "x-z trajectory", x: "x [d]", y: "z [d]" },
  { id: "velocity-leader", label: "Leader velocity", x: "Time t [-]", y: "Vertical velocity u_z [-]" },
  { id: "velocity-trailer", label: "Trailer velocity", x: "Time t [-]", y: "Vertical velocity u_z [-]" }
];

export const dktLevels: Array<{ id: DktLevelId; label: string; detail: string }> = [
  { id: "l3", label: "D/h = 8", detail: "L3 · 0.44 M elem" },
  { id: "l4", label: "D/h = 16", detail: "L4 · 3.54 M elem" }
];

const runMeta: Record<DktRunId, { label: string; color: string; levelled: boolean }> = {
  // Only the frictional run exists at both rungs of the resolution ladder.
  fric: { label: "Dry friction", color: "#f5b84b", levelled: true },
  // Level-independent groups carry a plain `source`, the same idiom the
  // sedimentation page uses for its PIV references. This is what lets groups with
  // different level coverage share one panel.
  nofric: { label: "Frictionless", color: "#7bd88f", levelled: false },
  axisym: { label: "Axisymmetric (no offset)", color: "#5fb8ff", levelled: false }
};

const runFile: Record<DktRunId, { l3: string; l4: string }> = {
  fric: { l3: "fric-dh8", l4: "fric-dh16" },
  nofric: { l3: "nofric", l4: "nofric" },
  axisym: { l3: "axisym", l4: "axisym" }
};

function source(metric: DktMetricId, file: string, dash?: string): PlotSource {
  return {
    kind: metric === "trajectory" ? "trace-array" : "single-trace",
    asset: { path: benchmarkAssetPath("dkt", `plots/${metric}/${file}.json`) },
    ...(dash ? { dash } : {})
  };
}

function group(metric: DktMetricId, runId: DktRunId): SeriesGroup {
  const meta = runMeta[runId];
  return {
    id: runId,
    label: meta.label,
    kind: "code",
    color: meta.color,
    ...(meta.levelled
      ? {
          levelSources: {
            l3: source(metric, runFile[runId].l3),
            l4: source(metric, runFile[runId].l4, "dot")
          }
        }
      : { source: source(metric, runFile[runId].l3) }),
    // For the trajectory trace-array this makes the two traces in the file
    // (Leader, Trailer) individually toggleable, with labels read from the JSON.
    variantStrategy: { kind: "single-trace" }
  };
}

function specFor(
  metric: (typeof dktMetrics)[number],
  runIds: DktRunId[],
  defaults: DktRunId[],
  idPrefix: string
): PlotSpec {
  return {
    id: `${idPrefix}-${metric.id}`,
    title: metric.label,
    metric: metric.id,
    comparisonAxis: "code",
    seriesSelectorLabel: "Contact model",
    seriesGroups: runIds.map(id => group(metric.id, id)),
    defaultSeriesGroupIds: defaults,
    levelAxis: { id: "resolution", label: "Resolution", options: dktLevels, defaultLevelId: "l3" },
    compareModes: ["overlay"],
    defaultCompareMode: "overlay",
    preserveSourceColorsWhenSingleGroup: false,
    axisLabels: { x: metric.x, y: metric.y }
  };
}

/** Full Results panel: every metric, every run. */
export const dktPlotSpecs: Record<DktMetricId, PlotSpec> = Object.fromEntries(
  dktMetrics.map(metric => [
    metric.id,
    specFor(metric, ["fric", "nofric", "axisym"], ["fric", "nofric"], "dkt")
  ])
) as Record<DktMetricId, PlotSpec>;

/**
 * Contact-model panel: the same data narrowed to the comparison that carries the
 * practical guidance — dry friction against frictionless contact.
 */
export const dktContactSpecs: Record<string, PlotSpec> = Object.fromEntries(
  dktMetrics
    .filter(metric => metric.id === "tilt" || metric.id === "trajectory")
    .map(metric => [metric.id, specFor(metric, ["fric", "nofric"], ["fric", "nofric"], "dkt-contact")])
);

/* ---------------- Case definition ---------------- */

export interface DktParameterRow {
  symbol: string;
  quantity: string;
  value: string;
}

export const dktParameterRows: DktParameterRow[] = [
  { symbol: "d", quantity: "Sphere diameter", value: "1 (nondimensional)" },
  { symbol: "rho_p / rho_f", quantity: "Density ratio", value: "1.14" },
  { symbol: "nu", quantity: "Kinematic viscosity", value: "4.7e-3" },
  { symbol: "g", quantity: "Gravity", value: "1.0, along -z" },
  { symbol: "L x W x H", quantity: "Closed box", value: "6d x 6d x 24d" },
  { symbol: "x_1", quantity: "Leading sphere centre", value: "(0, 0, 20)" },
  { symbol: "x_2", quantity: "Trailing sphere centre", value: "(0.05, 0, 21.5)" },
  { symbol: "dt", quantity: "Time step", value: "5e-3, Crank-Nicolson" },
  { symbol: "t_end", quantity: "End time", value: "40 (8000 steps)" }
];

export interface DktLadderRow {
  level: string;
  ratio: string;
  elements: string;
  velocityDofs: string;
  status: string;
}

export const dktLadderRows: DktLadderRow[] = [
  { level: "L3", ratio: "8", elements: "442,368", velocityDofs: "~10.6 M", status: "published" },
  { level: "L4", ratio: "16", elements: "3,538,944", velocityDofs: "~84.9 M", status: "published" },
  { level: "L5", ratio: "32", elements: "28,311,552", velocityDofs: "~679.5 M", status: "future" }
];

export interface DktPhaseRow {
  phase: string;
  time: string;
  observation: string;
}

/** The measured sequence, frictionless contact at D/h = 8. */
export const dktSequenceRows: DktPhaseRow[] = [
  { phase: "Drafting", time: "t = 10 – 18", observation: "Trailing sphere enters the wake and accelerates: -0.499 against -0.427 for the leader." },
  { phase: "Kissing", time: "t = 18.04", observation: "Centre distance reaches one diameter; the pair falls as a single doublet." },
  { phase: "Tumbling", time: "t = 19 – 29", observation: "Rolling contact, tilt growing 4.8 deg to 22.3 deg at t = 25 and 43.3 deg at t = 28." },
  { phase: "Separation onset", time: "t = 29.64", observation: "Centre distance passes 1.02 d while the pair is still rotating." },
  { phase: "Pair horizontal", time: "t = 32.92", observation: "Pair axis crosses 90 deg from the vertical." },
  { phase: "Role exchange", time: "t = 40", observation: "Separation 2.37 d at 109 deg; the former trailer now leads and falls faster, -0.419 against -0.348." }
];

/* ---------------- Validation ---------------- */

/**
 * Generated from the DNS validation datasheet by scripts/convert-dkt-data.mjs.
 * Never edit by hand — correct the datasheet and re-run the converter.
 */
export const dktValidationRows = generatedValidation.rows as ValidationRow[];
export const dktValidationSource = generatedValidation.source;

/* ---------------- References and downloads ---------------- */

export const dktReferences = [
  {
    id: "fortes-1987",
    text:
      "A. F. Fortes, D. D. Joseph, T. S. Lundgren; Nonlinear mechanics of fluidization of beds of spherical particles. Journal of Fluid Mechanics 177, 467-483, 1987. doi:10.1017/S0022112087001046"
  },
  {
    id: "glowinski-2001",
    text:
      "R. Glowinski, T.-W. Pan, T. I. Hesla, D. D. Joseph, J. Periaux; A fictitious domain approach to the direct numerical simulation of incompressible viscous flow past moving rigid bodies: application to particulate flow. Journal of Computational Physics 169 (2), 363-426, 2001. doi:10.1006/jcph.2000.6542"
  }
];

const runFiles: Array<{ id: string; label: string }> = [
  { id: "fric-dh8", label: "Dry friction, D/h = 8" },
  { id: "fric-dh16", label: "Dry friction, D/h = 16" },
  { id: "nofric", label: "Frictionless, D/h = 8" },
  { id: "axisym", label: "Axisymmetric control, D/h = 8" }
];

const seriesStems: Array<{ stem: string; label: string }> = [
  { stem: "tilt", label: "pair-axis tilt" },
  { stem: "separation", label: "centre separation" },
  { stem: "vz_leader", label: "leader vertical velocity" },
  { stem: "vz_trailer", label: "trailer vertical velocity" },
  { stem: "xz_leader", label: "leader x-z trajectory" },
  { stem: "xz_trailer", label: "trailer x-z trajectory" }
];

export const dktDownloads: DownloadItem[] = [
  {
    label: "dkt.zip",
    href: benchmarkAssetPath("dkt", "downloads/dkt.zip"),
    description: "All DKT series and the validation datasheet"
  },
  {
    label: "dns_validation_datasheet.csv",
    href: benchmarkAssetPath("dkt", "downloads/dns_validation_datasheet.csv"),
    description: "Complete DNS campaign claim ledger, one row per quantitative claim"
  },
  ...runFiles.flatMap(run =>
    seriesStems.map(series => ({
      label: `${run.id}_${series.stem}.dat`,
      href: benchmarkAssetPath("dkt", `downloads/${run.id}_${series.stem}.dat`),
      description: `${run.label} - ${series.label}`
    }))
  )
];

export const dktReferenceRows = [
  { fileType: "Tilt", pattern: "*_tilt.dat", column1: "Time t [-]", column2: "Pair-axis tilt from vertical [deg]" },
  { fileType: "Separation", pattern: "*_separation.dat", column1: "Time t [-]", column2: "Centre distance [d]" },
  { fileType: "Velocity", pattern: "*_vz_leader.dat, *_vz_trailer.dat", column1: "Time t [-]", column2: "Vertical velocity u_z [-]" },
  { fileType: "Trajectory", pattern: "*_xz_leader.dat, *_xz_trailer.dat", column1: "x [d]", column2: "z [d]" }
];
