import type { DownloadItem, ValidationRow } from "../components";
import { benchmarkAssetPath } from "./assets";
import generatedLubrication from "./generated/sedimentation-lubrication.json";
import generatedValidation from "./generated/sedimentation-validation.json";
import type { PlotSource, PlotSpec, SeriesGroup } from "./types";

export type SedimentationMetricId = "velocity" | "position";
export type SedimentationCaseId = "E1" | "E2" | "E3" | "E4";
export type SedimentationLevelId = "l2" | "l3";

export const sedimentationMetrics: Array<{ id: SedimentationMetricId; label: string; yAxis: string }> = [
  { id: "velocity", label: "Velocity", yAxis: "Vertical velocity [m/s]" },
  { id: "position", label: "Position", yAxis: "Gap height h/d_p" }
];

export const sedimentationCases: Array<{ id: SedimentationCaseId; label: string; re: number; st: number }> = [
  { id: "E1", label: "Case E1", re: 1.5, st: 0.19 },
  { id: "E2", label: "Case E2", re: 4.1, st: 0.53 },
  { id: "E3", label: "Case E3", re: 11.6, st: 1.5 },
  { id: "E4", label: "Case E4", re: 31.9, st: 4.13 }
];

export const sedimentationLevels: Array<{ id: SedimentationLevelId; label: string; detail: string }> = [
  { id: "l2", label: "L2", detail: "simulation" },
  { id: "l3", label: "L3", detail: "simulation" }
];

const caseMeta: Record<SedimentationCaseId, { color: string; markerSymbol: string }> = {
  E1: { color: "#5fb8ff", markerSymbol: "square-open" },
  E2: { color: "#f5b84b", markerSymbol: "circle-open" },
  E3: { color: "#7bd88f", markerSymbol: "triangle-up-open" },
  E4: { color: "#ef6f6c", markerSymbol: "diamond-open" }
};

function sedimentationPlotPath(metric: SedimentationMetricId, caseId: SedimentationCaseId, sourceId: SedimentationLevelId | "piv") {
  return benchmarkAssetPath("sedimentation", `plots/${metric}/${caseId}-${sourceId}.json`);
}

function sedimentationSource(metric: SedimentationMetricId, caseId: SedimentationCaseId, level: SedimentationLevelId): PlotSource {
  return {
    kind: "single-trace",
    asset: { path: sedimentationPlotPath(metric, caseId, level) },
    ...(level === "l3" ? { dash: "dot" } : {})
  };
}

function simulationGroup(metric: SedimentationMetricId, testCase: SedimentationCaseId): SeriesGroup {
  return {
    id: testCase.toLowerCase(),
    label: testCase,
    kind: "code",
    color: caseMeta[testCase].color,
    levelSources: Object.fromEntries(
      sedimentationLevels.map(level => [level.id, sedimentationSource(metric, testCase, level.id)])
    ),
    variantStrategy: { kind: "single-trace" }
  };
}

function pivGroup(metric: SedimentationMetricId, testCase: SedimentationCaseId): SeriesGroup {
  return {
    id: `${testCase.toLowerCase()}-piv`,
    label: `${testCase} PIV`,
    kind: "reference",
    color: caseMeta[testCase].color,
    source: {
      kind: "single-trace",
      asset: { path: sedimentationPlotPath(metric, testCase, "piv") }
    },
    markerSymbol: caseMeta[testCase].markerSymbol,
    variantStrategy: { kind: "single-trace" }
  };
}

function seriesGroups(metric: SedimentationMetricId): SeriesGroup[] {
  return [
    ...sedimentationCases.map(testCase => simulationGroup(metric, testCase.id)),
    ...sedimentationCases.map(testCase => pivGroup(metric, testCase.id))
  ];
}

