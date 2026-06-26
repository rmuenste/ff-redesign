// ===== Home / landing =====

const Home = ({ setRoute }) => {
  return (
    <div>
      <Hero setRoute={setRoute} />
      <SignalStrip />
      <Capabilities />
      <FeaturedBenchmarks setRoute={setRoute} />
      <Validation />
      <CallToCite />
    </div>
  );
};

// ----- HERO -----
const Hero = ({ setRoute }) => (
  <section style={{ position: "relative", minHeight: 640, overflow: "hidden", borderBottom: "1px solid var(--divider)" }}>
    <div className="flow-canvas" style={{ opacity: 0.7 }}>
      <FlowCanvas palette="mixed" density={110} speed={0.9} />
    </div>
    {/* fade to bg at bottom to land type on clean surface */}
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(180deg, transparent 0%, transparent 45%, var(--bg) 100%)",
      pointerEvents: "none",
    }} />
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at 70% 50%, transparent 40%, var(--bg) 100%)",
      pointerEvents: "none", opacity: 0.6,
    }} />

    <div className="section" style={{ position: "relative", paddingTop: 96, paddingBottom: 80 }}>
      {/* Top strip: operator labels */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 72 }}>
        <Overline>FF—Angular · benchmarking suite</Overline>
        <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)" }}>
          <span>REV 0.4.2</span><span>·</span><span>2026</span><span>·</span><span>OPEN SOURCE</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 64, alignItems: "end" }}>
        <div>
          <Chip tone="solid" style={{ marginBottom: 24 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, background: "currentColor", borderRadius: 999 }}/>
            Daily Benchmarking, Open
          </Chip>
          <h1 className="display" style={{
            fontSize: "clamp(56px, 7vw, 104px)",
            margin: "0 0 28px",
            color: "var(--fg1)",
          }}>
            Flow problems,<br/>
            <span style={{ color: "var(--primary)", fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 400 }}>solved</span>
            <span style={{ color: "var(--fg2)" }}> and </span>
            <span style={{ color: "var(--primary)", fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 400 }}>scrutinised</span>.
          </h1>
          <p style={{
            fontSize: 19, lineHeight: 1.55, color: "var(--fg2)",
            maxWidth: 560, margin: "0 0 36px", textWrap: "pretty",
          }}>
            FeatFloWer is a higher-order FEM suite for Newtonian, non-Newtonian,
            multiphase, and particulate flows. Every build is measured against an
            open catalogue of reference benchmarks — so you can see, not just trust.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" onClick={() => setRoute("benchmarks")}
              trailing={<Icon name="arrow_forward" size={16}/>}>
              Browse benchmarks
            </Btn>
            <Btn variant="stroked" size="lg" onClick={() => setRoute("detail")}
              leading={<Icon name="play_arrow" size={16}/>}>
              Open Rising Bubble 3D
            </Btn>
          </div>
        </div>

        {/* Right: live simulation card */}
        <div style={{ position: "relative" }}>
          <div className="card" style={{ padding: 20, background: "color-mix(in oklab, var(--surface) 75%, transparent)", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Overline>Latest run · 04.22.26</Overline>
              <Chip tone="default">
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "var(--tu-green-400)" }} />
                passing
              </Chip>
            </div>
            <div style={{ fontSize: 15, marginBottom: 4, fontWeight: 500 }}>Rising Bubble 3D · L3</div>
            <div style={{ color: "var(--fg2)", fontSize: 12, fontFamily: "var(--font-mono)", marginBottom: 16 }}>
              6 codes · 18.4M DOF · t ∈ [0, 3] s
            </div>
            <MiniPlot />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--divider)" }}>
              <Metric label="Circularity" value="0.9014" />
              <Metric label="Mass error" value="1.6e-5" />
              <Metric label="Δ ref" value="0.01%" good />
            </div>
          </div>
          <div style={{
            position: "absolute", bottom: -20, right: -20, width: 120, height: 120,
            border: "1px solid var(--divider)", borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg)",
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)",
          }}>
            <div style={{ textAlign: "center", lineHeight: 1.5 }}>
              Re = 35<br/>ρ₁/ρ₂ = 10<br/>η₁/η₂ = 10
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: corner markers */}
      <div style={{
        position: "absolute", bottom: 24, left: 48, right: 48,
        display: "flex", justifyContent: "space-between",
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", letterSpacing: ".14em",
      }}>
        <span>◢ 51.4935° N 7.4055° E</span>
        <span>TU · LS3 · APPLIED MATHEMATICS ◣</span>
      </div>
    </div>
  </section>
);

