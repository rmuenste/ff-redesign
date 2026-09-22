import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fac3Cases, fac3DofRows, fac3PlotSpecs } from "./fac3";
import type { RawTrace } from "../lib/comparison";

function loadTrace(metric: "drag" | "lift"): RawTrace {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `public/benchmark-assets/fac3/plots/${metric}.json`), "utf-8")
  ) as RawTrace;
}

describe("fac3 converted BenchValues plots", () => {
  it("converts drag from BenchValues column 2", () => {
    const drag = loadTrace("drag");
    expect(drag.name).toBe("FeatFloWer");
    expect(drag.x).toHaveLength(1602);
    expect(drag.y).toHaveLength(1602);
    expect(drag.x[0]).toBe(0);
    expect(drag.y[0]).toBe(0);
    expect(drag.x[1]).toBe(0.005);
    expect(drag.y[1]).toBe(0.16005235);
    expect(drag.x.at(-1)).toBe(8.005);
    expect(drag.x.every((value, index) => index === 0 || value > drag.x[index - 1])).toBe(true);
  });

  it("converts lift from BenchValues column 3", () => {
    const lift = loadTrace("lift");
    expect(lift.x).toHaveLength(1602);
    expect(lift.y).toHaveLength(1602);
    expect(lift.y[0]).toBe(0);
    expect(lift.y[1]).toBe(-0.0000047136312);
    expect(lift.y.at(-1)).toBe(-0.0010918115);
  });
});

describe("fac3 plot specs", () => {
  it("defines only drag and lift live metrics", () => {
    expect(Object.keys(fac3PlotSpecs).sort()).toEqual(["drag", "lift"]);
  });

  it("uses a single FeatFloWer reference series without a level axis", () => {
    for (const spec of Object.values(fac3PlotSpecs)) {
      expect(spec.seriesGroups).toHaveLength(1);
      expect(spec.seriesGroups[0].id).toBe("featflower");
      expect(spec.seriesGroups[0].kind).toBe("reference");
      expect(spec.levelAxis).toBeUndefined();
    }
  });

  it("pins documented axis ranges from the Gnuplot reference", () => {
    expect(fac3PlotSpecs.drag.axisRanges).toEqual({ x: [0, 8], y: [-0.5, 3.5] });
    expect(fac3PlotSpecs.lift.axisRanges).toEqual({ x: [0, 8], y: [-0.015, 0.005] });
  });
});

describe("fac3 case definitions", () => {
  it("labels the steady and the unsteady case explicitly", () => {
    expect(fac3Cases.map(c => c.label)).toEqual(["Case 1: steady, Re = 20", "Case 2: unsteady, Re_max = 100"]);
  });

  it("derives each Reynolds number from U_m with the 3D mean of 4/9 U_m", () => {
    const D = 0.1;
    const nu = 1e-3;
    const reynolds = fac3Cases.map(c => (((4 / 9) * parseFloat(c.um)) * D) / nu);
    expect(reynolds[0]).toBeCloseTo(20, 10);
    expect(reynolds[1]).toBeCloseTo(100, 10);
  });
});

describe("fac3 DOF table", () => {
  it("lists each level's cell count on its middle row, eight times the level below", () => {
    const cells = fac3DofRows.filter(row => row.cells !== "").map(row => Number(row.cells));
    expect(cells).toEqual([6144, 49152, 393216, 3145728]);
  });
});
