// ===== Global nav =====

const Nav = ({ route, setRoute, onToggleTweaks, tweaksAvailable }) => {
  const items = [
    { id: "home", label: "Home" },
    { id: "benchmarks", label: "Benchmarks" },
    { id: "gallery", label: "Gallery" },
    { id: "detail", label: "Rising Bubble 3D", hidden: true },
  ];
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 20,
      background: "color-mix(in oklab, var(--bg) 85%, transparent)",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--divider)",
    }}>
      <div style={{
        maxWidth: 1440, margin: "0 auto", padding: "0 32px",
        display: "flex", alignItems: "center", gap: 28, height: 64,
      }}>
        <div onClick={() => setRoute("home")}
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{
            width: 28, height: 28, position: "relative",
          }}>
            <svg viewBox="0 0 28 28" style={{ width: "100%", height: "100%" }}>
              <circle cx="14" cy="14" r="13" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="4" fill="var(--primary)" />
              <path d="M2 14 L26 14" stroke="var(--primary)" strokeWidth="0.8" opacity="0.5" />
              <path d="M14 2 L14 26" stroke="var(--primary)" strokeWidth="0.8" opacity="0.5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: ".02em", lineHeight: 1 }}>FeatFloWer</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg3)", letterSpacing: ".16em", textTransform: "uppercase", marginTop: 2 }}>
              TU Dortmund · LS3
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: 4, marginLeft: 24 }}>
          {items.filter(i => !i.hidden).map(i => (
            <div key={i.id} onClick={() => setRoute(i.id)}
              style={{
                padding: "8px 14px", fontSize: 13, cursor: "pointer", borderRadius: 4,
                color: route === i.id ? "var(--fg1)" : "var(--fg2)",
                background: route === i.id ? "var(--surface-alt)" : "transparent",
                transition: "all 160ms var(--ease-std)",
                fontWeight: route === i.id ? 500 : 400,
              }}
              onMouseEnter={e => { if (route !== i.id) e.currentTarget.style.color = "var(--fg1)"; }}
              onMouseLeave={e => { if (route !== i.id) e.currentTarget.style.color = "var(--fg2)"; }}>
              {i.label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)",
            padding: "4px 10px", borderRadius: 999, border: "1px solid var(--divider)",
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: 999,
              background: "var(--tu-green-400)", boxShadow: "0 0 0 3px rgba(147,204,40,0.2)",
              animation: "flowPulse 2s ease-in-out infinite",
            }} />
            v0.4 · build 2026.04
          </div>
          <Btn variant="stroked" size="sm" leading={<Icon name="download" size={14} />}>
            Reference data
          </Btn>
        </div>
      </div>
    </nav>
  );
};

window.Nav = Nav;