export const sedimentationPlotSpecs: Record<SedimentationMetricId, PlotSpec> = Object.fromEntries(
  sedimentationMetrics.map(metric => {
    const groups = seriesGroups(metric.id);
    return [
      metric.id,
      {
        id: `sedimentation-${metric.id}`,
        title: metric.label,
        metric: metric.id,
        comparisonAxis: "code",
        seriesSelectorLabel: "Cases & references",
        seriesGroups: groups,
        defaultSeriesGroupIds: groups.map(group => group.id),
        levelAxis: {
          id: "resolution",
          label: "Simulation level",
          options: sedimentationLevels,
          defaultLevelId: "l2"
        },
        compareModes: ["overlay"],
        defaultCompareMode: "overlay",
        preserveSourceColorsWhenSingleGroup: false,
        axisLabels: { x: "Time [s]", y: metric.yAxis }
      } satisfies PlotSpec
    ];
  })
) as Record<SedimentationMetricId, PlotSpec>;

export const sedimentationSetupAsset = benchmarkAssetPath("sedimentation", "media/sedimentation-setup.png");

export interface SedimentationPhysicalRow {
  case: SedimentationCaseId;
  rhoF: number;
  muF: number;
  re: number;
  st: number;
}

export const sedimentationPhysicalRows: SedimentationPhysicalRow[] = [
  { case: "E1", rhoF: 970, muF: 373, re: 1.5, st: 0.19 },
  { case: "E2", rhoF: 965, muF: 212, re: 4.1, st: 0.53 },
  { case: "E3", rhoF: 962, muF: 113, re: 11.6, st: 1.5 },
  { case: "E4", rhoF: 960, muF: 58, re: 31.9, st: 4.13 }
];

/* ---------------- Sub-grid lubrication (campaign gate D2.2 G3) ---------------- */

export type SedimentationLubricationMetricId = "approach" | "film";

export interface SedimentationLubricationCase {
  id: string;
  re: number;
  rhoF: number;
  window: number[];
  hMin: number;
  clampFactor: number;
  activationGap: number;
  activationTime: number;
  activationSpeed: number;
  buoyantWeight: number;
  reductions: Array<{ cells: number; base: number; lubricated: number; reduction: number }>;
  landing: { base: number; lubricated: number; increase: number };
  peakForce: number;
  peakForceRatio: number;
  activeSteps: number;
  restingGap: { base: number; lubricated: number };
}

export interface SedimentationBrennerBand {
  model: string;
  label: string;
  band1h2h: number;
  bandSub1h: number;
}

/**
 * Generated by scripts/convert-sedimentation-lubrication.mjs from the curated
 * approach windows. Never edit by hand — correct the source series and re-run the
 * converter.
 */
export const sedimentationLubricationCases =
  generatedLubrication.cases as SedimentationLubricationCase[];
export const sedimentationBrennerBands =
  generatedLubrication.brennerBands as SedimentationBrennerBand[];
export const sedimentationLandedFraction = generatedLubrication.landedFraction;

function lubricationSource(metric: string, caseId: string, id: string): PlotSource {
  return {
    kind: "single-trace",
    asset: {
      path: benchmarkAssetPath("sedimentation", `plots/lubrication/${metric}/${caseId.toLowerCase()}-${id}.json`)
    }
  };
}

function lubricationGroup(
  metric: string,
  id: string,
  label: string,
  kind: SeriesGroup["kind"],
  color: string,
  extra: Partial<SeriesGroup> = {}
): SeriesGroup {
  return {
    id,
    label,
    kind,
    color,
    levelSources: Object.fromEntries(
      sedimentationLubricationCases.map(entry => [entry.id.toLowerCase(), lubricationSource(metric, entry.id, id)])
    ),
    variantStrategy: { kind: "single-trace" },
    ...extra
  };
}

/** Case selector, reusing the panel's level axis — the cases are the ladder here. */
const lubricationCaseAxis = {
  id: "case",
  label: "Case",
  options: sedimentationLubricationCases.map(entry => ({
    id: entry.id.toLowerCase(),
    label: entry.id,
    detail: `Re = ${entry.re}`
  })),
  defaultLevelId: sedimentationLubricationCases[0].id.toLowerCase()
};

