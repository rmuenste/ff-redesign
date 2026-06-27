import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rb2PlotSpecs } from "./rb2";

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
