// Builds the aggregate reference-data index served at /reference-data.
//
// The index is DERIVED, never maintained by hand. Its only inputs are the asset
// manifests each benchmark converter already writes next to the files it
// describes (public/benchmark-assets/<id>/manifest.json), so a benchmark whose
// data changes, or a benchmark added with a new converter, shows up here as soon
// as its converter has run. A benchmark with no download entries simply produces
// no group.
//
// File size and format come from disk at build time: the manifests record what a
// file is, not how big it is, and reading a stat is cheaper than teaching every
// converter to record one.
//
// Files that are byte-identical across benchmarks — the DNS validation datasheet
// is offered under every DNS page — are detected by content hash and flagged, so
// the page can present them once as shared assets instead of implying that each
// benchmark ships its own copy.
//
// Outputs:
//   src/data/generated/reference-index.json
//
// Run with: node scripts/build-reference-index.mjs
// Also runs as the first step of `npm run build`, so a deploy cannot serve a
// stale index; src/data/reference-data.test.ts fails if the committed file has
// drifted from what a fresh scan produces.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const assetsDir = resolve(root, "public/benchmark-assets");
const outPath = resolve(root, "src/data/generated/reference-index.json");

/** Human-facing format label per extension. Anything else is reported verbatim. */
const FORMATS = {
  ".zip": "ZIP archive",
  ".csv": "CSV",
  ".dat": "ASCII, two columns",
  ".txt": "ASCII",
  ".json": "JSON"
};

function formatFor(name) {
  const ext = extname(name).toLowerCase();
  return FORMATS[ext] ?? (ext ? ext.slice(1).toUpperCase() : "file");
}

/** Every benchmark asset directory that carries a manifest, in directory order. */
export function manifestPaths(dir = assetsDir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => resolve(dir, entry.name, "manifest.json"))
    .filter(existsSync)
    .sort();
}

/**
 * Collect the download entries of every manifest, enriched with on-disk size,
 * format and content hash.
 */
export function collectGroups(paths = manifestPaths()) {
  const groups = [];

  for (const path of paths) {
    const manifest = JSON.parse(readFileSync(path, "utf-8"));
    const benchmarkDir = dirname(path);
    const files = [];

    for (const entry of manifest.entries ?? []) {
      if (entry.kind !== "download") continue;
      const absolute = resolve(benchmarkDir, entry.newPath);
      if (!existsSync(absolute)) {
        throw new Error(`${manifest.benchmarkId}: manifest lists a missing download ${entry.newPath}`);
      }
      const name = entry.newPath.replace(/^.*\//, "");
      files.push({
        name,
        path: entry.newPath,
        label: entry.label ?? name,
        format: formatFor(name),
        bytes: statSync(absolute).size,
        sha1: createHash("sha1").update(readFileSync(absolute)).digest("hex")
      });
    }

    // A benchmark without published reference data contributes no group at all,
    // rather than an empty section on the page.
    if (files.length) {
      groups.push({ benchmarkId: manifest.benchmarkId, files });
    }
  }

  return groups;
}

/** Content hashes that occur under more than one benchmark. */
export function findShared(groups) {
  const byHash = new Map();
  for (const group of groups) {
    for (const file of group.files) {
      const seen = byHash.get(file.sha1) ?? { file, benchmarkIds: [] };
      if (!seen.benchmarkIds.includes(group.benchmarkId)) seen.benchmarkIds.push(group.benchmarkId);
      byHash.set(file.sha1, seen);
    }
  }
  return [...byHash.values()]
    .filter(entry => entry.benchmarkIds.length > 1)
    .map(({ file, benchmarkIds }) => ({
      name: file.name,
      format: file.format,
      bytes: file.bytes,
      sha1: file.sha1,
      benchmarkIds
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildIndex(paths = manifestPaths()) {
  const groups = collectGroups(paths);
  const shared = findShared(groups);
  const sharedHashes = new Set(shared.map(entry => entry.sha1));

  return {
    generatedBy: "scripts/build-reference-index.mjs",
    groups: groups.map(group => ({
      ...group,
      files: group.files.map(file => ({ ...file, shared: sharedHashes.has(file.sha1) }))
    })),
    shared,
    totals: {
      benchmarks: groups.length,
      files: groups.reduce((sum, group) => sum + group.files.length, 0),
      bytes: groups.reduce((sum, group) => sum + group.files.reduce((n, file) => n + file.bytes, 0), 0)
    }
  };
}

export function serializeIndex(index) {
  return `${JSON.stringify(index, null, 2)}\n`;
}

// Run only when invoked directly, so the helpers stay importable from tests.
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const index = buildIndex();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, serializeIndex(index));
  console.log(
    `Indexed ${index.totals.files} reference files across ${index.totals.benchmarks} benchmarks ` +
      `(${(index.totals.bytes / 1024 / 1024).toFixed(1)} MB, ${index.shared.length} shared)`
  );
}
