import type { ReactNode } from "react";
import type { ContentBlock } from "../components";

export type BenchmarkStatus = "active" | "planned";
export type ComparisonAxis = "code" | "level";
export type SeriesKind = "code" | "level" | "reference";
export type PlotSourceKind = "single-trace" | "trace-array" | "segmented-shape";

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
  segmentSize?: number;
}

export interface TraceVariant {
  id: string;
  label: string;
  sourceTraceIndex: number;
  defaultVisible: boolean;
}

export interface SeriesGroup {
  id: string;
  label: string;
  kind: SeriesKind;
  color: string;
  source: PlotSource;
  dash?: string;
  highlight?: boolean;
}

export interface PlotSpec {
  id: string;
  title: string;
  metric: string;
  comparisonAxis: ComparisonAxis;
  seriesGroups: SeriesGroup[];
  traceVariants?: TraceVariant[];
  defaultSeriesGroupIds: string[];
  defaultTraceVariantIds?: string[];
  defaultBaselineGroupId?: string;
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
