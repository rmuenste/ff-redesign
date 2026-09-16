// The three-panel schematic of the Oberbeck spheroid fixture.
//
// Drawn to scale from the case definition rather than traced from a render: one
// pixels-per-cell-edge constant sets everything, so the cell, the two semi-axes
// and the gap between the body and its periodic images all sit at their true
// relative size, and the panel clips whatever falls outside it.
// Every colour is a design-system token, so the figure follows the site's
// light/dark switch — which a rasterised figure would not.
import { Fragment } from "react";

const BODY = "var(--tu-green-500)";
const WALL = "var(--fg3)";
const DRIVE = "var(--tu-yellow-500)";
const IMAGE = "var(--tu-orange-500)";

/**
 * Pixels per cell edge; the whole figure is derived from this one number. The
 * panel is tall enough to hold the cell plus its four nearest images at this
 * scale, so the asymmetry the benchmark's residual is attributed to — images
 * closer along the long axis than across it — is drawn rather than asserted.
 */
const PX = 60;

const CX = 91;
const CY = 79;
const HALF = PX / 2;

/** Panel box, and the baseline the caption block starts from. */
const PANEL = { width: 180, height: 156 };

/** Semi-axes in cell units: volume-matched to the D1.1 sphere at aspect ratio 2. */
const B = 1 / 6 / Math.cbrt(2);
const A = 2 * B;

const CELL = { x: CX - HALF, y: CY - HALF, size: PX };

const PANELS = [
  {
    n: 1,
    title: "PARALLEL",
    lines: ["axis along the driving force,", "hydrodynamic radius gates a·X^A"],
    rx: B,
    ry: A,
    scale: 1
  },
  {
    n: 2,
    title: "PERPENDICULAR",
    lines: ["axis across the force,", "hydrodynamic radius gates a·Y^A"],
    rx: A,
    ry: B,
    scale: 1
  },
  {
    n: 3,
    title: "HALF SIZE",
    lines: ["same cell, body halved:", "2a/L falls 0.53 → 0.26"],
    rx: B,
    ry: A,
    scale: 0.5
  }
];

/** The four nearest periodic images, then the body itself on top of them. */
const NEIGHBOURS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0]
];

function Body({ rx, ry, scale }: { rx: number; ry: number; scale: number }) {
  const w = rx * scale * PX;
  const h = ry * scale * PX;
  return (
    <Fragment>
      {NEIGHBOURS.map(([dx, dy]) => (
        <ellipse
          key={`${dx},${dy}`}
          cx={CX + dx * PX}
          cy={CY + dy * PX}
          rx={w}
          ry={h}
          fill={IMAGE}
          fillOpacity="0.14"
          stroke={IMAGE}
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
      ))}
      <ellipse cx={CX} cy={CY} rx={w} ry={h} fill={BODY} fillOpacity="0.32" stroke={BODY} strokeWidth="1.6" />
    </Fragment>
  );
}

export function OberbeckSchematic() {
  return (
    <figure style={{ margin: "32px 0" }}>
      <svg
        viewBox="0 0 562 212"
        role="img"
        aria-labelledby="obSchemT obSchemD"
        style={{ width: "100%", height: "auto" }}
      >
        <title id="obSchemT">The Oberbeck spheroid fixture</title>
        <desc id="obSchemD">
          Three panels, drawn to scale. Each shows a triply periodic cubic cell driven by a uniform body
          force pointing up, with a prolate spheroid of aspect ratio two held fixed at the centre and its
          four nearest periodic images dashed in around it. In the first panel the long axis is parallel to
          the force, so the close images are the ones above and below; in the second it is perpendicular to
          the force, so the close images are the ones to either side; and in the third the body is half the
          size in the same cell, which doubles every clearance.
        </desc>

        <defs>
          <marker id="obDrive" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={DRIVE} />
          </marker>
        </defs>

        {PANELS.map((panel, index) => (
          <g key={panel.n} transform={`translate(${index * 190}, 0)`}>
            <rect
              x="1"
              y="1"
              width={PANEL.width}
              height={PANEL.height}
              rx="4"
              fill="var(--surface-alt)"
              stroke="var(--divider)"
              strokeWidth="1"
            />

            {/* The periodic cell: dashed edges, with the images continuing past them. */}
            <rect
              x={CELL.x}
              y={CELL.y}
              width={CELL.size}
              height={CELL.size}
              fill={BODY}
              fillOpacity="0.05"
              stroke={WALL}
              strokeWidth="1.3"
              strokeDasharray="5 3"
            />

            <Body rx={panel.rx} ry={panel.ry} scale={panel.scale} />

            {/* Uniform driving body force: it acts on the fluid throughout the cell. */}
            <line
              x1={CELL.x + 8}
              y1={CY + 22}
              x2={CELL.x + 8}
              y2={CY - 22}
              stroke={DRIVE}
              strokeWidth="1.5"
              markerEnd="url(#obDrive)"
            />
            <text x={CELL.x + 3} y={CELL.y - 5} fontSize="10" fontFamily="var(--font-mono)" fill={DRIVE}>
              f
            </text>

            <text
              x={CELL.x + CELL.size + 5}
              y={CELL.y - 4}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--fg3)"
            >
              L = 1
            </text>

            <text
              x="12"
              y={PANEL.height + 19}
              fontSize="10"
              fontFamily="var(--font-mono)"
              letterSpacing="1.2"
              fill="var(--fg1)"
            >
              {panel.n} · {panel.title}
            </text>
            {panel.lines.map((line, i) => (
              <text key={line} x="12" y={PANEL.height + 35 + i * 13} fontSize="10.5" fill="var(--fg2)">
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>
      <figcaption style={{ color: "var(--fg2)", fontSize: 13, marginTop: 10 }}>
        <b>The fixture.</b> Drawn to scale in cell units. The body is held fixed at the centre of a triply
        periodic cube and the flow is driven by a uniform body force, so the cell is an infinite simple-cubic
        lattice of identical spheroids — the dashed outlines are the nearest images. Halving the body in the
        same cell, as the third panel does, leaves the shape and the mesh spacing alone and changes only how
        close those images sit.
      </figcaption>
    </figure>
  );
}
