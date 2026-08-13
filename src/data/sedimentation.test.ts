import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  sedimentationDecomposition,
  sedimentationDecompositionSource,
  sedimentationDtLadder,
  sedimentationPlotSpecs,
  sedimentationValidationRows,
  sedimentationValidationSource
} from "./sedimentation";

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

describe("sedimentation validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(sedimentationValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(sedimentationValidationRows.length).toBeGreaterThanOrEqual(15);
  });

  it("uses the campaign verdict vocabulary and strips scheduler job ids", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    for (const row of sedimentationValidationRows) {
      expect(allowed.has(row.verdict), `${row.case}: ${row.verdict}`).toBe(true);
    }
    expect(JSON.stringify(sedimentationValidationRows)).not.toMatch(/\bjobs?\s+\d+/i);
  });

  it("covers the spatial ladder for every case at all three levels", () => {
    const cases = new Set(sedimentationValidationRows.map(row => row.case));
    for (const level of ["l2", "l3", "l4"]) {
      expect(cases.has(`e4_ladder_${level}`), `e4 ${level}`).toBe(true);
    }
    for (const testCase of ["e2", "e3"]) {
      for (const level of ["l2", "l3", "l4"]) {
        expect(cases.has(`${testCase}_${level}`), `${testCase} ${level}`).toBe(true);
      }
    }
  });

  it("withholds the desynchronised timestep rows but publishes their synced replacements", () => {
    const cases = new Set(sedimentationValidationRows.map(row => row.case));

    // First-pass runs: the rigid body integrated at its own stepsize rather than
    // the CFD timestep, so these measured a coupling artifact. Superseded.
    for (const superseded of ["e4_l3_dt0p25", "e4_l3_dt0p5", "e4_l4_dt0p5", "e1_l3_dt0p5", "dt_stability", "dt_order"]) {
      expect(cases.has(superseded), `withheld: ${superseded}`).toBe(false);
    }

    // Their synced replacements, and the rows that found and refuted the defect.
    for (const published of ["pe_stepsize_mismatch", "dt_stability_refuted", "e4_l3_dt_ladder_sync"]) {
      expect(cases.has(published), `published: ${published}`).toBe(true);
    }

    // The published dt numbers come from synced runs only.
    for (const point of sedimentationDtLadder.filter(row => row.dtMs !== 1)) {
      expect(point.synced, `dt=${point.dtMs}ms must be a synced run`).toBe(true);
    }
  });
});

describe("sedimentation timestep ladder and error decomposition", () => {
  it("is parsed from the campaign's own decomposition tool", () => {
    expect(sedimentationDecompositionSource).toBe("scripts/source-data/dns/tencate_error_decomposition.txt");
  });

  it("publishes a descending timestep ladder at the workhorse level", () => {
    expect(sedimentationDtLadder.length).toBeGreaterThanOrEqual(3);
    expect(sedimentationDtLadder.every(row => row.level === "L3")).toBe(true);
    const steps = sedimentationDtLadder.map(row => row.dtMs);
    expect(steps).toEqual([...steps].sort((a, b) => b - a));
    expect(steps).toContain(0.25);
  });

  it("shows a sub-linear temporal response: each halving moves the peak by under one point", () => {
    const errors = sedimentationDtLadder.map(row => row.errorPct);
    for (let i = 1; i < errors.length; i += 1) {
      const increment = errors[i] - errors[i - 1];
      // Positive and shrinking: refining dt walks toward the spatial error.
      expect(increment, `step ${i}`).toBeGreaterThan(0);
      expect(increment, `step ${i}`).toBeLessThan(1);
    }
  });

  it("fits both candidate temporal orders and agrees on the structure", () => {
    const fits = sedimentationDecomposition.E4;
    expect(fits.map(fit => fit.order)).toEqual([1, 2]);
    for (const fit of fits) {
      // Coarse levels overshoot, the finest is converged within uncertainty.
      expect(fit.spatialPp.L2, `p=${fit.order} L2`).toBeGreaterThan(fit.spatialPp.L3);
      expect(fit.spatialPp.L3, `p=${fit.order} L3`).toBeGreaterThan(fit.spatialPp.L4);
      expect(Math.abs(fit.spatialPp.L4), `p=${fit.order} L4 converged`).toBeLessThan(1);
      // The temporal term opposes the coarse spatial terms — hence the cancellation.
      expect(fit.temporalPpAt1ms, `p=${fit.order} temporal`).toBeLessThan(0);
      expect(fit.maxResidualPp, `p=${fit.order} residual`).toBeLessThan(0.5);
    }
  });
});
