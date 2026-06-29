import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sedimentationPlotSpecs } from "./sedimentation";

const SEDIMENTATION_DIR = resolve(process.cwd(), "public/benchmark-assets/sedimentation");

function readTrace(metric: "velocity" | "position", file: string) {
  return JSON.parse(readFileSync(resolve(SEDIMENTATION_DIR, "plots", metric, file), "utf-8"));
}

function parseFirstPair(path: string) {
  const firstLine = readFileSync(path, "utf-8").trim().split(/\r?\n/)[0];
  return firstLine.split(/\s+/).map(Number) as [number, number];
}

describe("sedimentation converted Plotly data", () => {
  it("creates 12 plot JSON files per metric", () => {
    expect(readdirSync(resolve(SEDIMENTATION_DIR, "plots/velocity")).filter(file => file.endsWith(".json"))).toHaveLength(12);
    expect(readdirSync(resolve(SEDIMENTATION_DIR, "plots/position")).filter(file => file.endsWith(".json"))).toHaveLength(12);
  });

  it("converts simulation velocity without transforming values", () => {
    const trace = readTrace("velocity", "E1-l2.json");
    expect(trace.x[0]).toBe(0);
    expect(trace.y[0]).toBe(-0.00131344);
    expect(trace.mode).toBe("lines");
  });

  it("normalizes simulation position values", () => {
    const trace = readTrace("position", "E1-l2.json");
    expect(trace.y[0]).toBeCloseTo((0.127499 - 0.0075) / 0.015);
  });

  it("preserves PIV velocity and position reference values", () => {
    const [vX, vY] = parseFirstPair(resolve(process.cwd(), "scripts/source-data/sedimentation/ref_E1.dat"));
    const [pX, pY] = parseFirstPair(resolve(process.cwd(), "scripts/source-data/sedimentation/case_E1_h.csv"));
    const velocity = readTrace("velocity", "E1-piv.json");
    const position = readTrace("position", "E1-piv.json");
    expect(velocity.x[0]).toBe(vX);
    expect(velocity.y[0]).toBe(vY);
    expect(position.x[0]).toBe(pX);
    expect(position.y[0]).toBe(pY);
  });

  it("uses the Python-script marker mapping for PIV and line traces for simulations", () => {
    const expectedSymbols = {
      E1: "square-open",
      E2: "circle-open",
      E3: "triangle-up-open",
      E4: "diamond-open"
    };
    for (const [caseId, symbol] of Object.entries(expectedSymbols)) {
      expect(readTrace("velocity", `${caseId}-piv.json`).marker.symbol).toBe(symbol);
      expect(readTrace("position", `${caseId}-piv.json`).marker.symbol).toBe(symbol);
    }
    const sim = readTrace("velocity", "E1-l3.json");
    expect(readTrace("velocity", "E1-piv.json").mode).toBe("markers");
    expect(sim.mode).toBe("lines");
    expect(sim.line.dash).toBe("dot");
  });
});

describe("sedimentation plot specs", () => {
  it("exposes velocity and position specs with eight groups each", () => {
    expect(Object.keys(sedimentationPlotSpecs).sort()).toEqual(["position", "velocity"]);
    for (const spec of Object.values(sedimentationPlotSpecs)) {
      expect(spec.seriesGroups).toHaveLength(8);
      expect(spec.seriesGroups.filter(group => group.kind === "code")).toHaveLength(4);
      expect(spec.seriesGroups.filter(group => group.kind === "reference")).toHaveLength(4);
      expect(spec.levelAxis?.defaultLevelId).toBe("l2");
      expect(spec.seriesSelectorLabel).toBe("Cases & references");
    }
  });

  it("keeps L3 simulation sources dotted and PIV references level-independent", () => {
    const velocity = sedimentationPlotSpecs.velocity;
    const sim = velocity.seriesGroups.find(group => group.id === "e1");
    const piv = velocity.seriesGroups.find(group => group.id === "e1-piv");
    expect(sim?.levelSources?.l3.dash).toBe("dot");
    expect(sim?.levelSources?.l2.asset.path).toContain("E1-l2.json");
    expect(piv?.source?.asset.path).toContain("E1-piv.json");
    expect(piv?.markerSymbol).toBe("square-open");
    expect(piv?.levelSources).toBeUndefined();
  });
});