const Metric = ({ label, value, good }) => (
  <div>
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg3)", letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</div>
    <div className="num" style={{ fontSize: 20, color: good ? "var(--tu-green-400)" : "var(--fg1)", marginTop: 2 }}>{value}</div>
  </div>
);

// Compact plot inside the hero card
const MiniPlot = () => {
  const w = 380, h = 110, pad = 8;
  const pts = [0.5, 0.6, 0.72, 0.82, 0.88, 0.9, 0.905, 0.90, 0.895, 0.901, 0.905, 0.903, 0.901, 0.902];
  const ref = [0.5, 0.61, 0.73, 0.81, 0.87, 0.9, 0.91, 0.902, 0.895, 0.90, 0.902, 0.901, 0.902, 0.901];
  const x = i => pad + (i / (pts.length - 1)) * (w - pad * 2);
  const y = v => h - pad - (v - 0.5) * (h - pad * 2) * 1.9;
  const path = arr => arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 110, display: "block" }}>
      <defs>
        <linearGradient id="mini-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path(pts)} L ${x(pts.length - 1)} ${h - pad} L ${x(0)} ${h - pad} Z`} fill="url(#mini-fill)" />
      <path d={path(ref)} stroke="var(--fg3)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <path d={path(pts)} stroke="var(--primary)" strokeWidth="1.8" fill="none" />
      {pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="1.6" fill="var(--primary)" />)}
    </svg>
  );
};

// ----- SIGNAL STRIP: tickertape of currently supported configs -----
const SignalStrip = () => (
  <div style={{
    borderBottom: "1px solid var(--divider)",
    background: "var(--surface-alt)",
    padding: "16px 0",
    overflow: "hidden",
  }}>
    <div className="section" style={{
      display: "flex", alignItems: "center", gap: 40,
      fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)", letterSpacing: ".08em",
      textTransform: "uppercase",
    }}>
      <span style={{ color: "var(--primary)", fontWeight: 500 }}>◆ SUPPORTED MODELS</span>
      {["Newtonian", "Power-Law", "Carreau", "Visco-Elastic", "Two-Phase", "Particle-Laden", "LES", "DNS", "Adaptive Mesh"].map((m, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: 999, background: "var(--fg3)" }} />
          {m}
        </span>
      ))}
    </div>
  </div>
);

