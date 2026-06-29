// ===== Benchmarks index =====
import React from "react";
import { useNavigate } from "react-router-dom";
import { benchmarks } from "./data/benchmarks";
import { Chip, FlowCanvas, Icon, MeshThumb, Overline } from "./Primitives.jsx";

const dims = ["All", "2D", "3D"];
const models = ["All", "Two-Phase", "Newtonian", "Particulate"];

export const BenchmarksIndex = () => {
  const navigate = useNavigate();
  const [dim, setDim] = React.useState("All");
  const [model, setModel] = React.useState("All");
  const [layout, setLayout] = React.useState("grid");
  const [search, setSearch] = React.useState("");

  const filtered = benchmarks.filter(benchmark => (
    (dim === "All" || benchmark.dimension === dim) &&
    (model === "All" || benchmark.model === model) &&
    (
      search === "" ||
      benchmark.title.toLowerCase().includes(search.toLowerCase()) ||
      benchmark.tag.toLowerCase().includes(search.toLowerCase())
    )
  ));

  const openBenchmark = benchmark => {
    navigate(`/benchmarks/${benchmark.slug}`);
  };

  return (
    <div>
      <div style={{ borderBottom: "1px solid var(--divider)", padding: "48px 0 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
          <FlowCanvas palette="petrol" density={50} speed={0.6}/>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, var(--bg) 90%)" }} />
        <div className="section" style={{ position: "relative" }}>
          <Overline style={{ marginBottom: 16 }}>Catalogue · migrated from FF-Angular source data</Overline>
          <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", margin: "0 0 16px", color: "var(--fg1)" }}>
            Benchmarks<span style={{ color: "var(--primary)" }}>.</span>
          </h1>
          <p style={{ fontSize: 17, color: "var(--fg2)", margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
            The catalogue now shows the four benchmark pages backed by the Angular project.
            All listed benchmarks are active and backed by migrated content, curated assets,
            and real result data.
          </p>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid var(--divider)", padding: "16px 0", position: "sticky", top: 64, background: "color-mix(in oklab, var(--bg) 92%, transparent)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        <div className="section" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-alt)", padding: "6px 12px", borderRadius: 4, minWidth: 240 }}>
            <Icon name="search" size={16} style={{ color: "var(--fg3)" }}/>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search benchmarks..."
              style={{ background: "transparent", border: 0, outline: "none", color: "var(--fg1)", fontSize: 13, width: "100%", fontFamily: "inherit" }}/>
          </div>
          <FilterGroup label="Model" options={models} value={model} onChange={setModel}/>
          <FilterGroup label="Dim" options={dims} value={dim} onChange={setDim}/>
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", border: "1px solid var(--divider)", borderRadius: 4, overflow: "hidden" }}>
            {["grid", "table"].map(option => (
              <button key={option} onClick={() => setLayout(option)} style={{
                border: 0,
                padding: "6px 12px",
                background: layout === option ? "var(--surface-alt)" : "transparent",
                color: layout === option ? "var(--fg1)" : "var(--fg2)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}>
                <Icon name={option === "grid" ? "grid_view" : "view_list"} size={14}/>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section" style={{ padding: "40px 48px 160px" }}>
        <div className="overline" style={{ marginBottom: 24 }}>{filtered.length} of {benchmarks.length} shown</div>
        {layout === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filtered.map((benchmark, index) => (
              <BenchmarkCard
                key={benchmark.id}
                benchmark={benchmark}
                variant={index}
                onOpen={() => openBenchmark(benchmark)}
              />
            ))}
          </div>
        ) : (
          <BenchmarkTable rows={filtered} onOpen={openBenchmark}/>
        )}
      </div>
    </div>
  );
};

const FilterGroup = ({ label, options, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fg3)" }}>{label}</span>
    <div style={{ display: "flex", gap: 2, border: "1px solid var(--divider)", borderRadius: 4, padding: 2 }}>
      {options.map(option => (
        <button key={option} onClick={() => onChange(option)} style={{
          border: 0,
          background: value === option ? "var(--primary)" : "transparent",
          color: value === option ? "var(--on-primary)" : "var(--fg2)",
          padding: "4px 10px",
          fontSize: 11,
          borderRadius: 2,
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: value === option ? 500 : 400
        }}>{option}</button>
      ))}
    </div>
  </div>
);

const BenchmarkCard = ({ benchmark, variant, onOpen }) => {
  const active = benchmark.status === "active";
  return (
    <div className={"card" + (active ? " card-interactive" : "")} style={{ padding: 0, overflow: "hidden", opacity: active ? 1 : 0.62 }} onClick={active ? onOpen : undefined}>
      <div style={{ aspectRatio: "1.6/1", position: "relative", background: "var(--bg)" }}>
        <MeshThumb variant={variant}/>
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
          <Chip tone="solid">{benchmark.tag}</Chip>
          <Chip>{benchmark.dimension}</Chip>
        </div>
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Chip tone={active ? "default" : "ghost"}>{active ? "Migrated" : "Planned"}</Chip>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{benchmark.shortTitle}</div>
        <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 14 }}>
          {benchmark.model} · Re = {benchmark.reynolds ?? "n/a"}
        </div>
        <p style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.5, margin: 0 }}>{benchmark.summary}</p>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--divider)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>
          <div>{benchmark.levels ? `L1-L${benchmark.levels}` : "levels n/a"}</div>
          <div>{benchmark.comparisonAxis ? `${benchmark.comparisonAxis} axis` : "content"}</div>
          <div style={{ textAlign: "right", color: active ? "var(--tu-green-400)" : "var(--fg3)" }}>{benchmark.status}</div>
        </div>
      </div>
    </div>
  );
};

const BenchmarkTable = ({ rows, onOpen }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
    <thead>
      <tr style={{ textAlign: "left" }}>
        {["Tag", "Title", "Model", "Dim", "Re", "Levels", "Axis", "Status"].map(header => (
          <th key={header} style={{ padding: "12px 10px", borderBottom: "1px solid var(--divider)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fg3)", fontWeight: 500 }}>{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(benchmark => (
        <tr key={benchmark.id} style={{ borderBottom: "1px solid var(--divider)", cursor: benchmark.status === "active" ? "pointer" : "default", opacity: benchmark.status === "active" ? 1 : 0.62 }} onClick={() => benchmark.status === "active" && onOpen(benchmark)}>
          <td style={{ padding: "10px" }}><Chip tone="solid">{benchmark.tag}</Chip></td>
          <td style={{ padding: "10px", fontWeight: 500 }}>{benchmark.shortTitle}</td>
          <td style={{ padding: "10px", color: "var(--fg2)" }}>{benchmark.model}</td>
          <td style={{ padding: "10px", color: "var(--fg2)" }}>{benchmark.dimension}</td>
          <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>{benchmark.reynolds ?? "n/a"}</td>
          <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>{benchmark.levels ? `L1-L${benchmark.levels}` : "n/a"}</td>
          <td style={{ padding: "10px", color: "var(--fg2)" }}>{benchmark.comparisonAxis ?? "content"}</td>
          <td style={{ padding: "10px" }}><Chip>{benchmark.status}</Chip></td>
        </tr>
      ))}
    </tbody>
  </table>
);
