// ===== Gallery placeholder =====
import { benchmarks } from "./data/benchmarks";
import { Chip, FlowCanvas, MeshThumb, Overline } from "./Primitives.jsx";

export const Gallery = () => {
  return (
    <div>
      <div style={{ borderBottom: "1px solid var(--divider)", padding: "48px 0 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
          <FlowCanvas palette="mixed" density={60} speed={0.5}/>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, var(--bg) 100%)" }}/>
        <div className="section" style={{ position: "relative" }}>
          <Overline style={{ marginBottom: 16 }}>Gallery · placeholder</Overline>
          <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", margin: 0 }}>
            Visual results will use <span style={{ color: "var(--primary)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>real</span> assets.
          </h1>
          <p style={{ fontSize: 17, color: "var(--fg2)", margin: "16px 0 0", maxWidth: 680, lineHeight: 1.55 }}>
            The original redesign gallery used synthetic cards. It is now kept as a
            placeholder until benchmark-specific visual assets are mapped from the
            Angular project or generated from real result data.
          </p>
        </div>
      </div>

      <div className="section" style={{ padding: "40px 48px 120px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {benchmarks.map((benchmark, index) => (
            <div key={benchmark.id} className="card" style={{ padding: 0, overflow: "hidden", opacity: 0.72 }}>
              <div style={{ aspectRatio: "1.5/1", background: "var(--bg)" }}>
                <MeshThumb variant={index} shape={benchmark.thumb}/>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <Chip tone="solid">{benchmark.tag}</Chip>
                  <Chip>placeholder</Chip>
                </div>
                <h2 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 500 }}>{benchmark.shortTitle}</h2>
                <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  Real gallery imagery for this benchmark has not been migrated yet.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

