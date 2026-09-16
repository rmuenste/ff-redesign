import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OBERBECK_ID,
  oberbeckAbsolutesSpecs,
  oberbeckAnchor,
  oberbeckClosingRung,
  oberbeckDownloads,
  oberbeckGateRows,
  oberbeckHistorySpecs,
  oberbeckL3Full,
  oberbeckL4Full,
  oberbeckL4Half,
  oberbeckOblique,
  oberbeckOrientation,
  oberbeckRatioSpecs,
  oberbeckResistance,
  oberbeckRungs,
  oberbeckValidationRows,
  oberbeckValidationSource,
  percent
} from "./oberbeck";

const DIR = resolve(process.cwd(), "public/benchmark-assets", OBERBECK_ID);

function readPlot(metric: string, file: string) {
  return JSON.parse(readFileSync(resolve(DIR, "plots", metric, `${file}.json`), "utf-8"));
}

describe("Oberbeck resistance functions", () => {
  it("evaluates X^A and Y^A from the aspect ratio rather than transcribing them", () => {
    const { XA, YA, ratio, e } = oberbeckResistance;
    // Kim & Karrila section 3.3, prolate spheroid at r_e = 2.
    expect(e).toBeCloseTo(0.8660254, 7);
    expect(XA).toBeCloseTo(0.601970, 6);
    expect(YA).toBeCloseTo(0.689450, 6);
    expect(ratio).toBeCloseTo(1.14532, 5);
    expect(ratio).toBeCloseTo(YA / XA, 12);
    // Broadside always costs more than end-on for a prolate body.
    expect(YA).toBeGreaterThan(XA);
  });
});

