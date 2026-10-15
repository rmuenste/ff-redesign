import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  availableSeriesGroups,
  buildComparisonTraces,
  deriveTraceVariants,
  expandSource,
  type LoadedGroup
} from "../lib/comparison";
import generatedFeat3 from "./generated/sedimentation-feat3.json";
import generatedRuns from "./generated/sedimentation-runs.json";
import {
  buildSedimentationLevelPlotSpecs,
  buildSedimentationPlotSpecs,
  sedimentationBrennerBands,
  sedimentationCodes,
  sedimentationDecomposition,
  sedimentationDecompositionSource,
  sedimentationDownloads,
  sedimentationDtLadder,
  sedimentationFeat3Runs,
  sedimentationHasRun,
  sedimentationLevelPlotSpecs,
  sedimentationLevels,
  sedimentationLubricationCases,
  sedimentationLubricationRows,
  sedimentationLubricationSpecs,
  sedimentationPlotSpecs,
  sedimentationRuns,
  sedimentationValidationRows,
  sedimentationValidationSource
} from "./sedimentation";
import type { PlotSpec } from "./types";

const SEDIMENTATION_DIR = resolve(process.cwd(), "public/benchmark-assets/sedimentation");

function readTrace(metric: "velocity" | "position", file: string) {
  return JSON.parse(readFileSync(resolve(SEDIMENTATION_DIR, "plots", metric, file), "utf-8"));
}

function parseFirstPair(path: string) {
  const firstLine = readFileSync(path, "utf-8").trim().split(/\r?\n/)[0];
  return firstLine.split(/\s+/).map(Number) as [number, number];
}

const CAMPAIGN_DIR = resolve(process.cwd(), "scripts/source-data/sedimentation/campaign");
const CASES = ["E1", "E2", "E3", "E4"] as const;
const LEVELS = ["l2", "l3", "l4"] as const;
const levelTag = (level: string) => level.toUpperCase();

/** Pairs of the ladder that have not been exported. None since E1 at L2 landed. */
const missingKeys = new Set(
  (generatedRuns.missing as Array<{ case: string; level: string }>).map(entry => `${entry.case}-${entry.level}`)
);

