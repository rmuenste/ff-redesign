// ===== Benchmark Detail — novel comparison UI with interactive plot =====

const CODES = [
  { id: "ff",   name: "FeatFloWer", color: "var(--tu-green-500)",  type: "FEM · Q2/P1",   us: true },
  { id: "tp2d", name: "TP2D",       color: "var(--tu-petrol-500)", type: "FEM · Q2/Q1" },
  { id: "moon", name: "MooNMD",     color: "var(--tu-orange-500)", type: "FEM · P2/P1-disc" },
  { id: "nast", name: "NaSt3D",     color: "var(--tu-yellow-500)", type: "FVM · SIMPLE" },
  { id: "free", name: "FreeFEM",    color: "var(--tu-violet-500)", type: "FEM · P2/P1" },
  { id: "ref",  name: "Reference",  color: "var(--fg2)",           type: "Analytical",    dash: "4 4" },
];

// Generate a realistic-looking curve per code for "circularity(t)"
const generateSeries = (seed, variance) => {
  const n = 60;
  const arr = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = 0.5 + 0.42 * (1 - Math.exp(-t * 3.8));
    const wobble = Math.sin(t * 12 + seed) * 0.008 + Math.sin(t * 20 + seed * 2) * 0.004;
    arr.push(base + wobble + (Math.random() - 0.5) * variance);
  }
  return arr;
};

const CODE_DATA = CODES.reduce((acc, c, i) => {
  acc[c.id] = generateSeries(i * 1.3, c.us ? 0.0015 : 0.004);
  return acc;
}, {});

