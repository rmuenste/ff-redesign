import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  GalleryFigure,
  Icon,
  KpiBox,
  ReferenceList,
  Section,
  Tabs,
  useTabParam
} from "../components";
import { OberbeckSchematic } from "../components/oberbeck-schematic";
import {
  oberbeckAbsolutesSpecs,
  oberbeckCell,
  oberbeckClosingRung,
  oberbeckDownloads,
  oberbeckHistorySpecs,
  oberbeckL3Full,
  oberbeckL4Full,
  oberbeckL4Half,
  oberbeckOblique,
  oberbeckOrientation,
  oberbeckParameterRows,
  oberbeckRatioSpecs,
  oberbeckReferenceRows,
  oberbeckReferences,
  oberbeckRungs,
  oberbeckResistance,
  oberbeckToleranceRows,
  orientationLabel,
  percent,
  type OberbeckOrientationId,
  type OberbeckParameterRow,
  type OberbeckRung,
  type OberbeckToleranceRow
} from "../data/oberbeck";

const XA = oberbeckResistance.XA.toFixed(6);
const YA = oberbeckResistance.YA.toFixed(6);
const TARGET = oberbeckResistance.ratio.toFixed(5);
const CLOSING = oberbeckClosingRung.ratio.toFixed(5);
const CLOSING_DEV = percent(oberbeckClosingRung.deviation);
const THIN = oberbeckL4Full.thinAxisResolution.toFixed(1);
const THIN_PRODUCTION = oberbeckL3Full.thinAxisResolution.toFixed(1);

const closingPar = oberbeckOrientation(oberbeckClosingRung, "parallel");
const closingPerp = oberbeckOrientation(oberbeckClosingRung, "perpendicular");

/** Largest torque null anywhere on the ladder, in units of the drag moment scale. */
const worstTorqueNull = Math.max(
  ...oberbeckRungs.flatMap(rung => rung.orientations.map(entry => entry.torqueNull))
);

/** Largest torque null on the rung that closes the gate. */
const closingTorqueNull = Math.max(
  ...oberbeckClosingRung.orientations.map(entry => entry.torqueNull)
);

/** Ratio deviation read over the longest trailing window, the pessimistic end. */
const closingLongWindow = oberbeckClosingRung.sensitivity[oberbeckClosingRung.sensitivity.length - 1];

