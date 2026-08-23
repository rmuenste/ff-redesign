import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  hinderedConfinedRows,
  hinderedConfinementSpecs,
  hinderedFit,
  hinderedPlotSpecs,
  hinderedReynoldsRange,
  hinderedRoweBand,
  hinderedTerminalByColumn,
  hinderedValidationRows,
  hinderedValidationSource,
  hinderedWideRows,
  hinderedWideSlope,
  swarmReynolds
} from "./hindered-settling";

const DIR = resolve(process.cwd(), "public/benchmark-assets/hindered-settling");

function readPlot(metric: string, file: string) {
  return JSON.parse(readFileSync(resolve(DIR, "plots", metric, `${file}.json`), "utf-8"));
}

describe("hindered-settling converted data", () => {
  it("carries the whole ladder: four cloud sizes, three seeds each", () => {
    expect(hinderedConfinedRows).toHaveLength(12);
    for (const n of [20, 40, 80, 120]) {
      expect(hinderedConfinedRows.filter(row => row.n === n), `N = ${n}`).toHaveLength(3);
    }
    expect(hinderedWideRows).toHaveLength(6);
  });

  it("settles hindered in the walled column and enhanced in the wide one", () => {
    for (const row of hinderedConfinedRows) {
      expect(row.uOverUt, `confined N=${row.n} s${row.seed}`).toBeLessThan(1);
    }
    for (const row of hinderedWideRows) {
      expect(row.uOverUt, `wide N=${row.n} s${row.seed}`).toBeGreaterThan(1);
    }
  });

  it("grows the enhancement with cloud size in the wide column", () => {
    const mean = (n: number) => {
      const rows = hinderedWideRows.filter(row => row.n === n);
      return rows.reduce((sum, row) => sum + row.uOverUt, 0) / rows.length;
    };
    expect(mean(120)).toBeGreaterThan(mean(40));
  });

  it("reproduces the campaign's power-law fit", () => {
    // Through-origin Richardson-Zaki exponent over all twelve runs.
    expect(hinderedFit.count).toBe(12);
    expect(hinderedFit.n).toBeCloseTo(4.57, 2);
    expect(hinderedFit.rms).toBeLessThan(0.03);
    // Far above the unbounded band, which is the result.
    expect(hinderedFit.n).toBeGreaterThan(hinderedRoweBand[1]);
  });

  it("returns a negative exponent for the finite cloud in the wide vessel", () => {
    expect(hinderedWideSlope.n).toBeLessThan(0);
    expect(hinderedWideSlope.rungs.map(rung => rung.n)).toEqual([40, 120]);
  });

  it("finds no measurable wall retardation of a single particle", () => {
    const confined = hinderedTerminalByColumn["6d"];
    const wide = hinderedTerminalByColumn.wide;
    expect(Math.abs(confined.ut - wide.ut)).toBeLessThan(wide.utStd!);
  });

  it("puts the swarm Reynolds numbers in the recorded 51-77 range", () => {
    expect(Math.round(hinderedReynoldsRange.min)).toBe(51);
    expect(Math.round(hinderedReynoldsRange.max)).toBe(77);
    // The densest rung is the slowest, so the range runs downward with cloud size.
    expect(swarmReynolds(hinderedConfinedRows[0].u)).toBeGreaterThan(hinderedReynoldsRange.min);
  });
});

describe("hindered-settling plot assets", () => {
  it("stores the collapse in the coordinates the exponent is fitted in", () => {
    for (const n of [20, 40, 80, 120]) {
      const trace = readPlot("collapse", `n${n}`);
      expect(trace.mode).toBe("markers");
      expect(trace.x).toHaveLength(3);
      // ln(1 - phi) < 0 and ln(U/u_t) < 0: hindered, in log coordinates.
      for (const x of trace.x) expect(x).toBeLessThan(0);
      for (const y of trace.y) expect(y).toBeLessThan(0);
    }
  });

  it("draws the fit and the unbounded band as lines through the origin", () => {
    const fit = readPlot("collapse", "fit");
    expect(fit.x[1]).toBe(0);
    expect(fit.y[1]).toBe(0);
    const rowe = readPlot("collapse", "rowe");
    expect(rowe.map((trace: { name: string }) => trace.name)).toEqual(["n = 2.7", "n = 3.0"]);
  });

  it("keeps the 6d column as trace 0 of every settling-history file", () => {
    for (const n of [20, 40, 80, 120]) {
      const traces = readPlot("history", `n${n}`);
      expect(traces[0].name, `N = ${n}`).toBe("6d column");
    }
    // Only the two sizes that were also run wide carry a second column.
    expect(readPlot("history", "n20")).toHaveLength(1);
    expect(readPlot("history", "n40")).toHaveLength(2);
    expect(readPlot("history", "n80")).toHaveLength(1);
    expect(readPlot("history", "n120")).toHaveLength(2);
  });

  it("resolves every series source to a file that exists", () => {
    const specs = [...Object.values(hinderedPlotSpecs), ...Object.values(hinderedConfinementSpecs)];
    for (const spec of specs) {
      for (const group of spec.seriesGroups) {
        const path = group.source!.asset.path.replace(/^.*benchmark-assets\/hindered-settling\//, "");
        expect(() => readFileSync(resolve(DIR, path)), group.source!.asset.path).not.toThrow();
      }
    }
  });

  it("carries no resolution axis: the ladder is in cloud size, not refinement", () => {
    for (const spec of [...Object.values(hinderedPlotSpecs), ...Object.values(hinderedConfinementSpecs)]) {
      expect(spec.levelAxis, spec.id).toBeUndefined();
    }
  });
});

describe("hindered-settling validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(hinderedValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(hinderedValidationRows.length).toBeGreaterThanOrEqual(3);
  });

  it("selects only D3.2 cases and uses the campaign verdict vocabulary", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    for (const row of hinderedValidationRows) {
      expect(row.case.startsWith("d32_"), row.case).toBe(true);
      expect(allowed.has(row.verdict), `${row.case}: ${row.verdict}`).toBe(true);
      expect(row.measured.length, row.case).toBeGreaterThan(0);
    }
  });

  it("publishes the closure rows and withholds the pathfinder and the design row", () => {
    const cases = hinderedValidationRows.map(row => row.case);
    expect(cases).toContain("d32_phi_ladder");
    expect(cases).toContain("d32_wide_attribution");
    expect(cases).toContain("d32_ut_ref");
    expect(cases).not.toContain("d32_n40_smoke");
    expect(cases).not.toContain("d32_wide_design");
  });

  it("strips internal scheduler job ids from published prose", () => {
    const blob = JSON.stringify(hinderedValidationRows);
    expect(blob).not.toMatch(/\bjobs?\s+\d/i);
    // Partial ids left behind by a naive strip are just as internal.
    expect(blob).not.toMatch(/\b\d{5,7}\s*[-+/]\s*\d/);
  });
});
