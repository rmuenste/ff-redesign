// Resets the generated part of a benchmark's asset folder without touching what
// the converter does not build.
//
// public/benchmark-assets/<id>/ is shared. A converter writes plots/, downloads/
// (a few also copy named files under media/) and manifest.json; the gallery
// lands its hand-rendered stills under media/gallery/ and records them in the
// same manifest as `kind: "media"` entries that no converter derives. Wiping the
// folder before a rebuild therefore deleted the stills and their entries.
//
// Ownership is by path. A converter declares the directories and files it
// writes, relative to the folder; only those are removed before the rebuild,
// and every manifest entry outside them is carried into the rebuilt manifest
// unchanged. The converter's own entries take the place of the block it owned
// before (a companion that adds a section to another converter's manifest keeps
// its section where it was, and stills added after it stay last); a converter
// that owned nothing yet appends.
//
// Usage, in a converter:
//
//   const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId });
//   ... write files under the owned paths, collecting `entries` ...
//   writeManifest(outDir, benchmarkId, entries, preserved);
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

/** Whether a manifest `newPath` is `owned` itself or lies beneath it. */
function isUnder(newPath, owned) {
  return newPath === owned || newPath.startsWith(`${owned}/`);
}

/** Owned paths are plain relative paths inside the folder, never the folder itself. */
function normalizeOwned(ownedPaths) {
  return ownedPaths.map(path => {
    const clean = String(path).replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
    const segments = clean.split("/");
    if (!clean || isAbsolute(clean) || segments.some(segment => segment === "" || segment === "." || segment === "..")) {
      throw new Error(`owned path must be a relative path inside the output folder: ${JSON.stringify(path)}`);
    }
    return clean;
  });
}

/**
 * Remove what the converter owns and read back what it must keep.
 *
 * @param {string} outDir absolute path of the benchmark's asset folder
 * @param {string[]} ownedPaths directories or files the converter writes, relative
 *   to `outDir` (for example `["plots", "downloads", "media/geometry.jpg"]`);
 *   everything else in the folder is left alone
 * @param {{ benchmarkId?: string }} [options] with `benchmarkId`, an existing
 *   manifest for a different benchmark is an error (wrong folder)
 * @returns {{ entries: object[], insertAt: number, owned: string[] }} the manifest
 *   entries to carry over, the index among them where the converter's own entries
 *   belong, and the normalised ownership; hand it to `writeManifest`
 */
export function resetGeneratedOutputs(outDir, ownedPaths, { benchmarkId } = {}) {
  const owned = normalizeOwned(ownedPaths);
  const manifestPath = resolve(outDir, "manifest.json");
  const entries = [];
  let insertAt = -1;

  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    if (benchmarkId !== undefined && manifest.benchmarkId !== benchmarkId) {
      throw new Error(`unexpected manifest at ${manifestPath}: ${manifest.benchmarkId} (expected ${benchmarkId})`);
    }
    for (const entry of manifest.entries) {
      if (owned.some(path => isUnder(entry.newPath, path))) {
        if (insertAt < 0) insertAt = entries.length;
      } else {
        entries.push(entry);
      }
    }
  }
  if (insertAt < 0) insertAt = entries.length;

  for (const path of owned) rmSync(resolve(outDir, path), { recursive: true, force: true });
  rmSync(manifestPath, { force: true });
  mkdirSync(outDir, { recursive: true });

  return { entries, insertAt, owned };
}

/**
 * Write `manifest.json`: the converter's own entries merged with the preserved ones.
 *
 * Every own entry must lie under a path the converter declared as owned (otherwise
 * the next reset would leave its file behind, or it would collide with an entry
 * the reset preserved), and no path may be recorded twice.
 *
 * @param {string} outDir absolute path of the benchmark's asset folder
 * @param {string} benchmarkId the manifest's `benchmarkId`
 * @param {object[]} ownEntries the entries the converter built this run
 * @param {{ entries: object[], insertAt: number, owned: string[] }} preserved the
 *   result of `resetGeneratedOutputs`
 * @param {{ indent?: number }} [options] JSON indentation (default 2; 0 is compact)
 * @returns {object[]} the entries as written
 */
export function writeManifest(outDir, benchmarkId, ownEntries, preserved, { indent = 2 } = {}) {
  for (const entry of ownEntries) {
    if (!preserved.owned.some(path => isUnder(entry.newPath, path))) {
      throw new Error(
        `manifest entry ${entry.newPath} is outside the paths the converter owns (${preserved.owned.join(", ")})`
      );
    }
  }
  const entries = [...preserved.entries];
  entries.splice(preserved.insertAt, 0, ...ownEntries);

  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.newPath)) throw new Error(`manifest entry ${entry.newPath} is recorded twice`);
    seen.add(entry.newPath);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "manifest.json"), `${JSON.stringify({ benchmarkId, entries }, null, indent)}\n`);
  return entries;
}
