import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  percent,
  viscometerBaseline,
  viscometerEinstein,
  viscometerGateRows,
  viscometerGatedLadder,
  viscometerGates,
  viscometerInstrument,
  viscometerLoadedRungs,
  viscometerPairDecay,
  viscometerPairs,
  viscometerPairsSpecs,
  viscometerPhi10,
  viscometerPhi20,
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
  it("carries the whole ladder plus both lubrication twins", () => {
    expect(viscometerRungs.map(rung => rung.run)).toEqual([
      "baseline",
      "einstein",
      "phi10",
      "phi20",
      "phi10_lub",
      "phi20_lub"
    ]);
    expect(viscometerBaseline.particles).toBe(0);
    expect(viscometerGatedLadder.map(rung => rung.phi)).toEqual([0.05, 0.1, 0.2]);
    expect(viscometerGatedLadder.map(rung => rung.particles)).toEqual([225, 450, 900]);
    // Concentration rises with sphere count at fixed cell volume, as it must.
    expect(viscometerLoadedRungs).toHaveLength(5);
  });

  it("lands every rung on the closure that governs its concentration", () => {
    expect(viscometerGatedLadder.map(rung => rung.closure)).toEqual([
      "einstein",
      "batchelor",
      "krieger-dougherty"
    ]);
    expect(viscometerEinstein.eta).toBeCloseTo(1.1062, 4);
    expect(viscometerPhi10.eta).toBeCloseTo(1.2454, 4);
    expect(viscometerPhi20.eta).toBeCloseTo(1.7143, 4);
    for (const rung of viscometerGatedLadder) {
      expect(Math.abs(rung.deviationComposite), `phi = ${rung.phi}`).toBeLessThan(0.01);
    }
  });

  it("outgrows each closure in turn, by a margin the instrument resolves", () => {
    // The superseded closure is exceeded from above at the next rung up.
    const outgrown = viscometerGatedLadder.flatMap(rung =>
      rung.composites.filter(entry => !entry.gate).map(entry => ({ ...entry, phi: rung.phi }))
    );
    expect(outgrown.map(entry => `${entry.phi}:${entry.closure}`)).toEqual([
      "0.1:einstein",
      "0.2:batchelor"
    ]);
    for (const entry of outgrown) {
      expect(entry.deviation, `${entry.phi} ${entry.closure}`).toBeGreaterThan(0.04);
    }
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
    // Five digits on every loaded rung, however crowded the gap and whether or not
    // the lubrication model is running.
    for (const rung of viscometerLoadedRungs) {
      expect(Math.abs(rung.gapDeviation), rung.run).toBeLessThan(1e-4);
    }
    // Empty, the offset carries the same discretisation error as the torque itself.
    expect(Math.abs(viscometerBaseline.gapDeviation)).toBeLessThan(0.03);
  });

  it("attributes the lubrication contribution to single-variable twins", () => {
    expect(viscometerPairs.map(pair => pair.phi)).toEqual([0.1, 0.2]);
    for (const pair of viscometerPairs) {
      // Same cloud, same deck, same binary: only the model switch differs.
      expect(pair.etaWith).toBeGreaterThan(pair.etaWithout);
      expect(pair.saturatedPairs).toBeLessThan(pair.activePairs);
      expect(pair.samples).toBeGreaterThan(1000);
    }
    expect(viscometerPairs[0].delta).toBeCloseTo(0.0075, 4);
    expect(viscometerPairs[1].delta).toBeCloseTo(0.0271, 4);
    expect(Math.round(viscometerPairs[0].activePairs)).toBe(302);
    expect(Math.round(viscometerPairs[1].activePairs)).toBe(1065);
  });

  it("decays the lubrication contribution with the near-contact film count", () => {
    // The headline: the correction tracks how often two surfaces are close,
    // rather than acting everywhere like a numerical offset would.
    expect(viscometerPairDecay.eta).toBeCloseTo(3.6, 1);
    expect(viscometerPairDecay.pairs).toBeCloseTo(3.5, 1);
    expect(Math.abs(viscometerPairDecay.eta - viscometerPairDecay.pairs)).toBeLessThan(0.5);
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

  it("plots the measured ladder with its plateau scatter as an error bar", () => {
    const measured = readPlot("viscosity", "measured");
    expect(measured.x).toEqual([0, 0.05, 0.1, 0.2]);
    expect(measured.y[0]).toBe(1);
    expect(measured.y[1]).toBeCloseTo(viscometerEinstein.eta, 10);
    expect(measured.error_y.array[1]).toBeCloseTo(viscometerEinstein.etaPstd, 10);
    // The lubricated twins are a separate series at the two densest rungs.
    const lubricated = readPlot("viscosity", "lubricated");
    expect(lubricated.x).toEqual([0.1, 0.2]);
    expect(lubricated.y[1]).toBeCloseTo(viscometerPairs[1].etaWith, 10);
  });

  it("draws every closure through unity and orders them by concentration term", () => {
    const [einstein, batchelor, kd] = ["einstein", "batchelor", "krieger-dougherty"].map(id =>
      readPlot("viscosity", id)
    );
    for (const curve of [einstein, batchelor, kd]) expect(curve.y[0]).toBe(1);
    // Higher-order closures rise faster; at the top of the ladder they separate.
    const last = einstein.y.length - 1;
    expect(batchelor.y[last]).toBeGreaterThan(einstein.y[last]);
    expect(kd.y[last]).toBeGreaterThan(batchelor.y[last]);
  });

  it("stores the film counts the lubrication result is attributed to", () => {
    for (const stem of ["phi10", "phi20"]) {
      const active = readPlot("pairs", `${stem}-active`);
      const saturated = readPlot("pairs", `${stem}-saturated`);
      expect(active.x.length).toBe(saturated.x.length);
      for (let i = 0; i < active.y.length; i += 1) {
        expect(saturated.y[i]).toBeLessThanOrEqual(active.y[i]);
      }
    }
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
    // The pairs panel selects by concentration, so its sources hang off the level axis.
    for (const spec of Object.values(viscometerPairsSpecs)) {
      for (const group of spec.seriesGroups) {
        for (const source of Object.values(group.levelSources!)) {
          const path = source.asset.path.replace(/^.*benchmark-assets\/numerical-viscometer\//, "");
          expect(() => readFileSync(resolve(DIR, path)), source.asset.path).not.toThrow();
        }
      }
    }
  });

  it("carries no resolution axis: the ladders are in concentration, not refinement", () => {
    for (const spec of [...Object.values(viscometerTorqueSpecs), ...Object.values(viscometerViscositySpecs)]) {
      expect(spec.levelAxis, spec.id).toBeUndefined();
    }
    for (const spec of Object.values(viscometerPairsSpecs)) {
      expect(spec.levelAxis?.options.map(option => option.id), spec.id).toEqual(["phi10", "phi20"]);
    }
  });
});

describe("numerical-viscometer validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(viscometerValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(viscometerValidationRows).toHaveLength(6);
  });

  it("selects only the D5.1 rungs and uses the campaign verdict vocabulary", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    expect(viscometerValidationRows.map(row => row.case)).toEqual([
      "d52_v20_baseline",
      "d52_v21_einstein",
      "d52_v22_phi10",
      "d52_v23_phi20",
      "d52_v22L_settled",
      "d52_v23L_settled"
    ]);
    // The first-segment pair readings are superseded by the settled rows and are
    // published only inside the downloadable datasheet.
    expect(viscometerValidationRows.map(row => row.case)).not.toContain("d52_v22L_lubpair");
    expect(viscometerValidationRows.map(row => row.case)).not.toContain("d52_v23L_lubpair");
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
    expect(blob).not.toMatch(/\b1[34]\d{4}\b/);
  });
});
