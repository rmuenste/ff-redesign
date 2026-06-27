// ===== Benchmarks index =====

const BENCHMARKS = [
  { id: "rb3",  tag: "RB3", title: "Rising Bubble 3D",           model: "Two-Phase",  dim: "3D", re: 35,   levels: 3, codes: 6, variant: 1, delta: -0.01, status: "passing" },
  { id: "rb2a", tag: "RB2", title: "Rising Bubble 2D · Case 1",  model: "Two-Phase",  dim: "2D", re: 35,   levels: 3, codes: 5, variant: 1, delta: 0.02,  status: "passing" },
  { id: "rb2b", tag: "RB2", title: "Rising Bubble 2D · Case 2",  model: "Two-Phase",  dim: "2D", re: 125,  levels: 3, codes: 5, variant: 1, delta: -0.03, status: "passing" },
  { id: "fac3", tag: "FAC", title: "Flow Around Cylinder 3D",    model: "Newtonian",  dim: "3D", re: 100,  levels: 4, codes: 8, variant: 0, delta: 0.01,  status: "passing" },
  { id: "fac2", tag: "FAC", title: "Flow Around Cylinder 2D",    model: "Newtonian",  dim: "2D", re: 100,  levels: 4, codes: 8, variant: 0, delta: 0.00,  status: "passing" },
  { id: "sed3", tag: "SED", title: "Particle Sedimentation 3D",  model: "Particulate",dim: "3D", re: 40,   levels: 2, codes: 4, variant: 2, delta: -0.04, status: "passing" },
  { id: "sed2", tag: "SED", title: "Particle Sedimentation 2D",  model: "Particulate",dim: "2D", re: 40,   levels: 3, codes: 4, variant: 2, delta: -0.02, status: "passing" },
  { id: "chn",  tag: "CHN", title: "Poiseuille · Carreau",       model: "Non-Newt.",  dim: "2D", re: 10,   levels: 2, codes: 3, variant: 3, delta: 0.00,  status: "passing" },
  { id: "chn2", tag: "CHN", title: "Poiseuille · Power-Law",     model: "Non-Newt.",  dim: "2D", re: 10,   levels: 2, codes: 3, variant: 3, delta: 0.00,  status: "passing" },
  { id: "bfs",  tag: "BFS", title: "Backward-Facing Step",       model: "Newtonian",  dim: "2D", re: 800,  levels: 3, codes: 5, variant: 3, delta: 0.03,  status: "drift"   },
  { id: "ves",  tag: "VES", title: "Die-Swell · Visco-Elastic",  model: "Visco-El.",  dim: "2D", re: 5,    levels: 2, codes: 3, variant: 3, delta: 0.08,  status: "drift"   },
  { id: "led",  tag: "LED", title: "Lid-Driven Cavity 3D",       model: "Newtonian",  dim: "3D", re: 1000, levels: 3, codes: 6, variant: 0, delta: 0.01,  status: "passing" },
];