function Mono({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: "var(--font-mono)" }}>{children}</span>;
}

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <GalleryFigure id="oberbeck-spheroid-drag" />
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "A sphere settling through a viscous fluid does not care which way round it is. Nothing else does not care. Take the sphere, stretch it along one axis into a prolate spheroid, and the drag it feels now depends on how it is held: pull it along its long axis and it slips through more easily than if it is dragged broadside. Oberbeck solved that problem in 1876, and the answer is exact — two resistance functions, no fitted constant, no experiment behind them."
          },
          {
            type: "equation",
            value:
              "$F_{\\parallel} = 6\\pi\\mu a U\\,X^{A}, \\qquad F_{\\perp} = 6\\pi\\mu a U\\,Y^{A}$",
            block: true
          },
          {
            type: "paragraph",
            text:
              `Here a is the long semi-axis of the body, U the speed of the flow past it, and X^A and Y^A are the resistance functions — the drag in units of the Stokes drag on a sphere of radius a — for flow along the symmetry axis and across it. At aspect ratio two, the long axis twice the short one — the shape this benchmark uses — they are X^A = ${XA} and Y^A = ${YA}, and the quantity the benchmark is really about is their ratio, Y^A / X^A = ${TARGET}. Broadside costs about fourteen and a half per cent more than end-on, and that number is a property of the shape alone.`
          },
          { type: "heading", level: 3, text: "Why the anisotropy and not the drag" },
          {
            type: "paragraph",
            text:
              "The body is held fixed at the centre of a cube that repeats periodically in all three directions, and the fluid is driven past it by a uniform body force. That setup has a property worth stating plainly, because it decides what can be measured. At steady state the net force on the body is fixed by momentum balance — it must equal the driving force times the cell volume, whatever the body is and however it is turned. The anisotropy cannot show up in the force. It shows up in the flow the cell has to develop to carry that force: the superficial velocity, the mean speed of the fluid through the cell."
          },
          {
            type: "paragraph",
            text:
              "That velocity is turned into a length, the hydrodynamic radius. The drag on a sphere in a periodic cubic array is known in closed form (Hasimoto 1959) as a function of the sphere radius and the solid fraction, the share of the cell volume the sphere fills. For the spheroid, the measured drag and velocity are put into that relation and it is solved for the radius of the sphere that would produce them; that radius is the hydrodynamic radius of the spheroid in that orientation. The formula is on the Definition tab."
          },
          {
            type: "paragraph",
            text:
              `Two runs, then: the same body held with its long axis along the driving force, and held across it. The ratio of their hydrodynamic radii is compared with ${TARGET}, Oberbeck's exact Stokes-flow value for this aspect ratio. The effect of the periodic lattice and most of the discretisation error are common to both orientations and cancel in the ratio, which is why the ratio is the primary comparison and the absolute radii are the secondary one.`
          },
          { type: "heading", level: 3, text: "Three runs and a prediction" },
          {
            type: "paragraph",
            text:
              `With ${THIN_PRODUCTION} mesh cells across the body's thin axis the ratio came out ${oberbeckL3Full.ratio.toFixed(5)} — ${percent(oberbeckL3Full.deviation)}, just outside the two-per-cent tolerance. Doubling the mesh, to ${THIN} cells across the thin axis, moved it to ${oberbeckL4Full.ratio.toFixed(5)}: identical to four digits, so the excess is not a discretisation error. What it is instead is a property of the cell. The body's length relative to the cell edge, 2a/L = ${oberbeckL3Full.imageParameter.toFixed(3)}, is large enough that its own periodic copies lie closer along its long axis than across it, so the periodic lattice acts differently on the two orientations. That reading makes a falsifiable prediction — halve the body in the same cell, which halves 2a/L to ${oberbeckL4Half.imageParameter.toFixed(3)}, and the excess should collapse — and the half-size body, same cell and same ${oberbeckL4Half.thinAxisResolution.toFixed(1)} cells across its thin axis, confirms it: ${CLOSING}, ${CLOSING_DEV} from Oberbeck's value, with the absolute radii landing within one and a half per cent of a·X^A and a·Y^A and no empirical correction to the radius applied.`
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={oberbeckReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Setup" },
          {
            type: "paragraph",
            text:
              `A prolate spheroid of aspect ratio ${oberbeckCell.aspectRatio} is held fixed at the centre of a triply periodic cube of unit edge, and the flow is driven by a uniform body force of ${oberbeckCell.force.toExponential(
                0
              )} in the z direction. The Reynolds number is about 3e-3, so this is Stokes flow in all but name. Holding the body fixed is deliberate: there is no start-up motion of the body to wait out, and the lever arm of the torque stays unambiguous under periodicity.`
          },
          {
            type: "paragraph",
            text:
              `The body has the volume of a sphere of radius ${oberbeckCell.sphereRadius.toFixed(
                6
              )}, so it fills the same share of the cell as that sphere would. That gives semi-axes a = ${oberbeckL3Full.a.toFixed(
                6
              )} and b = c = ${oberbeckL3Full.b.toFixed(6)} for the full-size body.`
          }
        ]}
      />
      <OberbeckSchematic />
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "What sets the resolution" },
          {
            type: "paragraph",
            text:
              `A spheroid has two length scales and only the smaller one matters for the mesh: the thin axis is what has to be resolved. The thin-axis resolution 2b/h counts mesh cells across the body's thin diameter 2b, h being the mesh spacing. On the coarser mesh (level L3) the full-size body spans ${THIN_PRODUCTION} cells across its thin diameter; the finer mesh (level L4) doubles that to ${THIN}. The half-size body on the finer mesh is back at ${oberbeckL4Half.thinAxisResolution.toFixed(
                1
              )} cells while its length relative to the cell edge, 2a/L, halves from ${oberbeckL3Full.imageParameter.toFixed(3)} to ${oberbeckL4Half.imageParameter.toFixed(3)} — the two factors are varied one at a time.`
          },
          { type: "heading", level: 3, text: "The observable" },
          {
            type: "paragraph",
            text:
              "The steady force and torque on the body and the cell's superficial velocity, the mean speed of the fluid through the cell, are read from the run's own output. The drag and the velocity give a hydrodynamic radius R_h — the radius of the sphere that, in the same periodic cubic array, would feel the same drag at the same velocity — by solving Hasimoto's drag law for a periodic array of spheres. The solid fraction φ in that law, the share of the cell volume the sphere fills, is itself set by the radius being solved for, so the relation is solved self-consistently. The two orientations' radii are what is compared."
          },
          {
            type: "equation",
            value:
              "$\\frac{F}{6\\pi\\mu R_h U} = \\frac{1}{1 - 1.7601\\,\\phi^{1/3} + \\phi - 1.5593\\,\\phi^{2}}, \\qquad \\phi = \\frac{4}{3}\\pi R_h^{3}/L^{3}$",
            block: true
          },
          {
            type: "paragraph",
            text:
              "The solver marks the body on the mesh with a volume-fraction field, which represents a body of very slightly the wrong volume; each run reports the fluid fraction it actually realised, so that error is folded back into the radius rather than ignored. No other correction to the radius is applied anywhere on this page."
          }
        ]}
      />
      <div className="stack" style={{ gap: 32, marginTop: 24 }}>
        <div>
          <h3>Case parameters</h3>
          <DataTable<OberbeckParameterRow>
            columns={[
              {
                id: "symbol",
                header: "Symbol",
                render: row => <Mono>{row.symbol}</Mono>
              },
              { id: "quantity", header: "Quantity", render: row => row.quantity },
              {
                id: "value",
                header: "Value",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.value}</span>
                )
              }
            ]}
            rows={oberbeckParameterRows}
            getRowKey={row => `${row.symbol}-${row.quantity}`}
          />
        </div>

        <div>
          <h3>What is compared, and the tolerance</h3>
          <DataTable<OberbeckToleranceRow>
            columns={[
              { id: "quantity", header: "Quantity", render: row => <span style={{ fontWeight: 500 }}>{row.quantity}</span> },
              { id: "reference", header: "Reference", render: row => row.reference },
              {
                id: "tolerance",
                header: "Tolerance",
                align: "right",
                render: row => <Mono>{row.tolerance}</Mono>
              },
              {
                id: "result",
                header: "Result, half-size body",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {row.result}
                  </span>
                )
              }
            ]}
            rows={oberbeckToleranceRows}
            getRowKey={row => row.quantity}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            The torque comparison is free and orientation-independent: any ellipsoid in uniform Stokes flow feels no
            torque about its centre, at any orientation, and the body sits in a lattice mirror plane so
            periodisation does not spoil it. It is the only rotational observable this case carries.
          </p>
        </div>
      </div>
    </Section>
  );
}

