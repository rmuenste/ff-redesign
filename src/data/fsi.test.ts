import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RawTrace } from "../lib/comparison";
import {
  fsiCsm3Rows,
  fsiFsi2Rows,
  fsiFsi3Rows,
  fsiGenerated,
  fsiGeometryRows,
  fsiMeshRows,
  fsiTestCases,
  type FsiPeriodicRow
} from "./fsi";

// scripts/convert-fsi-data.mjs evaluates every published reference file the way
// the legacy "Quantities for Comparison" page defines it (max and min over the
// last full period). These tests hold that evaluation to the published tables,
// so the downloads, the plots and the tables cannot drift apart.

type Stats = { mean: number; amplitude: number; frequency: number };

/** "mean ± amplitude [frequency]" as printed in the legacy tables. */
function parse(cell: string | undefined): Stats {
  const match = /^(\S+) ± (\S+) \[(\S+)\]$/.exec(cell ?? "");
  if (!match) throw new Error(`unparseable cell: ${cell}`);
  return { mean: Number(match[1]), amplitude: Number(match[2]), frequency: Number(match[3]) };
}

function row(rows: FsiPeriodicRow[], dt: string, level: string) {
  const found = rows.find(r => r.dt === dt && r.level === level);
  if (!found) throw new Error(`no row for dt ${dt}, level ${level}`);
  return found;
}

/**
 * Amplitude and frequency to a relative tolerance; the mean to a fraction of the
 * amplitude, because a mean near zero (u_y, lift) has no meaningful relative error.
 * The default mean tolerance covers the published rounding: FSI3 prints its drag
 * mean with four digits (460.2), which is 0.4% of its amplitude.
 */
function expectClose(actual: Stats, published: Stats, { amplitude = 0.005, frequency = 0.005, mean = 0.005 } = {}) {
  expect(Math.abs(actual.amplitude - published.amplitude) / published.amplitude).toBeLessThan(amplitude);
  expect(Math.abs(actual.frequency - published.frequency) / published.frequency).toBeLessThan(frequency);
  expect(Math.abs(actual.mean - published.mean) / published.amplitude).toBeLessThan(mean);
}

const QUANTITIES = ["ux", "uy", "drag", "lift"] as const;

describe("FSI2 reference file", () => {
  const run = fsiGenerated.runs.fsi2;

  it("is the level 4 run at the time step it records", () => {
    expect(run.file).toBe("ref_fsi2.point");
    expect(run.timeStep).toBe(0.0005);
    expect(run.span).toEqual([10, 14.6195]);
  });

  it("reproduces the published level 4, dt 0.0005 row over its last period", () => {
    const published = row(fsiFsi2Rows, "0.0005", "4+0");
    for (const key of QUANTITIES) expectClose(run[key], parse(published[key]));
  });

  it("oscillates in-line (u_x, drag) at twice the frequency of the cross-flow motion", () => {
    expect(run.ux.frequency).toBeCloseTo(2 * run.uy.frequency, 6);
    expect(run.lift.frequency).toBeCloseTo(1.931, 3);
  });
});

describe("FSI3 reference file", () => {
  const run = fsiGenerated.runs.fsi3;

  it("records a time step of 0.00025", () => {
    expect(run.file).toBe("ref_fsi3.point");
    expect(run.timeStep).toBe(0.00025);
    expect(run.span).toEqual([5, 6.442]);
  });

  it("reproduces the published level 4, dt 0.0005 row over its last period", () => {
    const published = row(fsiFsi3Rows, "0.0005", "4+0");
    for (const key of QUANTITIES) expectClose(run[key], parse(published[key]));
  });

  // The file says dt = 0.00025, but its drag amplitude sits with the dt = 0.0005
  // row (27.47) and not the dt = 0.00025 row (27.74). The page says so; this pins it.
  it("matches the dt 0.0005 row more closely than the dt 0.00025 row it is labelled with", () => {
    const labelled = parse(row(fsiFsi3Rows, "0.00025", "4+0").drag);
    const matched = parse(row(fsiFsi3Rows, "0.0005", "4+0").drag);
    expect(Math.abs(run.drag.amplitude - matched.amplitude)).toBeLessThan(Math.abs(run.drag.amplitude - labelled.amplitude) / 4);
  });
});

describe("CSM3 reference files", () => {
  const steps: Record<string, string> = { dt0p02: "0.02", dt0p01: "0.01", dt0p005: "0.005" };

  it("reproduce every published level and time step", () => {
    const runs = Object.entries(fsiGenerated.runs.csm3);
    expect(runs).toHaveLength(9);
    for (const [key, run] of runs) {
      const [level, step] = key.split("-");
      const published = row(fsiCsm3Rows, steps[step], `${level.slice(1)}+0`);
      // The table prints displacements in 1e-3 m; one frequency serves both columns.
      for (const axis of ["ux", "uy"] as const) {
        const scaled = { mean: run[axis].mean * 1e3, amplitude: run[axis].amplitude * 1e3, frequency: run[axis].frequency };
        expectClose(scaled, parse(published[axis]), { amplitude: 0.003, frequency: 0.01, mean: 0.003 });
      }
    }
  });
});

describe("FSI plots", () => {
  function trace(path: string): RawTrace {
    return JSON.parse(readFileSync(resolve(process.cwd(), "public/benchmark-assets/fsi", path), "utf-8")) as RawTrace;
  }

  it("plot displacements in mm and the summed body forces in N", () => {
    const uy = trace("plots/fsi2/uy.json");
    const drag = trace("plots/fsi2/drag.json");
    const run = fsiGenerated.runs.fsi2;
    const max = (values: number[]) => Math.max(...values);
    expect(max(uy.y) / 1e3).toBeCloseTo(run.uy.mean + run.uy.amplitude, 2);
    expect(max(drag.y)).toBeCloseTo(run.drag.mean + run.drag.amplitude, -1);
    expect(uy.x[0]).toBe(10);
  });
});

describe("FSI definition tables", () => {
  it("places B at the upstream end of the cylinder, as the legacy text and figure do", () => {
    expect(fsiGeometryRows.find(r => r.symbol === "B")?.value).toBe("(0.15, 0.2)");
  });

  it("lists nine tests with the published Reynolds numbers", () => {
    expect(fsiTestCases.map(c => `${c.id}:${c.reynolds}`)).toEqual([
      "CFD1:20",
      "CFD2:100",
      "CFD3:200",
      "CSM1:0",
      "CSM2:0",
      "CSM3:0",
      "FSI1:20",
      "FSI2:100",
      "FSI3:200"
    ]);
  });

  it("refines the FSI mesh fourfold per level", () => {
    for (let i = 1; i < fsiMeshRows.length; i++) expect(fsiMeshRows[i].nel).toBe(4 * fsiMeshRows[i - 1].nel);
  });
});
