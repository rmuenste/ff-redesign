import type { DownloadItem } from "../components";
import { benchmarkAssetPath } from "./assets";
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
  }
];

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

export const sedimentationDownloads: DownloadItem[] = [
  {
    label: "sedimentation.zip",
    href: benchmarkAssetPath("sedimentation", "downloads/sedimentation.zip"),
    description: "All simulation and PIV reference downloads"
  },
  ...simDownloadItems,
  ...pivDownloadItems
];
