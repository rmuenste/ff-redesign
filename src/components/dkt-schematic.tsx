// DRAFT — the four-phase DKT schematic, ported from the campaign artifact's inline
// SVG (docs/artifact_snapshots/dns_campaign_artifact_2026-08-11.html, ~6 KB).
//
// The port is a token remap, not a redraw. Artifact token -> site token:
//   --accent      -> var(--tu-petrol-400)     (leader sphere, arrows)
//   --risk        -> var(--tu-orange-500)     (trailer sphere)
//   --accent-wash -> var(--tu-petrol-400) @ 0.14 opacity (wake)
//   --warm        -> var(--tu-yellow-500)     (rotation arcs, angle mark)
//   --ink / --ink-2 -> var(--fg1) / var(--fg2)
//   --muted       -> var(--fg3)
//   --rule        -> var(--divider)
// Because every colour is a token, the figure follows the site's light/dark
// switch for free — which a rasterised matplotlib figure would not.
import { Fragment } from "react";

const PANELS = [
  { n: 1, title: "DRAFTING", lines: ["trailer enters the wake,", "its drag drops, it catches up"] },
  { n: 2, title: "KISSING", lines: ["contact - the pair falls", "as a single doublet"] },
  { n: 3, title: "TUMBLING", lines: ["broadside doublet is unstable,", "rotates about the contact"] },
  { n: 4, title: "SEPARATION", lines: ["pair pulls apart with the", "roles exchanged"] }
];

// Leader/trailer keep one colour pair across the whole benchmark — the card
// thumbnail in Primitives.jsx uses the same two tokens.
const LEADER = "var(--tu-green-500)";
const TRAILER = "var(--tu-orange-500)";
const ROT = "var(--tu-yellow-500)";

export function DktSchematic() {
  return (
    <figure style={{ margin: "32px 0" }}>
      <svg
        viewBox="0 0 760 186"
        role="img"
        aria-labelledby="dktSchemT dktSchemD"
        style={{ width: "100%", height: "auto" }}
      >
        <title id="dktSchemT">The four phases of drafting-kissing-tumbling</title>
        <desc id="dktSchemD">
          Four panels. In drafting, a trailing sphere inside the leading sphere&apos;s wake accelerates and
          closes the gap. In kissing, the two spheres touch and fall together as a doublet. In tumbling,
          the broadside doublet rotates about its contact point through an angle theta. In separation, the
          spheres pull apart along a tilted axis with the leading and trailing roles exchanged. With dry
          contact friction the sequence stops at the end of kissing, at a tilt of about four degrees.
        </desc>

        <defs>
          <marker id="dktAh" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={LEADER} />
          </marker>
          <marker id="dktRh" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={ROT} />
          </marker>
        </defs>

        {PANELS.map((panel, index) => (
          <g key={panel.n} transform={`translate(${index * 190}, 0)`}>
            <rect
              x="1"
              y="1"
              width="180"
              height="110"
              rx="4"
              fill="var(--surface-alt)"
              stroke="var(--divider)"
              strokeWidth="1"
            />

            {panel.n === 1 && (
              <Fragment>
                <path d="M74 26 L106 26 L120 92 L60 92 Z" fill={LEADER} opacity="0.14" />
                <circle cx="90" cy="80" r="15" fill={LEADER} fillOpacity="0.28" stroke={LEADER} strokeWidth="1.5" />
                <circle cx="90" cy="36" r="15" fill={TRAILER} fillOpacity="0.28" stroke={TRAILER} strokeWidth="1.5" />
                <line x1="140" y1="70" x2="140" y2="86" stroke={LEADER} strokeWidth="1.6" markerEnd="url(#dktAh)" />
                <line x1="156" y1="24" x2="156" y2="56" stroke={TRAILER} strokeWidth="1.6" markerEnd="url(#dktAh)" />
              </Fragment>
            )}

            {panel.n === 2 && (
              <Fragment>
                <circle cx="90" cy="70" r="15" fill={LEADER} fillOpacity="0.28" stroke={LEADER} strokeWidth="1.5" />
                <circle cx="90" cy="40" r="15" fill={TRAILER} fillOpacity="0.28" stroke={TRAILER} strokeWidth="1.5" />
                <line x1="140" y1="42" x2="140" y2="76" stroke={LEADER} strokeWidth="1.6" markerEnd="url(#dktAh)" />
              </Fragment>
            )}

            {panel.n === 3 && (
              <Fragment>
                <line x1="90" y1="20" x2="90" y2="92" stroke="var(--fg3)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="76" cy="72" r="15" fill={LEADER} fillOpacity="0.28" stroke={LEADER} strokeWidth="1.5" />
                <circle cx="104" cy="44" r="15" fill={TRAILER} fillOpacity="0.28" stroke={TRAILER} strokeWidth="1.5" />
                <path d="M90 44 A22 22 0 0 1 104 50" fill="none" stroke={ROT} strokeWidth="1.2" />
                <text x="108" y="34" fontSize="10" fontFamily="var(--font-mono)" fill={ROT}>
                  θ
                </text>
                <path d="M124 78 A26 26 0 0 1 106 92" fill="none" stroke={ROT} strokeWidth="1.4" markerEnd="url(#dktRh)" />
                <path d="M56 38 A26 26 0 0 1 74 24" fill="none" stroke={ROT} strokeWidth="1.4" markerEnd="url(#dktRh)" />
              </Fragment>
            )}

            {panel.n === 4 && (
              <Fragment>
                <circle cx="62" cy="40" r="15" fill={LEADER} fillOpacity="0.28" stroke={LEADER} strokeWidth="1.5" />
                <circle cx="118" cy="74" r="15" fill={TRAILER} fillOpacity="0.28" stroke={TRAILER} strokeWidth="1.5" />
                <line x1="46" y1="58" x2="40" y2="78" stroke={LEADER} strokeWidth="1.6" markerEnd="url(#dktAh)" />
                <line x1="140" y1="60" x2="146" y2="88" stroke={TRAILER} strokeWidth="1.6" markerEnd="url(#dktAh)" />
              </Fragment>
            )}

            <text
              x="12"
              y="130"
              fontSize="10"
              fontFamily="var(--font-mono)"
              letterSpacing="1.2"
              fill="var(--fg1)"
            >
              {panel.n} · {panel.title}
            </text>
            {panel.lines.map((line, i) => (
              <text key={line} x="12" y={146 + i * 13} fontSize="10.5" fill="var(--fg2)">
                {line}
              </text>
            ))}
          </g>
        ))}

        <text x="392" y="178" fontSize="10.5" fontStyle="italic" fill="var(--tu-orange-500)">
          with dry contact friction the sequence stops here, at θ ≈ 4°
        </text>
      </svg>
      <figcaption style={{ color: "var(--fg2)", fontSize: 13, marginTop: 10 }}>
        <b>The sequence.</b> Phases 1 and 2 reproduced immediately at every resolution. Phase 3 stalled at
        θ ≈ 4° for two weeks — at D/h = 8 and again at D/h = 16 — until the contact friction was set to zero.
      </figcaption>
    </figure>
  );
}