describe("Oberbeck ladder", () => {
  it("varies one factor at a time across the three rungs", () => {
    expect(oberbeckRungs.map(rung => rung.id)).toEqual(["l3-full", "l4-full", "l4-half"]);
    // The two full-size rungs differ only in the mesh...
    expect(oberbeckL4Full.imageParameter).toBeCloseTo(oberbeckL3Full.imageParameter, 12);
    expect(oberbeckL4Full.thinAxisResolution / oberbeckL3Full.thinAxisResolution).toBeCloseTo(2, 10);
    // ...and the closing rung only in the body size, at the production resolution.
    expect(oberbeckL4Half.thinAxisResolution).toBeCloseTo(oberbeckL3Full.thinAxisResolution, 10);
    expect(oberbeckL4Half.imageParameter / oberbeckL3Full.imageParameter).toBeCloseTo(0.5, 10);
    expect(oberbeckL3Full.thinAxisResolution).toBeCloseTo(9.524, 3);
    expect(oberbeckL4Full.thinAxisResolution).toBeCloseTo(19.049, 3);
    expect(oberbeckL3Full.imageParameter).toBeCloseTo(0.529134, 6);
  });

  it("reproduces the campaign tool's anisotropy ratios", () => {
    // Pinned against tools/d61_oberbeck_analysis.py at window 0, which is the
    // reading every recorded campaign number was taken at.
    expect(oberbeckL3Full.ratio).toBeCloseTo(1.16993, 5);
    expect(oberbeckL4Full.ratio).toBeCloseTo(1.17000, 5);
    expect(oberbeckL4Half.ratio).toBeCloseTo(1.14142, 5);
    expect(oberbeckL3Full.ratioCorrected).toBeCloseTo(1.17005, 5);
    expect(oberbeckL4Half.ratioCorrected).toBeCloseTo(1.14148, 5);
  });

  it("shows the full-size excess as resolution-converged, not discretisation", () => {
    // Identical to four digits under a doubling of the mesh: whatever produces
    // the excess does not care about h.
    expect(Math.abs(oberbeckL4Full.ratio - oberbeckL3Full.ratio)).toBeLessThan(1e-4);
    expect(oberbeckL3Full.deviation).toBeCloseTo(0.0215, 4);
    expect(oberbeckL4Full.deviation).toBeCloseTo(0.0215, 4);
    // Both sit outside the primary band; only the half-size rung closes it.
    for (const rung of [oberbeckL3Full, oberbeckL4Full]) {
      expect(Math.abs(rung.deviation), rung.id).toBeGreaterThan(0.02);
    }
  });

  it("closes the primary gate on the half-size rung", () => {
    expect(oberbeckClosingRung.id).toBe("l4-half");
    expect(oberbeckClosingRung.deviation).toBeCloseTo(-0.0034, 4);
    expect(Math.abs(oberbeckClosingRung.deviation)).toBeLessThan(0.02);
    // The excess collapses rather than merely shrinking.
    expect(Math.abs(oberbeckClosingRung.deviation)).toBeLessThan(
      Math.abs(oberbeckL4Full.deviation) / 4
    );
  });

  it("passes the absolutes without an effective-radius correction", () => {
    const par = oberbeckOrientation(oberbeckClosingRung, "parallel");
    const perp = oberbeckOrientation(oberbeckClosingRung, "perpendicular");
    expect(par.deviationCorrected).toBeCloseTo(-0.0112, 4);
    expect(perp.deviationCorrected).toBeCloseTo(-0.0145, 4);
    for (const entry of [par, perp]) expect(Math.abs(entry.deviationCorrected)).toBeLessThan(0.03);
    // Each orientation is gated against its OWN resistance function.
    expect(par.target).toBeCloseTo(oberbeckClosingRung.a * oberbeckResistance.XA, 12);
    expect(perp.target).toBeCloseTo(oberbeckClosingRung.a * oberbeckResistance.YA, 12);
  });

  it("converges the absolutes with resolution at fixed body size", () => {
    for (const orientation of ["parallel", "perpendicular"] as const) {
      const coarse = oberbeckOrientation(oberbeckL3Full, orientation);
      const fine = oberbeckOrientation(oberbeckL4Full, orientation);
      expect(Math.abs(fine.deviationCorrected), orientation).toBeLessThan(
        Math.abs(coarse.deviationCorrected)
      );
    }
    expect(oberbeckOrientation(oberbeckL3Full, "parallel").deviationCorrected).toBeCloseTo(-0.0395, 4);
    expect(oberbeckOrientation(oberbeckL4Full, "parallel").deviationCorrected).toBeCloseTo(-0.0301, 4);
    expect(oberbeckOrientation(oberbeckL3Full, "perpendicular").deviationCorrected).toBeCloseTo(-0.0187, 4);
    expect(oberbeckOrientation(oberbeckL4Full, "perpendicular").deviationCorrected).toBeCloseTo(-0.0092, 4);
  });

  it("nulls the torque everywhere, by orders of magnitude", () => {
    for (const rung of oberbeckRungs) {
      for (const entry of rung.orientations) {
        expect(entry.torqueNull, `${rung.id} ${entry.id}`).toBeLessThan(1e-3);
        expect(entry.torqueNull, `${rung.id} ${entry.id}`).toBeLessThan(1e-6);
      }
    }
    expect(oberbeckOrientation(oberbeckClosingRung, "parallel").torqueNull).toBeCloseTo(2.66e-9, 11);
    expect(oberbeckOrientation(oberbeckClosingRung, "perpendicular").torqueNull).toBeCloseTo(1.27e-8, 10);
  });

  it("holds the momentum balance the fixture imposes on the drag", () => {
    // |F| -> f * V_cell in every orientation; the full-size rungs are there to
    // well under a per cent, and the half-size body's larger residual is the
    // settling caveat the window table prices.
    for (const rung of [oberbeckL3Full, oberbeckL4Full]) {
      for (const entry of rung.orientations) {
        expect(Math.abs(entry.balance), `${rung.id} ${entry.id}`).toBeLessThan(0.01);
      }
    }
    expect(oberbeckOrientation(oberbeckClosingRung, "parallel").balance).toBeCloseTo(0.023, 3);
    // The anisotropy lives in the velocity instead, and is large there.
    for (const rung of oberbeckRungs) {
      const par = oberbeckOrientation(rung, "parallel");
      const perp = oberbeckOrientation(rung, "perpendicular");
      expect(par.velocity / perp.velocity, rung.id).toBeGreaterThan(1.15);
    }
  });

  it("prices the plateau window instead of assuming it", () => {
    for (const rung of oberbeckRungs) {
      expect(rung.sensitivity.map(entry => entry.window)).toEqual([0, 0.25, 0.5, 1, 2]);
      // Every window keeps the rung on the same side of the gate.
      for (const entry of rung.sensitivity) {
        expect(Math.sign(entry.deviation), `${rung.id} @ ${entry.window}`).toBe(
          Math.sign(rung.deviation)
        );
      }
    }
    const half = oberbeckL4Half.sensitivity;
    expect(half[0].deviation).toBeCloseTo(-0.0034, 4);
    expect(half[half.length - 1].deviation).toBeCloseTo(-0.0044, 4);
    // Robustly inside the band at every window, but not pinned to a third digit.
    for (const entry of half) expect(Math.abs(entry.deviation)).toBeLessThan(0.02);
    // The half-size body is still settling where the full-size runs are flat.
    expect(oberbeckOrientation(oberbeckL4Half, "parallel").trend).toBeGreaterThan(
      Math.abs(oberbeckOrientation(oberbeckL4Full, "parallel").trend) * 10
    );
  });

  it("anchors the fixture on the certified sphere before any spheroid runs", () => {
    expect(oberbeckAnchor.K).toBeCloseTo(1.7404, 4);
    expect(oberbeckAnchor.certified).toBe(1.7404);
    expect(Math.abs(oberbeckAnchor.deviation)).toBeLessThan(1e-4);
  });

  it("keeps the off-diagonal run's prediction derived, not transcribed", () => {
    const { XA, YA } = oberbeckResistance;
    const expected = (Math.atan((YA - XA) / (YA + XA)) * 180) / Math.PI;
    expect(oberbeckOblique.predictedTilt).toBeCloseTo(expected, 12);
    expect(oberbeckOblique.predictedTilt).toBeCloseTo(3.88, 2);
  });

  it("keeps the published gate table in step with the generated numbers", () => {
    expect(oberbeckGateRows).toHaveLength(4);
    const ratioGate = oberbeckGateRows.find(row => row.gate.startsWith("Anisotropy"));
    expect(ratioGate?.measured).toContain(oberbeckClosingRung.ratio.toFixed(5));
    expect(ratioGate?.measured).toContain(percent(oberbeckClosingRung.deviation));
    for (const row of oberbeckGateRows) expect(row.verdict).toBe("PASS");
  });
});