const BenchmarksIndex = ({ setRoute }) => {
  const [model, setModel] = React.useState("All");
  const [dim, setDim] = React.useState("All");
  const [reRange, setReRange] = React.useState([0, 1000]);
  const [layout, setLayout] = React.useState("grid");
  const [search, setSearch] = React.useState("");
  const [compareSelection, setCompareSelection] = React.useState([]);

  const models = ["All", "Newtonian", "Non-Newt.", "Two-Phase", "Particulate", "Visco-El."];
  const dims = ["All", "2D", "3D"];

  const filtered = BENCHMARKS.filter(b => (
    (model === "All" || b.model === model) &&
    (dim === "All" || b.dim === dim) &&
    b.re >= reRange[0] && b.re <= reRange[1] &&
    (search === "" || b.title.toLowerCase().includes(search.toLowerCase()) || b.tag.toLowerCase().includes(search.toLowerCase()))
  ));

  const toggleCompare = (id) => {
    setCompareSelection(cs => cs.includes(id) ? cs.filter(x => x !== id) : cs.length < 3 ? [...cs, id] : cs);
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ borderBottom: "1px solid var(--divider)", padding: "48px 0 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
          <FlowCanvas palette="petrol" density={50} speed={0.6}/>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, var(--bg) 90%)" }} />
        <div className="section" style={{ position: "relative" }}>
          <Overline style={{ marginBottom: 16 }}>Catalogue · 28 configurations · Run daily</Overline>
          <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", margin: "0 0 16px", color: "var(--fg1)" }}>
            Benchmarks<span style={{ color: "var(--primary)" }}>.</span>
          </h1>
          <p style={{ fontSize: 17, color: "var(--fg2)", margin: 0, maxWidth: 680 }}>
            Every benchmark below is an end-to-end executable reference. Filter by physics.
            Select up to three to <span style={{ color: "var(--primary)" }}>compare side-by-side</span>.
          </p>
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ borderBottom: "1px solid var(--divider)", padding: "16px 0", position: "sticky", top: 64, background: "color-mix(in oklab, var(--bg) 92%, transparent)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        <div className="section" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-alt)", padding: "6px 12px", borderRadius: 4, minWidth: 240 }}>
            <Icon name="search" size={16} style={{ color: "var(--fg3)" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search configurations…"
              style={{ background: "transparent", border: 0, outline: "none", color: "var(--fg1)", fontSize: 13, width: "100%", fontFamily: "inherit" }}/>
          </div>
          <FilterGroup label="Model" options={models} value={model} onChange={setModel}/>
          <FilterGroup label="Dim" options={dims} value={dim} onChange={setDim}/>

          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)" }}>
            <span style={{ color: "var(--fg3)", letterSpacing: ".14em", textTransform: "uppercase", fontSize: 10 }}>Re</span>
            <span>{reRange[0]}</span>
            <div style={{ width: 140, position: "relative" }}>
              <input type="range" className="tu" min={0} max={1000} step={10} value={reRange[1]}
                onChange={e => setReRange([0, +e.target.value])}/>
            </div>
            <span>{reRange[1]}</span>
          </div>

          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", border: "1px solid var(--divider)", borderRadius: 4, overflow: "hidden" }}>
            {["grid", "table"].map(l => (
              <button key={l} onClick={() => setLayout(l)} style={{
                border: 0, padding: "6px 12px", background: layout === l ? "var(--surface-alt)" : "transparent",
                color: layout === l ? "var(--fg1)" : "var(--fg2)", cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <Icon name={l === "grid" ? "grid_view" : "view_list"} size={14}/>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compare tray */}
      {compareSelection.length > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface)", border: "1px solid var(--primary)", borderRadius: 4,
          padding: "12px 20px", display: "flex", alignItems: "center", gap: 20,
          boxShadow: "var(--shadow-3)", zIndex: 50,
        }}>
          <Overline>Compare ·</Overline>
          <div style={{ display: "flex", gap: 8 }}>
            {compareSelection.map(id => {
              const b = BENCHMARKS.find(x => x.id === id);
              return <Chip key={id} tone="solid">{b.tag} {b.title.slice(0, 16)}</Chip>;
            })}
          </div>
          <Btn variant="primary" size="sm" onClick={() => setRoute("detail")} trailing={<Icon name="arrow_forward" size={14}/>}>Open comparison</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setCompareSelection([])}>Clear</Btn>
        </div>
      )}

      <div className="section" style={{ padding: "40px 48px 160px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <div className="overline">{filtered.length} of {BENCHMARKS.length} shown</div>
          <div className="overline">
            {compareSelection.length}/3 selected to compare
          </div>
        </div>

        {layout === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filtered.map(b => (
              <BenchmarkCard key={b.id} b={b} selected={compareSelection.includes(b.id)}
                onOpen={() => setRoute("detail")}
                onToggleCompare={() => toggleCompare(b.id)} />
            ))}
          </div>
        ) : (
          <BenchmarkTable rows={filtered} selection={compareSelection} toggle={toggleCompare} onOpen={() => setRoute("detail")}/>
        )}
      </div>
    </div>
  );
};

const FilterGroup = ({ label, options, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fg3)" }}>{label}</span>
    <div style={{ display: "flex", gap: 2, border: "1px solid var(--divider)", borderRadius: 4, padding: 2 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          border: 0, background: value === o ? "var(--primary)" : "transparent",
          color: value === o ? "var(--on-primary)" : "var(--fg2)",
          padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer", fontFamily: "inherit",
          fontWeight: value === o ? 500 : 400, transition: "all 160ms",
        }}>{o}</button>
      ))}
    </div>
  </div>
);