function LadderTable({ rows }: { rows: OberbeckRung[] }) {
  return (
    <DataTable<OberbeckRung>
      columns={[
        {
          id: "rung",
          header: "Rung",
          render: row => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.short}</span>
        },
        {
          id: "thin",
          header: "2b / h",
          align: "right",
          render: row => <Mono>{row.thinAxisResolution.toFixed(1)}</Mono>
        },
        {
          id: "image",
          header: "2a / L",
          align: "right",
          render: row => <Mono>{row.imageParameter.toFixed(3)}</Mono>
        },
        {
          id: "par",
          header: "R_h, parallel",
          align: "right",
          render: row => <Mono>{oberbeckOrientation(row, "parallel").rh.toFixed(6)}</Mono>
        },
        {
          id: "perp",
          header: "R_h, perpendicular",
          align: "right",
          render: row => <Mono>{oberbeckOrientation(row, "perpendicular").rh.toFixed(6)}</Mono>
        },
        {
          id: "ratio",
          header: "Ratio",
          align: "right",
          render: row => (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.ratio.toFixed(5)}</span>
          )
        },
        {
          id: "dev",
          header: "vs Oberbeck",
          align: "right",
          render: row => (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{percent(row.deviation)}</span>
          )
        }
      ]}
      rows={rows}
      getRowKey={row => row.id}
    />
  );
}

function RatioTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ maxWidth: 900, gap: 20 }}>
        <h3 style={{ margin: 0 }}>Three rungs, two factors</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The anisotropy ratio is the headline result, and it was measured three times. Two rungs keep the
          full-size body and differ only in the mesh; the third keeps the finer mesh and halves the body. That
          is a two-factor design with one factor moved at a time, and it is what turns a marginal first reading
          into an attributed one.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          At full size the ratio is {oberbeckL3Full.ratio.toFixed(5)} at 2b/h = {THIN_PRODUCTION} and{" "}
          {oberbeckL4Full.ratio.toFixed(5)} at 2b/h = {THIN} — {percent(oberbeckL4Full.deviation)} above{" "}
          {TARGET}, and identical to four digits under a doubling of resolution. Whatever produces that excess
          is converged with respect to the mesh, so it is not a discretisation error. Halving the body in the
          same cell moves it to {CLOSING}, {CLOSING_DEV} — inside the band, in the direction and by roughly the
          amount a finite-cell lattice term predicts.
        </p>
        <div
          style={{
            borderLeft: "3px solid var(--accent)",
            background: "var(--surface-alt)",
            borderRadius: 4,
            padding: "16px 20px"
          }}
        >
          <p style={{ margin: 0, color: "var(--fg1)", lineHeight: 1.65 }}>
            A prolate body in a cubic cell is closer to its own images along its long axis than across it, so
            the periodic array is not isotropic about it: the two orientations are corrected by different
            amounts, and the ratio inherits the difference. The compact cell's{" "}
            {percent(oberbeckL4Full.deviation)} is therefore quantified cell physics, not method error — and
            the collapse was predicted before the half-size body was run.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 32, maxWidth: 1040 }}>
        <h3>The ladder</h3>
        <LadderTable rows={oberbeckRungs} />
        <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
          Hydrodynamic radii from the Hasimoto inversion of each run's steady drag and superficial velocity.
          The volume-corrected ratios differ from these in the fifth digit and are carried in{" "}
          <Mono>gates.csv</Mono>.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={oberbeckRatioSpecs} defaultMetric="ratio" />
      </div>
      <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 900, marginTop: 20 }}>
        The abscissa is how much of the cell the body spans along its long axis, which is the axis the result
        moves along. The two full-size rungs sit at the same place on it and land on top of each other despite
        a factor of two in mesh spacing; the rung that halves the body drops into the band. Reading the plot
        left to right is reading the extrapolation toward an unbounded fluid.
      </p>
    </Section>
  );
}

function AbsolutesTab() {
  const rows = oberbeckRungs.flatMap(rung =>
    rung.orientations.map(entry => ({
      id: `${rung.id}-${entry.id}`,
      rung: rung.short,
      orientation: orientationLabel[entry.id as OberbeckOrientationId],
      rh: entry.rhCorrected,
      target: entry.target,
      deviation: entry.deviationCorrected,
      torqueNull: entry.torqueNull
    }))
  );

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ maxWidth: 900, gap: 20 }}>
        <h3 style={{ margin: 0 }}>Each orientation against its own resistance function</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The ratio is the number that matters, because the lattice correction and the discretisation bias
          mostly cancel in it. The absolute radii carry both, so their tolerance is three per cent instead of
          two. They are worth reading anyway, because they say something the ratio cannot: whether the method
          converges.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          They do. Doubling the mesh at full body size moves the parallel orientation from{" "}
          {percent(oberbeckOrientation(oberbeckL3Full, "parallel").deviationCorrected)} to{" "}
          {percent(oberbeckOrientation(oberbeckL4Full, "parallel").deviationCorrected)} and the perpendicular
          one from {percent(oberbeckOrientation(oberbeckL3Full, "perpendicular").deviationCorrected)} to{" "}
          {percent(oberbeckOrientation(oberbeckL4Full, "perpendicular").deviationCorrected)}, both toward zero.
          For the half-size body they are {percent(closingPar.deviationCorrected)} and{" "}
          {percent(closingPerp.deviationCorrected)} — inside the band with no correction of the radius applied
          at all. A correction of the radius by a fixed fraction of the mesh spacing, which works for a sphere,
          does not carry over to a body with two different semi-axes, so none is applied here; the uncorrected
          numbers do not need it.
        </p>
      </div>

      <div style={{ marginTop: 32, maxWidth: 1000 }}>
        <h3>Absolute radii and torque nulls</h3>
        <DataTable<(typeof rows)[number]>
          columns={[
            {
              id: "rung",
              header: "Configuration",
              render: row => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.rung}</span>
            },
            { id: "orientation", header: "Orientation", render: row => row.orientation },
            {
              id: "rh",
              header: "R_h",
              align: "right",
              render: row => <Mono>{row.rh.toFixed(6)}</Mono>
            },
            {
              id: "target",
              header: "Target",
              align: "right",
              render: row => <Mono>{row.target.toFixed(6)}</Mono>
            },
            {
              id: "dev",
              header: "Deviation",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{percent(row.deviation)}</span>
              )
            },
            {
              id: "torque",
              header: "|T| / (a|F|)",
              align: "right",
              render: row => <Mono>{row.torqueNull.toExponential(1)}</Mono>
            }
          ]}
          rows={rows}
          getRowKey={row => row.id}
        />
        <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
          Radii carry the imaged-volume correction each run reports for itself; targets are a·X^A and a·Y^A at
          that configuration's body size. The torque null is the measured moment in units of the drag moment scale —
          nowhere larger than {worstTorqueNull.toExponential(1)} against a tolerance of 1e-3, and a factor of ten
          smaller again at the finer level.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={oberbeckAbsolutesSpecs} defaultMetric="absolutes" />
      </div>

      <div className="stack" style={{ marginTop: 44, maxWidth: 900, gap: 32 }}>
        <div>
          <h3>The off-diagonal, qualitatively</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            A third orientation was run with the axis at 45 degrees, where the resistance tensor is no longer
            diagonal in the frame of the driving force. Under body-force driving the drag direction cannot
            report that: momentum balance pins every component of the force, so the mobility shows up in the
            mean flow instead, which tilts toward the body's axis. It does, by{" "}
            <Mono>+5.86°</Mono> against an unbounded prediction of{" "}
            <Mono>+{oberbeckOblique.predictedTilt.toFixed(2)}°</Mono> — the right sign, the transverse
            component symmetry demands at machine zero, and a magnitude inflated by the same finite-cell
            anisotropy that owns the ratio residual above. It is reported as a qualitative check; a
            quantitative comparison would need the half-size body in this orientation as well.
          </p>
        </div>
      </div>
    </Section>
  );
}

