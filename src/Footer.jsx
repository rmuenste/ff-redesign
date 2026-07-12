// ===== Footer =====
import { Link } from "react-router-dom";

// Footer navigation. Items with `to` are internal routes, `href` are external
// links, and items with neither are planned destinations that are not wired up
// yet — rendered as non-interactive, de-emphasized text rather than dead links.
const columns = [
  {
    h: "Product",
    items: [
      { label: "Benchmarks", to: "/benchmarks" },
      { label: "Gallery", to: "/gallery" },
      { label: "Changelog" },
      { label: "Roadmap" }
    ]
  },
  {
    h: "Research",
    items: [
      { label: "Publications", href: "https://wwwold.mathematik.tu-dortmund.de/lsiii/cms/de/vortraege.html" },
      { label: "Reference data" },
      { label: "BibTeX" },
      { label: "Collaborators" }
    ]
  },
  {
    h: "LS3",
    items: [
      { label: "Applied Mathematics", href: "https://wwwold.mathematik.tu-dortmund.de/lsiii/cms/en/lehrstuhl3.html" },
      { label: "TU Dortmund", href: "https://www.tu-dortmund.de/" },
      { label: "Contact" },
      { label: "Imprint" }
    ]
  }
];

const linkStyle = { display: "block", fontSize: 13, color: "var(--fg2)", marginBottom: 8, cursor: "pointer", textDecoration: "none" };
const pendingStyle = { display: "block", fontSize: 13, color: "var(--fg3)", marginBottom: 8, cursor: "default", opacity: 0.6 };

const hoverOn = event => { event.currentTarget.style.color = "var(--fg1)"; };
const hoverOff = event => { event.currentTarget.style.color = "var(--fg2)"; };

const FooterItem = ({ item }) => {
  if (item.to) {
    return (
      <Link to={item.to} style={linkStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        {item.label}
      </Link>
    );
  }
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        {item.label}
      </a>
    );
  }
  return (
    <span style={pendingStyle} aria-disabled="true" title="Coming soon">
      {item.label}
    </span>
  );
};

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
      {columns.map(c => (
        <div key={c.h}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>{c.h}</div>
          {c.items.map(item => <FooterItem key={item.label} item={item} />)}
        </div>
      ))}
    </div>
    <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--divider)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
      <span>© 2022–2026 · FeatFloWer team</span>
      <span>v0.4.2 · build 2026.04.22</span>
      <span>MIT licensed</span>
    </div>
  </footer>
);
