import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  JEFFERY_ID,
  jefferyClearanceSpecs,
  jefferyClosedForm,
  jefferyControl,
  jefferyControlSpecs,
  jefferyDownloads,
  jefferyGateRows,
  jefferyH4,
  jefferyH8,
  jefferyOrbitSpecs,
  jefferyOrbits,
  jefferyOrientBins,
  jefferyRuns,
  jefferyValidationRows,
  jefferyValidationSource,
  jefferyWall,
  jefferyWallModel,
  percent,
  points
} from "./jeffery";

const DIR = resolve(process.cwd(), "public/benchmark-assets", JEFFERY_ID);

function readPlot(metric: string, file: string) {
  return JSON.parse(readFileSync(resolve(DIR, "plots", metric, `${file}.json`), "utf-8"));
}

describe("Jeffery's closed form", () => {
  it("evaluates the period and the waveform from the aspect ratio, not from a table", () => {
    // T gammadot = 2 pi (r_e + 1/r_e); at r_e = 2 that is 5 pi.
    expect(jefferyClosedForm.periodGamma).toBeCloseTo(15.70796, 5);
    expect(jefferyClosedForm.periodGamma).toBeCloseTo(5 * Math.PI, 12);
    // The rate swings by r_e^2 between flow alignment and the gradient direction.
    expect(jefferyClosedForm.modulation).toBe(4);
    expect(jefferyClosedForm.slow).toBeCloseTo(0.04, 12);
    expect(jefferyClosedForm.fast).toBeCloseTo(0.16, 12);
    expect(jefferyClosedForm.fast / jefferyClosedForm.slow).toBeCloseTo(4, 12);
  });
});

describe("Jeffery fixture", () => {
  it("moves exactly one thing between the two orbit runs", () => {
    expect(jefferyOrbits.map(run => run.id)).toEqual(["v1b", "v2"]);
    for (const field of ["a", "b", "re", "gammadot", "dt"] as const) {
      expect(jefferyH4[field], field).toBe(jefferyH8[field]);
    }
    expect(jefferyH4.box.x).toBe(jefferyH8.box.x);
    expect(jefferyH4.box.y).toBe(jefferyH8.box.y);
    // ...the box height, and with it the wall clearance, which halves.
    expect(jefferyH4.box.h / jefferyH8.box.h).toBeCloseTo(0.5, 12);
    expect(jefferyH8.clearanceAxes).toBe(8);
    expect(jefferyH4.clearanceAxes).toBe(4);
    // The wall speed halves with the box so the shear rate does not move.
    expect(jefferyH4.wallSpeed / jefferyH8.wallSpeed).toBeCloseTo(0.5, 12);
    expect(jefferyH8.reynolds).toBeCloseTo(0.05, 12);
    expect(jefferyH4.reynolds).toBeCloseTo(0.05, 12);
  });

  it("reads every run on the same mask the campaign tool used", () => {
    expect(jefferyH8.seams).toEqual([40.01, 80.01]);
    expect(jefferyH4.seams).toEqual([50.01, 100.01]);
    for (const run of jefferyOrbits) {
      expect(run.analysis.samples, run.id).toBe(11833);
      expect(run.analysis.tStart, run.id).toBeCloseTo(0.51, 3);
      expect(run.analysis.tEnd, run.id).toBeCloseTo(120.01, 3);
      expect(run.analysis.halfTurns, run.id).toBeCloseTo(3.0, 1);
      expect(run.segments, run.id).toBe(3);
    }
    expect(jefferyRuns.find(run => run.id === "v0b")?.analysis.samples).toBe(901);
  });

  it("turns the way the vorticity requires", () => {
    for (const run of jefferyRuns) {
      // u = gammadot z x^ gives vorticity +gammadot y^, so omega_y = +gammadot/2
      // and the analyser's angle, measured from the flow axis, DECREASES.
      expect(run.analysis.sense, run.id).toBe(-1);
      expect(run.analysis.sense, run.id).toBe(run.analysis.senseExpected);
    }
  });
});

