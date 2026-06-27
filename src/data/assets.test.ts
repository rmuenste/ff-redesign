import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AssetManifest } from "./types";

const RB3_DIR = resolve(process.cwd(), "public/benchmark-assets/rb3");
const RB2_DIR = resolve(process.cwd(), "public/benchmark-assets/rb2");
const FAC3_DIR = resolve(process.cwd(), "public/benchmark-assets/fac3");
const CANONICAL_METRICS = new Set(["sphericity", "mass", "size", "surface"]);
const RB2_METRICS = new Set(["shape", "center-of-mass", "circularity", "rise-velocity", "mass"]);
const RB2_CASES = new Set(["case-1", "case-2"]);
const RB2_CODES = new Set(["tp2d", "freelife", "moonmd", "featflower"]);

const manifest = JSON.parse(readFileSync(resolve(RB3_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const rb2Manifest = JSON.parse(readFileSync(resolve(RB2_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const fac3Manifest = JSON.parse(readFileSync(resolve(FAC3_DIR, "manifest.json"), "utf-8")) as AssetManifest;

function listPlotFiles(): string[] {
  const plotsDir = resolve(RB3_DIR, "plots");
  return readdirSync(plotsDir, { withFileTypes: true }).flatMap(metricDir =>
    metricDir.isDirectory()
      ? readdirSync(resolve(plotsDir, metricDir.name)).map(file => `plots/${metricDir.name}/${file}`)
      : []
  );
}

function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = resolve(dir, entry.name);
    return entry.isDirectory() ? listFiles(abs, rel) : [rel];
  });
}

describe("rb3 asset manifest (public/benchmark-assets/rb3/manifest.json)", () => {
  it("is the single source of truth: not duplicated in app code", () => {
    expect(existsSync(resolve(process.cwd(), "src/data/assets.ts"))).toBe(true);
    const assetsSrc = readFileSync(resolve(process.cwd(), "src/data/assets.ts"), "utf-8");
    expect(assetsSrc).not.toMatch(/rb3AssetManifest/);
  });

  it("has 18 entries", () => {
    expect(manifest.entries).toHaveLength(18);
  });

  it("every manifest newPath exists on disk", () => {
    for (const entry of manifest.entries) {
      expect(existsSync(resolve(RB3_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("every plot file on disk is covered by the manifest (no orphans)", () => {
    const mapped = new Set(manifest.entries.map(entry => entry.newPath));
    for (const plotFile of listPlotFiles()) {
      expect(mapped.has(plotFile), plotFile).toBe(true);
    }
  });

  it("uses only the canonical metric vocabulary", () => {
    for (const entry of manifest.entries) {
      if (entry.metric) expect(CANONICAL_METRICS.has(entry.metric), entry.metric).toBe(true);
    }
  });
});

describe("fac3 asset manifest (public/benchmark-assets/fac3/manifest.json)", () => {
  it("covers copied and derived FAC assets", () => {
    expect(fac3Manifest.benchmarkId).toBe("fac3");
    expect(fac3Manifest.entries).toHaveLength(6);
    for (const entry of fac3Manifest.entries) {
      expect(existsSync(resolve(FAC3_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("marks live plot JSON as derived from BenchValues.txt", () => {
    const derived = fac3Manifest.entries.filter(entry => entry.derived);
    expect(derived.map(entry => entry.newPath).sort()).toEqual(["plots/drag.json", "plots/lift.json"]);
    expect(derived.every(entry => entry.oldPath === "files/fac3d/BenchValues.txt")).toBe(true);
  });

  it("keeps BenchValues.txt as a non-derived download", () => {
    const download = fac3Manifest.entries.find(entry => entry.newPath === "downloads/BenchValues.txt");
    expect(download?.kind).toBe("download");
    expect(download?.derived).toBeUndefined();
  });

  it("does not copy or reference dropped static result images", () => {
    const forbidden = [
      "Fd_Q2P1_paper.png",
      "Fl_Q2P1_paper.png",
      "zoom_Fd_Q2P1_paper.png",
      "zoom_Fl_Q2P1_paper.png"
    ];
    const copied = listFiles(FAC3_DIR);
    const mapped = fac3Manifest.entries.flatMap(entry => [entry.oldPath, entry.newPath]);
    for (const name of forbidden) {
      expect(copied.some(file => file.endsWith(name)), name).toBe(false);
      expect(mapped.some(file => file.endsWith(name)), name).toBe(false);
    }
  });
});

describe("rb2 asset manifest (public/benchmark-assets/rb2/manifest.json)", () => {
  it("has canonical, curated entries and no video asset", () => {
    expect(rb2Manifest.benchmarkId).toBe("rb2");
    expect(rb2Manifest.entries).toHaveLength(103);
    expect(rb2Manifest.entries.some(entry => /mp4|video|risingbubble/i.test(entry.newPath))).toBe(false);
  });

  it("every manifest newPath exists on disk", () => {
    for (const entry of rb2Manifest.entries) {
      expect(existsSync(resolve(RB2_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("every copied plot file is covered by the manifest (no orphans)", () => {
    const mapped = new Set(rb2Manifest.entries.map(entry => entry.newPath));
    for (const file of listFiles(resolve(RB2_DIR, "plots")).map(file => `plots/${file}`)) {
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("uses canonical case/metric/code-level plot paths", () => {
    for (const entry of rb2Manifest.entries.filter(entry => entry.newPath.startsWith("plots/"))) {
      const match = /^plots\/([^/]+)\/([^/]+)\/([^-]+)-(l[1-3])\.json$/.exec(entry.newPath);
      expect(match, entry.newPath).not.toBeNull();
      if (!match) continue;
      expect(RB2_CASES.has(match[1]), entry.newPath).toBe(true);
      expect(RB2_METRICS.has(match[2]), entry.newPath).toBe(true);
      expect(RB2_CODES.has(match[3]), entry.newPath).toBe(true);
    }
  });
});
