// The three-panel schematic of the numerical Couette viscometer.
//
// Drawn to scale from the case definition rather than traced from a render: the
// panel is 4.8 px per length unit, so the bob (r_i = 5), the outer wall
// (r_a = 10) and the spheres (d = 1) all sit at their true relative size. Every
// colour is a design-system token, so the figure follows the site's light/dark
// switch — which a rasterised figure would not.
import { Fragment } from "react";

const BOB = "var(--tu-green-500)";
const WALL = "var(--fg3)";
const PARTICLE = "var(--tu-orange-500)";
const SPIN = "var(--tu-yellow-500)";

/** Pixels per length unit; the whole figure is derived from this one number. */
const PX = 4.8;

const CX = 91;
const CY = 56;
const R_INNER = 5 * PX;
const R_OUTER = 10 * PX;
const R_PARTICLE = 0.5 * PX;

/**
 * A representative slice through the seeded gap. Three concentric rings with an
 * incommensurate angular offset, so the arrangement reads as a random packing
 * without being one — the real cloud is 225 spheres placed by random sequential
 * addition, of which about this many fall in a slice one diameter thick.
 */
const SEEDED = [
  { count: 6, radius: 6.3 },
  { count: 8, radius: 7.7 },
  { count: 10, radius: 9.0 }
].flatMap(ring =>
  Array.from({ length: ring.count }, (_, index) => {
    const angle = (2 * Math.PI * index) / ring.count + ring.radius;
    const radius = (ring.radius + 0.28 * Math.sin(index * 2.399)) * PX;
    return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  })
);

/**
 * Axial section through the axis: the full diameter across, the height H down. It
 * shares the scale of the cross-section, so the two panels line up edge to edge.
 */
const AXIAL = { x: CX - R_OUTER, y: CY - 5 * PX, width: 2 * R_OUTER, height: 10 * PX };
const AXIAL_HOLE = { x: CX - R_INNER, width: 2 * R_INNER };

const CAPTIONS = [
  { n: 1, title: "CROSS-SECTION", lines: ["bob r_i = 5 rotates at Omega,", "outer wall r_a = 10 is static"] },
  { n: 2, title: "AXIAL SECTION", lines: ["the bob is a hole through the", "full height, free slip at both ends"] },
  { n: 3, title: "SEEDED GAP", lines: ["225 spheres at phi = 0.05,", "0.5d clearance from either wall"] }
];

function Annulus({ seeded = false }: { seeded?: boolean }) {
  return (
    <Fragment>
      <circle cx={CX} cy={CY} r={R_OUTER} fill={BOB} fillOpacity="0.07" stroke={WALL} strokeWidth="1.4" />
      {seeded &&
        SEEDED.map(sphere => (
          <circle
            key={`${sphere.x.toFixed(2)}-${sphere.y.toFixed(2)}`}
            cx={sphere.x}
            cy={sphere.y}
            r={R_PARTICLE}
            fill={PARTICLE}
            fillOpacity="0.45"
            stroke={PARTICLE}
            strokeWidth="0.7"
          />
        ))}
      <circle cx={CX} cy={CY} r={R_INNER} fill="var(--surface-alt)" stroke={BOB} strokeWidth="1.6" />
      <path
        d={`M${CX} ${CY - R_INNER + 6} A${R_INNER - 6} ${R_INNER - 6} 0 0 1 ${CX + R_INNER - 6} ${CY}`}
        fill="none"
        stroke={SPIN}
        strokeWidth="1.4"
        markerEnd="url(#viscSpin)"
      />
      <text x={CX - 5} y={CY + 4} fontSize="10" fontFamily="var(--font-mono)" fill={SPIN}>
        Ω
      </text>
    </Fragment>
  );
}

export function ViscometerSchematic() {
  return (
    <figure style={{ margin: "32px 0" }}>
      <svg
        viewBox="0 0 562 176"
        role="img"
        aria-labelledby="viscSchemT viscSchemD"
        style={{ width: "100%", height: "auto" }}
      >
        <title id="viscSchemT">The numerical Couette viscometer</title>
        <desc id="viscSchemD">
          Three panels, drawn to scale. The cross-section shows an annulus: an inner surface of radius five
          particle diameters that rotates at angular velocity Omega, and a static outer wall at radius ten.
          The axial section shows that the inner surface is an un-meshed hole running through the full height
          of the cell, with free-slip symmetry planes closing the top and bottom, so the flow is uniform along
          the axis. The third panel shows the same gap seeded with rigid spheres at a volume fraction of five
          per cent, each kept half a diameter clear of either wall.
        </desc>

        <defs>
          <marker id="viscSpin" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={SPIN} />
          </marker>
          <marker id="viscTick" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={WALL} />
          </marker>
        </defs>

        {CAPTIONS.map((panel, index) => (
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
                <Annulus />
                <line
                  x1={CX + R_INNER}
                  y1={CY}
                  x2={CX + R_OUTER}
                  y2={CY}
                  stroke={WALL}
                  strokeWidth="1"
                  markerEnd="url(#viscTick)"
                />
                <text x={CX + R_INNER + 1} y={CY - 5} fontSize="9" fill="var(--fg2)">
                  gap 5d
                </text>
              </Fragment>
            )}

            {panel.n === 2 && (
              <Fragment>
                <rect
                  x={AXIAL.x}
                  y={AXIAL.y}
                  width={AXIAL.width}
                  height={AXIAL.height}
                  fill={BOB}
                  fillOpacity="0.07"
                  stroke="none"
                />
                <rect
                  x={AXIAL_HOLE.x}
                  y={AXIAL.y}
                  width={AXIAL_HOLE.width}
                  height={AXIAL.height}
                  fill="var(--surface-alt)"
                  stroke={BOB}
                  strokeWidth="1.6"
                />
                {/* Free-slip symmetry planes close the cell at both ends. */}
                {[AXIAL.y, AXIAL.y + AXIAL.height].map(y => (
                  <line
                    key={y}
                    x1={AXIAL.x}
                    y1={y}
                    x2={AXIAL.x + AXIAL.width}
                    y2={y}
                    stroke={WALL}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                ))}
                {/* The static outer wall, on both sides of the section. */}
                {[AXIAL.x, AXIAL.x + AXIAL.width].map(x => (
                  <line
                    key={x}
                    x1={x}
                    y1={AXIAL.y}
                    x2={x}
                    y2={AXIAL.y + AXIAL.height}
                    stroke={WALL}
                    strokeWidth="1.5"
                  />
                ))}
                <text x={CX - 9} y={CY + 3} fontSize="9" fill="var(--fg2)">
                  hole
                </text>
                <text x={AXIAL.x + 3} y={AXIAL.y - 5} fontSize="9" fill="var(--fg3)">
                  free slip
                </text>
                <text x={AXIAL.x + 3} y={AXIAL.y + AXIAL.height + 11} fontSize="9" fill="var(--fg3)">
                  free slip
                </text>
                <text x={AXIAL.x + AXIAL.width + 4} y={CY + 3} fontSize="9" fill="var(--fg2)">
                  H = 10
                </text>
              </Fragment>
            )}

            {panel.n === 3 && <Annulus seeded />}

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
      </svg>
      <figcaption style={{ color: "var(--fg2)", fontSize: 13, marginTop: 10 }}>
        <b>The instrument.</b> Drawn to scale in campaign units, where the particle diameter is the unit of
        length. Because the cell is closed by symmetry planes rather than end plates, the flow is an axially
        uniform annular Couette flow with no end effects — which is what gives the instrument an exact
        analytic torque to be measured against.
      </figcaption>
    </figure>
  );
}