describe("Jeffery orbit gates", () => {
  it("reproduces the campaign tool's pi-crossings and periods", () => {
    // Pinned against tools/d62_jeffery_analysis.py --tmin 0.5 --seams ...
    expect(jefferyH8.analysis.crossings.map(value => Number(value.toFixed(4)))).toEqual([
      39.4949, 78.8818, 118.271
    ]);
    expect(jefferyH4.analysis.crossings.map(value => Number(value.toFixed(4)))).toEqual([
      39.6858, 79.2739, 118.8631
    ]);
    expect(jefferyH8.analysis.periodGamma).toBeCloseTo(15.7552, 4);
    expect(jefferyH4.analysis.periodGamma).toBeCloseTo(15.8355, 4);
    expect(jefferyH8.analysis.periodDeviation).toBeCloseTo(0.003, 4);
    expect(jefferyH4.analysis.periodDeviation).toBeCloseTo(0.0081, 4);
    // Both sit well inside the +/- 3% band the case specification sets.
    for (const run of jefferyOrbits) {
      expect(Math.abs(run.analysis.periodDeviation!), run.id).toBeLessThan(0.03);
    }
  });

  it("agrees across the segment seams it chains over", () => {
    // Each run's two half-periods bracket a restart; if the orientation carry
    // cost anything, it would show up as a spread between them.
    expect(jefferyH8.analysis.halfPeriods.map(value => Number(value.toFixed(3)))).toEqual([
      39.387, 39.389
    ]);
    expect(jefferyH4.analysis.halfPeriods.map(value => Number(value.toFixed(3)))).toEqual([
      39.588, 39.589
    ]);
    for (const run of jefferyOrbits) {
      const spread = Math.max(...run.analysis.halfPeriods) - Math.min(...run.analysis.halfPeriods);
      expect(spread, run.id).toBeLessThan(3e-3);
    }
  });

  it("holds the 4:1 waveform modulation at both clearances", () => {
    expect(jefferyH8.analysis.rate.modulation).toBeCloseTo(4.033, 3);
    expect(jefferyH4.analysis.rate.modulation).toBeCloseTo(4.067, 3);
    for (const run of jefferyOrbits) {
      expect(Math.abs(run.analysis.rate.modulationDeviation), run.id).toBeLessThan(0.05);
      expect(run.analysis.rate.min, run.id).toBeLessThan(jefferyClosedForm.slow * 1.05);
      expect(run.analysis.rate.max, run.id).toBeGreaterThan(jefferyClosedForm.fast * 0.95);
    }
  });

  it("is slow at flow alignment, which extrema alone could not establish", () => {
    // The gate the 2026-09-10 review added: an orbit phase-shifted by a quarter
    // turn passes period and modulation exactly, and fails only here.
    expect(jefferyH8.analysis.orient.placementDeviation).toBeCloseTo(0.018, 4);
    expect(jefferyH4.analysis.orient.placementDeviation).toBeCloseTo(0.003, 4);
    expect(jefferyH8.analysis.orient.rmsResidual).toBeCloseTo(0.0048, 4);
    expect(jefferyH4.analysis.orient.rmsResidual).toBeCloseTo(0.0047, 4);
    for (const run of jefferyOrbits) {
      expect(run.analysis.orient.bins, run.id).toHaveLength(jefferyOrientBins);
      expect(Math.abs(run.analysis.orient.placementDeviation!), run.id).toBeLessThan(0.1);
      expect(run.analysis.orient.rmsResidual, run.id).toBeLessThan(0.03);
      // Placement below one means the body really is slowest along the flow.
      expect(run.analysis.orient.placement!, run.id).toBeLessThan(0.5);
      expect(run.analysis.orient.placementJeffery).toBeCloseTo(0.2662, 4);
    }
  });

  it("keeps the orbit in its plane, where nothing restores it", () => {
    expect(jefferyH8.analysis.maxAxisY).toBeCloseTo(1.5e-7, 8);
    expect(jefferyH4.analysis.maxAxisY).toBeCloseTo(1.5e-8, 9);
    for (const run of jefferyRuns) {
      expect(run.analysis.maxAxisY, run.id).toBeLessThan(0.02);
      expect(run.analysis.maxAxisY, run.id).toBeLessThan(1e-6);
    }
  });
});