describe("Oberbeck plot assets", () => {
  it("plots the ratio ladder against the body's length in the cell", () => {
    const coarse = readPlot("ratio", "res-9");
    const fine = readPlot("ratio", "res-19");
    // The production-resolution series carries both body sizes, smallest first.
    expect(coarse.x).toHaveLength(2);
    expect(coarse.x[0]).toBeLessThan(coarse.x[1]);
    expect(coarse.y[1]).toBeCloseTo(oberbeckL3Full.ratio, 12);
    expect(coarse.y[0]).toBeCloseTo(oberbeckL4Half.ratio, 12);
    // The refinement rung is a single point on top of the full-size one.
    expect(fine.x).toHaveLength(1);
    expect(fine.x[0]).toBeCloseTo(coarse.x[1], 12);
    expect(fine.y[0]).toBeCloseTo(oberbeckL4Full.ratio, 12);
  });

  it("draws the Oberbeck target flat, with the two-per-cent band around it", () => {
    const target = readPlot("ratio", "oberbeck");
    expect(new Set(target.y).size).toBe(1);
    expect(target.y[0]).toBeCloseTo(oberbeckResistance.ratio, 12);
    const band = readPlot("ratio", "band");
    expect(band).toHaveLength(2);
    expect(band[0].y[0] / oberbeckResistance.ratio).toBeCloseTo(1.02, 12);
    expect(band[1].y[0] / oberbeckResistance.ratio).toBeCloseTo(0.98, 12);
  });

  it("plots the absolutes as deviations in per cent against the same abscissa", () => {
    const par = readPlot("absolutes", "parallel-9");
    expect(par.y[1]).toBeCloseTo(
      oberbeckOrientation(oberbeckL3Full, "parallel").deviationCorrected * 100,
      10
    );
    const band = readPlot("absolutes", "band");
    expect(band.map((trace: { y: number[] }) => trace.y[0])).toEqual([3, -3]);
  });

  it("shows both orientations running to the same momentum-balance drag", () => {
    for (const rung of oberbeckRungs) {
      const par = readPlot("force", `${rung.id}-parallel`);
      const perp = readPlot("force", `${rung.id}-perpendicular`);
      const balance = readPlot("force", `${rung.id}-balance`);
      expect(par.x).toHaveLength(400);
      expect(par.y[0]).toBeLessThan(balance.y[0]);
      // Both plateaus land within a few per cent of f * V_cell...
      for (const trace of [par, perp]) {
        expect(Math.abs(trace.y[trace.y.length - 1] / balance.y[0] - 1), rung.id).toBeLessThan(0.05);
      }
      // ...while the superficial velocities stay well apart.
      const uPar = readPlot("velocity", `${rung.id}-parallel`);
      const uPerp = readPlot("velocity", `${rung.id}-perpendicular`);
      expect(uPar.y[uPar.y.length - 1] / uPerp.y[uPerp.y.length - 1], rung.id).toBeGreaterThan(1.15);
    }
  });

  it("resolves every series source to a file that exists", () => {
    const strip = (path: string) => path.replace(new RegExp(`^.*benchmark-assets/${OBERBECK_ID}/`), "");
    for (const spec of [...Object.values(oberbeckRatioSpecs), ...Object.values(oberbeckAbsolutesSpecs)]) {
      for (const group of spec.seriesGroups) {
        expect(() => readFileSync(resolve(DIR, strip(group.source!.asset.path)))).not.toThrow();
      }
      expect(spec.levelAxis, spec.id).toBeUndefined();
    }
    for (const spec of Object.values(oberbeckHistorySpecs)) {
      expect(spec.levelAxis?.options.map(option => option.id)).toEqual([
        "l3-full",
        "l4-full",
        "l4-half"
      ]);
      for (const group of spec.seriesGroups) {
        for (const source of Object.values(group.levelSources!)) {
          expect(() => readFileSync(resolve(DIR, strip(source.asset.path))), source.asset.path).not.toThrow();
        }
      }
    }
  });

  it("offers every published file with a description", () => {
    for (const item of oberbeckDownloads) {
      expect(item.description, item.label).toBeTruthy();
      const path = item.href.replace(new RegExp(`^.*benchmark-assets/${OBERBECK_ID}/`), "");
      expect(() => readFileSync(resolve(DIR, path)), item.label).not.toThrow();
    }
  });
});