const BenchmarkDetail = ({ setRoute }) => {
  const [tab, setTab] = React.useState("Results");
  const [level, setLevel] = React.useState("L3");
  const [activeCodes, setActiveCodes] = React.useState(CODES.map(c => c.id));
  const [metric, setMetric] = React.useState("circularity");
  const [brushRange, setBrushRange] = React.useState([0, 1]);
  const [hoverX, setHoverX] = React.useState(null);
  const [compareMode, setCompareMode] = React.useState("overlay"); // overlay | diff | small-multiples

  const toggle = id => setActiveCodes(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

  return (
    <div>
      {/* Breadcrumb header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)", padding: "24px 0" }}>
        <div className="section">
          <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setRoute("benchmarks")}>
            <Icon name="arrow_back" size={14}/> Catalogue / Two-Phase / RB3
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Chip tone="solid">RB3</Chip>
                <Chip>Two-Phase</Chip>
                <Chip>3D</Chip>
                <Chip>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "var(--tu-green-400)" }}/>
                  passing
                </Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Rising Bubble <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>3D</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 620, lineHeight: 1.55 }}>
                A buoyancy-driven two-phase bubble rising through a viscous medium.
                Canonical interface-tracking benchmark — dimensionless circularity and
                centre-of-mass are compared across codes at three refinement levels.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Δ reference" value="−0.01%" good/>
              <KpiBox label="Levels" value="3"/>
              <KpiBox label="Codes" value="6"/>
              <KpiBox label="Re" value="35"/>
              <KpiBox label="ρ₁/ρ₂" value="10"/>
              <KpiBox label="η₁/η₂" value="10"/>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}>
        <div className="section">
          <div className="tabs">
            {["Results", "Compare", "Definition", "Simulation", "References"].map(t => (
              <div key={t} className="tab" data-active={tab === t} onClick={() => setTab(t)}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="section" style={{ padding: "32px 48px 120px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* LEFT: controls */}
        <aside style={{ position: "sticky", top: 140, alignSelf: "start" }}>
          <div style={{ marginBottom: 28 }}>
            <Overline style={{ marginBottom: 12 }}>Refinement level</Overline>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {["L1", "L2", "L3"].map(l => (
                <button key={l} onClick={() => setLevel(l)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  background: level === l ? "var(--surface-alt)" : "transparent",
                  border: "1px solid " + (level === l ? "var(--divider)" : "transparent"),
                  borderLeft: "2px solid " + (level === l ? "var(--primary)" : "transparent"),
                  color: "var(--fg1)", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left", transition: "all 160ms",
                  borderRadius: 0,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg2)", fontSize: 11 }}>{l}</span>
                  <span style={{ flex: 1 }}>{l === "L1" ? "Coarse" : l === "L2" ? "Medium" : "Fine"}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{l === "L1" ? "0.3M" : l === "L2" ? "2.1M" : "18.4M"}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <Overline style={{ marginBottom: 12 }}>Metric</Overline>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { id: "circularity", label: "Circularity", sub: "c(t)" },
                { id: "mass",        label: "Mass centre",  sub: "y_c(t)" },
                { id: "velocity",    label: "Rise velocity",sub: "v_c(t)" },
              ].map(m => (
                <button key={m.id} onClick={() => setMetric(m.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  background: metric === m.id ? "var(--surface-alt)" : "transparent",
                  border: 0, color: "var(--fg1)", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left", justifyContent: "space-between",
                }}>
                  <span>{m.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <Overline style={{ marginBottom: 12 }}>Codes</Overline>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {CODES.map(c => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                  <button onClick={() => toggle(c.id)} style={{
                    width: 16, height: 16, borderRadius: 3, border: "1.5px solid " + c.color,
                    background: activeCodes.includes(c.id) ? c.color : "transparent",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "var(--on-primary)", cursor: "pointer", padding: 0,
                  }}>
                    {activeCodes.includes(c.id) && <Icon name="check" size={11}/>}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: activeCodes.includes(c.id) ? "var(--fg1)" : "var(--fg3)", fontWeight: c.us ? 500 : 400 }}>
                      {c.name}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{c.type}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Overline style={{ marginBottom: 12 }}>Export</Overline>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Btn variant="stroked" size="sm" leading={<Icon name="download" size={13}/>} style={{ justifyContent: "flex-start", width: "100%" }}>CSV · raw data</Btn>
              <Btn variant="ghost" size="sm" leading={<Icon name="code" size={13}/>} style={{ justifyContent: "flex-start", width: "100%" }}>BibTeX</Btn>
              <Btn variant="ghost" size="sm" leading={<Icon name="image" size={13}/>} style={{ justifyContent: "flex-start", width: "100%" }}>Plot as SVG</Btn>
            </div>
          </div>
        </aside>

        {/* RIGHT: plot + data */}
        <main style={{ minWidth: 0 }}>
          {/* Compare mode selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <Overline>Plot · {metric} vs. time</Overline>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)", marginTop: 4 }}>
                {level} · t ∈ [{(brushRange[0] * 3).toFixed(2)}, {(brushRange[1] * 3).toFixed(2)}] s · {activeCodes.length} codes
              </div>
            </div>
            <div style={{ display: "flex", border: "1px solid var(--divider)", borderRadius: 4, overflow: "hidden" }}>
              {[
                { id: "overlay", label: "Overlay", icon: "stacked_line_chart" },
                { id: "diff", label: "Δ Reference", icon: "compare_arrows" },
                { id: "small-multiples", label: "Small multiples", icon: "grid_view" },
              ].map(m => (
                <button key={m.id} onClick={() => setCompareMode(m.id)} style={{
                  border: 0, padding: "8px 14px",
                  background: compareMode === m.id ? "var(--surface-alt)" : "transparent",
                  color: compareMode === m.id ? "var(--fg1)" : "var(--fg2)",
                  cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name={m.icon} size={14}/>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* The plot */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            {compareMode === "overlay" && (
              <ComparisonPlot activeCodes={activeCodes} hoverX={hoverX} setHoverX={setHoverX} brushRange={brushRange}/>
            )}
            {compareMode === "diff" && (
              <DiffPlot activeCodes={activeCodes} hoverX={hoverX} setHoverX={setHoverX}/>
            )}
            {compareMode === "small-multiples" && (
              <SmallMultiples activeCodes={activeCodes}/>
            )}
            {/* Brush strip */}
            <BrushStrip range={brushRange} onChange={setBrushRange}/>
          </div>

          {/* Results table */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <Overline>Results @ t = 3.0 s · {level}</Overline>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)" }}>
                5 rows · reference bold
              </span>
            </div>
            <ResultsTable activeCodes={activeCodes}/>
          </div>
        </main>
      </div>
    </div>
  );
};

const KpiBox = ({ label, value, good }) => (
  <div style={{ padding: 12, background: "var(--surface-alt)", borderRadius: 4, border: "1px solid var(--divider)" }}>
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg3)", letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</div>
    <div className="num" style={{ fontSize: 18, color: good ? "var(--tu-green-400)" : "var(--fg1)", marginTop: 2 }}>{value}</div>
  </div>
);

// ----- Overlay plot with hover crosshair -----
const ComparisonPlot = ({ activeCodes, hoverX, setHoverX, brushRange }) => {
  const w = 900, h = 360, pad = { l: 48, r: 16, t: 20, b: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const svgRef = React.useRef(null);
  const n = 60;

  const yMin = 0.5, yMax = 0.94;
  const x = i => pad.l + (i / (n - 1)) * innerW;
  const y = v => pad.t + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const onMove = e => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * w;
    const i = Math.round((px - pad.l) / innerW * (n - 1));
    if (i >= 0 && i < n) setHoverX(i);
  };

  const brushStart = pad.l + brushRange[0] * innerW;
  const brushEnd = pad.l + brushRange[1] * innerW;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 360, cursor: "crosshair" }}
      onMouseMove={onMove} onMouseLeave={() => setHoverX(null)}>
      <defs>
        <linearGradient id="plot-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--bg)" stopOpacity="0.9"/>
          <stop offset={`${brushRange[0] * 100}%`} stopColor="var(--bg)" stopOpacity="0"/>
          <stop offset={`${brushRange[1] * 100}%`} stopColor="var(--bg)" stopOpacity="0"/>
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.9"/>
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0.5, 0.6, 0.7, 0.8, 0.9].map(v => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--divider)" strokeWidth="1"/>
          <text x={pad.l - 8} y={y(v) + 3} fontSize="10" fill="var(--fg3)" textAnchor="end" fontFamily="var(--font-mono)">{v.toFixed(2)}</text>
        </g>
      ))}
      {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(t => {
        const i = (t / 3) * (n - 1);
        return (
          <g key={t}>
            <line x1={x(i)} x2={x(i)} y1={pad.t} y2={h - pad.b} stroke="var(--divider)" strokeWidth="1" opacity="0.4"/>
            <text x={x(i)} y={h - pad.b + 16} fontSize="10" fill="var(--fg3)" textAnchor="middle" fontFamily="var(--font-mono)">{t.toFixed(1)}</text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={h - pad.b} stroke="var(--fg3)" strokeWidth="0.8"/>
      <line x1={pad.l} x2={w - pad.r} y1={h - pad.b} y2={h - pad.b} stroke="var(--fg3)" strokeWidth="0.8"/>
      <text x={14} y={pad.t + innerH/2} fontSize="10" fill="var(--fg3)" textAnchor="middle" fontFamily="var(--font-mono)" transform={`rotate(-90, 14, ${pad.t + innerH/2})`}>circularity</text>
      <text x={pad.l + innerW/2} y={h - 4} fontSize="10" fill="var(--fg3)" textAnchor="middle" fontFamily="var(--font-mono)">t [s]</text>

      {/* Brush dim */}
      <rect x={pad.l} y={pad.t} width={brushStart - pad.l} height={innerH} fill="var(--bg)" opacity="0.7"/>
      <rect x={brushEnd} y={pad.t} width={w - pad.r - brushEnd} height={innerH} fill="var(--bg)" opacity="0.7"/>

      {/* Series */}
      {CODES.filter(c => activeCodes.includes(c.id)).map(c => {
        const d = CODE_DATA[c.id].map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
        return (
          <path key={c.id} d={d} stroke={c.color} strokeWidth={c.us ? 2.2 : 1.4}
            strokeDasharray={c.dash} fill="none"
            style={{ filter: c.us ? `drop-shadow(0 0 6px ${c.color === "var(--tu-green-500)" ? "rgba(132,184,24,0.4)" : ""})` : "" }}/>
        );
      })}

      {/* Hover crosshair */}
      {hoverX !== null && (
        <g>
          <line x1={x(hoverX)} x2={x(hoverX)} y1={pad.t} y2={h - pad.b} stroke="var(--fg2)" strokeWidth="1" strokeDasharray="2 2"/>
          {CODES.filter(c => activeCodes.includes(c.id)).map(c => (
            <circle key={c.id} cx={x(hoverX)} cy={y(CODE_DATA[c.id][hoverX])} r="3.5" fill={c.color} stroke="var(--bg)" strokeWidth="1.5"/>
          ))}
          <rect x={x(hoverX) + 10} y={pad.t + 10} width={140} height={activeCodes.length * 16 + 28} rx={4}
            fill="var(--surface)" stroke="var(--divider)"/>
          <text x={x(hoverX) + 20} y={pad.t + 26} fontSize="10" fill="var(--fg3)" fontFamily="var(--font-mono)">
            t = {((hoverX / (n - 1)) * 3).toFixed(3)} s
          </text>
          {CODES.filter(c => activeCodes.includes(c.id)).map((c, idx) => (
            <g key={c.id} transform={`translate(${x(hoverX) + 20}, ${pad.t + 44 + idx * 16})`}>
              <rect x="0" y="-7" width="8" height="2" fill={c.color}/>
              <text x="14" y="0" fontSize="10" fill="var(--fg1)" fontFamily="var(--font-mono)">
                {c.name.slice(0, 8).padEnd(8)} {CODE_DATA[c.id][hoverX].toFixed(4)}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

// ----- Difference plot (vs reference) -----
const DiffPlot = ({ activeCodes }) => {
  const w = 900, h = 360, pad = { l: 48, r: 16, t: 20, b: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = 60;
  const ref = CODE_DATA.ref;
  const yRange = 0.02;
  const x = i => pad.l + (i / (n - 1)) * innerW;
  const y = v => pad.t + innerH/2 - (v / yRange) * innerH/2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 360 }}>
      {[-0.02, -0.01, 0, 0.01, 0.02].map(v => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--primary)" : "var(--divider)"} strokeWidth={v === 0 ? 1 : 0.5}/>
          <text x={pad.l - 8} y={y(v) + 3} fontSize="10" fill="var(--fg3)" textAnchor="end" fontFamily="var(--font-mono)">{v > 0 ? "+" : ""}{v.toFixed(2)}</text>
        </g>
      ))}
      {CODES.filter(c => activeCodes.includes(c.id) && c.id !== "ref").map(c => {
        const diffs = CODE_DATA[c.id].map((v, i) => v - ref[i]);
        const d = diffs.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
        return <path key={c.id} d={d} stroke={c.color} strokeWidth={c.us ? 2.2 : 1.3} fill="none"/>;
      })}
      <text x={14} y={pad.t + innerH/2} fontSize="10" fill="var(--fg3)" textAnchor="middle" fontFamily="var(--font-mono)" transform={`rotate(-90, 14, ${pad.t + innerH/2})`}>Δ ref</text>
    </svg>
  );
};

// ----- Small multiples: one panel per code -----
const SmallMultiples = ({ activeCodes }) => {
  const codes = CODES.filter(c => activeCodes.includes(c.id));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, height: 360 }}>
      {codes.map(c => {
        const d = CODE_DATA[c.id];
        const w = 240, h = 120, pad = 14;
        const x = i => pad + (i / (d.length - 1)) * (w - pad * 2);
        const y = v => pad + (1 - (v - 0.5) / 0.44) * (h - pad * 2);
        return (
          <div key={c.id} style={{ background: "var(--surface-alt)", padding: 12, borderRadius: 4, border: "1px solid var(--divider)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: c.color }}>{c.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{d[d.length-1].toFixed(4)}</span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 120 }}>
              <path d={d.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ")} stroke={c.color} strokeWidth="1.5" fill="none"/>
            </svg>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{c.type}</div>
          </div>
        );
      })}
    </div>
  );
};

// ----- Brush strip under the plot -----
const BrushStrip = ({ range, onChange }) => {
  const stripRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null);

  const startDrag = (which) => (e) => {
    e.preventDefault();
    setDrag(which);
  };
  React.useEffect(() => {
    if (!drag) return;
    const move = e => {
      const rect = stripRef.current.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (drag === "l") onChange([Math.min(t, range[1] - 0.05), range[1]]);
      else if (drag === "r") onChange([range[0], Math.max(t, range[0] + 0.05)]);
    };
    const up = () => setDrag(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [drag, range, onChange]);

  return (
    <div ref={stripRef} style={{
      position: "relative", marginTop: 16, height: 36,
      background: "var(--surface-alt)", borderRadius: 4, border: "1px solid var(--divider)", userSelect: "none",
    }}>
      <svg viewBox="0 0 400 36" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d={CODE_DATA.ff.map((v, i) => `${i === 0 ? "M" : "L"}${(i/59)*400},${36 - (v - 0.5)/0.44 * 30}`).join(" ")}
          stroke="var(--primary)" strokeWidth="1" fill="none" opacity="0.8"/>
      </svg>
      <div style={{
        position: "absolute",
        left: `${range[0] * 100}%`, right: `${(1 - range[1]) * 100}%`,
        top: 0, bottom: 0,
        border: "1px solid var(--primary)",
        background: "color-mix(in oklab, var(--primary) 8%, transparent)",
      }}/>
      <div onMouseDown={startDrag("l")} style={{
        position: "absolute", left: `calc(${range[0] * 100}% - 4px)`, top: 0, bottom: 0, width: 8,
        cursor: "ew-resize", background: "var(--primary)", opacity: 0.6,
      }}/>
      <div onMouseDown={startDrag("r")} style={{
        position: "absolute", left: `calc(${range[1] * 100}% - 4px)`, top: 0, bottom: 0, width: 8,
        cursor: "ew-resize", background: "var(--primary)", opacity: 0.6,
      }}/>
    </div>
  );
};

// ----- Results table (final values) -----
const ResultsTable = ({ activeCodes }) => {
  const rows = CODES.filter(c => activeCodes.includes(c.id)).map(c => {
    const d = CODE_DATA[c.id];
    const circ = d[d.length - 1];
    const ref = CODE_DATA.ref[CODE_DATA.ref.length - 1];
    return {
      ...c,
      circ,
      mass: 0.157 + (circ - 0.9) * 0.3,
      drel: ((circ - ref) / ref * 100),
    };
  });
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Code", "Type", "Circularity", "Mass centre", "Δ ref (%)", "CPU h"].map((h, i) => (
              <th key={h} style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", background: "var(--surface-alt)", textAlign: i < 2 ? "left" : "right", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fg3)", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: "1px solid var(--divider)", background: r.us ? "color-mix(in oklab, var(--primary) 5%, transparent)" : "transparent" }}>
              <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: r.color }}/>
                <span style={{ fontWeight: r.us ? 600 : 400 }}>{r.name}</span>
                {r.us && <Chip tone="solid">ours</Chip>}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--fg2)", fontSize: 12 }}>{r.type}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{r.circ.toFixed(4)}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--fg2)" }}>{r.mass.toFixed(5)}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: Math.abs(r.drel) < 0.1 ? "var(--tu-green-400)" : "var(--tu-orange-500)" }}>
                {r.drel > 0 ? "+" : ""}{r.drel.toFixed(3)}%
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--fg3)" }}>{r.us ? "412" : Math.round(200 + Math.random() * 600)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

window.BenchmarkDetail = BenchmarkDetail;
