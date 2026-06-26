// ===== Gallery of simulation results =====

const GALLERY_ITEMS = [
  { id: "g1", title: "Rising Bubble · t=1.8s", benchmark: "RB3", code: "FeatFloWer", meta: "L3 · Q2/P1", variant: 1, accent: "var(--tu-green-500)" },
  { id: "g2", title: "Vortex shedding at Re=100", benchmark: "FAC", code: "FeatFloWer", meta: "L4 · adaptive", variant: 0, accent: "var(--tu-petrol-500)" },
  { id: "g3", title: "240-particle sedimentation", benchmark: "SED", code: "FeatFloWer", meta: "L3 · DLM/FD", variant: 2, accent: "var(--tu-orange-500)" },
  { id: "g4", title: "Carreau channel · shear profile", benchmark: "CHN", code: "FeatFloWer", meta: "L2 · analytical ref", variant: 3, accent: "var(--tu-yellow-500)" },
  { id: "g5", title: "Die-swell visco-elastic", benchmark: "VES", code: "FeatFloWer", meta: "L2 · Oldroyd-B", variant: 3, accent: "var(--tu-violet-500)" },
  { id: "g6", title: "Backward-facing step · reattachment", benchmark: "BFS", code: "FeatFloWer", meta: "L3 · Re 800", variant: 3, accent: "var(--tu-petrol-400)" },
  { id: "g7", title: "Lid-driven cavity · corner vortex", benchmark: "LED", code: "FeatFloWer", meta: "L3 · Re 1000", variant: 0, accent: "var(--tu-green-500)" },
  { id: "g8", title: "Two-phase jet breakup", benchmark: "RB2", code: "FeatFloWer", meta: "L3 · CLSVOF", variant: 1, accent: "var(--tu-green-500)" },
];

const Gallery = () => {
  const [filter, setFilter] = React.useState("All");
  const [active, setActive] = React.useState(null);
  const tags = ["All", "RB3", "RB2", "FAC", "SED", "CHN", "VES", "BFS", "LED"];
  const items = filter === "All" ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.benchmark === filter);

  return (
    <div>
      <div style={{ borderBottom: "1px solid var(--divider)", padding: "48px 0 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
          <FlowCanvas palette="mixed" density={60} speed={0.5}/>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, var(--bg) 100%)" }}/>
        <div className="section" style={{ position: "relative" }}>
          <Overline style={{ marginBottom: 16 }}>Gallery · selected results</Overline>
          <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", margin: 0 }}>
            The <span style={{ color: "var(--primary)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>pictures</span> behind the numbers.
          </h1>
          <p style={{ fontSize: 17, color: "var(--fg2)", margin: "16px 0 0", maxWidth: 640 }}>
            Snapshots, streamline fields, and mesh visualisations from the current
            benchmark catalogue. Each image links back to its run and raw data.
          </p>
        </div>
      </div>

      <div className="section" style={{ padding: "32px 48px 120px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
          {tags.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 12,
              border: "1px solid " + (filter === t ? "transparent" : "var(--divider)"),
              background: filter === t ? "var(--primary)" : "transparent",
              color: filter === t ? "var(--on-primary)" : "var(--fg2)",
              cursor: "pointer", fontFamily: "var(--font-mono)", letterSpacing: ".06em", textTransform: "uppercase",
              transition: "all 160ms",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ columnCount: 3, columnGap: 20 }}>
          {items.map((it, i) => (
            <div key={it.id} onClick={() => setActive(it)}
              className="card card-interactive fade-up"
              style={{
                breakInside: "avoid",
                marginBottom: 20,
                padding: 0, overflow: "hidden",
                animationDelay: `${i * 40}ms`,
              }}>
              <div style={{ aspectRatio: i % 3 === 1 ? "1/1.2" : i % 3 === 2 ? "1/0.7" : "1/0.9", position: "relative", background: "var(--bg)" }}>
                <MeshThumb variant={it.variant}/>
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--bg) 92%, transparent))`,
                }}/>
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <Chip tone="solid">{it.benchmark}</Chip>
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: "var(--fg1)" }}>{it.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg2)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                    {it.code} · {it.meta}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {active && (
        <div onClick={() => setActive(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 48,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--surface)", border: "1px solid var(--divider)",
            maxWidth: 1100, width: "100%", borderRadius: 4, overflow: "hidden",
            display: "grid", gridTemplateColumns: "2fr 1fr",
          }}>
            <div style={{ background: "var(--bg)", aspectRatio: "1.4/1" }}>
              <MeshThumb variant={active.variant}/>
            </div>
            <div style={{ padding: 32 }}>
              <Chip tone="solid" style={{ marginBottom: 16 }}>{active.benchmark}</Chip>
              <h2 style={{ fontSize: 28, fontWeight: 300, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{active.title}</h2>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)", marginBottom: 24, letterSpacing: ".08em", textTransform: "uppercase" }}>
                {active.code} · {active.meta}
              </div>
              <p style={{ fontSize: 14, color: "var(--fg2)", lineHeight: 1.6, marginBottom: 24 }}>
                Rendered from run <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg1)" }}>2026-04-22 03:14 UTC</span>{" "}
                on <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg1)" }}>rev c3f82a1</span>.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn variant="primary" leading={<Icon name="download" size={14}/>}>Download raw field (VTK)</Btn>
                <Btn variant="stroked" leading={<Icon name="image" size={14}/>}>Save as PNG</Btn>
                <Btn variant="ghost" leading={<Icon name="open_in_new" size={14}/>}>Open benchmark</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.Gallery = Gallery;
