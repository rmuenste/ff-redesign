// The two-panel schematic of the Jeffery-orbit fixture.
//
// Drawn to scale from the case definition rather than traced from a render: one
// pixels-per-length-unit constant sets everything, so the box, the body and the
// wall clearance all sit at their true relative size and the only difference
// between the panels — half the box height, the same body — is the difference
// the benchmark measures. Every colour is a design-system token, so the figure
// follows the site's light/dark switch, which a rasterised figure would not.
import { Fragment } from "react";
import { jefferyH4, jefferyH8, percent } from "../data/jeffery";

const BODY = "var(--tu-green-500)";
const GHOST = "var(--tu-green-500)";
const WALL = "var(--fg3)";
const SHEAR = "var(--tu-yellow-500)";
const CLEARANCE = "var(--tu-orange-500)";

/** Pixels per length unit; the whole figure is derived from this one number. */
const PX = 26;

/** Body semi-axes in length units: a prolate spheroid of aspect ratio 2. */
const A = 0.5;
const B = 0.25;

/** Streamwise extent of the box; both panels share it. */
const WIDTH = 8;

const PANEL = { width: 260, height: 256 };
const CX = 130;
const CY = 128;

/** Orbit phases sketched behind the body, in the analyser's decreasing angle. */
const PHASES = [-45, -90, -135];

interface PanelSpec {
  n: number;
  title: string;
  height: number;
  clearance: string;
  lines: string[];
}

/** Both panels are derived from the run table, never from transcribed numbers. */
const PANELS: PanelSpec[] = [jefferyH8, jefferyH4].map((run, index) => ({
  n: index + 1,
  title: `CLEARANCE ${run.clearanceAxes}a`,
  height: run.box.h,
  clearance: `${run.clearanceAxes}a`,
  lines: [
    `box ${run.box.x} x ${run.box.y} x ${run.box.h}, walls at z = ±${run.box.h / 2}:`,
    `period ${percent(run.analysis.periodDeviation!)} over Jeffery`
  ]
}));

function Body() {
  return (
    <Fragment>
      {PHASES.map(phase => (
        <ellipse
          key={phase}
          cx={CX}
          cy={CY}
          rx={A * PX}
          ry={B * PX}
          transform={`rotate(${-phase} ${CX} ${CY})`}
          fill="none"
          stroke={GHOST}
          strokeOpacity="0.32"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
      ))}
      <ellipse
        cx={CX}
        cy={CY}
        rx={A * PX}
        ry={B * PX}
        fill={BODY}
        fillOpacity="0.34"
        stroke={BODY}
        strokeWidth="1.6"
      />
    </Fragment>
  );
}

/** The linear profile u = gammadot z, drawn as arrows off the box's left edge. */
function ShearProfile({ half }: { half: number }) {
  const rows = [-1, -0.5, 0.5, 1];
  const x0 = CX - (WIDTH / 2) * PX + 34;
  return (
    <Fragment>
      {rows.map(fraction => {
        const y = CY - fraction * half * PX;
        // Drawn from the profile's own axis outwards, so the arrowhead follows the
        // flow direction at that height and its length is the local speed.
        const len = fraction * half * PX * 0.3;
        return (
          <line
            key={fraction}
            x1={x0}
            y1={y}
            x2={x0 + len}
            y2={y}
            stroke={SHEAR}
            strokeWidth="1.2"
            markerEnd="url(#jefShear)"
          />
        );
      })}
      <line
        x1={x0}
        y1={CY - half * PX}
        x2={x0}
        y2={CY + half * PX}
        stroke={SHEAR}
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
    </Fragment>
  );
}

export function JefferySchematic() {
  return (
    <figure style={{ margin: "32px 0" }}>
      <svg
        viewBox="0 0 550 312"
        role="img"
        aria-labelledby="jefSchemT jefSchemD"
        style={{ width: "100%", height: "auto" }}
      >
        <title id="jefSchemT">The Jeffery-orbit fixture at its two wall clearances</title>
        <desc id="jefSchemD">
          Two panels, drawn to scale. Each shows a planar Couette box, periodic along the flow and
          spanwise directions, with walls at the top and bottom moving in opposite directions to set a
          uniform shear rate. A prolate spheroid of aspect ratio two sits at the centre with its
          translation locked and its rotation free, sketched at four phases of its tumble. The first
          panel is the default box, whose walls stand eight semi-major axes from the body; the second
          halves the box height so the walls stand four, leaving the body, the shear rate and the
          streamwise and spanwise periods unchanged.
        </desc>

        <defs>
          <marker id="jefShear" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={SHEAR} />
          </marker>
          <marker id="jefClear" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={CLEARANCE} />
          </marker>
        </defs>

        {PANELS.map((panel, index) => {
          const half = panel.height / 2;
          const top = CY - half * PX;
          const bottom = CY + half * PX;
          const left = CX - (WIDTH / 2) * PX;
          return (
            <g key={panel.n} transform={`translate(${index * 280}, 0)`}>
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

              {/* The fluid box: dashed on the periodic faces, solid on the walls. */}
              <rect
                x={left}
                y={top}
                width={WIDTH * PX}
                height={panel.height * PX}
                fill={BODY}
                fillOpacity="0.05"
                stroke={WALL}
                strokeWidth="1"
                strokeDasharray="5 3"
              />
              {[top, bottom].map(y => (
                <line
                  key={y}
                  x1={left}
                  y1={y}
                  x2={left + WIDTH * PX}
                  y2={y}
                  stroke={WALL}
                  strokeWidth="2.4"
                />
              ))}

              <ShearProfile half={half} />
              <Body />

              {/* Wall-to-centre clearance, the one thing the panels do not share. */}
              <line
                x1={CX + (WIDTH / 2) * PX - 22}
                y1={CY}
                x2={CX + (WIDTH / 2) * PX - 22}
                y2={top}
                stroke={CLEARANCE}
                strokeWidth="1.2"
                markerEnd="url(#jefClear)"
              />
              <text
                x={CX + (WIDTH / 2) * PX - 18}
                y={(CY + top) / 2 + 3}
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill={CLEARANCE}
              >
                l = {panel.clearance}
              </text>

              <text x={left} y={top - 7} fontSize="9.5" fontFamily="var(--font-mono)" fill={WALL}>
                u = +gammadot H / 2
              </text>
              <text x={left} y={bottom + 14} fontSize="9.5" fontFamily="var(--font-mono)" fill={WALL}>
                u = −gammadot H / 2
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
          );
        })}
      </svg>
      <figcaption style={{ color: "var(--fg2)", fontSize: 13, marginTop: 10 }}>
        <b>The fixture.</b> Drawn to scale in box units. The walls move in opposite directions to set a
        uniform shear; the flow and spanwise directions are periodic, so the only boundaries the body
        can feel are the two walls. The spheroid is held at the centre with its translation locked and
        its rotation free, and tumbles in the shear plane — the dashed outlines are three later phases
        of one turn. The second panel changes exactly one thing: the walls come in from eight
        semi-major axes to four.
      </figcaption>
    </figure>
  );
}