export const sedimentationLubricationSpecs: Record<SedimentationLubricationMetricId, PlotSpec> = {
  approach: {
    id: "sedimentation-lubrication-approach",
    title: "Bottom approach",
    metric: "lubrication-approach",
    comparisonAxis: "code",
    seriesSelectorLabel: "Runs & references",
    seriesGroups: [
      lubricationGroup("approach", "base", "FBM, no F_lub", "code", "#ef6f6c", { dash: "dash" }),
      lubricationGroup("approach", "lub", "FBM + deficit model", "code", "#7bd88f"),
      lubricationGroup("approach", "piv", "PIV (digitised)", "reference", "var(--fg1)", {
        markerSymbol: "square-open"
      }),
      lubricationGroup("approach", "activation", "Activation gap", "reference", "var(--fg3)")
    ],
    defaultSeriesGroupIds: ["base", "lub", "piv", "activation"],
    levelAxis: lubricationCaseAxis,
    compareModes: ["overlay"],
    defaultCompareMode: "overlay",
    preserveSourceColorsWhenSingleGroup: false,
    axisLabels: { x: "Time [s]", y: "Vertical velocity [m/s]" }
  },
  film: {
    id: "sedimentation-lubrication-film",
    title: "Lubrication force",
    metric: "lubrication-film",
    comparisonAxis: "code",
    seriesSelectorLabel: "Runs",
    seriesGroups: [lubricationGroup("film", "flub", "|F_lub| / buoyant weight", "code", "#7bd88f")],
    defaultSeriesGroupIds: ["flub"],
    levelAxis: lubricationCaseAxis,
    compareModes: ["overlay"],
    defaultCompareMode: "overlay",
    preserveSourceColorsWhenSingleGroup: false,
    axisLabels: { x: "Time [s]", y: "|F_lub| / buoyant weight [-]" }
  }
};

export const sedimentationReferenceRows = [
  {
    fileType: "Simulation velocity txt",
    pattern: "velE*.txt / velE*_L3.txt",
    column1: "Time [s]",
    column2: "Velocity [m/s]"
  },
  {
    fileType: "Simulation position txt",
    pattern: "posE*.txt / posE*_L3.txt",
    column1: "Time [s]",
    column2: "Raw position height [m]"
  },
  {
    fileType: "PIV velocity reference",
    pattern: "ref_E*.dat",
    column1: "Time [s]",
    column2: "u_z [m/s]"
  },
  {
    fileType: "PIV position reference",
    pattern: "case_E*_h.csv",
    column1: "Time [s]",
    column2: "Normalized gap height h/d_p [-]"
  },
  {
    fileType: "Lubrication approach window",
    pattern: "lubrication/approach_E*_base.csv",
    column1: "Time [s]",
    column2: "u [m/s], wall gap [m]"
  },
  {
    fileType: "Lubrication approach window",
    pattern: "lubrication/approach_E*_lub.csv",
    column1: "Time [s]",
    column2: "u [m/s], wall gap [m], F_lub [N], active pairs"
  }
];

/**
 * Generated from the DNS validation datasheet by
 * scripts/convert-sedimentation-validation.mjs. Never edit by hand — correct the
 * datasheet and re-run the converter.
 */
export const sedimentationValidationRows = generatedValidation.rows as ValidationRow[];
export const sedimentationValidationSource = generatedValidation.source;

/** The sub-grid lubrication ladder, shown on the Lubrication tab. */
export const sedimentationLubricationRows = generatedValidation.lubricationRows as ValidationRow[];

/** One point of the synchronised timestep ladder at the workhorse resolution. */
export interface SedimentationDtRow {
  level: string;
  dtMs: number;
  errorPct: number;
  synced: boolean;
}