// ----- CAPABILITIES -----
const Capabilities = () => {
  const cards = [
    {
      num: "01",
      title: "Higher-order FEM",
      desc: "Q₂/P₁-disc velocity-pressure pairs with isogeometric extensions. Unstructured meshes, dynamic h-refinement where it matters.",
      metrics: [{ l: "Max order", v: "P₄" }, { l: "Mesh type", v: "Tetra / Hexa / Hybrid" }],
    },
    {
      num: "02",
      title: "Newton-Multigrid solver",
      desc: "Monolithic coupled solver for incompressible Navier–Stokes. Geometric multigrid preconditioner scales to 10⁸ DOF.",
      metrics: [{ l: "Peak scale", v: "1.2 × 10⁸ DOF" }, { l: "Parallelism", v: "MPI + OpenMP" }],
    },
    {
      num: "03",
      title: "Daily validation",
      desc: "Each nightly build is re-run against the benchmark catalogue once a day. Regression flagged automatically, open to inspection.",
      metrics: [{ l: "Benchmarks", v: "28 configs" }, { l: "Reference codes", v: "6 external" }],
    },
  ];
  return (
    <section className="section" style={{ padding: "120px 48px" }}>
      <div className="section-marker">I · Capabilities</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 96, marginBottom: 80 }}>
        <h2 className="h-editorial" style={{ fontSize: "clamp(40px, 4.4vw, 64px)", margin: 0 }}>
          Built for the <em style={{ color: "var(--primary)" }}>hard</em> regime —
          where assumptions stop working.
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--fg2)", alignSelf: "end", margin: 0, textWrap: "pretty" }}>
          Most CFD tools make a single trade-off — fast and approximate, or slow and
          rigorous. FeatFloWer is designed around the second: a coupled FEM solver
          that stays stable and accurate when flow separates, interfaces move, or
          the fluid stops being Newtonian. Then we prove it, on a public board.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--divider)", border: "1px solid var(--divider)" }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: "var(--bg)", padding: 32, minHeight: 340 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
              <Overline>{c.num}</Overline>
              <div style={{ width: 1, height: 32, background: "var(--primary)" }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 16px", letterSpacing: "-0.01em" }}>{c.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--fg2)", margin: "0 0 32px", textWrap: "pretty" }}>
              {c.desc}
            </p>
            <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, display: "grid", gap: 8 }}>
              {c.metrics.map((m, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg3)", letterSpacing: ".1em", textTransform: "uppercase" }}>{m.l}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg1)" }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ----- FEATURED BENCHMARKS -----
const FeaturedBenchmarks = ({ setRoute }) => {
  const list = [
    { id: "rb3", tag: "RB3", title: "Rising Bubble 3D", desc: "Two-phase interface tracking · Re 35",
      meta: ["Q2/P1-disc", "L1 · L2 · L3", "6 codes"], variant: 1, featured: true, delta: "−0.01%" },
    { id: "fac3", tag: "FAC", title: "Flow Around Cylinder", desc: "Canonical benchmark · Re 100",
      meta: ["Adaptive mesh", "L1 — L4", "8 codes"], variant: 0, delta: "+0.02%" },
    { id: "sed", tag: "SED", title: "Particle Sedimentation", desc: "Fictitious-domain · 240 particles",
      meta: ["DLM/FD", "L2 · L3", "4 codes"], variant: 2, delta: "−0.04%" },
    { id: "chn", tag: "CHN", title: "Poiseuille, Non-Newtonian", desc: "Carreau · shear-thinning",
      meta: ["Analytical ref", "L1 · L2", "3 codes"], variant: 3, delta: "0.00%" },
  ];
  return (
    <section style={{ background: "var(--surface-alt)", padding: "120px 0", borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)" }}>
      <div className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 48 }}>
          <div>
            <div className="section-marker">II · Featured Benchmarks</div>
            <h2 className="h-editorial" style={{ fontSize: "clamp(36px, 4vw, 56px)", margin: 0, maxWidth: 780 }}>
              A living catalogue of flow problems — with every number open to audit.
            </h2>
          </div>
          <Btn variant="stroked" onClick={() => setRoute("benchmarks")} trailing={<Icon name="arrow_forward" size={14}/>}>
            All 28 benchmarks
          </Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 24 }}>
          {list.map((b, i) => (
            <div key={b.id} className="card card-interactive" onClick={() => setRoute("detail")}
              style={{
                gridColumn: i === 0 ? "span 2" : "auto",
                padding: 0, overflow: "hidden",
                display: "flex", flexDirection: "column",
              }}>
              <div style={{ aspectRatio: i === 0 ? "2.2/1" : "1.2/1", position: "relative", background: "var(--bg)" }}>
                <MeshThumb variant={b.variant} />
                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                  <Chip tone="solid">{b.tag}</Chip>
                  {b.featured && <Chip tone="accent">featured</Chip>}
                </div>
                <div style={{ position: "absolute", bottom: 12, right: 12,
                  fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg2)",
                  padding: "3px 8px", borderRadius: 999, background: "color-mix(in oklab, var(--bg) 80%, transparent)", border: "1px solid var(--divider)",
                }}>Δ ref {b.delta}</div>
              </div>
              <div style={{ padding: 20, flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px" }}>{b.title}</h3>
                <div style={{ fontSize: 13, color: "var(--fg2)", marginBottom: 14 }}>{b.desc}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                  {b.meta.map((m, j) => <span key={j}>{m}{j < b.meta.length - 1 && <span style={{ marginLeft: 6, opacity: 0.4 }}>·</span>}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ----- VALIDATION -----
const Validation = () => (
  <section className="section" style={{ padding: "120px 48px" }}>
    <div className="section-marker">III · Validation</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
      <div>
        <h2 className="h-editorial" style={{ fontSize: "clamp(36px, 4vw, 52px)", margin: "0 0 24px" }}>
          6 codes. 28 benchmarks.<br/>One board, run daily.
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--fg2)", margin: "0 0 36px", textWrap: "pretty" }}>
          We cross-validate against five external FEM/FVM codes from collaborating
          groups, plus one analytical reference where it exists. The board is
          re-computed nightly against master — so when you cite a number, you
          know exactly which revision it came from.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, paddingTop: 32, borderTop: "1px solid var(--divider)" }}>
          <div>
            <div className="num" style={{ fontSize: 48, color: "var(--primary)" }}>28</div>
            <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 4 }}>Benchmark<br/>configurations</div>
          </div>
          <div>
            <div className="num" style={{ fontSize: 48, color: "var(--primary)" }}>6</div>
            <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 4 }}>Reference<br/>codes compared</div>
          </div>
          <div>
            <div className="num" style={{ fontSize: 48, color: "var(--primary)" }}>1.2M</div>
            <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 4 }}>Runs executed<br/>since 2022</div>
          </div>
        </div>
      </div>
      <CodesBoard />
    </div>
  </section>
);

