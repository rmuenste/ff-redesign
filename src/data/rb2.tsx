import type { DownloadItem } from "../components";
import { benchmarkAssetPath } from "./assets";
import type { PlotSource, PlotSpec, SeriesGroup, TraceVariantStrategy } from "./types";

export type Rb2CaseId = "case-1" | "case-2";
export type Rb2MetricId = "shape" | "center-of-mass" | "circularity" | "rise-velocity" | "mass";
export type Rb2LevelId = "l1" | "l2" | "l3";
export type Rb2CodeId = "tp2d" | "freelife" | "moonmd" | "featflower";

export const rb2Cases: Array<{ id: Rb2CaseId; label: string; detail: string; re: string; eo: string }> = [
  { id: "case-1", label: "Case 1", detail: "Moderate density and viscosity ratios", re: "35", eo: "10" },
  { id: "case-2", label: "Case 2", detail: "Large density and viscosity ratios", re: "35", eo: "125" }
];

export const rb2Levels: Array<{ id: Rb2LevelId; label: string }> = [
  { id: "l1", label: "Level 1" },
  { id: "l2", label: "Level 2" },
  { id: "l3", label: "Level 3" }
];

export const rb2Metrics: Array<{ id: Rb2MetricId; label: string; yAxis: string }> = [
  { id: "shape", label: "Bubble shape", yAxis: "Y-coordinate" },
  { id: "center-of-mass", label: "Center of mass", yAxis: "Center of Mass" },
  { id: "circularity", label: "Circularity", yAxis: "Circularity" },
  { id: "rise-velocity", label: "Rise velocity", yAxis: "Rise Velocity" },
  { id: "mass", label: "Mass / area", yAxis: "Mass / Area" }
];

const rb2CodeMeta: Record<Rb2CodeId, { label: string; color: string; markerSymbol: string }> = {
  tp2d: { label: "TP2D", color: "var(--tu-petrol-400)", markerSymbol: "circle" },
  freelife: { label: "FreeLIFE", color: "var(--tu-green-400)", markerSymbol: "square" },
  moonmd: { label: "MooNMD", color: "var(--tu-red-300)", markerSymbol: "x" },
  featflower: { label: "FeatFloWer", color: "var(--tu-orange-500)", markerSymbol: "diamond" }
};

const baseCodes: Rb2CodeId[] = ["tp2d", "freelife", "moonmd"];

function availableCodes(caseId: Rb2CaseId, metric: Rb2MetricId): Rb2CodeId[] {
  if (caseId === "case-2" && (metric === "shape" || metric === "circularity" || metric === "mass")) {
    return [...baseCodes, "featflower"];
  }
  return baseCodes;
}

function rb2PlotPath(caseId: Rb2CaseId, metric: Rb2MetricId, code: Rb2CodeId, level: Rb2LevelId) {
  return benchmarkAssetPath("rb2", `plots/${caseId}/${metric}/${code}-${level}.json`);
}

function rb2Source(caseId: Rb2CaseId, metric: Rb2MetricId, code: Rb2CodeId, level: Rb2LevelId): PlotSource {
  if (metric === "shape") {
    return {
      kind: "segmented-shape",
      asset: { path: rb2PlotPath(caseId, metric, code, level) },
      segmentSize: code === "moonmd" ? 8 : 2,
      dash: code === "moonmd" ? "dot" : undefined
    };
  }

  return {
    kind: "single-trace",
    asset: { path: rb2PlotPath(caseId, metric, code, level) },
    markerSampleEvery: 90
  };
}

function rb2VariantStrategy(metric: Rb2MetricId): TraceVariantStrategy {
  return metric === "shape" ? { kind: "all-traces", label: "Outline" } : { kind: "single-trace" };
}

function rb2SeriesGroups(caseId: Rb2CaseId, metric: Rb2MetricId): SeriesGroup[] {
  return availableCodes(caseId, metric).map(code => ({
    id: code,
    label: rb2CodeMeta[code].label,
    kind: "code",
    color: rb2CodeMeta[code].color,
    markerSymbol: rb2CodeMeta[code].markerSymbol,
    variantStrategy: rb2VariantStrategy(metric),
    levelSources: Object.fromEntries(
      rb2Levels.map(level => [level.id, rb2Source(caseId, metric, code, level.id)])
    ) as Record<Rb2LevelId, PlotSource>
  }));
}

function rb2AxisLabels(metric: Rb2MetricId): { x: string; y: string } {
  if (metric === "shape") return { x: "X-coordinate", y: "Y-coordinate" };
  return { x: "Time [s]", y: rb2Metrics.find(item => item.id === metric)!.yAxis };
}