function SteadinessTab() {
  const sensitivityRows = oberbeckClosingRung.sensitivity.map((entry, index) => ({
    id: String(entry.window),
    window: entry.window,
    l3: oberbeckL3Full.sensitivity[index],
    l4: oberbeckL4Full.sensitivity[index],
    half: entry
  }));

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ maxWidth: 900, gap: 20 }}>
        <h3 style={{ margin: 0 }}>What the plateau is worth</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Every number on this page is read at the end of a run that goes to t = 4. Two things are worth
          showing about that: what the drag does on the way there, and how much the answer moves if the reading
          is taken as a trailing average over a window instead of at the last sample.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The drag history makes the momentum balance visible. Both orientations run to the same value — the
          driving force times the cell volume — because a steady periodic cell can do nothing else, and the two
          curves are indistinguishable at the plateau. Switch the panel to the superficial velocity and they
          separate by {percent(closingPar.velocity / closingPerp.velocity - 1, 0)}. That separation is the anisotropy; the force never carried it.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={oberbeckHistorySpecs} defaultMetric="force" />
      </div>

      <div className="stack" style={{ marginTop: 44, maxWidth: 900, gap: 32 }}>
        <div>
          <h3>Window sensitivity, honestly</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Re-reading the ratio as a trailing mean over windows of up to two time units moves it by a few
            hundredths of a per cent for the two full-size bodies and from {percent(oberbeckClosingRung.deviation)}{" "}
            to {percent(closingLongWindow.deviation)} for the half-size one. The half-size result is therefore
            &minus;0.3 to &minus;0.4 per cent depending on where the window is placed, robustly inside the
            two-per-cent band but not fixed to a third digit. The half-size body is the reason: its drag is
            still climbing at {percent(closingPar.trend, 2)} per time unit at t = 4, where the full-size runs
            are flat to within a few hundredths. An extended run would be needed to settle the last digit.
          </p>
          <DataTable<(typeof sensitivityRows)[number]>
            columns={[
              {
                id: "window",
                header: "Trailing window [t.u.]",
                align: "right",
                render: row => <Mono>{row.window.toFixed(2)}</Mono>
              },
              {
                id: "l3",
                header: `${oberbeckL3Full.short} ratio`,
                align: "right",
                render: row => (
                  <Mono>
                    {row.l3.ratio.toFixed(5)} ({percent(row.l3.deviation)})
                  </Mono>
                )
              },
              {
                id: "l4",
                header: `${oberbeckL4Full.short} ratio`,
                align: "right",
                render: row => (
                  <Mono>
                    {row.l4.ratio.toFixed(5)} ({percent(row.l4.deviation)})
                  </Mono>
                )
              },
              {
                id: "half",
                header: `${oberbeckL4Half.short} ratio`,
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                    {row.half.ratio.toFixed(5)} ({percent(row.half.deviation)})
                  </span>
                )
              }
            ]}
            rows={sensitivityRows}
            getRowKey={row => row.id}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            A window of zero is the last sample, which is the reading every other number on this page uses. The transient is shared between the two orientations of a configuration, which is why the ratio is far
            less sensitive to it than the individual radii would be.
          </p>
        </div>

      </div>
    </Section>
  );
}

function ReferenceDataTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 100 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "The run files are the raw record of each simulation: one line per time step, carrying the full wrench on the body, the cell's superficial velocity and the fluid fraction the run realised, neither smoothed nor trimmed. Alongside them, the run and configuration tables say which run supplied which orientation of which configuration, the results table carries the derived radii and deviations, and the window table carries the plateau sensitivity. All quantities are nondimensional with unit cell edge and unit viscosity, and forces and torques are signed in the cell frame. The bundle also contains the DNS validation datasheet, plus an extract of the rows that concern this benchmark."
          }
        ]}
      />
      <div className="stack" style={{ marginTop: 32, gap: 32 }}>
        <DataTable
          columns={[
            { id: "fileType", header: "Quantity", render: row => row.fileType },
            {
              id: "pattern",
              header: "Pattern",
              render: row => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.pattern}</span>
            },
            {
              id: "columns",
              header: "Columns",
              render: row => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.columns}</span>
            }
          ]}
          rows={oberbeckReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={oberbeckDownloads} />
      </div>
    </Section>
  );
}

export function OberbeckSpheroidDragPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "ratio", label: "Ratio Ladder" },
    { id: "absolutes", label: "Absolute Drag" },
    { id: "steadiness", label: "Steadiness" },
    { id: "reference-data", label: "Reference Data" }
  ];
  const [tab, setTab] = useTabParam(tabs.map(item => item.id), "introduction");

  return (
    <div>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)", padding: "24px 0" }}>
        <Section>
          <button
            type="button"
            className="focus-ring"
            onClick={() => navigate("/benchmarks")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: 0,
              background: "transparent",
              color: "var(--fg2)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              marginBottom: 12
            }}
          >
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / Oberbeck Spheroid Drag
          </button>
          <div className="split split-hero">
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">Oberbeck spheroid drag</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>DNS validation</Chip>
              </div>
              <h1 className="display display-md" style={{ margin: "0 0 12px" }}>
                Oberbeck:{" "}
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "var(--primary)"
                  }}
                >
                  Anisotropic Drag
                </span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A prolate spheroid held fixed in a periodic Stokes cell, measured end-on and broadside against
                Oberbeck&apos;s 1876 resistance functions — and three runs that attribute the residual to the
                cell rather than the method.
              </p>
            </div>
            <div className="kpi-grid">
              <KpiBox label="Configurations" value={String(oberbeckRungs.length)} />
              <KpiBox label="Aspect ratio" value={String(oberbeckCell.aspectRatio)} />
              <KpiBox label="Thin axis 2b/h" value={THIN_PRODUCTION} />
              <KpiBox label="Ratio vs Oberbeck" value={CLOSING_DEV} good />
              <KpiBox
                label="Absolutes"
                value={`${percent(closingPar.deviationCorrected, 1)} / ${percent(
                  closingPerp.deviationCorrected,
                  1
                )}`}
                good
              />
              <KpiBox label="Torque null" value={closingTorqueNull.toExponential(0)} good />
            </div>
          </div>
        </Section>
      </div>

      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}>
        <Section>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </Section>
      </div>

      {tab === "introduction" && <IntroductionTab />}
      {tab === "definition" && <DefinitionTab />}
      {tab === "ratio" && <RatioTab />}
      {tab === "absolutes" && <AbsolutesTab />}
      {tab === "steadiness" && <SteadinessTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