describe("sedimentation campaign series", () => {
  it("publishes every exported case/level pair and lists the rest as missing", () => {
    expect(generatedRuns.source).toBe("scripts/source-data/sedimentation/campaign/campaign_runs.csv");
    expect(generatedRuns.levels).toEqual([...LEVELS]);
    for (const caseId of CASES) {
      for (const level of LEVELS) {
        const key = `${caseId}-${level}`;
        const exported = existsSync(resolve(CAMPAIGN_DIR, `vel${caseId}_${levelTag(level)}.txt`));
        expect(sedimentationHasRun(caseId, level), key).toBe(exported);
        expect(missingKeys.has(key), key).toBe(!exported);
      }
    }
    expect(sedimentationRuns.length + missingKeys.size).toBe(CASES.length * LEVELS.length);
  });

  it("has the full ladder: all four cases at L2, L3 and L4", () => {
    for (const caseId of CASES) {
      for (const level of LEVELS) expect(sedimentationHasRun(caseId, level), `${caseId} ${level}`).toBe(true);
    }
    expect(sedimentationRuns).toHaveLength(12);
    expect(missingKeys.size).toBe(0);
  });

  it("writes one trace per published run plus the PIV reference, and nothing for an absent pair", () => {
    for (const metric of ["velocity", "position"] as const) {
      // FeatFloWer's own curves; the feat3-*.json files beside them are the FEAT3 converter's.
      const files = readdirSync(resolve(SEDIMENTATION_DIR, "plots", metric)).filter(
        file => file.endsWith(".json") && !file.startsWith("feat3-")
      );
      expect(files.sort()).toEqual(
        [...sedimentationRuns.map(run => `${run.case}-${run.level}.json`), ...CASES.map(caseId => `${caseId}-piv.json`)].sort()
      );
      for (const key of missingKeys) expect(files).not.toContain(`${key}.json`);
    }
  });

  it("converts simulation velocity without transforming values", () => {
    const [x, y] = parseFirstPair(resolve(CAMPAIGN_DIR, "velE4_L4.txt"));
    const trace = readTrace("velocity", "E4-l4.json");
    expect(trace.x[0]).toBe(x);
    expect(trace.y[0]).toBe(y);
    expect(trace.mode).toBe("lines");
  });

  it("normalizes the sphere-centre height to the gap in diameters, starting at eight", () => {
    for (const run of sedimentationRuns) {
      const raw = parseFirstPair(resolve(CAMPAIGN_DIR, `pos${run.case}_${levelTag(run.level)}.txt`))[1];
      const trace = readTrace("position", `${run.case}-${run.level}.json`);
      expect(trace.y[0], `${run.case} ${run.level}`).toBeCloseTo((raw - 0.0075) / 0.015, 9);
      expect(trace.y[0], `${run.case} ${run.level}`).toBeCloseTo(8, 9);
    }
  });

  it("agrees with the run summary: one point per step, ending at t_end, peaking where it says", () => {
    for (const run of sedimentationRuns) {
      const velocity = readTrace("velocity", `${run.case}-${run.level}.json`);
      const position = readTrace("position", `${run.case}-${run.level}.json`);
      const label = `${run.case} ${run.level}`;
      expect(velocity.x, label).toHaveLength(run.steps);
      expect(position.x, label).toHaveLength(run.steps);
      expect(velocity.x.at(-1), label).toBeCloseTo(run.tEndS, 9);
      const peak = Math.min(...velocity.y);
      expect(peak, label).toBeCloseTo(run.peakVzMS, 6);
      expect(velocity.x[velocity.y.indexOf(peak)], label).toBeCloseTo(run.tPeakS, 9);
    }
  });

  it("refines toward a limit: each refinement moves the peak less than the one before", () => {
    // What the Results caption says; checked for every case with the full ladder.
    for (const caseId of CASES) {
      const peaks = LEVELS.map(level => sedimentationRuns.find(run => run.case === caseId && run.level === level)?.peakVzMS);
      if (peaks.some(peak => peak === undefined)) continue;
      const [l2, l3, l4] = peaks as number[];
      expect(Math.abs(l4 - l3), caseId).toBeLessThan(Math.abs(l3 - l2));
    }
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

  it("uses the Python-script marker mapping for PIV and a solid line for FeatFloWer", () => {
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
    expect(readTrace("velocity", "E1-piv.json").mode).toBe("markers");
    // The line style is the code: every FeatFloWer curve is solid.
    for (const run of sedimentationRuns) {
      const sim = readTrace("velocity", `${run.case}-${run.level}.json`);
      expect(sim.mode).toBe("lines");
      expect(sim.line.dash, `${run.case} ${run.level}`).toBe("solid");
    }
  });
});

describe("sedimentation plot specs", () => {
  const withoutE1L2 = {
    featflower: sedimentationRuns.filter(run => !(run.case === "E1" && run.level === "l2")),
    feat3: sedimentationFeat3Runs
  };

  const assetExists = (path: string) =>
    existsSync(resolve(SEDIMENTATION_DIR, path.replace(/^.*benchmark-assets\/sedimentation\//, "")));

  it("shares the site's refinement vocabulary: L2-L4, coarse to fine, petrol/orange/green", () => {
    expect(sedimentationLevels.map(level => level.label)).toEqual(["L2", "L3", "L4"]);
    expect(sedimentationLevels.map(level => level.color)).toEqual([
      "var(--tu-petrol-400)",
      "var(--tu-orange-500)",
      "var(--tu-green-400)"
    ]);
  });

  it("encodes the code as line style: FeatFloWer solid, FEAT3 dashed", () => {
    expect(sedimentationCodes.map(code => [code.label, code.dash])).toEqual([
      ["FeatFloWer", "solid"],
      ["FEAT3", "dash"]
    ]);
  });

  it("all-cases view: one group per case and code, one per PIV reference, finest level by default", () => {
    expect(Object.keys(sedimentationPlotSpecs).sort()).toEqual(["position", "velocity"]);
    for (const spec of Object.values(sedimentationPlotSpecs)) {
      expect(spec.seriesGroups).toHaveLength(12);
      expect(spec.seriesGroups.filter(group => group.kind === "code")).toHaveLength(8);
      expect(spec.seriesGroups.filter(group => group.kind === "reference")).toHaveLength(4);
      // Each case's two codes side by side, then the PIV: legend rows read as colour pairs.
      expect(spec.seriesGroups.map(group => group.label)).toEqual([
        ...CASES.flatMap(caseId => [`${caseId} FeatFloWer`, `${caseId} FEAT3`]),
        ...CASES.map(caseId => `${caseId} PIV`)
      ]);
      expect(spec.defaultSeriesGroupIds).toEqual(spec.seriesGroups.map(group => group.id));
      expect(spec.levelAxis?.options.map(option => option.id)).toEqual([...LEVELS]);
      expect(spec.levelAxis?.defaultLevelId).toBe("l4");
      expect(spec.seriesSelectorLabel).toBe("Cases, codes & references");
    }
  });

  it("all-cases view: a case has a source exactly at the levels it was run at", () => {
    const velocity = sedimentationPlotSpecs.velocity;
    for (const caseId of CASES) {
      const sim = velocity.seriesGroups.find(group => group.id === caseId.toLowerCase())!;
      for (const level of LEVELS) {
        const source = sim.levelSources?.[level];
        expect(Boolean(source), `${caseId} ${level}`).toBe(sedimentationHasRun(caseId, level));
        if (source) expect(assetExists(source.asset.path), source.asset.path).toBe(true);
      }
    }
    const piv = velocity.seriesGroups.find(group => group.id === "e1-piv");
    expect(piv?.source?.asset.path).toContain("E1-piv.json");
    expect(piv?.markerSymbol).toBe("square-open");
    expect(piv?.levelSources).toBeUndefined();
  });

  it("all-cases view: an absent run drops its case from that level only", () => {
    // The ladder is complete today; build the specs as they would be without E1 at L2.
    const specs = buildSedimentationPlotSpecs(withoutE1L2);
    const atL2 = availableSeriesGroups(specs.velocity, "l2").map(group => group.id);
    expect(atL2).not.toContain("e1");
    // The other code's curve for the same case and level stays.
    expect(atL2).toContain("e1-feat3");
    expect(atL2).toContain("e1-piv");
    expect(atL2).toHaveLength(11);
    expect(availableSeriesGroups(specs.velocity, "l3")).toHaveLength(12);
    expect(availableSeriesGroups(specs.velocity, "l4")).toHaveLength(12);
    expect(availableSeriesGroups(sedimentationPlotSpecs.velocity, "l2")).toHaveLength(12);
  });

  const PER_CASE_IDS = ["l2", "feat3-l2", "l3", "feat3-l3", "l4", "feat3-l4", "piv"];

  it("per-case view: both codes at the three levels and the PIV reference, case selector, E4 first", () => {
    expect(Object.keys(sedimentationLevelPlotSpecs).sort()).toEqual(["position", "velocity"]);
    for (const spec of Object.values(sedimentationLevelPlotSpecs)) {
      expect(spec.comparisonAxis).toBe("level");
      expect(spec.seriesGroups.map(group => group.id)).toEqual(PER_CASE_IDS);
      expect(spec.seriesGroups.map(group => group.label)).toEqual([
        "FeatFloWer L2",
        "FEAT3 L2",
        "FeatFloWer L3",
        "FEAT3 L3",
        "FeatFloWer L4",
        "FEAT3 L4",
        "PIV"
      ]);
      // Both codes are shown by default.
      expect(spec.defaultSeriesGroupIds).toEqual(PER_CASE_IDS);
      expect(spec.levelAxis?.options.map(option => option.label)).toEqual([...CASES]);
      expect(spec.levelAxis?.defaultLevelId).toBe("e4");
      for (const group of spec.seriesGroups.filter(entry => entry.kind === "level")) {
        const level = sedimentationLevels.find(entry => group.id.endsWith(entry.id))!;
        expect(group.color).toBe(level.color);
        const dash = group.id.startsWith("feat3-") ? "dash" : "solid";
        for (const source of Object.values(group.levelSources!)) {
          expect(source.dash).toBe(dash);
          expect(assetExists(source.asset.path), source.asset.path).toBe(true);
        }
      }
    }
  });

  it("per-case view: every case shows the levels it was run at, never an empty curve", () => {
    for (const metric of ["velocity", "position"] as const) {
      const spec = sedimentationLevelPlotSpecs[metric];
      for (const caseId of CASES) {
        const shown = availableSeriesGroups(spec, caseId.toLowerCase()).map(group => group.id);
        expect(shown, `${metric} ${caseId}`).toEqual(PER_CASE_IDS);
      }
      // Without FeatFloWer's E1 at L2, E1 loses that one curve; FEAT3's E1 L2 and
      // the other cases are unchanged.
      const partial = buildSedimentationLevelPlotSpecs(withoutE1L2)[metric];
      expect(availableSeriesGroups(partial, "e1").map(group => group.id)).toEqual(PER_CASE_IDS.filter(id => id !== "l2"));
      expect(availableSeriesGroups(partial, "e2").map(group => group.id)).toEqual(PER_CASE_IDS);
      expect(partial.seriesGroups.find(group => group.id === "l2")?.levelSources?.e1).toBeUndefined();
    }
  });
});

describe("sedimentation downloads", () => {
  it("offers each published run's two series, the run summary and the PIV files, all on disk", () => {
    const labels = sedimentationDownloads.map(item => item.label);
    for (const run of sedimentationRuns) {
      expect(labels).toContain(`vel${run.case}_${levelTag(run.level)}.txt`);
      expect(labels).toContain(`pos${run.case}_${levelTag(run.level)}.txt`);
    }
    for (const key of missingKeys) {
      const [caseId, level] = key.split("-");
      expect(labels).not.toContain(`vel${caseId}_${levelTag(level)}.txt`);
    }
    expect(labels).toContain("campaign_runs.csv");
    // No unsuffixed legacy names.
    expect(labels.filter(label => /^(vel|pos)E\d\.txt$/.test(label))).toEqual([]);
    for (const item of sedimentationDownloads) {
      const path = item.href.replace(/^.*benchmark-assets\/sedimentation\//, "");
      expect(existsSync(resolve(SEDIMENTATION_DIR, path)), item.href).toBe(true);
    }
  });

  it("bundles the same files in sedimentation.zip", () => {
    const zip = readFileSync(resolve(SEDIMENTATION_DIR, "downloads/sedimentation.zip"));
    const names = new Set<string>();
    // Central directory: signature 0x02014b50, name length at +28, name at +46.
    for (let offset = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02])); offset >= 0; ) {
      const length = zip.readUInt16LE(offset + 28);
      names.add(zip.subarray(offset + 46, offset + 46 + length).toString());
      offset = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), offset + 46 + length);
    }
    const expected = [
      ...sedimentationRuns.flatMap(run => [`vel${run.case}_${levelTag(run.level)}.txt`, `pos${run.case}_${levelTag(run.level)}.txt`]),
      "campaign_runs.csv",
      ...CASES.flatMap(caseId => [`ref_${caseId}.dat`, `case_${caseId}_h.csv`])
    ].map(name => `sedimentation/${name}`);
    expect([...names].sort()).toEqual(expected.sort());
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

describe("sub-grid lubrication study (gate D2.2 G3)", () => {
  const byId = Object.fromEntries(sedimentationLubricationCases.map(entry => [entry.id, entry]));

  it("reruns the two lowest-Reynolds fixtures of this benchmark", () => {
    expect(sedimentationLubricationCases.map(entry => entry.id)).toEqual(["E1", "E2"]);
    expect(byId.E1.re).toBe(1.5);
    expect(byId.E2.re).toBe(4.1);
  });

  it("arms the model at the mesh clamp, not at a particle scale", () => {
    for (const entry of sedimentationLubricationCases) {
      expect(entry.activationGap).toBeCloseTo(entry.clampFactor * entry.hMin, 12);
      expect(entry.clampFactor).toBe(2);
      // The pair is controlled: both runs reach the activation gap at the same instant,
      // which the converter also asserts.
      expect(entry.activationTime).toBeGreaterThan(entry.window[0]);
      expect(entry.activationTime).toBeLessThan(entry.window[1]);
    }
  });

  it("decelerates more gradually inside the film band", () => {
    for (const entry of sedimentationLubricationCases) {
      expect(entry.reductions.map(r => r.cells)).toEqual([1, 0.5]);
      for (const reduction of entry.reductions) {
        // Slower with the model, by a tenth to a fifth.
        expect(reduction.lubricated, `${entry.id} ${reduction.cells} cells`).toBeLessThan(reduction.base);
        expect(reduction.reduction).toBeGreaterThan(0.1);
        expect(reduction.reduction).toBeLessThan(0.2);
      }
    }
    expect(byId.E1.reductions[0].reduction).toBeCloseTo(0.154, 3);
    expect(byId.E2.reductions[0].reduction).toBeCloseTo(0.161, 3);
  });

  it("still lands: the descent stays finite and ends at the same resting gap", () => {
    for (const entry of sedimentationLubricationCases) {
      expect(entry.landing.lubricated).toBeGreaterThan(entry.landing.base);
      // The paper's pathology is an unbounded tail; a tenth longer is not one.
      expect(entry.landing.increase).toBeGreaterThan(0.05);
      expect(entry.landing.increase).toBeLessThan(0.2);
      const gapDelta = Math.abs(entry.restingGap.lubricated - entry.restingGap.base);
      expect(gapDelta, `${entry.id} resting gap`).toBeLessThan(0.1 * entry.hMin);
    }
    expect(Math.round(byId.E1.landing.base * 1000)).toBe(301);
    expect(Math.round(byId.E1.landing.lubricated * 1000)).toBe(334);
    expect(Math.round(byId.E2.landing.base * 1000)).toBe(124);
    expect(Math.round(byId.E2.landing.lubricated * 1000)).toBe(140);
  });

  it("keeps the correction modest, as the resolved film implies", () => {
    for (const entry of sedimentationLubricationCases) {
      expect(entry.peakForceRatio, entry.id).toBeGreaterThan(0);
      expect(entry.peakForceRatio, entry.id).toBeLessThan(0.25);
      expect(entry.activeSteps, entry.id).toBeGreaterThan(0);
    }
  });

  it("scores the deficit form closest to the exact wall-approach drag", () => {
    const by = Object.fromEntries(sedimentationBrennerBands.map(band => [band.model, band]));
    expect(Object.keys(by).sort()).toEqual(["fbm_only", "kroupa_deficit", "kroupa_full"]);
    // The resolved method alone is short; the full resistance set double-counts.
    expect(by.fbm_only.band1h2h).toBeLessThan(0);
    expect(by.kroupa_full.band1h2h).toBeGreaterThan(0.5);
    // The published form is the one nearest zero in both bands.
    for (const band of ["band1h2h", "bandSub1h"] as const) {
      expect(Math.abs(by.kroupa_deficit[band]), band).toBeLessThan(Math.abs(by.fbm_only[band]));
      expect(Math.abs(by.kroupa_deficit[band]), band).toBeLessThan(Math.abs(by.kroupa_full[band]));
    }
  });

  it("resolves every lubrication series to a file that exists, per case", () => {
    for (const spec of Object.values(sedimentationLubricationSpecs)) {
      expect(spec.levelAxis?.options.map(option => option.id)).toEqual(["e1", "e2"]);
      for (const group of spec.seriesGroups) {
        for (const source of Object.values(group.levelSources!)) {
          const path = source.asset.path.replace(/^.*benchmark-assets\/sedimentation\//, "");
          expect(() => readFileSync(resolve(SEDIMENTATION_DIR, path)), source.asset.path).not.toThrow();
        }
      }
    }
  });

  it("publishes the three campaign claims behind the tab, job ids stripped", () => {
    expect(sedimentationLubricationRows.map(row => row.case)).toEqual([
      "d22_g2_brenner",
      "d22_g2b_deficit",
      "d22_g3_tencate"
    ]);
    const blob = JSON.stringify(sedimentationLubricationRows);
    expect(blob).not.toMatch(/\bjobs?\s+\d/i);
    // Bare scheduler ids left behind once the keyword is gone are just as internal.
    expect(blob).not.toMatch(/\b1[34]\d{4}\b/);
  });
});

const FEAT3_SOURCE = resolve(process.cwd(), "scripts/source-data/sedimentation/feat3");

/** Every file name in a zip's central directory. */
function zipNames(path: string) {
  const zip = readFileSync(path);
  const names: string[] = [];
  const signature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  for (let offset = zip.indexOf(signature); offset >= 0; ) {
    const length = zip.readUInt16LE(offset + 28);
    names.push(zip.subarray(offset + 46, offset + 46 + length).toString());
    offset = zip.indexOf(signature, offset + 46 + length);
  }
  return names;
}

describe("sedimentation FEAT3 series", () => {
  const feat3Missing = generatedFeat3.missing as Array<{ case: string; level: string }>;

  it("is generated from feat3_runs.csv and has all four cases at L2, L3 and L4", () => {
    expect(generatedFeat3.source).toBe("scripts/source-data/sedimentation/feat3/feat3_runs.csv");
    expect(generatedFeat3.label).toBe("FEAT3");
    expect(generatedFeat3.levels).toEqual([...LEVELS]);
    expect(feat3Missing).toEqual([]);
    expect(sedimentationFeat3Runs.map(run => `${run.case}-${run.level}`)).toEqual(
      CASES.flatMap(caseId => LEVELS.map(level => `${caseId}-${level}`))
    );
    for (const run of sedimentationFeat3Runs) {
      expect(existsSync(resolve(FEAT3_SOURCE, `vel${run.case}_${levelTag(run.level)}.txt`))).toBe(true);
    }
  });

  it("ran on the FeatFloWer meshes with the same time step and simulated time", () => {
    for (const run of sedimentationFeat3Runs) {
      const label = `${run.case} ${run.level}`;
      const level = sedimentationLevels.find(entry => entry.id === run.level)!;
      expect(run.cellsAcrossDiameter.toFixed(1), label).toBe(level.cellsAcrossDiameter.toFixed(1));
      const featflower = sedimentationRuns.find(entry => entry.case === run.case && entry.level === run.level)!;
      expect(run.dtS, label).toBe(featflower.dtS);
      expect(run.steps, label).toBe(featflower.steps);
      expect(run.tEndS, label).toBeCloseTo(featflower.tEndS, 9);
    }
    expect(sedimentationLevels.map(level => level.cellsAcrossDiameter)).toEqual([11.4, 23.9, 49.1]);
  });

  it("writes one feat3-*.json curve per run and metric, next to FeatFloWer's", () => {
    for (const metric of ["velocity", "position"] as const) {
      const files = readdirSync(resolve(SEDIMENTATION_DIR, "plots", metric)).filter(file => file.startsWith("feat3-"));
      expect(files.sort()).toEqual(sedimentationFeat3Runs.map(run => `feat3-${run.case}-${run.level}.json`).sort());
    }
  });

  it("agrees with its run table: one point per step, peak where it says, gap height starting at eight", () => {
    for (const run of sedimentationFeat3Runs) {
      const label = `${run.case} ${run.level}`;
      const velocity = readTrace("velocity", `feat3-${run.case}-${run.level}.json`);
      const position = readTrace("position", `feat3-${run.case}-${run.level}.json`);
      expect(velocity.x, label).toHaveLength(run.steps);
      expect(position.x, label).toHaveLength(run.steps);
      expect(velocity.x[0], label).toBeCloseTo(0.001, 12);
      expect(velocity.x.at(-1), label).toBeCloseTo(run.tEndS, 9);
      const peak = Math.min(...velocity.y);
      expect(peak, label).toBeCloseTo(run.peakVzMS, 6);
      expect(velocity.x[velocity.y.indexOf(peak)], label).toBeCloseTo(run.tPeakS, 9);
      // Velocity is copied unchanged; position is normalised like FeatFloWer's.
      const [, v0] = parseFirstPair(resolve(FEAT3_SOURCE, `vel${run.case}_${levelTag(run.level)}.txt`));
      const [, z0] = parseFirstPair(resolve(FEAT3_SOURCE, `pos${run.case}_${levelTag(run.level)}.txt`));
      expect(velocity.y[0], label).toBe(v0);
      expect(position.y[0], label).toBeCloseTo((z0 - 0.0075) / 0.015, 9);
      expect(position.y[0], label).toBeCloseTo(8, 9);
      expect(velocity.name).toBe(`FEAT3 ${run.case} ${levelTag(run.level)}`);
      expect(velocity.line.dash).toBe("dash");
    }
  });

  it("refines toward a limit too: each refinement moves the peak less than the one before", () => {
    // The Results caption says this for both codes.
    for (const caseId of CASES) {
      const [l2, l3, l4] = LEVELS.map(
        level => sedimentationFeat3Runs.find(run => run.case === caseId && run.level === level)!.peakVzMS
      );
      expect(Math.abs(l4 - l3), caseId).toBeLessThan(Math.abs(l3 - l2));
    }
  });

  it("offers every series, the run table and the bundle under downloads/feat3/, with distinct names", () => {
    const feat3 = sedimentationDownloads.filter(item => item.href.includes("downloads/feat3/"));
    expect(feat3.map(item => item.label).sort()).toEqual(
      [
        ...sedimentationFeat3Runs.flatMap(run => [
          `feat3_vel${run.case}_${levelTag(run.level)}.txt`,
          `feat3_pos${run.case}_${levelTag(run.level)}.txt`
        ]),
        "feat3_runs.csv",
        "sedimentation-feat3.zip"
      ].sort()
    );
    for (const item of feat3) {
      const path = item.href.replace(/^.*benchmark-assets\/sedimentation\//, "");
      expect(existsSync(resolve(SEDIMENTATION_DIR, path)), item.href).toBe(true);
    }
    // No file name is offered twice on the page (the reference-data index keys on names).
    const names = sedimentationDownloads.map(item => item.href.replace(/^.*\//, ""));
    expect(new Set(names).size).toBe(names.length);
    // The series are the source files, byte for byte.
    expect(readFileSync(resolve(SEDIMENTATION_DIR, "downloads/feat3/feat3_velE4_L3.txt"))).toEqual(
      readFileSync(resolve(FEAT3_SOURCE, "velE4_L3.txt"))
    );
  });

  it("bundles the same files in sedimentation-feat3.zip", () => {
    const expected = [
      ...sedimentationFeat3Runs.flatMap(run => [
        `feat3_vel${run.case}_${levelTag(run.level)}.txt`,
        `feat3_pos${run.case}_${levelTag(run.level)}.txt`
      ]),
      "feat3_runs.csv"
    ].map(name => `sedimentation-feat3/${name}`);
    expect(zipNames(resolve(SEDIMENTATION_DIR, "downloads/feat3/sedimentation-feat3.zip")).sort()).toEqual(expected.sort());
    // The core bundle stays FeatFloWer's.
    expect(zipNames(resolve(SEDIMENTATION_DIR, "downloads/sedimentation.zip")).some(name => /feat3/i.test(name))).toBe(false);
  });
});

describe("sedimentation comparison panels with two codes", () => {
  /** Load a group's source for one level-axis option from the published files, as the panel would. */
  function load(spec: PlotSpec, option: string): LoadedGroup[] {
    return availableSeriesGroups(spec, option).map(group => {
      const source = group.levelSources?.[option] ?? group.source!;
      const raw = JSON.parse(
        readFileSync(resolve(SEDIMENTATION_DIR, source.asset.path.replace(/^.*benchmark-assets\/sedimentation\//, "")), "utf-8")
      );
      const rawTraces = expandSource(raw, source);
      return { group, source, rawTraces, variants: deriveTraceVariants(rawTraces, group.variantStrategy) };
    });
  }

  function traces(spec: PlotSpec, option: string) {
    const loaded = load(spec, option);
    return buildComparisonTraces(spec, loaded, {
      selectedGroupIds: spec.defaultSeriesGroupIds,
      selectedVariantIds: ["0"],
      compareMode: "overlay"
    });
  }

  const legend = (built: ReturnType<typeof traces>) => built.filter(trace => trace.showlegend);

  it("per-case panel: both codes at every level over the PIV, seven legend entries", () => {
    const built = traces(sedimentationLevelPlotSpecs.velocity, "e4");
    expect(legend(built).map(trace => trace.name)).toEqual([
      "FeatFloWer L2",
      "FEAT3 L2",
      "FeatFloWer L3",
      "FEAT3 L3",
      "FeatFloWer L4",
      "FEAT3 L4",
      "PIV"
    ]);
  });

  it("per-case panel: a level keeps its colour for both codes; solid is FeatFloWer, dashed is FEAT3", () => {
    const entries = legend(traces(sedimentationLevelPlotSpecs.velocity, "e1"));
    for (const level of sedimentationLevels) {
      const pair = entries.filter(trace => trace.name.endsWith(` ${level.label}`));
      expect(pair.map(trace => trace.name), level.id).toEqual([`FeatFloWer ${level.label}`, `FEAT3 ${level.label}`]);
      expect(new Set(pair.map(trace => trace.line.color)).size, level.id).toBe(1);
      expect(pair.map(trace => trace.line.dash), level.id).toEqual(["solid", "dash"]);
      // The legend entry is the line itself, so it shows the line style.
      expect(pair.every(trace => trace.mode === "lines"), level.id).toBe(true);
    }
  });

  it("per-case panel: one full line per curve, no marker overlays", () => {
    const built = traces(sedimentationLevelPlotSpecs.velocity, "e3");
    const run = sedimentationFeat3Runs.find(entry => entry.case === "E3" && entry.level === "l3")!;
    const lines = built.filter(trace => trace.name.endsWith("L3"));
    expect(lines.map(trace => [trace.mode, trace.x.length])).toEqual([
      ["lines", run.steps],
      ["lines", run.steps]
    ]);
    // Six simulation curves and the PIV, one trace each.
    expect(built).toHaveLength(7);
  });

  it("all-cases panel: at the selected level both codes' curves for every case sit over the PIV", () => {
    for (const level of LEVELS) {
      const built = traces(sedimentationPlotSpecs.position, level);
      expect(legend(built).map(trace => trace.name)).toEqual([
        ...CASES.flatMap(caseId => [`${caseId} FeatFloWer`, `${caseId} FEAT3`]),
        ...CASES.map(caseId => `${caseId} PIV`)
      ]);
      for (const caseId of CASES) {
        const pair = legend(built).filter(trace => trace.name.startsWith(`${caseId} F`));
        expect(new Set(pair.map(trace => trace.line.color)).size, caseId).toBe(1);
        // Line style is the code, as in the per-case panel.
        expect(pair.map(trace => trace.line.dash), caseId).toEqual(["solid", "dash"]);
      }
      // The FEAT3 curves come from FEAT3's files at that level.
      const feat3 = built.find(trace => trace.mode === "lines" && trace.name === "E2 FEAT3")!;
      const run = sedimentationFeat3Runs.find(entry => entry.case === "E2" && entry.level === level)!;
      expect(feat3.x).toHaveLength(run.steps);
    }
  });
});
