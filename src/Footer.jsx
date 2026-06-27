// ===== Footer =====
export const Footer = () => (
  <footer style={{ borderTop: "1px solid var(--divider)", padding: "48px 0 32px", background: "var(--surface)" }}>
    <div className="section" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 32 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <svg viewBox="0 0 28 28" style={{ width: 24, height: 24 }}>
            <circle cx="14" cy="14" r="13" fill="none" stroke="var(--primary)" strokeWidth="1.5"/>
            <circle cx="14" cy="14" r="4" fill="var(--primary)"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 500 }}>FeatFloWer</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--fg2)", margin: 0, maxWidth: 340, lineHeight: 1.55 }}>
          A higher-order FEM suite and open benchmark catalogue, developed at LS3 / TU Dortmund.
        </p>
      </div>
      {[
        { h: "Product", items: ["Benchmarks", "Gallery", "Changelog", "Roadmap"] },
        { h: "Research", items: ["Publications", "Reference data", "BibTeX", "Collaborators"] },
        { h: "LS3", items: ["Applied Mathematics", "TU Dortmund", "Contact", "Imprint"] },
      ].map(c => (
        <div key={c.h}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>{c.h}</div>
          {c.items.map(i => <div key={i} style={{ fontSize: 13, color: "var(--fg2)", marginBottom: 8, cursor: "pointer" }}>{i}</div>)}
        </div>
      ))}
    </div>
    <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--divider)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
      <span>© 2022–2026 · FeatFloWer team</span>
      <span>v0.4.2 · build 2026.04.22</span>
      <span>MIT licensed · DOI 10.xxxx/ff.2026.04</span>
    </div>
  </footer>
);