describe("Jeffery wall clearance", () => {
  it("lengthens the period when the walls come in", () => {
    expect(jefferyH4.analysis.periodDeviation!).toBeGreaterThan(jefferyH8.analysis.periodDeviation!);
    expect(jefferyWall.shift).toBeCloseTo(0.0051, 4);
    expect(points(jefferyWall.shift)).toBe("+0.51 pp");
  });

  it("brackets the clearance-free period between two scaling laws", () => {
    const cubic = jefferyWallModel("cubic");
    const square = jefferyWallModel("square");
    expect(cubic.exponent).toBe(3);
    expect(square.exponent).toBe(2);
    expect(cubic.intercept).toBeCloseTo(0.0023, 4);
    expect(square.intercept).toBeCloseTo(0.0013, 4);
    // Both laws pass exactly through the two measured rungs, by construction.
    for (const model of [cubic, square]) {
      for (const run of jefferyOrbits) {
        const predicted = model.intercept + model.slope * run.imageParameter ** model.exponent;
        expect(predicted, `${model.id} at ${run.id}`).toBeCloseTo(run.analysis.periodDeviation!, 12);
      }
      // A faster fall-off leaves less behind at infinite clearance.
      expect(model.slope).toBeGreaterThan(0);
      expect(model.intercept).toBeLessThan(jefferyH8.analysis.periodDeviation!);
      expect(model.intercept).toBeGreaterThan(0);
    }
    expect(cubic.intercept).toBeGreaterThan(square.intercept);
  });

  it("keeps the caveat honest: the meshes are too close to explain the shift", () => {
    // Resolutions come from each run's own DNS_RESOLUTION record (2b / h_min),
    // not from the case specification's pre-mesh estimate. The two boxes differ
    // by 1.6%, which no refinement study in this campaign turns into half a
    // percentage point of period.
    expect(jefferyH8.thinAxisResolution).toBeCloseTo(10.385, 3);
    expect(jefferyH4.thinAxisResolution).toBeCloseTo(10.217, 3);
    expect(jefferyH8.thinAxisResolution).toBeCloseTo((2 * jefferyH8.b) / jefferyH8.hMin, 12);
    expect(jefferyH4.thinAxisResolution).toBeCloseTo((2 * jefferyH4.b) / jefferyH4.hMin, 12);
    const gap = Math.abs(jefferyH4.thinAxisResolution / jefferyH8.thinAxisResolution - 1);
    expect(gap).toBeCloseTo(0.016, 3);
    expect(gap * 100).toBeLessThan(Math.abs(jefferyWall.shift) * 100 * 4);
    // The sphere control shares the default box, and so its mesh.
    const control = jefferyRuns.find(run => run.role === "control")!;
    expect(control.hMin).toBe(jefferyH8.hMin);
    expect([control.insideDofs, jefferyH8.insideDofs, jefferyH4.insideDofs]).toEqual([
      5006, 10010, 9530
    ]);
  });

  it("does not move the waveform while it moves the clock", () => {
    // The discriminating picture: the period shifts by half a point, the shape
    // does not degrade at all.
    expect(Math.abs(jefferyH4.analysis.orient.placementDeviation!)).toBeLessThan(
      Math.abs(jefferyH8.analysis.orient.placementDeviation!)
    );
    expect(jefferyH4.analysis.orient.rmsResidual).toBeLessThan(
      jefferyH8.analysis.orient.rmsResidual * 1.1
    );
  });
});

describe("Jeffery sphere control", () => {
  it("returns the exact half-vorticity spin to within the one-per-cent band", () => {
    // tools/d62_jeffery_analysis.py --re 1.0 --tmin 1; the campaign's windowed
    // fits over t = 6.5..10.5 all land in -0.50495..-0.50496.
    expect(jefferyControl.spin).toBeCloseTo(-0.50495, 4);
    expect(jefferyControl.exact).toBe(-0.5);
    expect(jefferyControl.deviation).toBeCloseTo(0.0099, 4);
    expect(jefferyControl.deviation).toBeLessThan(jefferyControl.band);
    // A sphere spins uniformly: there is no waveform for the shear to modulate.
    expect(jefferyControl.modulation).toBeCloseTo(1.002, 3);
    expect(jefferyControl.maxAxisY).toBeLessThan(1e-8);
  });

  it("sets the scale of the discretisation share in the orbit's excess", () => {
    // Same sign, same order: a rotation rate slightly too slow at 2b/h = 10.4.
    expect(jefferyControl.deviation).toBeGreaterThan(0);
    expect(jefferyH8.analysis.periodDeviation!).toBeGreaterThan(0);
    expect(jefferyControl.deviation).toBeLessThan(0.01);
  });
});

