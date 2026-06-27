import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chip,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Equation,
  Figure,
  Icon,
  KpiBox,
  Overline,
  PlotPanel,
  Section,
  Tabs,
  VideoBlock
} from "../components";
import {
  rb3Downloads,
  rb3GeometryAsset,
  rb3Levels,
  rb3MeshRows,
  rb3Metrics,
  rb3PhysicalRows,
  rb3PlotPath,
  rb3VideoAsset,
  type Rb3LevelId,
  type Rb3MetricId
} from "../data/rb3";

const Plot = lazy(() => import("react-plotly.js"));

interface PlotTrace {
  x: number[];
  y: number[];
  type: string;
  mode?: string;
  name?: string;
  marker?: { color?: string };
  line?: { color?: string; dash?: string };
  showlegend?: boolean;
}

const traceColors = ["var(--tu-petrol-400)", "var(--tu-orange-500)", "var(--tu-green-400)", "var(--tu-red-300)"];

function useRb3PlotData(metric: Rb3MetricId, level: Rb3LevelId) {
  const [data, setData] = useState<PlotTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(rb3PlotPath(metric, level), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${response.url}`);
        return response.json() as Promise<PlotTrace[]>;
      })
      .then(json => setData(json))
      .catch(err => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [metric, level]);

  return { data, loading, error };
}

function traceVariantGroups(metric: Rb3MetricId, data: PlotTrace[]) {
  if (metric === "size") {
    return [0, 2, 4, 6].filter(index => data[index]).map(index => ({
      id: String(index / 2),
      label: data[index].name ?? `trace ${index + 1}`,
      traceIndexes: [index, index + 1].filter(i => data[i])
    }));
  }

  return data.map((trace, index) => ({
    id: String(index),
    label: trace.name ?? `trace ${index + 1}`,
    traceIndexes: [index]
  }));
}

function themedLayout(metric: Rb3MetricId) {
  const selectedMetric = rb3Metrics.find(item => item.id === metric)!;
  return {
    title: { text: selectedMetric.label },
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "rgba(255,255,255,0.82)" },
    legend: { font: { color: "rgba(255,255,255,0.72)" } },
    margin: { l: 54, r: 20, t: 48, b: 48 },
    xaxis: {
      title: { text: metric === "surface" ? "X-coordinate" : "Time [s]" },
      gridcolor: "rgba(255,255,255,0.10)",
      zerolinecolor: "rgba(255,255,255,0.10)"
    },
    yaxis: {
      title: { text: metric === "surface" ? "Z-coordinate" : selectedMetric.yAxis },
      gridcolor: "rgba(255,255,255,0.10)",
      zerolinecolor: "rgba(255,255,255,0.10)"
    }
  };
}

function Rb3ComparisonPanel() {
  const [metric, setMetric] = useState<Rb3MetricId>("sphericity");
  const [level, setLevel] = useState<Rb3LevelId>("l1");
  const { data, loading, error } = useRb3PlotData(metric, level);
  const variants = useMemo(() => traceVariantGroups(metric, data), [metric, data]);
  const [visibleVariants, setVisibleVariants] = useState<string[]>([]);

  useEffect(() => {
    setVisibleVariants(variants.map(variant => variant.id));
  }, [variants]);

  const visibleTraces = useMemo(() => {
    const selectedIndexes = new Set(
      variants
        .filter(variant => visibleVariants.includes(variant.id))
        .flatMap(variant => variant.traceIndexes)
    );

    return data
      .filter((_, index) => selectedIndexes.has(index))
      .map((trace, index) => ({
        ...trace,
        line: { ...trace.line, color: trace.marker?.color ?? traceColors[index % traceColors.length] },
        marker: { ...trace.marker, color: trace.marker?.color ?? traceColors[index % traceColors.length] }
      }));
  }, [data, variants, visibleVariants]);

  const toggleVariant = (id: string) => {
    setVisibleVariants(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
      <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
        <div style={{ marginBottom: 28 }}>
          <Overline style={{ marginBottom: 12 }}>Metric</Overline>
          <div style={{ display: "grid", gap: 4 }}>
            {rb3Metrics.map(item => (
              <button
                key={item.id}
                className="focus-ring"
                type="button"
                onClick={() => setMetric(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  background: metric === item.id ? "var(--surface-alt)" : "transparent",
                  border: 0,
                  color: "var(--fg1)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left"
                }}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <Overline style={{ marginBottom: 12 }}>Refinement level</Overline>
          <div style={{ display: "grid", gap: 4 }}>
            {rb3Levels.map(item => (
              <button
                key={item.id}
                className="focus-ring"
                type="button"
                onClick={() => setLevel(item.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 1fr",
                  gap: 8,
                  padding: "8px 10px",
                  background: level === item.id ? "var(--surface-alt)" : "transparent",
                  border: "1px solid " + (level === item.id ? "var(--divider)" : "transparent"),
                  borderLeft: "2px solid " + (level === item.id ? "var(--primary)" : "transparent"),
                  color: "var(--fg1)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left"
                }}
              >
                <span className="mono">{item.label}</span>
                <span>
                  <span>{item.detail}</span>
                  <span style={{ display: "block", color: "var(--fg3)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{item.dof}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Overline style={{ marginBottom: 12 }}>Trace variants</Overline>
          <div style={{ display: "grid", gap: 8 }}>
            {variants.map(variant => (
              <label key={variant.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={visibleVariants.includes(variant.id)}
                  onChange={() => toggleVariant(variant.id)}
                />
                <span>{variant.label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      <main style={{ minWidth: 0 }}>
        <PlotPanel
          title={`${rb3Metrics.find(item => item.id === metric)?.label} · ${rb3Levels.find(item => item.id === level)?.label}`}
          meta={`${visibleTraces.length} Plotly traces · real RB3 JSON`}
        >
          {loading && <div style={{ color: "var(--fg2)" }}>Loading plot data...</div>}
          {error && <div style={{ color: "var(--warn)" }}>{error}</div>}
          {!loading && !error && (
            <Suspense fallback={<div style={{ color: "var(--fg2)" }}>Loading Plotly...</div>}>
              <Plot
                data={visibleTraces}
                layout={themedLayout(metric)}
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

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "We provide the computational details of a 3D multiphase flow benchmark problem which follows its well-established 2D counterpart. The 3D benchmark uses no-slip boundary conditions on the channel sides, unlike the free-slip side boundaries of the original 2D setup."
          },
          {
            type: "paragraph",
            text:
              "Meshes of different refinement levels are used in the computations. The refinement levels are created by regular refinement of the same base mesh. The table lists the problem resolution, mesh resolution, number of elements, number of Q2 degrees of freedom, and total degrees of freedom."
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <DataTable
          columns={[
            { id: "lvl", header: "Level", render: row => row.lvl },
            { id: "mx", header: "mx", align: "right", render: row => row.mx },
            { id: "my", header: "my", align: "right", render: row => row.my },
            { id: "mz", header: "mz", align: "right", render: row => row.mz },
            { id: "nx", header: "nx", align: "right", render: row => row.nx },
            { id: "ny", header: "ny", align: "right", render: row => row.ny },
            { id: "nz", header: "nz", align: "right", render: row => row.nz },
            { id: "nel", header: "NEL", align: "right", render: row => row.nel.toLocaleString() },
            { id: "nq2", header: "#Q2", align: "right", render: row => row.nq2.toLocaleString() },
            { id: "tdof", header: "Total DOF", align: "right", render: row => row.tdof.toLocaleString() }
          ]}
          rows={rb3MeshRows}
          getRowKey={row => String(row.lvl)}
        />
      </div>
      <VideoBlock src={rb3VideoAsset} title="Video Rising Bubble 3D" />
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and flow configurations" },
          {
            type: "paragraph",
            text:
              "The initial configuration consists of a circular bubble of radius centered at the middle of a 1 by 2 cuboid domain. The density of the bubble is smaller than that of the surrounding fluid. No-slip boundary conditions are used on all boundaries."
          },
          { type: "equation", value: "$r_0 = 0.25,\\quad (x,y) = (0.5, 0.5)$", block: true },
          { type: "equation", value: "$(\\rho_1 < \\rho_2),\\quad \\mathbf{u}=0$", block: true }
        ]}
      />
      <Figure src={rb3GeometryAsset} alt="Initial 3D rising bubble geometry and boundary conditions" caption="Initial configuration and boundary conditions for the 3D rising bubble benchmark." />
      <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
        The table below lists the fluid and physical parameters. The evolution of the bubble is tracked for 3 time units. The test case models a rising bubble with Reynolds number <Equation>$Re=35$</Equation>, Eötvös number <Equation>$Eo=10$</Equation>, and density and viscosity ratios equal to 10.
      </p>
      <DataTable
        columns={[
          { id: "position", header: "Test case", render: row => row.position },
          { id: "p1", header: "rho1", align: "right", render: row => row.p1 },
          { id: "p2", header: "rho2", align: "right", render: row => row.p2 },
          { id: "mu1", header: "mu1", align: "right", render: row => row.mu1 },
          { id: "mu2", header: "mu2", align: "right", render: row => row.mu2 },
          { id: "g", header: "g", align: "right", render: row => row.g },
          { id: "sigma", header: "sigma", align: "right", render: row => row.sigma },
          { id: "re", header: "Re", align: "right", render: row => row.re },
          { id: "eo", header: "Eo", align: "right", render: row => row.eo },
          { id: "rel", header: "rho1/rho2", align: "right", render: row => row.rel },
          { id: "relmu", header: "mu1/mu2", align: "right", render: row => row.relmu }
        ]}
        rows={rb3PhysicalRows}
        getRowKey={row => String(row.position)}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 22 }}>
        <div>
          <h3>Bubble Size</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Bubble size is measured in the rise direction and perpendicular directions, normalized by the initial bubble size.
          </p>
          <Equation block>{"$R_z / R_0,\\quad R_{x,y} / R_0$"}</Equation>
        </div>
        <div>
          <h3>Bubble Sphericity</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The degree of sphericity compares the initial equivalent spherical surface area with the current interfacial area.
          </p>
          <Equation block>{"$\\frac{A_0}{A} = \\frac{4\\pi R_0^2}{A}$"}</Equation>
        </div>
        <div>
          <h3>Rise Velocity</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The mean velocity of the bubble is integrated over the occupied bubble region.
          </p>
          <Equation block>{"$\\mathbf{U}_c = \\frac{\\int_{\\Omega_2} \\mathbf{u}\\;\\mathrm{d}x}{\\int_{\\Omega_2} 1\\;\\mathrm{d}x}$"}</Equation>
        </div>
      </div>
    </Section>
  );
}

function ResultsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <Rb3ComparisonPanel />
    </Section>
  );
}

function ReferenceDataTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 100 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Reference Data Format Description for Plotly Visualization" },
          {
            type: "paragraph",
            text:
              "The data is structured as a JSON array where each element contains Plotly traces for one spatial resolution. Each trace represents a different time resolution or, for size data, one component of a paired size curve."
          },
          {
            type: "paragraph",
            text:
              "The top-level array represents increasing spatial resolution from coarse to fine. Each trace contains x-values, y-values, Plotly type metadata, a name, and marker styling."
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <DownloadTable items={rb3Downloads} />
      </div>
    </Section>
  );
}

export function RisingBubble3DPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("introduction");
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "reference-data", label: "Reference Data" }
  ];

  return (
    <div>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)", padding: "24px 0" }}>
        <Section>
          <button
            type="button"
            className="focus-ring"
            onClick={() => navigate("/benchmarks")}
            style={{ display: "flex", alignItems: "center", gap: 6, border: 0, background: "transparent", color: "var(--fg2)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, marginBottom: 12 }}
          >
            <Icon name="arrow_back" size={14} /> Catalogue / Two-Phase / RB3
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">RB3</Chip>
                <Chip>Two-Phase</Chip>
                <Chip>3D</Chip>
                <Chip>Real Plotly Data</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Rising Bubble <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>3D</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
                A three-dimensional multiphase benchmark for a single bubble rising through a viscous medium. The migrated results compare FeatFloWer refinement levels L1-L3 across four real metrics.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Levels" value="3" />
              <KpiBox label="Metrics" value="4" />
              <KpiBox label="Re" value="35" />
              <KpiBox label="rho1/rho2" value="10" />
              <KpiBox label="mu1/mu2" value="10" />
              <KpiBox label="Time" value="0-3s" />
            </div>
          </div>
        </Section>
      </div>

      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}>
        <Section>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </Section>
      </div>

      {tab === "introduction" && <IntroductionTab />}
      {tab === "definition" && <DefinitionTab />}
      {tab === "results" && <ResultsTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
