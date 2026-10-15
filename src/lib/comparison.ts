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
  marker?: { color?: string; symbol?: string; size?: number };
  line?: { color?: string; dash?: string };
  showlegend?: boolean;
  legendgroup?: string;
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
 * The series groups that have data at the selected level-axis option. A group
 * with per-option `levelSources` but no entry for the selected option has no
 * curve there (for example one run of a ladder that does not exist), so it is
 * left out of the plot and of the series selector rather than failing the
 * panel. Groups with a single level-independent `source` are always available.
 */
export function availableSeriesGroups(spec: PlotSpec, selectedLevelId?: string): SeriesGroup[] {
  return spec.seriesGroups.filter(
    group => !selectedLevelId || !group.levelSources || group.levelSources[selectedLevelId] !== undefined
  );
}

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
 *
 * Variant ids are positional (`"0"`, `"1"`, ...) and a selection is matched across
 * groups by position, not label: the curated per-level/per-code files list the same
 * variants in the same order even where the label formatting differs (e.g. RB3
 * sphericity `dt=1.0E-3` on L1 vs `dt = 1.0000E-03` on L2). The alignment test in
 * comparison.test.ts guards this ordering invariant against reordered asset files.
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

  // When no dash override applies, keep the curated dash from the JSON: spreading
  // an explicit `dash: undefined` would clobber it.
  const line = dash ? { ...trace.line, color, dash } : { ...trace.line, color };

  const lineTrace: PlotlyTrace = {
    ...trace,
    name,
    mode: source.markerSampleEvery ? "lines" : trace.mode,
    line,
    marker: { ...trace.marker, color },
    showlegend
  };

  if (!source.markerSampleEvery || source.markerSampleEvery <= 0) return [lineTrace];

  const symbol = group.markerSymbol ?? trace.marker?.symbol;
  const markers: PlotlyTrace = {
    ...trace,
    x: sample(trace.x, source.markerSampleEvery, source.markerSampleOffset),
    y: sample(trace.y, source.markerSampleEvery, source.markerSampleOffset),
    name,
    mode: "markers",
    line: { ...line },
    marker: { ...trace.marker, color, symbol },
    showlegend: false
  };
  if (!source.markerInLegend) return [lineTrace, markers];

  // The legend entry is a proxy drawn as line + marker: a single point on top of
  // the first sampled marker, so it adds nothing visible to the chart (Plotly
  // leaves a trace without data out of the legend). The full line and its sampled
  // markers stay out of the legend but share its legend group, so a legend click
  // still toggles the whole curve.
  const legendgroup = `${group.id}:${variant.id}`;
  const anchor = markers.x.length ? 0 : -1;
  return [
    { ...lineTrace, showlegend: false, legendgroup },
    { ...markers, legendgroup },
    {
      x: anchor < 0 ? trace.x.slice(0, 1) : markers.x.slice(0, 1),
      y: anchor < 0 ? trace.y.slice(0, 1) : markers.y.slice(0, 1),
      type: trace.type ?? "scatter",
      name,
      mode: "lines+markers",
      line,
      marker: { ...trace.marker, color, symbol },
      showlegend,
      legendgroup
    }
  ];
}

function sample(values: number[], every: number, offset = 0) {
  const first = ((offset % every) + every) % every;
  return values.filter((_, index) => index % every === first);
}

/** Resolved theme tokens for the plot chrome; callers pass values read from the
 * active CSS theme (`--fg1` / `--fg2` / `--divider`). Defaults match the dark theme. */
export interface ComparisonLayoutColors {
  text?: string;
  mutedText?: string;
  grid?: string;
}

/**
 * Below this plot-column width the legend no longer fits beside the curves
 * without taking a third of the chart: on a phone it moves under the x-axis.
 * Above it (tablet and desktop, where the control rail sits beside or the
 * column is wide) the side legend stays.
 */
export const NARROW_PLOT_WIDTH = 560;

export interface ComparisonLayoutOptions {
  /** The plot column is narrower than NARROW_PLOT_WIDTH. */
  narrow?: boolean;
  /** Legend entries to make room for when the legend sits under the chart. */
  legendEntries?: number;
  /** Width of the figure in pixels, to split a legend under the chart into two columns. */
  width?: number;
}

/** Rows the horizontal legend wraps to: it is laid out two entries per row. */
export function legendRows(entries: number) {
  return Math.max(1, Math.ceil(entries / 2));
}

/** Pixels a legend row takes under the chart. */
export const LEGEND_ROW_PX = 20;

/** Themed, token-driven Plotly layout shared by every comparison plot. */
export function comparisonLayout(
  spec: PlotSpec,
  colors: ComparisonLayoutColors = {},
  options: ComparisonLayoutOptions = {}
) {
  const axis = spec.axisLabels ?? { x: "", y: "" };
  const text = colors.text ?? "rgba(255,255,255,0.82)";
  const mutedText = colors.mutedText ?? "rgba(255,255,255,0.72)";
  const grid = colors.grid ?? "rgba(255,255,255,0.10)";
  // Under the chart, the legend sits at the bottom of the figure (container
  // coordinates, so it never rides up into the x-axis title however short the
  // plot area is), two entries per row; the bottom margin reserves a row height
  // per row on top of the axis title's own space. The panel grows the figure by
  // the same amount, so the plot area keeps its height.
  // Plotly wraps a horizontal legend at the plot-area width, and each entry is its
  // symbol (40px) plus `entrywidth` plus a 5px gap, so half the plot area less
  // those makes exactly two entries a row. Legend groups (see `markerInLegend`)
  // would add a 10px gap under every row; it is dropped here.
  const right = options.narrow ? 12 : 20;
  const plotAreaWidth = (options.width ?? 320) - 54 - right;
  const legend = options.narrow
    ? {
        font: { color: mutedText, size: 11 },
        orientation: "h" as const,
        entrywidth: Math.max(40, Math.floor(plotAreaWidth / 2) - 46),
        tracegroupgap: 0,
        entrywidthmode: "pixels" as const,
        x: 0,
        xanchor: "left" as const,
        y: 0,
        yref: "container" as const,
        yanchor: "bottom" as const
      }
    : { font: { color: mutedText } };
  const bottom = options.narrow ? 56 + LEGEND_ROW_PX * legendRows(options.legendEntries ?? 0) : 48;
  return {
    title: { text: spec.title },
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: text },
    legend,
    margin: { l: 54, r: right, t: 48, b: bottom },
    xaxis: {
      title: { text: axis.x },
      range: spec.axisRanges?.x,
      gridcolor: grid,
      zerolinecolor: grid
    },
    yaxis: {
      title: { text: axis.y },
      range: spec.axisRanges?.y,
      gridcolor: grid,
      zerolinecolor: grid
    }
  };
}
