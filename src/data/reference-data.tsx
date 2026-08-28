import type { DownloadItem } from "../components";
import { benchmarkAssetPath } from "./assets";
import { benchmarks } from "./benchmarks";
import { dktDownloads } from "./dkt";
import { fac3Downloads } from "./fac3";
import generatedIndex from "./generated/reference-index.json";
import { hinderedDownloads } from "./hindered-settling";
import { viscometerDownloads } from "./numerical-viscometer";
import { rb2Downloads } from "./rb2";
import { rb3Downloads } from "./rb3";
import { sedimentationDownloads } from "./sedimentation";
import type { BenchmarkMeta } from "./types";

/**
 * Per-benchmark download prose. The FILE LIST is never taken from here — it comes
 * from the generated index, which is derived from the asset manifests — but the
 * benchmark pages already carry a curated one-line description for the files they
 * highlight, and there is no reason to write those twice. A file the manifest
 * lists and no page describes still appears, using its manifest label.
 */
const curatedDownloads: Record<string, DownloadItem[]> = {
  rb3: rb3Downloads,
  rb2: rb2Downloads,
  fac3: fac3Downloads,
  sedimentation: sedimentationDownloads,
  dkt: dktDownloads,
  "hindered-settling": hinderedDownloads,
  "numerical-viscometer": viscometerDownloads
};

function basename(path: string) {
  return path.replace(/^.*\//, "");
}

function describedBy(benchmarkId: string) {
  const items = curatedDownloads[benchmarkId] ?? [];
  return new Map(items.filter(item => item.description).map(item => [basename(item.href), item.description!]));
}

export interface ReferenceFile {
  name: string;
  href: string;
  format: string;
  bytes: number;
  description?: string;
  shared: boolean;
}

export interface ReferenceGroup {
  benchmark: BenchmarkMeta;
  /** Deep link to the benchmark page's own Reference Data tab. */
  href: string;
  files: ReferenceFile[];
  bytes: number;
}

const indexByBenchmark = new Map(generatedIndex.groups.map(group => [group.benchmarkId, group]));

/**
 * Reference-data groups in catalogue order.
 *
 * Registry order drives the page, and the generated index decides which
 * benchmarks appear at all: a benchmark registered without published reference
 * data contributes no group rather than an empty one, and an index group with no
 * matching registry entry is ignored rather than rendered without a title.
 */
export const referenceGroups: ReferenceGroup[] = benchmarks.flatMap(benchmark => {
  const group = indexByBenchmark.get(benchmark.id);
  if (!group || !group.files.length) return [];
  const descriptions = describedBy(benchmark.id);

  const files = group.files.map(file => ({
    name: file.name,
    href: benchmarkAssetPath(benchmark.id, file.path),
    format: file.format,
    bytes: file.bytes,
    description: descriptions.get(file.name),
    shared: file.shared
  }));

  return [
    {
      benchmark,
      href: `/benchmarks/${benchmark.slug}?tab=reference-data`,
      files,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0)
    }
  ];
});

export interface SharedReferenceFile {
  name: string;
  format: string;
  bytes: number;
  /** Benchmarks that offer this exact file, as catalogue entries. */
  offeredBy: BenchmarkMeta[];
  /** Any one of the identical copies; they are byte-identical by construction. */
  href: string;
}

/** Files that are byte-identical across benchmarks, listed once. */
export const referenceShared: SharedReferenceFile[] = generatedIndex.shared.flatMap(entry => {
  const offeredBy = entry.benchmarkIds
    .map(id => benchmarks.find(benchmark => benchmark.id === id))
    .filter((benchmark): benchmark is BenchmarkMeta => Boolean(benchmark));
  if (!offeredBy.length) return [];
  const source = indexByBenchmark.get(offeredBy[0].id)?.files.find(file => file.name === entry.name);
  if (!source) return [];
  return [
    {
      name: entry.name,
      format: entry.format,
      bytes: entry.bytes,
      offeredBy,
      href: benchmarkAssetPath(offeredBy[0].id, source.path)
    }
  ];
});

export const referenceTotals = {
  benchmarks: referenceGroups.length,
  files: referenceGroups.reduce((sum, group) => sum + group.files.length, 0),
  bytes: referenceGroups.reduce((sum, group) => sum + group.bytes, 0)
};

/** Byte count in the units a reader wants, with a fixed one-decimal MB/kB. */
export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${bytes} B`;
}