describe("Jeffery plot assets", () => {
  it("anchors the analytic curve on the theoretical period, not on a refit", () => {
    const ax = readPlot("axis", "jeffery-ax");
    const az = readPlot("axis", "jeffery-az");
    expect(ax.x).toHaveLength(2000);
    expect(ax.x[0]).toBeCloseTo(jefferyH8.analysis.tStart, 6);
    expect(ax.x[ax.x.length - 1]).toBeCloseTo(jefferyH8.analysis.tEnd, 6);
    // Unit vector: the two analytic components stay on the unit circle.
    for (const index of [0, 500, 1999]) {
      expect(ax.y[index] ** 2 + az.y[index] ** 2).toBeCloseTo(1, 10);
    }
    // Anchored at the first sample the mask keeps, by which point the axis has
    // barely left the flow direction it started in.
    expect(ax.y[0]).toBeCloseTo(1, 3);
    expect(Math.abs(az.y[0])).toBeLessThan(0.02);
  });

  it("plots the DNS orientation as markers on top of it", () => {
    for (const key of ["h8", "h4"]) {
      const ax = readPlot("axis", `${key}-ax`);
      const az = readPlot("axis", `${key}-az`);
      expect(ax.mode).toBe("markers");
      expect(ax.x).toHaveLength(az.x.length);
      expect(ax.x.length).toBeGreaterThan(300);
      for (const index of [0, 100, ax.x.length - 1]) {
        expect(ax.y[index] ** 2 + az.y[index] ** 2, `${key} @ ${index}`).toBeCloseTo(1, 6);
      }
    }
  });

  it("normalises both rate frames by the shear rate", () => {
    for (const metric of ["rate", "waveform"]) {
      const jeffery = readPlot(metric, "jeffery");
      expect(Math.min(...jeffery.y)).toBeCloseTo(0.2, 3);
      expect(Math.max(...jeffery.y)).toBeCloseTo(0.8, 3);
      for (const key of ["h8", "h4"]) {
        const dns = readPlot(metric, key);
        expect(Math.min(...dns.y), `${metric}/${key}`).toBeGreaterThan(0.18);
        expect(Math.max(...dns.y), `${metric}/${key}`).toBeLessThan(0.82);
      }
    }
    // The waveform frame has no clock in it: the abscissa is phi mod pi.
    const waveform = readPlot("waveform", "h8");
    expect(Math.min(...waveform.x)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...waveform.x)).toBeLessThanOrEqual(Math.PI);
  });

  it("plots the clearance ladder against a / l, with zero as the unbounded limit", () => {
    const dns = readPlot("period", "dns");
    expect(dns.x).toEqual([jefferyH8.imageParameter, jefferyH4.imageParameter]);
    expect(dns.x[0]).toBeCloseTo(0.125, 12);
    expect(dns.x[1]).toBeCloseTo(0.25, 12);
    expect(dns.y[0]).toBeCloseTo(jefferyH8.analysis.periodGamma!, 10);
    expect(dns.y[1]).toBeCloseTo(jefferyH4.analysis.periodGamma!, 10);

    const target = readPlot("period", "jeffery");
    expect(new Set(target.y).size).toBe(1);
    expect(target.y[0]).toBeCloseTo(jefferyClosedForm.periodGamma, 12);

    const band = readPlot("period", "band");
    expect(band).toHaveLength(2);
    expect(band[0].y[0] / jefferyClosedForm.periodGamma).toBeCloseTo(1.03, 12);
    expect(band[1].y[0] / jefferyClosedForm.periodGamma).toBeCloseTo(0.97, 12);

    // Both extrapolations start at zero clearance on their own intercept.
    for (const model of ["cubic", "square"]) {
      const curve = readPlot("excess", model);
      expect(curve.x[0]).toBe(0);
      expect(curve.y[0]).toBeCloseTo(jefferyWallModel(model).intercept * 100, 10);
    }
    // The zoomed frame carries no band, because +/- 3% is off its scale.
    expect(() => readPlot("excess", "band")).toThrow();
  });

  it("frames the sphere control against the exact value and its band", () => {
    const dns = readPlot("spin", "dns");
    expect(Math.max(...dns.y)).toBeLessThan(-0.5);
    const exact = readPlot("spin", "exact");
    expect(exact.y).toEqual([-0.5, -0.5]);
    const band = readPlot("spin", "band");
    expect(band.map((entry: { y: number[] }) => entry.y[0])).toEqual([-0.505, -0.495]);
  });

  it("resolves every series source to a file that exists", () => {
    const strip = (path: string) => path.replace(new RegExp(`^.*benchmark-assets/${JEFFERY_ID}/`), "");
    const specs = [
      ...Object.values(jefferyOrbitSpecs),
      ...Object.values(jefferyClearanceSpecs),
      ...Object.values(jefferyControlSpecs)
    ];
    for (const spec of specs) {
      expect(spec.levelAxis, spec.id).toBeUndefined();
      for (const group of spec.seriesGroups) {
        expect(() => readFileSync(resolve(DIR, strip(group.source!.asset.path))), group.id).not.toThrow();
      }
      for (const id of spec.defaultSeriesGroupIds) {
        expect(spec.seriesGroups.some(group => group.id === id), `${spec.id}/${id}`).toBe(true);
      }
    }
  });

  it("offers every published file with a description", () => {
    for (const item of jefferyDownloads) {
      expect(item.description, item.label).toBeTruthy();
      const path = item.href.replace(new RegExp(`^.*benchmark-assets/${JEFFERY_ID}/`), "");
      expect(() => readFileSync(resolve(DIR, path)), item.label).not.toThrow();
    }
  });

  it("keeps the published gate table in step with the generated numbers", () => {
    expect(jefferyGateRows).toHaveLength(6);
    const period = jefferyGateRows.find(row => row.gate.startsWith("Period"));
    expect(period?.measured).toContain(jefferyH8.analysis.periodGamma!.toFixed(4));
    expect(period?.measured).toContain(percent(jefferyH8.analysis.periodDeviation!));
    for (const row of jefferyGateRows) expect(row.verdict).toBe("PASS");
  });
});

