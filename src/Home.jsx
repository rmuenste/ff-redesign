// ===== Home / landing =====
import { useNavigate } from "react-router-dom";
import { benchmarks } from "./data/benchmarks";
import { Btn, Chip, FlowCanvas, Icon, MeshThumb, Overline } from "./Primitives.jsx";

export const Home = () => {
  const navigate = useNavigate();
  const openBenchmark = benchmark => {
    navigate(`/benchmarks/${benchmark.slug}`);
  };

  return (
    <div>
      <section style={{ position: "relative", minHeight: 620, overflow: "hidden", borderBottom: "1px solid var(--divider)" }}>
        <div className="flow-canvas" style={{ opacity: 0.7 }}>
          <FlowCanvas palette="mixed" density={110} speed={0.9} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, transparent 45%, var(--bg) 100%)", pointerEvents: "none" }} />
        <div className="section" style={{ position: "relative", paddingTop: 96, paddingBottom: 80 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 72 }}>
            <Overline>FeatFloWer · CFD benchmark suite</Overline>
            <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)" }}>
              <span>{benchmarks.length} benchmarks</span><span>·</span><span>2D & 3D</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 64, alignItems: "end" }}>
            <div>
              <Chip tone="solid" style={{ marginBottom: 24 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, background: "currentColor", borderRadius: 999 }}/>
                Real benchmark content
              </Chip>
              <h1 className="display" style={{ fontSize: "clamp(56px, 7vw, 104px)", margin: "0 0 28px", color: "var(--fg1)" }}>
                Flow problems,<br/>
                <span style={{ color: "var(--primary)", fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 400 }}>measured</span>
                <span style={{ color: "var(--fg2)" }}> and </span>
                <span style={{ color: "var(--primary)", fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 400 }}>compared</span>.
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg2)", maxWidth: 600, margin: "0 0 36px", textWrap: "pretty" }}>
                FeatFloWer benchmarks document validated flow simulations — rising
                bubbles, flow around a cylinder, particle sedimentation — with precise
                problem definitions, interactive result plots, and downloadable
                reference data.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Btn variant="primary" size="lg" onClick={() => navigate("/benchmarks")} trailing={<Icon name="arrow_forward" size={16}/>}>
                  Browse benchmarks
                </Btn>
                <Btn variant="stroked" size="lg" onClick={() => navigate("/benchmarks/bubble3")} leading={<Icon name="science" size={16}/>}>
                  Open Rising Bubble 3D
                </Btn>
              </div>
            </div>

            <div className="card" style={{ padding: 20, background: "color-mix(in oklab, var(--surface) 75%, transparent)", backdropFilter: "blur(10px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Overline>Benchmark overview</Overline>
                <Chip tone="default">
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "var(--tu-green-400)" }} />
                  results online
                </Chip>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {benchmarks.map(benchmark => (
                  <div
                    key={benchmark.id}
                    onClick={() => benchmark.status === "active" && openBenchmark(benchmark)}
                    style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--divider)", cursor: benchmark.status === "active" ? "pointer" : "default" }}
                  >
                    <Chip tone={benchmark.status === "active" ? "solid" : "ghost"}>{benchmark.tag}</Chip>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{benchmark.shortTitle}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", marginTop: 2 }}>{benchmark.model} · {benchmark.dimension}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: benchmark.status === "active" ? "var(--tu-green-400)" : "var(--fg3)" }}>
                      Re = {benchmark.reynolds ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: "96px 48px" }}>
        <div className="section-marker">I · Capabilities</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 96, marginBottom: 64 }}>
          <h2 className="h-editorial" style={{ fontSize: "clamp(38px, 4vw, 60px)", margin: 0 }}>
            A benchmark site built around <em style={{ color: "var(--primary)" }}>traceable</em> data.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--fg2)", alignSelf: "end", margin: 0, textWrap: "pretty" }}>
            Every benchmark page is source-backed: precise problem definitions,
            structured content, and interactive Plotly views computed from the
            published reference data.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--divider)", border: "1px solid var(--divider)" }}>
          {[
            ["Structured content", "Benchmark pages are modeled as typed tabs, blocks, tables, figures, downloads, and references."],
            ["Interactive plots", "Result views render the benchmark reference data as live Plotly traces with zoom, series toggles, and comparisons."],
            ["Comparison first", "The detail-page pattern supports level, code, and reference comparisons as reusable UI."],
          ].map(([title, desc], index) => (
            <div key={title} style={{ background: "var(--bg)", padding: 32, minHeight: 260 }}>
              <Overline style={{ marginBottom: 24 }}>0{index + 1}</Overline>
              <h3 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 16px" }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--fg2)", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--surface-alt)", padding: "96px 0", borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)" }}>
        <div className="section">
          <div className="section-marker">II · Benchmarks</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {benchmarks.map((benchmark, index) => (
              <div key={benchmark.id} className={"card" + (benchmark.status === "active" ? " card-interactive" : "")} onClick={() => benchmark.status === "active" && openBenchmark(benchmark)} style={{ overflow: "hidden", opacity: benchmark.status === "active" ? 1 : 0.62 }}>
                <div style={{ aspectRatio: "1.5/1", background: "var(--bg)" }}>
                  <MeshThumb variant={index} shape={benchmark.thumb}/>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <Chip tone="solid">{benchmark.tag}</Chip>
                    <Chip>{benchmark.status}</Chip>
                  </div>
                  <h3 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 500 }}>{benchmark.shortTitle}</h3>
                  <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{benchmark.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