/** Fitted split of the peak error into a per-level spatial term and a temporal term. */
export interface SedimentationDecompositionFit {
  order: number;
  spatialPp: Record<string, number>;
  temporalPpAt1ms: number;
  maxResidualPp: number;
}

export const sedimentationDtLadder = generatedValidation.dtLadder as SedimentationDtRow[];
export const sedimentationDecomposition =
  generatedValidation.decomposition as Record<string, SedimentationDecompositionFit[]>;
export const sedimentationDecompositionSource = generatedValidation.decompositionSource;

export const sedimentationReferences = [
  {
    id: "ten-cate-2002",
    text:
      "A. ten Cate, C. H. Nieuwstad, J. J. Derksen, H. E. A. Van den Akker; Particle imaging velocimetry experiments and lattice-Boltzmann simulations on a single sphere settling under gravity. Physics of Fluids 14 (11), 4012-4025, 2002. https://doi.org/10.1063/1.1512918"
  }
];

const simDownloadItems = sedimentationCases.flatMap(testCase =>
  sedimentationLevels.flatMap(level => {
    const suffix = level.id === "l3" ? "_L3" : "";
    return [
      {
        label: `vel${testCase.id}${suffix}.txt`,
        href: benchmarkAssetPath("sedimentation", `downloads/vel${testCase.id}${suffix}.txt`),
        description: `${testCase.label} ${level.label} velocity time series`
      },
      {
        label: `pos${testCase.id}${suffix}.txt`,
        href: benchmarkAssetPath("sedimentation", `downloads/pos${testCase.id}${suffix}.txt`),
        description: `${testCase.label} ${level.label} position time series`
      }
    ];
  })
);

const pivDownloadItems = sedimentationCases.flatMap(testCase => [
  {
    label: `ref_${testCase.id}.dat`,
    href: benchmarkAssetPath("sedimentation", `downloads/ref_${testCase.id}.dat`),
    description: `${testCase.label} PIV velocity reference`
  },
  {
    label: `case_${testCase.id}_h.csv`,
    href: benchmarkAssetPath("sedimentation", `downloads/case_${testCase.id}_h.csv`),
    description: `${testCase.label} PIV position reference`
  }
]);

const lubricationDownloadItems: DownloadItem[] = [
  ...sedimentationLubricationCases.flatMap(entry => [
    {
      label: `approach_${entry.id}_base.csv`,
      href: benchmarkAssetPath("sedimentation", `downloads/lubrication/approach_${entry.id}_base.csv`),
      description: `${entry.id} bottom-approach window, lubrication off`
    },
    {
      label: `approach_${entry.id}_lub.csv`,
      href: benchmarkAssetPath("sedimentation", `downloads/lubrication/approach_${entry.id}_lub.csv`),
      description: `${entry.id} bottom-approach window with the deficit model, including the lubrication force`
    }
  ]),
  {
    label: "cases.csv",
    href: benchmarkAssetPath("sedimentation", "downloads/lubrication/cases.csv"),
    description: "Approach window, fluid density and mesh clamp per lubrication case"
  },
  {
    label: "brenner_bands.csv",
    href: benchmarkAssetPath("sedimentation", "downloads/lubrication/brenner_bands.csv"),
    description: "Wall-approach benchmark deviations that select the model form"
  }
];

export const sedimentationDownloads: DownloadItem[] = [
  {
    label: "sedimentation.zip",
    href: benchmarkAssetPath("sedimentation", "downloads/sedimentation.zip"),
    description: "All simulation and PIV reference downloads"
  },
  {
    label: "sedimentation-lubrication.zip",
    href: benchmarkAssetPath("sedimentation", "downloads/lubrication/sedimentation-lubrication.zip"),
    description: "Bottom-approach series with and without the sub-grid lubrication model"
  },
  ...simDownloadItems,
  ...pivDownloadItems,
  ...lubricationDownloadItems
];
