import type {
  CompareMode,
  PlotSource,
  PlotSpec,
  SeriesGroup,
  TraceVariant,
  TraceVariantStrategy
} from "../data/types";

/** A Plotly trace exactly as stored in the curated asset JSON files. */
export interface RawTrace {
  x: number[];
  y: number[];
  type?: string;
  mode?: string;
  name?: string | null;
  marker?: { color?: string; symbol?: string };
  line?: { color?: string; dash?: string };
  showlegend?: boolean;
}

/** A trace ready to hand to Plotly, with resolved colour/dash/name. */
export interface PlotlyTrace extends RawTrace {
  name: string;
  line: { color: string; dash?: string };
  marker: { color: string; symbol?: string };
  showlegend: boolean;
}

export interface LoadedGroup {
  group: SeriesGroup;
  source: PlotSource;
  rawTraces: RawTrace[];
  variants: TraceVariant[];
}

export interface ComparisonSelection {
  selectedGroupIds: string[];
  selectedVariantIds: string[];
  compareMode: CompareMode;
}

const VARIANT_DASHES = ["solid", "dot", "dash", "dashdot"] as const;
const VARIANT_COLORS = ["dodgerblue", "orange", "green", "red"] as const;

/**
 * Normalise a loaded asset payload into a flat list of traces.
 * - `single-trace` / `trace-array`: the JSON is already an array of traces.
 * - `segmented-shape`: each trace's points are split into contiguous segments of
 *   `segmentSize` points (reserved for true bubble-shape files; unused by RB3 and
 *   covered only by a synthetic fixture test).
 */
export function expandSource(raw: unknown, source: PlotSource): RawTrace[] {
  const traces = Array.isArray(raw) ? (raw as RawTrace[]) : [raw as RawTrace];

  if (source.kind === "segmented-shape") {
    const size = source.segmentSize ?? 2;
    return traces.flatMap(trace => splitTraceIntoSegments(trace, size));
  }

  return traces;
}

function splitTraceIntoSegments(trace: RawTrace, segmentSize: number): RawTrace[] {
  const segments: RawTrace[] = [];
  for (let start = 0; start < trace.x.length; start += segmentSize) {
    segments.push({
      ...trace,
      x: trace.x.slice(start, start + segmentSize),
      y: trace.y.slice(start, start + segmentSize),
      name: trace.name ? `${trace.name} [${start / segmentSize}]` : null
    });
  }
  return segments;
}

/**
 * Derive the user-toggleable variants from a group's expanded traces. Labels come
 * from the JSON `name` fields, never from static config.
 */
export function deriveTraceVariants(
  rawTraces: RawTrace[],
  strategy: TraceVariantStrategy
): TraceVariant[] {
  if (strategy.kind === "paired-traces") {
    const variants: TraceVariant[] = [];
    for (let i = 0; i < rawTraces.length; i += strategy.pairSize) {
      const members = [i, i + 1].filter(index => index < rawTraces.length);
      const named = members.map(index => rawTraces[index].name).find(Boolean);
      variants.push({
        id: String(i / strategy.pairSize),
        label: named ?? `pair ${i / strategy.pairSize + 1}`,
        traceIndexes: members
      });
    }
    return variants;
  }

  if (strategy.kind === "all-traces") {
    return [{
      id: "all",
      label: strategy.label ?? "All traces",
      traceIndexes: rawTraces.map((_, index) => index)
    }];
  }

  return rawTraces.map((trace, index) => ({
    id: String(index),
    label: trace.name ?? `trace ${index + 1}`,
    traceIndexes: [index]
  }));
}

/**
 * Assemble the final Plotly traces for the current selection.
 *
 * Only `overlay` is implemented. `diff` and `small-multiples` are typed for forward
 * compatibility but guarded: a mode that is not listed in `spec.compareModes`, or is
 * not yet implemented, throws rather than producing partial output.
 */
