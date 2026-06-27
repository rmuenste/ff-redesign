import type { ReactNode } from "react";
import type { ContentBlock } from "../components";

export type BenchmarkStatus = "active" | "planned";
export type ComparisonAxis = "code" | "level";
export type SeriesKind = "code" | "level" | "reference";
export type PlotSourceKind = "single-trace" | "trace-array" | "segmented-shape";
export type CompareMode = "overlay" | "diff" | "small-multiples";

/**
 * How a loaded source's traces are sliced into user-toggleable variants. Kept
 * separate from `PlotSource.kind` (which describes the file payload) because the
 * two are orthogonal: e.g. RB3 `size` is a `trace-array` whose consecutive traces
 * are grouped two-at-a-time via `paired-traces`.
 */
export type TraceVariantStrategy =
  | { kind: "single-trace" }
  | { kind: "paired-traces"; pairSize: 2 };

export interface AssetRef {
  path: string;
  alt?: string;
  caption?: ReactNode;
  sourceBenchmark?: string;
}

export interface BenchmarkMeta {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tag: string;
  model: string;
  dimension: "2D" | "3D";
  reynolds?: number | string;
  levels?: number;
  summary: string;
  heroAsset?: AssetRef;
  tabs: string[];
  comparisonAxis?: ComparisonAxis;
  status: BenchmarkStatus;
}

export interface BenchmarkContent {
  benchmarkId: string;
  tabs: BenchmarkTabContent[];
}

export interface BenchmarkTabContent {
  id: string;
  label: string;
  blocks: ContentBlock[];
}

export interface PlotSource {
  kind: PlotSourceKind;
  asset: AssetRef;
  /** Only meaningful for `segmented-shape`: number of points per emitted segment. */
  segmentSize?: number;
}

/**
 * A variant is derived at runtime from a loaded source's traces (labels come from
 * the JSON `name` fields, not static config). `traceIndexes` are positions into the
 * expanded trace array that this variant covers (one for `single-trace`, a pair for
 * `paired-traces`).
 */
export interface TraceVariant {
  id: string;
  label: string;
  traceIndexes: number[];
}

export interface SeriesGroup {
  id: string;
  label: string;
  kind: SeriesKind;
  color: string;
  source: PlotSource;
  variantStrategy: TraceVariantStrategy;
  dash?: string;
  highlight?: boolean;
}

export interface PlotSpec {
  id: string;
  title: string;
  metric: string;
  comparisonAxis: ComparisonAxis;
  seriesGroups: SeriesGroup[];
  defaultSeriesGroupIds: string[];
  compareModes: CompareMode[];
  defaultCompareMode: CompareMode;
  /** Reserved for `diff` mode (not implemented yet). */
  defaultBaselineGroupId?: string;
  axisLabels?: { x: string; y: string };
}

export interface AssetManifestEntry {
  oldPath: string;
  newPath: string;
  metric?: string;
  seriesGroupId?: string;
  kind?: SeriesKind;
  label?: string;
  sourceShape?: PlotSourceKind;
}

export interface AssetManifest {
  benchmarkId: string;
  entries: AssetManifestEntry[];
}