describe("Oberbeck validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(oberbeckValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(oberbeckValidationRows).toHaveLength(9);
  });

  it("selects the D6.1 rows in campaign order and uses the campaign vocabulary", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    expect(oberbeckValidationRows.map(row => row.case)).toEqual([
      "pe_ellfix_twin",
      "d61_setup_twin",
      "d61_v0_anchor",
      "d61_g0b_pass",
      "d61_v123_l3",
      "d61_v4_resolution",
      "d61_v3b_transverse",
      "d61_v5_halfsize",
      "d61_review_corrections"
    ]);
    for (const row of oberbeckValidationRows) {
      expect(row.suite).toBe("d6_nonspherical");
      expect(allowed.has(row.verdict), `${row.case}: ${row.verdict}`).toBe(true);
      expect(row.measured.length, row.case).toBeGreaterThan(0);
    }
    // The rung that closes the primary gate, and the review that priced it.
    expect(oberbeckValidationRows.find(row => row.case === "d61_v5_halfsize")?.verdict).toBe("PASS");
    expect(oberbeckValidationRows.find(row => row.case === "d61_review_corrections")?.verdict).toBe(
      "RESOLVED"
    );
  });

  it("strips internal scheduler job ids without eating a decimal", () => {
    const blob = JSON.stringify(oberbeckValidationRows);
    expect(blob).not.toMatch(/\bjobs?\s+\d/i);
    // The semi-axis the closing rung quotes begins with the campaign's own job-id
    // digits after the decimal point; it must survive the sanitiser intact.
    expect(oberbeckValidationRows.find(row => row.case === "d61_v5_halfsize")?.quantity).toContain(
      `a=${oberbeckL4Half.a.toFixed(6)}`
    );
  });

  it("publishes the same rows as the standalone ledger extract", () => {
    const extract = readFileSync(resolve(DIR, "downloads/oberbeck_validation_rows.csv"), "utf-8");
    for (const row of oberbeckValidationRows) expect(extract).toContain(`"${row.case}"`);
    expect(extract.trimEnd().split("\n")).toHaveLength(oberbeckValidationRows.length + 1);
  });
});
