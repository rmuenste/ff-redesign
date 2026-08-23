import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  dktContactSpecs,
  dktLadderRows,
  dktPlotSpecs,
  dktValidationRows,
  dktValidationSource
} from "./dkt";

const DKT_DIR = resolve(process.cwd(), "public/benchmark-assets/dkt");
const RUNS = ["fric-dh8", "nofric", "axisym"];
const TIME_METRICS = ["tilt", "separation", "velocity-leader", "velocity-trailer"];

function readPlot(metric: string, run: string) {
  return JSON.parse(readFileSync(resolve(DKT_DIR, "plots", metric, `${run}.json`), "utf-8"));
}

describe("dkt converted Plotly data", () => {
  it("emits one file per run for every metric", () => {
    for (const metric of [...TIME_METRICS, "trajectory"]) {
      const files = readdirSync(resolve(DKT_DIR, "plots", metric)).filter(file => file.endsWith(".json"));
      expect(files.sort(), metric).toEqual(RUNS.map(run => `${run}.json`).sort());
    }
  });

  it("stores time-series metrics as a single trace and the trajectory as a trace array", () => {
    for (const metric of TIME_METRICS) {
      expect(Array.isArray(readPlot(metric, "nofric")), metric).toBe(false);
    }
    const trajectory = readPlot("trajectory", "nofric");
    expect(Array.isArray(trajectory)).toBe(true);
    expect(trajectory.map((trace: { name: string }) => trace.name)).toEqual(["Leader", "Trailer"]);
  });

  it("reproduces the published tumbling result in the frictionless tilt trace", () => {
    const tilt = readPlot("tilt", "nofric");
    expect(tilt.mode).toBe("lines");
    // Runs to t = 40 and ends with the pair past horizontal, roles exchanged.
    expect(tilt.x[tilt.x.length - 1]).toBeGreaterThan(39.9);
    expect(tilt.y[tilt.y.length - 1]).toBeCloseTo(109.1, 0);
  });

  it("tumbles under dry friction too, more slowly than without it", () => {
    const fric = readPlot("tilt", "fric-dh8");
    const nofric = readPlot("tilt", "nofric");
    // Both runs end their common window at t = 25, past contact and tilting.
    expect(fric.x[fric.x.length - 1]).toBeCloseTo(25, 0);
    const fricFinal = fric.y[fric.y.length - 1];
    expect(fricFinal).toBeGreaterThan(15);
    const nofricAt25 = nofric.y[nofric.x.findIndex((t: number) => t >= 24.97)];
    expect(nofricAt25).toBeGreaterThan(fricFinal);
  });

  it("draws every contact model on the same mesh, so no run is dashed", () => {
    for (const run of RUNS) {
      expect(readPlot("tilt", run).line.dash, run).toBeUndefined();
    }
  });
});

describe("dkt plot specs", () => {
  it("exposes five metrics with the contact model as the series axis", () => {
    expect(Object.keys(dktPlotSpecs).sort()).toEqual(
      ["separation", "tilt", "trajectory", "velocity-leader", "velocity-trailer"].sort()
    );
    for (const spec of Object.values(dktPlotSpecs)) {
      expect(spec.seriesSelectorLabel).toBe("Contact model");
      expect(spec.seriesGroups.map(group => group.id)).toEqual(["fric", "nofric", "axisym"]);
      // The axisymmetric run is a control, off by default.
      expect(spec.defaultSeriesGroupIds).toEqual(["fric", "nofric"]);
    }
  });

  it("carries no resolution axis, because every published run is at D/h = 8", () => {
    for (const spec of Object.values(dktPlotSpecs)) {
      expect(spec.levelAxis).toBeUndefined();
      for (const group of spec.seriesGroups) {
        expect(group.levelSources, group.id).toBeUndefined();
        expect(group.source, group.id).toBeDefined();
      }
    }
  });

  it("narrows the contact-model panel to the friction comparison", () => {
    expect(Object.keys(dktContactSpecs).sort()).toEqual(["tilt", "trajectory"]);
    for (const spec of Object.values(dktContactSpecs)) {
      expect(spec.seriesGroups.map(group => group.id)).toEqual(["fric", "nofric"]);
    }
  });

  it("resolves every series source to a file that exists", () => {
    const specs = [...Object.values(dktPlotSpecs), ...Object.values(dktContactSpecs)];
    for (const spec of specs) {
      for (const group of spec.seriesGroups) {
        const sources = group.levelSources ? Object.values(group.levelSources) : [group.source!];
        for (const source of sources) {
          const relative = source.asset.path.replace(/^.*benchmark-assets\/dkt\//, "");
          expect(() => readFileSync(resolve(DKT_DIR, relative)), source.asset.path).not.toThrow();
        }
      }
    }
  });
});

describe("dkt validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(dktValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(dktValidationRows.length).toBeGreaterThanOrEqual(6);
  });

  it("selects only DKT cases and uses the campaign verdict vocabulary", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    for (const row of dktValidationRows) {
      expect(row.case.toLowerCase().startsWith("dkt"), row.case).toBe(true);
      expect(allowed.has(row.verdict), `${row.case}: ${row.verdict}`).toBe(true);
      expect(row.quantity.length, row.case).toBeGreaterThan(0);
      expect(row.measured.length, row.case).toBeGreaterThan(0);
    }
  });

  it("carries the corrected kissing time through the audit row that produced it", () => {
    const audit = dktValidationRows.find(row => row.case === "dkt_tkiss_correction");
    expect(audit?.verdict).toBe("RESOLVED");
    expect(audit?.measured).toContain("18.04");
    expect(audit?.measured).toContain("18.34");
  });

  it("withholds the contact rows that later measurement superseded", () => {
    const cases = dktValidationRows.map(row => row.case);
    for (const superseded of ["dkt_offset", "dkt16_offset", "dkt_nofric"]) {
      expect(cases, superseded).not.toContain(superseded);
    }
    // The complete frictionless sequence is the published post-contact result.
    expect(cases).toContain("dkt_nofric_long");
  });

  it("strips internal scheduler job ids from published prose", () => {
    const blob = JSON.stringify(dktValidationRows);
    expect(blob).not.toMatch(/\bjobs?\s+\d+/i);
  });
});

describe("dkt case definition", () => {
  it("publishes trajectories on the first rung and marks the other two", () => {
    expect(dktLadderRows.map(row => row.status)).toEqual(["published", "pre-contact check", "future"]);
    expect(dktLadderRows.map(row => row.ratio)).toEqual(["8", "16", "32"]);
  });
});
