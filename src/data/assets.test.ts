import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AssetManifest } from "./types";

const RB3_DIR = resolve(process.cwd(), "public/benchmark-assets/rb3");
const CANONICAL_METRICS = new Set(["sphericity", "mass", "size", "surface"]);

const manifest = JSON.parse(readFileSync(resolve(RB3_DIR, "manifest.json"), "utf-8")) as AssetManifest;

function listPlotFiles(): string[] {
  const plotsDir = resolve(RB3_DIR, "plots");
  return readdirSync(plotsDir, { withFileTypes: true }).flatMap(metricDir =>
    metricDir.isDirectory()
      ? readdirSync(resolve(plotsDir, metricDir.name)).map(file => `plots/${metricDir.name}/${file}`)
      : []
  );
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
