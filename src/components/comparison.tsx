import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { CompareMode, PlotSource, PlotSpec, SeriesGroup, TraceVariant } from "../data/types";
import {
  buildComparisonTraces,
  comparisonLayout,
  deriveTraceVariants,
  expandSource,
  type LoadedGroup
} from "../lib/comparison";
import { PlotPanel } from "./science";
import { Overline } from "./ui";

// The only module in the app that imports Plotly — keeps the heavy chunk lazy and
// isolated (enforced by plotly-isolation.test.ts).
const Plot = lazy(() => import("react-plotly.js"));

const COMPARE_MODE_LABELS: Record<CompareMode, string> = {
  overlay: "Overlay",
  diff: "Difference",
  "small-multiples": "Small multiples"
};

function resolveCssVar(value: string): string {
  const match = /^var\((--[^)]+)\)$/.exec(value.trim());
  if (!match || typeof window === "undefined") return value;
  const bodyResolved = getComputedStyle(document.body).getPropertyValue(match[1]).trim();
  const rootResolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  const resolved = bodyResolved || rootResolved;
  return resolved || value;
}

function resolveSource(group: SeriesGroup, selectedLevelId?: string): PlotSource | null {
  if (selectedLevelId && group.levelSources) return group.levelSources[selectedLevelId] ?? null;
  return group.source ?? null;
}

function useComparisonData(spec: PlotSpec, selectedLevelId?: string) {
  const [groups, setGroups] = useState<LoadedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setGroups([]);

    Promise.all(
      spec.seriesGroups.map(async group => {
        const source = resolveSource(group, selectedLevelId);
        if (!source) throw new Error(`Missing source for ${group.label}.`);
        const response = await fetch(source.asset.path, { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load ${response.url}`);
        const raw = await response.json();
        const rawTraces = expandSource(raw, source);
        const variants = deriveTraceVariants(rawTraces, group.variantStrategy);
        return { group: { ...group, color: resolveCssVar(group.color) }, source, rawTraces, variants };
      })
    )
      .then(nextGroups => {
        if (!controller.signal.aborted) setGroups(nextGroups);
      })
      .catch(err => {
        if (!controller.signal.aborted && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [spec, selectedLevelId]);

  return { groups, loading, error };
}

export function ComparisonPanel({
  specs,
  defaultMetric
}: {
  specs: Record<string, PlotSpec>;
  defaultMetric: string;
}) {
  const metricIds = Object.keys(specs);
  const [metric, setMetric] = useState(defaultMetric);
  const spec = specs[metric];

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(spec.defaultSeriesGroupIds);
  const [compareMode, setCompareMode] = useState<CompareMode>(spec.defaultCompareMode);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>(spec.levelAxis?.defaultLevelId);

  const { groups, loading, error } = useComparisonData(spec, selectedLevelId);

  // Variant options come from whichever loaded group exposes the most variants.
  const variantOptions = useMemo<TraceVariant[]>(
    () => groups.reduce<TraceVariant[]>((best, entry) => (entry.variants.length > best.length ? entry.variants : best), []),
    [groups]
  );

  // Reset series/mode selection when the active metric (spec) changes.
  useEffect(() => {
    setSelectedGroupIds(spec.defaultSeriesGroupIds);
    setCompareMode(spec.defaultCompareMode);
    setSelectedLevelId(spec.levelAxis?.defaultLevelId);
  }, [spec]);

  // Default to all variants visible whenever the option set changes.
  useEffect(() => {
    setSelectedVariantIds(variantOptions.map(variant => variant.id));
  }, [variantOptions]);

  const traceResult = useMemo(() => {
    if (!groups.length) return { traces: [], buildError: null };
    try {
      return {
        traces: buildComparisonTraces(spec, groups, { selectedGroupIds, selectedVariantIds, compareMode }),
        buildError: null
      };
    } catch (err) {
      return {
        traces: [],
        buildError: err instanceof Error ? err.message : "Failed to build comparison traces."
      };
    }
  }, [spec, groups, selectedGroupIds, selectedVariantIds, compareMode]);
  const { traces, buildError } = traceResult;

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    setter(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));

  const toggleGroup = toggle(setSelectedGroupIds);
  const toggleVariant = toggle(setSelectedVariantIds);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
      <aside style={{ position: "sticky", top: 96, alignSelf: "start", display: "grid", gap: 28 }}>
        <Group label="Metric">
          {metricIds.map(id => (
            <OptionButton key={id} active={metric === id} onClick={() => setMetric(id)}>
              {specs[id].title}
            </OptionButton>
          ))}
        </Group>

        {spec.levelAxis && (
          <Group label={spec.levelAxis.label}>
            {spec.levelAxis.options.map(option => (
              <OptionButton key={option.id} active={selectedLevelId === option.id} onClick={() => setSelectedLevelId(option.id)}>
                <span>
                  <span>{option.label}</span>
                  {option.detail && (
                    <span style={{ display: "block", color: "var(--fg3)", fontFamily: "var(--font-mono)", fontSize: 10, marginTop: 2 }}>
                      {option.detail}
                    </span>
                  )}
                </span>
              </OptionButton>
            ))}
          </Group>
        )}

        {spec.seriesGroups.length > 1 && (
          <Group label={spec.comparisonAxis === "level" ? "Refinement levels" : "Codes"}>
            {spec.seriesGroups.map(group => (
              <CheckRow
                key={group.id}
                checked={selectedGroupIds.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
              >
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, background: group.color, display: "inline-block" }} />
                <span>{group.label}</span>
              </CheckRow>
            ))}
          </Group>
        )}

        {variantOptions.length > 1 && (
          <Group label="Trace variants">
            {variantOptions.map(variant => (
              <CheckRow
                key={variant.id}
                checked={selectedVariantIds.includes(variant.id)}
                onChange={() => toggleVariant(variant.id)}
              >
                <span>{variant.label}</span>
              </CheckRow>
            ))}
          </Group>
        )}

        {spec.compareModes.length > 1 && (
          <Group label="Compare mode">
            {spec.compareModes.map(mode => (
              <OptionButton key={mode} active={compareMode === mode} onClick={() => setCompareMode(mode)}>
                {COMPARE_MODE_LABELS[mode]}
              </OptionButton>
            ))}
          </Group>
        )}
      </aside>

      <main style={{ minWidth: 0 }}>
        <PlotPanel title={spec.title} meta={`${traces.length} Plotly traces · real ${spec.metric} JSON`}>
          {loading && <div style={{ color: "var(--fg2)" }}>Loading plot data...</div>}
          {error && <div style={{ color: "var(--warn)" }}>{error}</div>}
          {buildError && <div style={{ color: "var(--warn)" }}>{buildError}</div>}
          {!loading && !error && !buildError && (
            <Suspense fallback={<div style={{ color: "var(--fg2)" }}>Loading Plotly...</div>}>
              <Plot
                data={traces}
                layout={comparisonLayout(spec)}
                config={{ responsive: true, displaylogo: false }}
                useResizeHandler
                style={{ width: "100%", height: 520 }}
              />
            </Suspense>
          )}
        </PlotPanel>
      </main>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Overline style={{ marginBottom: 12 }}>{label}</Overline>
      <div style={{ display: "grid", gap: 4 }}>{children}</div>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="focus-ring"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 10px",
        background: active ? "var(--surface-alt)" : "transparent",
        border: 0,
        color: "var(--fg1)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }}
    >
      {children}
    </button>
  );
}

function CheckRow({
  checked,
  onChange,
  children
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", padding: "4px 0" }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}