export const rb2PlotSpecs: Record<Rb2CaseId, Record<Rb2MetricId, PlotSpec>> = Object.fromEntries(
  rb2Cases.map(testCase => [
    testCase.id,
    Object.fromEntries(
      rb2Metrics.map(metric => {
        const groups = rb2SeriesGroups(testCase.id, metric.id);
        return [
          metric.id,
          {
            id: `rb2-${testCase.id}-${metric.id}`,
            title: `${testCase.label} · ${metric.label}`,
            metric: metric.id,
            comparisonAxis: "code",
            seriesGroups: groups,
            defaultSeriesGroupIds: groups.map(group => group.id),
            levelAxis: {
              id: "level",
              label: "Refinement level",
              options: rb2Levels,
              defaultLevelId: "l1"
            },
            compareModes: ["overlay"],
            defaultCompareMode: "overlay",
            preserveSourceColorsWhenSingleGroup: false,
            axisLabels: rb2AxisLabels(metric.id)
          } satisfies PlotSpec
        ];
      })
    ) as Record<Rb2MetricId, PlotSpec>
  ])
) as Record<Rb2CaseId, Record<Rb2MetricId, PlotSpec>>;

export const rb2SixCodesAsset = benchmarkAssetPath("rb2", "media/6codes.png");
export const rb2GeometryAsset = benchmarkAssetPath("rb2", "media/geometry-2d.png");

export const rb2Downloads: DownloadItem[] = [
  { label: "quantities.zip", href: benchmarkAssetPath("rb2", "downloads/quantities.zip"), description: "ASCII reference data for mass, circularity, center of mass, and rise velocity" },
  { label: "shapes.zip", href: benchmarkAssetPath("rb2", "downloads/shapes.zip"), description: "ASCII line-segment data for bubble shapes" }
];

export interface Rb2PhysicalRow {
  position: number;
  p1: number;
  p2: number;
  mu1: number;
  mu2: number;
  g: number;
  sigma: number;
  re: number;
  eo: number;
  rel: number;
  relmu: number;
}

export const rb2PhysicalRows: Rb2PhysicalRow[] = [
  { position: 1, p1: 1000, p2: 100, mu1: 10, mu2: 1, g: 0.98, sigma: 24.5, re: 35, eo: 10, rel: 10, relmu: 10 },
  { position: 2, p1: 1000, p2: 1, mu1: 10, mu2: 0.1, g: 0.98, sigma: 1.96, re: 35, eo: 125, rel: 1000, relmu: 100 }
];

export const rb2NotationRows = [
  { abbreviation: "c1", description: "Test Case 1" },
  { abbreviation: "c2", description: "Test Case 2" },
  { abbreviation: "g1", description: "TU Dortmund (TP2D)" },
  { abbreviation: "g2", description: "EPFL Lausanne (FreeLIFE)" },
  { abbreviation: "g3", description: "Uni Magdeburg (MooNMD)" },
  { abbreviation: "l#", description: "Grid refinement level; higher numbers indicate denser grids" }
];

export const rb2FormatRows = [
  { column: "1", quantity: "Time" },
  { column: "2", quantity: "Bubble mass or area" },
  { column: "3", quantity: "Circularity" },
  { column: "4", quantity: "Center of mass (y-coordinate)" },
  { column: "5", quantity: "Rise velocity" }
];

export const rb2References = [
  {
    id: "hysing-2009",
    text: "Hysing, S.; Turek, S.; Kuzmin, D.; Parolini, N.; Burman, E.; Ganesan, S.; Tobiska, L.: Quantitative benchmark computations of two-dimensional bubble dynamics, International Journal for Numerical Methods in Fluids, Volume 60 Issue 11, Pages 1259-1288, DOI: 10.1002/fld.1934, 2009."
  },
  {
    id: "hysing-2007-report",
    text: "Hysing, S.; Turek, S.; Kuzmin, D.; Parolini, N.; Burman, E.; Ganesan, S.; Tobiska, L.: Proposal for quantitative benchmark computations of bubble dynamics, Ergebnisberichte des Instituts fuer Angewandte Mathematik, Nummer 351, Fakultaet fuer Mathematik, TU Dortmund, 2007."
  },
  {
    id: "hysing-2007-icmf",
    text: "Hysing, S.; Turek, S.: Benchmark proposals for incompressible two-phase flows, ICMF 2007 Programme and Abstracts of the 6th International Conference on Multiphase Flow, Wiley-VCH, 2007."
  }
];
