import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  percent,
  viscometerBaseline,
  viscometerEinstein,
  viscometerGateRows,
  viscometerGates,
  viscometerInstrument,
  viscometerRungs,
  viscometerTorqueSpecs,
  viscometerValidationRows,
  viscometerValidationSource,
  viscometerViscositySpecs
} from "./numerical-viscometer";

const DIR = resolve(process.cwd(), "public/benchmark-assets/numerical-viscometer");

function readPlot(metric: string, file: string) {
  return JSON.parse(readFileSync(resolve(DIR, "plots", metric, `${file}.json`), "utf-8"));
}

describe("numerical-viscometer instrument", () => {
  it("derives the exact annular-Couette torque from the geometry", () => {
    const { rInner, rOuter, height, mu, omega, torqueExact } = viscometerInstrument;
    const expected = (4 * Math.PI * mu * omega * height) / (rInner ** -2 - rOuter ** -2);
    expect(torqueExact).toBeCloseTo(expected, 10);
    expect(torqueExact).toBeCloseTo(83.7758, 3);
  });

  it("derives the transpose correction from the enclosed hole volume alone", () => {
    const { mu, omega, holeVolume, transposeCorrection } = viscometerInstrument;
    expect(transposeCorrection).toBeCloseTo(2 * mu * omega * holeVolume, 10);
    expect(transposeCorrection).toBeCloseTo(31.416, 3);
  });
});

describe("numerical-viscometer plateau statistics", () => {
  it("carries the two executed rungs of the concentration ladder", () => {
    expect(viscometerRungs.map(rung => rung.run)).toEqual(["baseline", "einstein"]);
    expect(viscometerBaseline.particles).toBe(0);
    expect(viscometerEinstein.particles).toBe(225);
    expect(viscometerEinstein.phi).toBeCloseTo(0.05, 6);
  });

  it("reads the empty instrument within the three-per-cent torque gate", () => {
    expect(viscometerBaseline.torqueDna).toBeCloseTo(84.2296, 3);
    expect(Math.abs(viscometerGates.torque)).toBeLessThan(0.03);
    expect(viscometerGates.torque).toBeCloseTo(0.0054, 4);
    // Machine-steady: the plateau varies by less than a part per million of itself.
    expect(viscometerBaseline.scatter).toBeLessThan(1e-6);
  });

  it("recovers the exact torque from the second estimator once the offset is added", () => {
    expect(viscometerGates.correctedTorque).toBeCloseTo(viscometerInstrument.torqueExact, 2);
    expect(Math.abs(viscometerGates.correctedDeviation)).toBeLessThan(1e-4);
  });

  it("measures the Einstein rung against the composite target, not the naive law", () => {
    expect(viscometerEinstein.eta).toBeCloseTo(1.1062, 4);
    expect(viscometerEinstein.etaPstd).toBeLessThan(1e-3);
    expect(viscometerEinstein.etaComposite).toBe(1.0996);
    expect(viscometerEinstein.etaNaive).toBe(1.125);
    expect(viscometerEinstein.deviationComposite).toBeCloseTo(0.006, 3);
    // The naive dilute value sits further away than the composite, which is the point.
    expect(Math.abs(viscometerEinstein.deviationNaive)).toBeGreaterThan(
      Math.abs(viscometerEinstein.deviationComposite)
    );
  });

  it("confirms the estimator offset depends only on the particle-free hole volume", () => {
    // With 225 spheres in the gap the measured offset still matches to five digits.
    expect(Math.abs(viscometerEinstein.gapDeviation)).toBeLessThan(1e-4);
    // Empty, the offset carries the same discretisation error as the torque itself.
    expect(Math.abs(viscometerBaseline.gapDeviation)).toBeLessThan(0.03);
  });

  it("keeps every published gate row in step with the generated numbers", () => {
    const torqueGate = viscometerGateRows.find(row => row.gate === "Analytic torque");
    expect(torqueGate?.reference).toBe(viscometerInstrument.torqueExact.toFixed(4));
    expect(torqueGate?.measured).toBe(viscometerBaseline.torqueDna.toFixed(4));
    expect(torqueGate?.deviation).toBe(percent(viscometerGates.torque));
    expect(viscometerGateRows).toHaveLength(4);
  });
});