const BenchmarkCard = ({ b, selected, onOpen, onToggleCompare }) => (
  <div className={"card card-interactive"} style={{
    padding: 0, overflow: "hidden", display: "flex", flexDirection: "column",
    borderColor: selected ? "var(--primary)" : "var(--divider)",
    boxShadow: selected ? "0 0 0 1px var(--primary)" : "none",
  }}>
    <div style={{ aspectRatio: "1.6/1", position: "relative", background: "var(--bg)" }} onClick={onOpen}>
      <MeshThumb variant={b.variant}/>
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
        <Chip tone="solid">{b.tag}</Chip>
        <Chip>{b.dim}</Chip>
      </div>
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <button onClick={e => { e.stopPropagation(); onToggleCompare(); }} style={{
          width: 24, height: 24, borderRadius: 4, border: "1px solid " + (selected ? "var(--primary)" : "var(--divider)"),
          background: selected ? "var(--primary)" : "color-mix(in oklab, var(--bg) 75%, transparent)",
          color: selected ? "var(--on-primary)" : "var(--fg2)",
          cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}>
          <Icon name={selected ? "check" : "add"} size={14}/>
        </button>
      </div>
    </div>
    <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }} onClick={onOpen}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{b.title}</div>
      <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 16 }}>
        {b.model} · Re = {b.re}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--divider)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>
        <div>L1·L{b.levels}</div>
        <div>{b.codes} codes</div>
        <div style={{ color: Math.abs(b.delta) < 0.02 ? "var(--tu-green-400)" : "var(--tu-orange-500)", textAlign: "right" }}>
          Δ {b.delta > 0 ? "+" : ""}{b.delta}%
        </div>
      </div>
    </div>
  </div>
);

const BenchmarkTable = ({ rows, selection, toggle, onOpen }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
    <thead>
      <tr style={{ textAlign: "left" }}>
        {["", "Tag", "Title", "Model", "Dim", "Re", "Levels", "Codes", "Δ ref", "Status"].map(h => (
          <th key={h} style={{ padding: "12px 10px", borderBottom: "1px solid var(--divider)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fg3)", fontWeight: 500 }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(b => {
        const sel = selection.includes(b.id);
        return (
          <tr key={b.id} style={{ borderBottom: "1px solid var(--divider)", cursor: "pointer", background: sel ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "transparent" }}
            onClick={() => onOpen()}>
            <td style={{ padding: "10px" }} onClick={e => { e.stopPropagation(); toggle(b.id); }}>
              <div style={{
                width: 18, height: 18, borderRadius: 3, border: "1px solid " + (sel ? "var(--primary)" : "var(--divider)"),
                background: sel ? "var(--primary)" : "transparent",
                color: "var(--on-primary)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                {sel && <Icon name="check" size={12}/>}
              </div>
            </td>
            <td style={{ padding: "10px" }}><Chip tone="solid">{b.tag}</Chip></td>
            <td style={{ padding: "10px", fontWeight: 500 }}>{b.title}</td>
            <td style={{ padding: "10px", color: "var(--fg2)" }}>{b.model}</td>
            <td style={{ padding: "10px", color: "var(--fg2)" }}>{b.dim}</td>
            <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>{b.re}</td>
            <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>L1–L{b.levels}</td>
            <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>{b.codes}</td>
            <td style={{ padding: "10px", fontFamily: "var(--font-mono)", color: Math.abs(b.delta) < 0.02 ? "var(--tu-green-400)" : "var(--tu-orange-500)" }}>{b.delta > 0 ? "+" : ""}{b.delta}%</td>
            <td style={{ padding: "10px" }}>
              <Chip tone={b.status === "passing" ? "default" : "accent"}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: b.status === "passing" ? "var(--tu-green-400)" : "var(--tu-orange-500)" }}/>
                {b.status}
              </Chip>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

Object.assign(window, { BenchmarksIndex, BENCHMARKS_DATA: BENCHMARKS });