const CodesBoard = () => {
  const codes = [
    { name: "FeatFloWer", type: "FEM · Q2/P1", pass: 28, total: 28, us: true },
    { name: "TP2D",       type: "FEM · Q2/Q1", pass: 24, total: 26 },
    { name: "MooNMD",     type: "FEM · P2/P1-disc", pass: 22, total: 24 },
    { name: "NaSt3D",     type: "FVM · SIMPLE", pass: 18, total: 20 },
    { name: "FreeFEM",    type: "FEM · P2/P1", pass: 16, total: 18 },
    { name: "Reference",  type: "Analytical / exp.", pass: 14, total: 14 },
  ];
  return (
    <div className="card" style={{ padding: 28 }}>
      <Overline style={{ marginBottom: 16 }}>Cross-code board · live</Overline>
      <div style={{ display: "grid", gap: 14 }}>
        {codes.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 80px 1fr", gap: 16, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: c.us ? 600 : 400, color: c.us ? "var(--primary)" : "var(--fg1)" }}>
                {c.name}{c.us && <span style={{ fontSize: 9, marginLeft: 6, fontFamily: "var(--font-mono)" }}>OURS</span>}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", marginTop: 2 }}>{c.type}</div>
            </div>
            <div style={{ height: 4, background: "var(--surface-alt)", borderRadius: 2, position: "relative" }}>
              <div style={{
                height: "100%", width: `${(c.pass/c.total) * 100}%`,
                background: c.us ? "var(--primary)" : "var(--fg3)",
                borderRadius: 2,
              }} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)", textAlign: "right" }}>
              {c.pass}/{c.total}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: ".12em" }}>
              {c.pass === c.total ? "complete" : `${c.total - c.pass} pending`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----- CITE / footer area -----
const CallToCite = () => (
  <section style={{
    borderTop: "1px solid var(--divider)",
    background: "var(--surface)",
    padding: "80px 0",
  }}>
    <div className="section" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "center" }}>
      <div>
        <Overline style={{ marginBottom: 16 }}>IV · Cite this work</Overline>
        <h2 className="h-editorial" style={{ fontSize: "clamp(32px, 3.6vw, 48px)", margin: "0 0 20px" }}>
          Using FeatFloWer in your research?
        </h2>
        <p style={{ fontSize: 16, color: "var(--fg2)", margin: "0 0 24px", maxWidth: 520, textWrap: "pretty" }}>
          Every benchmark ships with raw data (CSV), its exact revision hash, and a
          BibTeX stub. Pin a version, reference it, and your result is reproducible.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn variant="primary" leading={<Icon name="download" size={14}/>}>Download reference data</Btn>
          <Btn variant="stroked" leading={<Icon name="code" size={14}/>}>BibTeX</Btn>
          <Btn variant="ghost" leading={<Icon name="open_in_new" size={14}/>}>DOI · 10.xxxx/ff.2026.04</Btn>
        </div>
      </div>
      <div style={{
        border: "1px solid var(--divider)", borderRadius: 4,
        padding: 24, background: "var(--bg)",
        fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg2)",
        lineHeight: 1.7,
      }}>
        <div style={{ color: "var(--fg3)", marginBottom: 8, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase" }}>BibTeX</div>
{`@software{featflower2026,
  title   = {FeatFloWer},
  author  = {{LS3 / TU Dortmund}},
  year    = {2026},
  version = {0.4.2},
  url     = {https://ls3.math.tu-dortmund.de/ff},
  doi     = {10.xxxx/ff.2026.04}
}`.split("\n").map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  </section>
);

window.Home = Home;