describe("numerical-viscometer plot assets", () => {
  it("puts both runs on one time axis, with the suspension after the baseline", () => {
    const dna = readPlot("torque", "dna");
    expect(dna.mode).toBe("lines");
    expect(dna.x[0]).toBeLessThan(1);
    expect(dna.x[dna.x.length - 1]).toBeCloseTo(250, 0);
    // Monotone time, i.e. the two histories are concatenated and not interleaved.
    for (let i = 1; i < dna.x.length; i += 1) expect(dna.x[i]).toBeGreaterThan(dna.x[i - 1]);
  });

  it("stores the corrected reaction estimator as the reaction estimator plus the offset", () => {
    const res = readPlot("torque", "res");
    const corrected = readPlot("torque", "res-corrected");
    expect(corrected.y).toHaveLength(res.y.length);
    for (let i = 0; i < res.y.length; i += 200) {
      expect(corrected.y[i] - res.y[i]).toBeCloseTo(viscometerInstrument.transposeCorrection, 9);
    }
  });

  it("plots the measured viscosity with its plateau scatter as an error bar", () => {
    const measured = readPlot("viscosity", "measured");
    expect(measured.x).toEqual(viscometerRungs.map(rung => rung.phi));
    expect(measured.y[0]).toBe(1);
    expect(measured.y[1]).toBeCloseTo(viscometerEinstein.eta, 10);
    expect(measured.error_y.array[1]).toBeCloseTo(viscometerEinstein.etaPstd, 10);
  });

  it("draws the naive Einstein reference through unity with slope 5/2", () => {
    const einstein = readPlot("viscosity", "einstein");
    expect(einstein.y[0]).toBe(1);
    const slope = (einstein.y[1] - einstein.y[0]) / (einstein.x[1] - einstein.x[0]);
    expect(slope).toBeCloseTo(2.5, 10);
  });

  it("resolves every series source to a file that exists", () => {
    const specs = [...Object.values(viscometerTorqueSpecs), ...Object.values(viscometerViscositySpecs)];
    for (const spec of specs) {
      for (const group of spec.seriesGroups) {
        const path = group.source!.asset.path.replace(/^.*benchmark-assets\/numerical-viscometer\//, "");
        expect(() => readFileSync(resolve(DIR, path)), group.source!.asset.path).not.toThrow();
      }
    }
  });

  it("carries no resolution axis: the ladder is in concentration, not refinement", () => {
    for (const spec of [...Object.values(viscometerTorqueSpecs), ...Object.values(viscometerViscositySpecs)]) {
      expect(spec.levelAxis, spec.id).toBeUndefined();
    }
  });
});

describe("numerical-viscometer validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(viscometerValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(viscometerValidationRows).toHaveLength(2);
  });

  it("selects only the D5.1 rungs and uses the campaign verdict vocabulary", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    expect(viscometerValidationRows.map(row => row.case)).toEqual([
      "d52_v20_baseline",
      "d52_v21_einstein"
    ]);
    for (const row of viscometerValidationRows) {
      expect(row.suite).toBe("d5_rheology");
      expect(allowed.has(row.verdict), `${row.case}: ${row.verdict}`).toBe(true);
      expect(row.measured.length, row.case).toBeGreaterThan(0);
    }
  });

  it("strips internal scheduler job ids from published prose", () => {
    const blob = JSON.stringify(viscometerValidationRows);
    expect(blob).not.toMatch(/\bjobs?\s+\d/i);
    // The two runs behind this page, by scheduler id. Step counts written as
    // "10000/10000" are content, so the guard names the ids rather than a shape.
    expect(blob).not.toContain("141372");
    expect(blob).not.toContain("141522");
  });
});