export function buildComparisonTraces(
  spec: PlotSpec,
  loaded: LoadedGroup[],
  selection: ComparisonSelection
): PlotlyTrace[] {
  if (!spec.compareModes.includes(selection.compareMode)) {
    throw new Error(`Compare mode "${selection.compareMode}" is not enabled for plot "${spec.id}".`);
  }
  if (selection.compareMode !== "overlay") {
    throw new Error(`Compare mode "${selection.compareMode}" is not implemented yet.`);
  }

  const selectedVariantIds = new Set(selection.selectedVariantIds);
  const onlyOneGroup = selection.selectedGroupIds.length <= 1;
  const preserveSourceColors = spec.preserveSourceColorsWhenSingleGroup ?? true;

  return loaded
    .filter(entry => selection.selectedGroupIds.includes(entry.group.id))
    .flatMap(entry => {
      const activeVariants = entry.variants.filter(variant => selectedVariantIds.has(variant.id));
      const onlyOneVariant = activeVariants.length <= 1;

      return activeVariants.flatMap((variant, ordinal) =>
        variant.traceIndexes
          .map(index => entry.rawTraces[index])
          .filter((trace): trace is RawTrace => Boolean(trace))
          .flatMap((trace, memberOrdinal) =>
            styleTrace(trace, entry.group, entry.source, variant, ordinal, memberOrdinal, activeVariants.length, {
              onlyOneGroup,
              onlyOneVariant,
              preserveSourceColors
            })
          )
      );
    });
}

function styleTrace(
  trace: RawTrace,
  group: SeriesGroup,
  source: PlotSource,
  variant: TraceVariant,
  variantOrdinal: number,
  memberOrdinal: number,
  variantCount: number,
  context: { onlyOneGroup: boolean; onlyOneVariant: boolean; preserveSourceColors: boolean }
): PlotlyTrace[] {
  // With a single level/code selected, preserve the curated trace colours from
  // the JSON files. With multiple groups selected, colour by group so levels/codes
  // remain distinguishable and use dash to separate variants within each group.
  const dash =
    source.dash ?? group.dash ?? (variantCount > 1 ? VARIANT_DASHES[variantOrdinal % VARIANT_DASHES.length] : undefined);
  const sourceColor = trace.line?.color ?? trace.marker?.color;
  const color =
    context.onlyOneGroup && context.preserveSourceColors
      ? sourceColor ?? VARIANT_COLORS[variantOrdinal % VARIANT_COLORS.length]
      : group.color;
  const showlegend = trace.showlegend === false ? false : memberOrdinal === 0;

  const labelParts: string[] = [];
  if (!context.onlyOneGroup) labelParts.push(group.label);
  if (!context.onlyOneVariant || context.onlyOneGroup) labelParts.push(variant.label);
  const name = labelParts.join(" · ") || group.label;

  const lineTrace: PlotlyTrace = {
    ...trace,
    name,
    mode: source.markerSampleEvery ? "lines" : trace.mode,
    line: { ...trace.line, color, dash },
    marker: { ...trace.marker, color },
    showlegend
  };

  if (!source.markerSampleEvery || source.markerSampleEvery <= 0) return [lineTrace];

  return [
    lineTrace,
    {
      ...trace,
      x: sample(trace.x, source.markerSampleEvery),
      y: sample(trace.y, source.markerSampleEvery),
      name,
      mode: "markers",
      line: { ...trace.line, color, dash },
      marker: { ...trace.marker, color, symbol: group.markerSymbol },
      showlegend: false
    }
  ];
}

function sample(values: number[], every: number) {
  return values.filter((_, index) => index % every === 0);
}

/** Themed, token-driven Plotly layout shared by every comparison plot. */
export function comparisonLayout(spec: PlotSpec) {
  const axis = spec.axisLabels ?? { x: "", y: "" };
  return {
    title: { text: spec.title },
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "rgba(255,255,255,0.82)" },
    legend: { font: { color: "rgba(255,255,255,0.72)" } },
    margin: { l: 54, r: 20, t: 48, b: 48 },
    xaxis: {
      title: { text: axis.x },
      gridcolor: "rgba(255,255,255,0.10)",
      zerolinecolor: "rgba(255,255,255,0.10)"
    },
    yaxis: {
      title: { text: axis.y },
      gridcolor: "rgba(255,255,255,0.10)",
      zerolinecolor: "rgba(255,255,255,0.10)"
    }
  };
}
