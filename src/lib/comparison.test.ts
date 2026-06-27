import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildComparisonTraces,
  comparisonLayout,
  deriveTraceVariants,
  expandSource,
  type LoadedGroup,
  type RawTrace
} from "./comparison";
import type { PlotSpec, SeriesGroup } from "../data/types";

const RB3 = resolve(process.cwd(), "public/benchmark-assets/rb3");

function loadTraces(rel: string): RawTrace[] {
  return JSON.parse(readFileSync(resolve(RB3, rel), "utf-8")) as RawTrace[];
}

function levelGroup(id: string, color: string, traceArrayMetric: "single" | "paired"): SeriesGroup {
  return {
    id,
    label: id.toUpperCase(),
    kind: "level",
    color,
    source: { kind: "trace-array", asset: { path: "" } },
    variantStrategy: traceArrayMetric === "paired" ? { kind: "paired-traces", pairSize: 2 } : { kind: "single-trace" }
  };
}

describe("expandSource", () => {
  it("passes trace-array / single-trace payloads through unchanged", () => {
    const raw = loadTraces("plots/sphericity/l1.json");
    expect(expandSource(raw, { kind: "trace-array", asset: { path: "" } })).toHaveLength(raw.length);
  });

  it("splits a segmented-shape source into fixed-size segments (synthetic fixture)", () => {
    const raw: RawTrace[] = [{ x: [0, 1, 2, 3], y: [10, 11, 12, 13], name: "shape" }];
    const segments = expandSource(raw, { kind: "segmented-shape", asset: { path: "" }, segmentSize: 2 });
    expect(segments).toHaveLength(2);
    expect(segments[0].x).toEqual([0, 1]);
    expect(segments[1].y).toEqual([12, 13]);
  });
});

describe("deriveTraceVariants", () => {
  it("derives one variant per trace (single-trace) labelled from JSON name", () => {
    const raw = loadTraces("plots/sphericity/l1.json"); // 4 dt traces
    const variants = deriveTraceVariants(raw, { kind: "single-trace" });
    expect(variants).toHaveLength(4);
    expect(variants.every(v => v.traceIndexes.length === 1)).toBe(true);
    expect(variants[0].label).toMatch(/dt/i);
  });

  it("groups RB3 size traces into pairs labelled from the named member", () => {
    const raw = loadTraces("plots/size/l1.json"); // 8 traces (named dt + unnamed partner)
    expect(raw).toHaveLength(8);
    const variants = deriveTraceVariants(raw, { kind: "paired-traces", pairSize: 2 });
    expect(variants).toHaveLength(4);
    expect(variants[0].traceIndexes).toEqual([0, 1]);
    expect(variants.every(v => /dt/i.test(v.label))).toBe(true);
  });
});

describe("buildComparisonTraces (overlay)", () => {
  const sphericityL1 = loadTraces("plots/sphericity/l1.json");
  const sphericityL2 = loadTraces("plots/sphericity/l2.json");

  const groupL1 = levelGroup("l1", "#11aabb", "single");
  const groupL2 = levelGroup("l2", "#ff7700", "single");

  const loaded: LoadedGroup[] = [
    { group: groupL1, rawTraces: sphericityL1, variants: deriveTraceVariants(sphericityL1, groupL1.variantStrategy) },
    { group: groupL2, rawTraces: sphericityL2, variants: deriveTraceVariants(sphericityL2, groupL2.variantStrategy) }
  ];

  const spec: PlotSpec = {
    id: "rb3-sphericity",
    title: "Sphericity",
    metric: "sphericity",
    comparisonAxis: "level",
    seriesGroups: [groupL1, groupL2],
    defaultSeriesGroupIds: ["l1"],
    compareModes: ["overlay"],
    defaultCompareMode: "overlay"
  };

  it("overlays one variant across two level groups, coloured by group", () => {
    const traces = buildComparisonTraces(spec, loaded, {
      selectedGroupIds: ["l1", "l2"],
      selectedVariantIds: ["0"],
      compareMode: "overlay"
    });
    expect(traces).toHaveLength(2);
    expect(traces.map(t => t.line.color).sort()).toEqual(["#11aabb", "#ff7700"]);
  });

  it("passes real source data through without fabricating values", () => {
    const traces = buildComparisonTraces(spec, loaded, {
      selectedGroupIds: ["l1"],
      selectedVariantIds: ["0"],
      compareMode: "overlay"
    });
    expect(traces[0].y).toEqual(sphericityL1[0].y);
    expect(traces[0].x).toEqual(sphericityL1[0].x);
  });

  it("preserves curated trace colours when only one level group is selected", () => {
    const traces = buildComparisonTraces(spec, loaded, {
      selectedGroupIds: ["l1"],
      selectedVariantIds: ["0", "1", "2", "3"],
      compareMode: "overlay"
    });
    expect(traces.map(t => t.line.color)).toEqual(["dodgerblue", "orange", "green", "red"]);
  });

  it("keeps paired RB3 size partner traces out of the legend", () => {
    const sizeL1 = loadTraces("plots/size/l1.json");
    const sizeGroup = levelGroup("l1", "#11aabb", "paired");
    const sizeSpec: PlotSpec = { ...spec, id: "rb3-size", title: "Bubble size", metric: "size", seriesGroups: [sizeGroup] };
    const traces = buildComparisonTraces(
      sizeSpec,
      [{ group: sizeGroup, rawTraces: sizeL1, variants: deriveTraceVariants(sizeL1, sizeGroup.variantStrategy) }],
      { selectedGroupIds: ["l1"], selectedVariantIds: ["0", "1", "2", "3"], compareMode: "overlay" }
    );

    expect(traces).toHaveLength(8);
    expect(traces.map(t => t.showlegend)).toEqual([true, false, true, false, true, false, true, false]);
  });

  it("respects series selection", () => {
    const traces = buildComparisonTraces(spec, loaded, {
      selectedGroupIds: ["l2"],
      selectedVariantIds: ["0"],
      compareMode: "overlay"
    });
    expect(traces).toHaveLength(1);
    expect(traces[0].x).toEqual(sphericityL2[0].x);
    expect(traces[0].line.color).toBe("dodgerblue");
  });

  it("throws for a mode not enabled on the spec", () => {
    expect(() =>
      buildComparisonTraces(spec, loaded, { selectedGroupIds: ["l1"], selectedVariantIds: ["0"], compareMode: "diff" })
    ).toThrow(/not enabled/i);
  });

  it("throws 'not implemented yet' for an enabled-but-unimplemented mode", () => {
    const specWithDiff: PlotSpec = { ...spec, compareModes: ["overlay", "diff"] };
    expect(() =>
      buildComparisonTraces(specWithDiff, loaded, { selectedGroupIds: ["l1"], selectedVariantIds: ["0"], compareMode: "diff" })
    ).toThrow(/not implemented yet/i);
  });
});

describe("comparisonLayout", () => {
  it("produces a transparent, token-themed layout with the spec's axis labels", () => {
    const layout = comparisonLayout({
      id: "x",
      title: "Sphericity",
      metric: "sphericity",
      comparisonAxis: "level",
      seriesGroups: [],
      defaultSeriesGroupIds: [],
      compareModes: ["overlay"],
      defaultCompareMode: "overlay",
      axisLabels: { x: "Time [s]", y: "Sphericity" }
    });
    expect(layout.paper_bgcolor).toBe("rgba(0,0,0,0)");
    expect(layout.xaxis.title.text).toBe("Time [s]");
    expect(layout.yaxis.title.text).toBe("Sphericity");
  });
});
