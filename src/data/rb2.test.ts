import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rb2Downloads, rb2Feat3Levels, rb2Metrics, rb2PlotSpecs } from "./rb2";

const RB2_DIR = resolve(process.cwd(), "public/benchmark-assets/rb2");

/** Strip the Vite base path so an asset href can be resolved against the rb2 folder. */
function assetFile(path: string) {
  return resolve(RB2_DIR, path.replace(/^.*?benchmark-assets\/rb2\//, ""));
}

function readPlot(metric: string, level: string): { x: number[]; y: number[] } {
  return JSON.parse(readFileSync(resolve(RB2_DIR, "plots/case-1", metric, `feat3-${level}.json`), "utf-8"));
}

describe("rb2 plot specs", () => {
  it("uses a first-class single selected level axis on every metric", () => {
    for (const specs of Object.values(rb2PlotSpecs)) {
      for (const spec of Object.values(specs)) {
        expect(spec.comparisonAxis).toBe("code");
        expect(spec.levelAxis?.defaultLevelId).toBe("l1");
        expect(spec.levelAxis?.options.map(option => option.id)).toEqual(["l1", "l2", "l3"]);
      }
    }
  });

  it("encodes sparse FeatFloWer availability only where source data exists", () => {
    const withFeatFloWer = Object.entries(rb2PlotSpecs).flatMap(([caseId, specs]) =>
      Object.entries(specs)
        .filter(([, spec]) => spec.seriesGroups.some(group => group.id === "featflower"))
        .map(([metric]) => `${caseId}/${metric}`)
    );

    expect(withFeatFloWer.sort()).toEqual([
      "case-2/circularity",
      "case-2/mass",
      "case-2/shape"
    ]);
  });

  it("uses the primary highlight token for FeatFloWer when it is available", () => {
    const featflower = rb2PlotSpecs["case-2"].mass.seriesGroups.find(group => group.id === "featflower");
    expect(featflower?.highlight).toBe(true);
    expect(featflower?.color).toBe("var(--primary)");
  });

  it("uses segmented all-trace sources for shapes and sampled marker companions for quantities", () => {
    const shape = rb2PlotSpecs["case-2"].shape;
    expect(shape.seriesGroups.every(group => group.variantStrategy.kind === "all-traces")).toBe(true);
    expect(shape.seriesGroups.every(group => group.levelSources?.l1.kind === "segmented-shape")).toBe(true);

    const circularity = rb2PlotSpecs["case-2"].circularity;
    expect(circularity.seriesGroups.every(group => group.variantStrategy.kind === "single-trace")).toBe(true);
    expect(circularity.seriesGroups.every(group => group.levelSources?.l1.markerSampleEvery === 90)).toBe(true);
  });

  it("does not expose or reference an RB2 video asset", () => {
    const source = readFileSync(resolve(process.cwd(), "src/data/rb2.tsx"), "utf-8");
    expect(source).not.toMatch(/mp4|risingbubble2|VideoBlock/i);
  });
});

describe("rb2 FEAT3 (Case 1)", () => {
  it("is present in every Case 1 metric and absent from Case 2", () => {
    for (const metric of rb2Metrics) {
      const ids = rb2PlotSpecs["case-1"][metric.id].seriesGroups.map(group => group.id);
      expect(ids, metric.id).toEqual(["tp2d", "freelife", "moonmd", "feat3"]);
      expect(rb2PlotSpecs["case-2"][metric.id].seriesGroups.some(group => group.id === "feat3"), metric.id).toBe(false);
    }
  });

  it("is highlighted with its own colour and marker", () => {
    const groups = rb2PlotSpecs["case-1"].circularity.seriesGroups;
    const feat3 = groups.find(group => group.id === "feat3");
    expect(feat3?.label).toBe("FEAT3");
    expect(feat3?.highlight).toBe(true);
    expect(feat3?.color).toBe("var(--tu-orange-500)");
    expect(feat3?.markerSymbol).toBe("triangle-up");
    const others = [...groups, ...rb2PlotSpecs["case-2"].mass.seriesGroups].filter(group => group.id !== "feat3");
    expect(others.some(group => group.color === feat3?.color || group.markerSymbol === feat3?.markerSymbol)).toBe(false);
  });

  it("points every level source at a plot file that exists", () => {
    for (const metric of rb2Metrics) {
      const feat3 = rb2PlotSpecs["case-1"][metric.id].seriesGroups.find(group => group.id === "feat3")!;
      for (const level of ["l1", "l2", "l3"] as const) {
        const source = feat3.levelSources![level];
        expect(source.asset.path, `${metric.id}/${level}`).toMatch(new RegExp(`plots/case-1/${metric.id}/feat3-${level}\\.json$`));
        expect(existsSync(assetFile(source.asset.path)), source.asset.path).toBe(true);
        if (metric.id === "shape") {
          expect(source.kind).toBe("segmented-shape");
          expect(source.segmentSize).toBe(2);
        } else {
          expect(source.kind).toBe("single-trace");
          expect(source.markerSampleEvery).toBe(90);
        }
      }
    }
  });

  it("offers the FEAT3 download next to the legacy bundles", () => {
    const feat3 = rb2Downloads.find(item => item.label === "feat3-case1.zip");
    expect(feat3).toBeDefined();
    expect(existsSync(assetFile(feat3!.href))).toBe(true);
  });

  it("maps the site levels to FEAT3 levels 2-4 by total NDOF", () => {
    expect(
      rb2Feat3Levels.map(level => [level.siteLevel, level.feat3Level, level.runDir, level.cells, level.q2Nodes, level.ndof])
    ).toEqual([
      ["l1", 2, "case1_L2_k2.5e-4", 1760, 7177, 19634],
      ["l2", 3, "case1_L3_k2.5e-4", 7040, 28433, 77986],
      ["l3", 4, "case1_L4_k2.5e-4_mg", 28160, 113185, 310850]
    ]);
    // NDOF = 2 * (Q2 velocity nodes) + 3 * cells (P1dc pressure).
    for (const level of rb2Feat3Levels) expect(level.ndof).toBe(2 * level.q2Nodes + 3 * level.cells);
    // Within 1 % of TP2D at h = 1/40, 1/80, 1/160.
    const tp2d = [19561, 77521, 308641];
    rb2Feat3Levels.forEach((level, index) => expect(Math.abs(level.ndof / tp2d[index] - 1)).toBeLessThan(0.01));
    expect(rb2Feat3Levels.map(level => level.interfaceEdges)).toEqual([72, 144, 288]);
    expect(rb2Feat3Levels.every(level => level.timeStep === 2.5e-4 && level.steps === 12000)).toBe(true);
  });

  it("reproduces the key values of the full-resolution bench.txt", () => {
    const expected = [
      { minCircularity: 0.9014565, maxRiseVelocity: 0.2416228, centerOfMassEnd: 1.0817264 },
      { minCircularity: 0.9013898, maxRiseVelocity: 0.2416253, centerOfMassEnd: 1.0817075 },
      { minCircularity: 0.9013939, maxRiseVelocity: 0.2416260, centerOfMassEnd: 1.0817286 }
    ];
    rb2Feat3Levels.forEach((level, index) => {
      expect(level.minCircularity, level.siteLevel).toBeCloseTo(expected[index].minCircularity, 7);
      expect(level.maxRiseVelocity, level.siteLevel).toBeCloseTo(expected[index].maxRiseVelocity, 7);
      expect(level.centerOfMassEnd, level.siteLevel).toBeCloseTo(expected[index].centerOfMassEnd, 7);
    });
    // The times of the extrema, on the k = 2.5e-4 grid.
    [1.89925, 1.899, 1.89875].forEach((t, index) => expect(rb2Feat3Levels[index].minCircularityTime).toBeCloseTo(t, 9));
    for (const level of rb2Feat3Levels) expect(level.maxRiseVelocityTime).toBeCloseTo(0.922, 9);
  });

  it("plots every 4th step from t = 0 to t = 3", () => {
    for (const level of ["l1", "l2", "l3"]) {
      for (const metric of ["center-of-mass", "circularity", "rise-velocity", "mass"]) {
        const plot = readPlot(metric, level);
        expect(plot.x, `${metric}/${level}`).toHaveLength(3001);
        expect(plot.y).toHaveLength(3001);
        expect(plot.x[0]).toBe(0);
        expect(plot.x[3000]).toBe(3);
        expect(plot.x[1]).toBeCloseTo(1e-3, 12);
      }
      const generated = rb2Feat3Levels.find(entry => entry.siteLevel === level)!;
      expect(readPlot("center-of-mass", level).y[3000]).toBeCloseTo(generated.centerOfMassEnd, 7);
      // Mass is plotted, like every legacy code, as a percentage of the exact
      // initial area pi * 0.25^2; FEAT3 starts from the discrete circle.
      const mass = readPlot("mass", level).y;
      expect(mass[0]).toBeGreaterThan(99.99);
      expect(mass[0]).toBeLessThanOrEqual(100);
      expect(Math.max(...mass)).toBeLessThan(100.05);
    }
  });

  it("draws each shape as a closed outline in the TP2D bubble's place", () => {
    rb2Feat3Levels.forEach(level => {
      const { x, y } = readPlot("shape", level.siteLevel);
      // Four segments per curved edge, two points per segment.
      expect(x).toHaveLength(8 * level.interfaceEdges);
      // Every point is shared by exactly two segments: no gaps, no loose ends.
      const degree = new Map<string, number>();
      x.forEach((value, index) => {
        const key = `${value} ${y[index]}`;
        degree.set(key, (degree.get(key) ?? 0) + 1);
      });
      expect([...degree.values()].every(count => count === 2), level.siteLevel).toBe(true);

      const tp2d = JSON.parse(
        readFileSync(resolve(RB2_DIR, "plots/case-1/shape", `tp2d-${level.siteLevel}.json`), "utf-8")
      ) as { x: number[]; y: number[] };
      expect(Math.min(...x)).toBeCloseTo(Math.min(...tp2d.x), 2);
      expect(Math.max(...x)).toBeCloseTo(Math.max(...tp2d.x), 2);
      expect(Math.max(...y)).toBeCloseTo(Math.max(...tp2d.y), 2);
      expect(Math.min(...y)).toBeCloseTo(Math.min(...tp2d.y), 2);
    });
  });
});
