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
import type { PlotSpec, SeriesGroup, TraceVariantStrategy } from "../data/types";

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

  it("can group all expanded traces into one UI variant", () => {
    const raw: RawTrace[] = [
      { x: [0, 1], y: [0, 1], name: "segment" },
      { x: [1, 2], y: [1, 2], name: "segment" }
    ];
    const variants = deriveTraceVariants(raw, { kind: "all-traces", label: "Outline" });
    expect(variants).toEqual([{ id: "all", label: "Outline", traceIndexes: [0, 1] }]);
  });
});

describe("buildComparisonTraces (overlay)", () => {
  const sphericityL1 = loadTraces("plots/sphericity/l1.json");
  const sphericityL2 = loadTraces("plots/sphericity/l2.json");

  const groupL1 = levelGroup("l1", "#11aabb", "single");
  const groupL2 = levelGroup("l2", "#ff7700", "single");

  const loaded: LoadedGroup[] = [
    { group: groupL1, source: groupL1.source!, rawTraces: sphericityL1, variants: deriveTraceVariants(sphericityL1, groupL1.variantStrategy) },
    { group: groupL2, source: groupL2.source!, rawTraces: sphericityL2, variants: deriveTraceVariants(sphericityL2, groupL2.variantStrategy) }
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
      [{ group: sizeGroup, source: sizeGroup.source!, rawTraces: sizeL1, variants: deriveTraceVariants(sizeL1, sizeGroup.variantStrategy) }],
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

  it("uses group colours when source-colour preservation is disabled", () => {
    const traces = buildComparisonTraces(
      { ...spec, preserveSourceColorsWhenSingleGroup: false },
      loaded,
      { selectedGroupIds: ["l2"], selectedVariantIds: ["0"], compareMode: "overlay" }
    );
    expect(traces).toHaveLength(1);
    expect(traces[0].line.color).toBe("#ff7700");
  });

  it("preserves a curated line dash when no dash override applies", () => {
    const raw: RawTrace[] = [{ x: [0, 1], y: [0, 1], name: "ref", line: { color: "black", dash: "dashdot" } }];
    const group = levelGroup("l1", "#11aabb", "single");
    const traces = buildComparisonTraces(
      { ...spec, seriesGroups: [group] },
      [{ group, source: group.source!, rawTraces: raw, variants: deriveTraceVariants(raw, group.variantStrategy) }],
      { selectedGroupIds: ["l1"], selectedVariantIds: ["0"], compareMode: "overlay" }
    );
    expect(traces).toHaveLength(1);
    expect(traces[0].line.dash).toBe("dashdot");
    expect(traces[0].line.color).toBe("black");
  });

  it("lets a source dash override the curated dash", () => {
    const raw: RawTrace[] = [{ x: [0, 1], y: [0, 1], name: "ref", line: { color: "black", dash: "dashdot" } }];
    const group: SeriesGroup = { ...levelGroup("l1", "#11aabb", "single"), source: { kind: "trace-array", asset: { path: "" }, dash: "dot" } };
    const traces = buildComparisonTraces(
      { ...spec, seriesGroups: [group] },
      [{ group, source: group.source!, rawTraces: raw, variants: deriveTraceVariants(raw, group.variantStrategy) }],
      { selectedGroupIds: ["l1"], selectedVariantIds: ["0"], compareMode: "overlay" }
    );
    expect(traces[0].line.dash).toBe("dot");
  });

  it("adds sampled marker companions for dense quantity sources", () => {
    const source = { ...groupL1.source!, markerSampleEvery: 2 };
    const group: SeriesGroup = { ...groupL1, markerSymbol: "circle" };
    const raw: RawTrace[] = [{ x: [0, 1, 2, 3], y: [10, 11, 12, 13], name: "TP2D" }];
    const traces = buildComparisonTraces(
      { ...spec, preserveSourceColorsWhenSingleGroup: false, seriesGroups: [group] },
      [{ group, source, rawTraces: raw, variants: deriveTraceVariants(raw, group.variantStrategy) }],
      { selectedGroupIds: ["l1"], selectedVariantIds: ["0"], compareMode: "overlay" }
    );

    expect(traces).toHaveLength(2);
    expect(traces[0].mode).toBe("lines");
    expect(traces[1].mode).toBe("markers");
    expect(traces[1].x).toEqual([0, 2]);
    expect(traces[1].marker.symbol).toBe("circle");
    expect(traces[1].showlegend).toBe(false);
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
      axisLabels: { x: "Time [s]", y: "Sphericity" },
      axisRanges: { x: [0, 8], y: [-0.5, 3.5] }
    });
    expect(layout.paper_bgcolor).toBe("rgba(0,0,0,0)");
    expect(layout.xaxis.title.text).toBe("Time [s]");
    expect(layout.yaxis.title.text).toBe("Sphericity");
    expect(layout.xaxis.range).toEqual([0, 8]);
    expect(layout.yaxis.range).toEqual([-0.5, 3.5]);
  });

  it("themes the plot chrome from resolved token colours", () => {
    const spec: PlotSpec = {
      id: "x",
      title: "Sphericity",
      metric: "sphericity",
      comparisonAxis: "level",
      seriesGroups: [],
      defaultSeriesGroupIds: [],
      compareModes: ["overlay"],
      defaultCompareMode: "overlay"
    };
    const light = comparisonLayout(spec, {
      text: "rgba(0,0,0,0.87)",
      mutedText: "rgba(0,0,0,0.60)",
      grid: "rgba(0,0,0,0.12)"
    });
    expect(light.font.color).toBe("rgba(0,0,0,0.87)");
    expect(light.legend.font.color).toBe("rgba(0,0,0,0.60)");
    expect(light.xaxis.gridcolor).toBe("rgba(0,0,0,0.12)");
    expect(light.yaxis.zerolinecolor).toBe("rgba(0,0,0,0.12)");

    // Without resolved tokens the layout falls back to the dark theme.
    const fallback = comparisonLayout(spec);
    expect(fallback.font.color).toBe("rgba(255,255,255,0.82)");
    expect(fallback.xaxis.gridcolor).toBe("rgba(255,255,255,0.10)");
  });
});

describe("RB3 variant alignment across levels", () => {
  // Variant selection is matched across groups by position (ids "0", "1", ...), so
  // every level's file must list the same variants in the same order. Labels may
  // differ in formatting (l1 sphericity uses "dt=1.0E-3", l2 "dt = 1.0000E-03"),
  // so compare the numeric values they contain instead of the raw strings.
  const numbersIn = (label: string) =>
    (label.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? []).map(Number);

  it.each(["mass", "size", "sphericity", "surface"] as const)(
    "lists %s variants in the same order on every level",
    metric => {
      const strategy: TraceVariantStrategy =
        metric === "size" ? { kind: "paired-traces", pairSize: 2 } : { kind: "single-trace" };
      const perLevel = (["l1", "l2", "l3"] as const).map(level =>
        deriveTraceVariants(loadTraces(`plots/${metric}/${level}.json`), strategy)
      );
      const [first, ...rest] = perLevel;
      expect(first.length).toBeGreaterThan(0);
      for (const variants of rest) {
        expect(variants).toHaveLength(first.length);
        variants.forEach((variant, index) => {
          expect(numbersIn(variant.label)).toEqual(numbersIn(first[index].label));
        });
      }
    }
  );
});