describe("Jeffery validation ledger", () => {
  it("is generated from the curated datasheet, not hand-written", () => {
    expect(jefferyValidationSource).toBe("scripts/source-data/dns/dns_validation_datasheet.csv");
    expect(jefferyValidationRows).toHaveLength(5);
  });

  it("selects the D6.2 rows in campaign order and uses the campaign vocabulary", () => {
    const allowed = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN"]);
    expect(jefferyValidationRows.map(row => row.case)).toEqual([
      "d62_g0_smoke",
      "d62_v0b_spin",
      "d62_v1b_orbit",
      "d62_v2_clearance",
      "d62_resolution_pinned"
    ]);
    for (const row of jefferyValidationRows) {
      expect(row.suite).toBe("d6_nonspherical");
      expect(allowed.has(row.verdict), `${row.case}: ${row.verdict}`).toBe(true);
      expect(row.measured.length, row.case).toBeGreaterThan(0);
    }
    // Every gate passes; the fifth row is the bookkeeping correction that
    // supersedes the resolution figure the clearance row's caveat quotes.
    for (const row of jefferyValidationRows.filter(entry => entry.case !== "d62_resolution_pinned")) {
      expect(row.verdict, row.case).toBe("PASS");
    }
    const pinned = jefferyValidationRows.find(row => row.case === "d62_resolution_pinned");
    expect(pinned?.verdict).toBe("RESOLVED");
    expect(pinned?.measured).toContain(jefferyH8.thinAxisResolution.toFixed(3));
    expect(pinned?.measured).toContain(jefferyH4.thinAxisResolution.toFixed(3));
  });

  it("strips internal scheduler job ids from the campaign prose", () => {
    const blob = JSON.stringify(jefferyValidationRows);
    expect(blob).not.toMatch(/\bjobs?\s+\d/i);
    // The measured values the page quotes survive the sanitiser intact.
    expect(jefferyValidationRows.find(row => row.case === "d62_v2_clearance")?.measured).toContain(
      jefferyH4.analysis.periodGamma!.toFixed(4)
    );
    expect(jefferyValidationRows.find(row => row.case === "d62_v1b_orbit")?.measured).toContain(
      jefferyH8.analysis.periodGamma!.toFixed(4)
    );
  });

  it("publishes the same rows as the standalone ledger extract", () => {
    const extract = readFileSync(resolve(DIR, "downloads/jeffery_validation_rows.csv"), "utf-8");
    for (const row of jefferyValidationRows) expect(extract).toContain(`"${row.case}"`);
  });
});
