import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Icon,
  KpiBox,
  ReferenceList,
  Section,
  Tabs,
  useTabParam,
  ValidationLedger
} from "../components";
import { JefferySchematic } from "../components/jeffery-schematic";
import {
  jefferyClearanceSpecs,
  jefferyClosedForm,
  jefferyControl,
  jefferyControlSpecs,
  jefferyDownloads,
  jefferyGateRows,
  jefferyH4,
  jefferyH8,
  jefferyOrbitSpecs,
  jefferyOrbits,
  jefferyOrientBins,
  jefferyParameterRows,
  jefferyReferenceRows,
  jefferyReferences,
  jefferyRuns,
  jefferySeamWindow,
  jefferyValidationRows,
  jefferyWall,
  jefferyWallModel,
  percent,
  points,
  type JefferyGateRow,
  type JefferyParameterRow,
  type JefferyRun
} from "../data/jeffery";

const PERIOD_TARGET = jefferyClosedForm.periodGamma.toFixed(5);
const H8_PERIOD = jefferyH8.analysis.periodGamma!.toFixed(4);
const H4_PERIOD = jefferyH4.analysis.periodGamma!.toFixed(4);
const H8_DEV = percent(jefferyH8.analysis.periodDeviation!);
const H4_DEV = percent(jefferyH4.analysis.periodDeviation!);

const CUBIC = jefferyWallModel("cubic");
const SQUARE = jefferyWallModel("square");

/** The sphere control run, quoted next to the orbits for its resolution and spin. */
const jefferyControlRun = jefferyRuns.find(run => run.role === "control")!;

/** Thin-axis resolution gap between the two boxes: the caveat's one number. */
const resolutionGap = `${(
  Math.abs(jefferyH4.thinAxisResolution / jefferyH8.thinAxisResolution - 1) * 100
).toFixed(1)} per cent`;

/** Largest orbit-plane excursion anywhere on the ladder. */
const worstAxisY = Math.max(...jefferyRuns.map(run => run.analysis.maxAxisY));

/** Tightest half-period agreement across a segment seam, in time units. */
const seamSpread = Math.max(
  ...jefferyOrbits.map(run => Math.max(...run.analysis.halfPeriods) - Math.min(...run.analysis.halfPeriods))
);

function Mono({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: "var(--font-mono)" }}>{children}</span>;
}

function Row({ children }: { children: ReactNode }) {
  return <span className="code-inline">{children}</span>;
}

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "Drop an elongated particle into a simple shear flow and it does not settle into an orientation. It tumbles, forever, and not at a steady rate: it hurries through the orientations where it stands across the flow and lingers in the ones where it lies along it. Jeffery worked the motion out in 1922 and it is exact — a closed-form orbit with no fitted constant, the period and the whole rate waveform fixed by the aspect ratio and the shear rate alone."
          },
          {
            type: "equation",
            value:
              "$T = \\frac{2\\pi}{\\dot\\gamma}\\left(r_e + \\frac{1}{r_e}\\right), \\qquad \\left|\\frac{d\\varphi}{dt}\\right| = \\dot\\gamma\\,\\frac{\\cos^{2}\\varphi + r_e^{2}\\sin^{2}\\varphi}{r_e^{2} + 1}$",
            block: true
          },
          {
            type: "paragraph",
            text:
              `Here phi is the angle of the body's symmetry axis from the flow direction, in the plane of the shear. At aspect ratio two the period is T·gammadot = ${PERIOD_TARGET} whatever the shear rate, and the rate swings by a factor of ${jefferyClosedForm.modulation} between its slowest and its fastest point in every turn. That is a demanding pair of targets: the period is an integral over the whole orbit and the waveform is its shape, and a method can get one right while getting the other wrong.`
          },
          { type: "heading", level: 3, text: "What this case actually tests" },
          {
            type: "paragraph",
            text:
              "This is the second non-spherical case in the DNS validation campaign, and the first in which torque does anything. The spheroid case before it held its body fixed and checked that the hydrodynamic torque on it was zero — a null, which a method can pass by not computing torque at all. Here the body is free to rotate, so the whole rotational path is under test end to end: the fluid torque on the immersed surface, the rigid-body angular update, the orientation integration, and the axis that comes back out. The orbit is the integral of all of it over a hundred and twenty time units."
          },
          {
            type: "paragraph",
            text:
              `Measured in a box whose walls stand eight semi-major axes from the body, the period came out T·gammadot = ${H8_PERIOD}, ${H8_DEV} of Jeffery, with the rate waveform tracking the closed form to ${(
                jefferyH8.analysis.orient.rmsResidual * 100
              ).toFixed(2)} per cent of gammadot and the orbit staying in its plane to ${jefferyH8.analysis.maxAxisY.toExponential(
                1
              )} (row d62_v1b_orbit).`
          },
          { type: "heading", level: 3, text: "The walls, and why they get their own rung" },
          {
            type: "paragraph",
            text:
              `A tenth of a per cent is a small number, but a number that small is only meaningful once you know what is in it. Shear in a box is shear between walls, and walls are the one thing Jeffery's unbounded solution does not have. So the case carries a required second rung: the same body, the same shear rate, the same streamwise and spanwise periods, and half the box height. Halving the clearance lengthened the period to ${H4_PERIOD}, ${H4_DEV} — a shift of ${points(jefferyWall.shift)}. The walls retard the orbit, the effect shrinks as they move away, and the ladder converges toward Jeffery rather than away from him.`
          },
          {
            type: "paragraph",
            text:
              `Extrapolated to no walls at all, the residual is ${percent(CUBIC.intercept)} on an image-dipole scaling and ${percent(
                SQUARE.intercept
              )} on a slower one — either way a wall systematic of one to two tenths of a point inside the certified number, and a clearance-free residual no larger than the resolution and finite-Reynolds share. Through both of those shifts the rate waveform stays on Jeffery's curve. A period that drifts while the shape holds is the signature of a clock effect, not a physics error, and it is exactly the picture the figures are built to show.`
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={jefferyReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Fixture" },
          {
            type: "paragraph",
            text:
              `A prolate spheroid of aspect ratio ${jefferyH8.re} — semi-axes a = ${jefferyH8.a}, b = c = ${jefferyH8.b} — sits at the centre of a planar Couette box of ${jefferyH8.box.x} by ${jefferyH8.box.y} by H, periodic along the flow and spanwise directions, with the walls at z = +/-H/2 driven in opposite directions at +/- gammadot H / 2. That makes the undisturbed flow a linear shear of rate gammadot = ${jefferyH8.gammadot} with its vorticity along +y, and the shear Reynolds number on the semi-major axis is gammadot a^2 / nu = ${jefferyH8.reynolds}. The box is planar by decision, not convenience: Jeffery's solution is for linear shear, and the curvature of an annular viscometer would contaminate the gate it is supposed to close.`
          },
          {
            type: "paragraph",
            text:
              "The body's translation is locked and its rotation is free, so it neither drifts nor sediments and the only degree of freedom under test is the one the benchmark measures. The axis starts along the flow direction, which is the slow phase of the orbit and so the gentlest place to begin."
          }
        ]}
      />
      <JefferySchematic />
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Method note on the density" },
          {
            type: "paragraph",
            text:
              "With translation locked and gravity off, the particle density enters only through the rotational inertia; a density ratio of 10 keeps the explicit torque exchange stable (rotational relaxation 0.04 time units, dt 0.01) while tau_rot·gammadot = 0.008 leaves the zero-inertia Jeffery limit intact."
          },
          { type: "heading", level: 3, text: "The observable" },
          {
            type: "paragraph",
            text:
              `The solver records the unit vector along the body's symmetry axis at every step. Everything on this page is a statistic of that one series. The in-plane angle is phi = atan2(a_z, a_x), unwrapped modulo pi rather than 2pi because a body axis is headless — a and −a are the same orientation, so one turn of the body is a half turn of phi. The period comes from successive pi-crossings, since by the orbit's own symmetry each half turn takes exactly T/2; a mean-rate estimate would be biased over the non-integer number of half turns a finite run covers.`
          },
          {
            type: "paragraph",
            text:
              `The rate waveform is a centred difference of phi, and it is gated twice: once on its extrema, whose ratio must be r_e^2, and once against orientation, by binning the rate into ${jefferyOrientBins} bins of phi mod pi and comparing each bin with Jeffery's rate at the bin centre. The second gate is the one that matters. Extrema alone accept an orbit shifted by a quarter turn — one that runs fastest exactly where Jeffery runs slowest — and that failure mode is only visible when the rate is read against where the body is pointing.`
          },
          { type: "heading", level: 3, text: "Segments" },
          {
            type: "paragraph",
            text:
              `Each orbit run is ${jefferyH8.segments} twenty-four-hour segments on two nodes of the production cluster, and the restarts carry the orientation across the seam. The body does restart a segment with zero angular velocity and spins back up within tau_rot, so samples in the ${jefferySeamWindow}-time-unit window after each restart are masked out of the waveform. The period is unaffected either way: the half-periods that straddle a seam agree with the ones that do not to ${seamSpread.toExponential(
                0
              )} time units.`
          }
        ]}
      />
      <div style={{ display: "grid", gap: 32, marginTop: 24 }}>
        <div>
          <h3>Case parameters</h3>
          <DataTable<JefferyParameterRow>
            columns={[
              { id: "symbol", header: "Symbol", render: row => <Mono>{row.symbol}</Mono> },
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
            rows={jefferyParameterRows}
            getRowKey={row => `${row.symbol}-${row.quantity}`}
          />
        </div>

        <div>
          <h3>Gates</h3>
          <DataTable<JefferyGateRow>
            columns={[
              { id: "gate", header: "Gate", render: row => <span style={{ fontWeight: 500 }}>{row.gate}</span> },
              { id: "quantity", header: "Quantity", render: row => row.quantity },
              { id: "band", header: "Band", align: "right", render: row => <Mono>{row.band}</Mono> },
              {
                id: "measured",
                header: "Default clearance",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {row.measured}
                  </span>
                )
              }
            ]}
            rows={jefferyGateRows}
            getRowKey={row => row.gate}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            The rotation sense is checked separately and is not a band: with the vorticity along +y the
            physical spin is omega_y = +gammadot/2, so phi must decrease. It does, in every run.
          </p>
        </div>
      </div>
    </Section>
  );
}

function OrbitTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>Jeffery's curve, and the samples on it</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Three views of the same {jefferyH8.analysis.halfTurns.toFixed(2)} half-turns. The first is the
          body's axis against time, the second is how fast it is turning, and the third is how fast it is
          turning as a function of where it is pointing. In all three the continuous curve is Jeffery's
          closed form and the markers are the simulation.
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
            The analytic curve is anchored at the first sample and then left to run on Jeffery's own
            theoretical period. It is not refitted to the data. A period error therefore does not average
            away — it accumulates into a phase lag that grows across the frame, which is what lets the two
            clearances be told apart by eye while their waveforms remain indistinguishable.
          </p>
        </div>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Switch the metric to the rate and turn on both clearances: the half-clearance run falls behind
          the theoretical clock about two and a half times as fast. Switch to the waveform and the two
          collapse onto the same curve, because that frame has no clock in it at all.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={jefferyOrbitSpecs} defaultMetric="axis" />
      </div>

      <div style={{ marginTop: 36, maxWidth: 1040 }}>
        <h3>The orbit gates, both clearances</h3>
        <DataTable<JefferyRun>
          columns={[
            {
              id: "run",
              header: "Clearance",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                  {row.clearanceAxes}a
                </span>
              )
            },
            {
              id: "period",
              header: "T gammadot",
              align: "right",
              render: row => <Mono>{row.analysis.periodGamma!.toFixed(4)}</Mono>
            },
            {
              id: "dev",
              header: "vs Jeffery",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                  {percent(row.analysis.periodDeviation!)}
                </span>
              )
            },
            {
              id: "mod",
              header: "Modulation",
              align: "right",
              render: row => (
                <Mono>
                  {row.analysis.rate.modulation.toFixed(3)} ({percent(row.analysis.rate.modulationDeviation, 1)})
                </Mono>
              )
            },
            {
              id: "placement",
              header: "Rate placement",
              align: "right",
              render: row => <Mono>{percent(row.analysis.orient.placementDeviation!)}</Mono>
            },
            {
              id: "rms",
              header: "Waveform rms",
              align: "right",
              render: row => <Mono>{(row.analysis.orient.rmsResidual * 100).toFixed(2)}%</Mono>
            },
            {
              id: "plane",
              header: "max |a_y|",
              align: "right",
              render: row => <Mono>{row.analysis.maxAxisY.toExponential(1)}</Mono>
            }
          ]}
          rows={jefferyOrbits}
          getRowKey={row => row.id}
        />
        <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
          Rate placement is the measured ratio of the rate at flow alignment to the rate through the
          gradient direction, against Jeffery's 1/r_e^2; the rms is the residual over the{" "}
          {jefferyOrientBins} orientation bins, in units of gammadot. Both runs are slow at flow alignment and
          fast through the gradient direction, which is the way round Jeffery requires — and the way round
          a quarter-turn-shifted orbit would not be. The orbit plane is neutrally stable at these
          Reynolds numbers, and the out-of-plane component stays below{" "}
          {worstAxisY.toExponential(1)} against a gate of 0.02.
        </p>
      </div>

      <div style={{ marginTop: 44, maxWidth: 900 }}>
        <h3>Where the period is read</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          At the default clearance the axis crossed pi at t ={" "}
          {jefferyH8.analysis.crossings.map(value => value.toFixed(4)).join(", ")}, giving half-periods of{" "}
          {jefferyH8.analysis.halfPeriods.map(value => value.toFixed(3)).join(" and ")}. At half the
          clearance the crossings are {jefferyH4.analysis.crossings.map(value => value.toFixed(4)).join(", ")}{" "}
          and the half-periods {jefferyH4.analysis.halfPeriods.map(value => value.toFixed(3)).join(" and ")}.
          The two half-periods of each run bracket a segment restart and agree to a couple of thousandths
          of a time unit, so the chaining costs nothing the period can see.
        </p>
      </div>
    </Section>
  );
}

function ClearanceTab() {
  const rows = jefferyWall.models.map(model => ({
    id: model.id,
    label: model.label,
    exponent: model.exponent,
    intercept: model.intercept
  }));

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>Halving the clearance, changing one thing</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The second rung keeps the body, the aspect ratio, the shear rate, the time step and the
          streamwise and spanwise periods, and halves the box height. The wall speed halves with it, which
          is what holds gammadot fixed. One parameter moves: how far the walls stand from the body, from{" "}
          {jefferyH8.clearanceAxes} semi-major axes to {jefferyH4.clearanceAxes}.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The period lengthens, from {H8_PERIOD} to {H4_PERIOD} — {H8_DEV} to {H4_DEV} of Jeffery, a shift
          of {points(jefferyWall.shift)}. The sign is the informative part: the walls slow the orbit down,
          and moving them away brings it back toward the unbounded solution rather than past it
          (<Row>d62_v2_clearance</Row>).
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
            Two clearances support two straight lines, one per scaling law, and the clearance-free period
            is where each of them crosses zero. An image-dipole law falling as (a/l)^3 puts it at{" "}
            {percent(CUBIC.intercept)}; a slower (a/l)^2 law puts it at {percent(SQUARE.intercept)}. The
            bracket, not the fit, is the claim: the wall systematic carried by the certified number is one
            to two tenths of a percentage point, and what is left when the walls are gone is the size of
            the resolution and finite-Reynolds share.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={jefferyClearanceSpecs} defaultMetric="period" />
      </div>
      <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 900, marginTop: 20 }}>
        The abscissa is the body's semi-major axis over its distance to the wall, so the left edge is an
        unbounded fluid and reading the frame right to left is the extrapolation. On the absolute frame
        both rungs sit deep inside the three-per-cent band; switch to the zoomed excess to see the two
        laws separate, which they only do below the clearances actually run.
      </p>

      <div style={{ marginTop: 40, maxWidth: 900, display: "grid", gap: 32 }}>
        <div>
          <h3>The extrapolations</h3>
          <DataTable<(typeof rows)[number]>
            columns={[
              { id: "label", header: "Law", render: row => row.label },
              {
                id: "exponent",
                header: "Falls as",
                align: "right",
                render: row => <Mono>(a/l)^{row.exponent}</Mono>
              },
              {
                id: "intercept",
                header: "Clearance-free period excess",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                    {percent(row.intercept)}
                  </span>
                )
              }
            ]}
            rows={rows}
            getRowKey={row => row.id}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            Two points determine each line exactly, so these are readings rather than regressions, and
            they are quoted as a bracket for that reason. The case deliberately does not attempt an
            analytic wall correction; it measures the systematic and prices it.
          </p>
        </div>

        <div>
          <h3>One honest caveat</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The half-clearance box is not quite the same mesh. Read from each run's own resolution
            record, the two meshes differ by {resolutionGap} in thin-axis resolution (2b/h{" "}
            {jefferyH8.thinAxisResolution.toFixed(1)} vs {jefferyH4.thinAxisResolution.toFixed(1)}), far
            too small to produce the {points(jefferyWall.shift)} shift — the spheroid-drag refinement
            ladder that precedes this case moved its ratio by 1e-4 under a doubling of the mesh — so the
            shift is the wall effect. The bodies are resolved by {jefferyH8.insideDofs} and{" "}
            {jefferyH4.insideDofs} interior degrees of freedom respectively, and{" "}
            {jefferyControlRun.insideDofs} for the sphere control (<Row>d62_resolution_pinned</Row>).
          </p>
        </div>

        <div>
          <h3>What the waveform says while the period moves</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            At half the clearance the waveform is, if anything, better placed than at the default one: the
            orientation-resolved rate sits {percent(jefferyH4.analysis.orient.placementDeviation!)} from
            Jeffery against {percent(jefferyH8.analysis.orient.placementDeviation!)}, with an rms residual
            of {(jefferyH4.analysis.orient.rmsResidual * 100).toFixed(2)} per cent of gammadot against{" "}
            {(jefferyH8.analysis.orient.rmsResidual * 100).toFixed(2)}. The modulation widens slightly,
            from {jefferyH8.analysis.rate.modulation.toFixed(3)} to{" "}
            {jefferyH4.analysis.rate.modulation.toFixed(3)} against an exact{" "}
            {jefferyClosedForm.modulation}. A body that is turning through the right shape at the wrong
            speed is a body whose clock the walls have touched — which is the reading, and the reason the
            rung was required rather than optional.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ControlTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>A sphere, before anything with a shape</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          At aspect ratio one Jeffery's orbit degenerates into something with no shape left in it: a
          sphere in a shear flow spins steadily at half the vorticity, omega_y = +gammadot/2, forever and uniformly.
          There is no period to measure and no waveform to fit. That makes it the ideal control — it
          certifies the torque-to-rotation chain against an exact, shape-free number before the spheroid
          is asked to do anything more interesting.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Run in the same box at the same resolution, the sphere returns{" "}
          {jefferyControl.spin.toFixed(5)} against an exact −0.5, or {percent(jefferyControl.deviation)} —
          at the edge of the one-per-cent band, with no drift over the settled tail and a spin that is
          uniform to {jefferyControl.modulation.toFixed(3)}. The excess is attributed to the fictitious-
          boundary discretisation at this resolution; wall and image corrections in this box are four
          orders of magnitude smaller (<Row>d62_v0b_spin</Row>).
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={jefferyControlSpecs} defaultMetric="spin" />
      </div>

      <div style={{ marginTop: 40, maxWidth: 900, display: "grid", gap: 32 }}>
        <div>
          <h3>Why it is quoted next to the orbit</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The sphere's {percent(jefferyControl.deviation)} and the orbit's {H8_DEV} are the same kind of
            number, with the same sign, from the same fixture at the same resolution — a rotation rate
            slightly too slow, so a clock slightly too long. The control therefore does double duty: it
            certifies the chain, and it sets the scale of the discretisation share in the orbit's period
            excess, which is what makes the clearance-free residual of {percent(CUBIC.intercept)} to{" "}
            {percent(SQUARE.intercept)} a credible remainder rather than an unexplained one.
          </p>
        </div>
        <div>
          <h3>In plane</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The sphere's axis is a passive marker rather than a physical orientation, and it stays in the
            shear plane to {jefferyControl.maxAxisY.toExponential(1)}. The orbit runs keep their plane to{" "}
            {jefferyH8.analysis.maxAxisY.toExponential(1)} and{" "}
            {jefferyH4.analysis.maxAxisY.toExponential(1)}. The in-plane orbit is neutrally stable in
            Stokes flow — nothing restores it — so any drift there would be integration error, and there
            is none to five or more decimal places.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ValidationTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, marginBottom: 28 }}>
        <h3>Validation ledger</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          One row per quantitative claim, generated from the campaign datasheet that is offered in full
          under Reference Data and reproduced as the campaign wrote it, apart from internal run
          identifiers. Every gate on this page is against a closed-form solution rather than another
          simulation: Jeffery's period and waveform for the orbit, the exact half-vorticity spin for the
          sphere, and a measured-not-assumed shift for the walls.
        </p>
      </div>
      <ValidationLedger rows={jefferyValidationRows} />
      <div style={{ marginTop: 36, maxWidth: 900, display: "grid", gap: 20 }}>
        <div>
          <h3>Controlled comparison</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The two orbit runs share the body, the aspect ratio, the shear rate, the time step, the
            binary and the analysis. Exactly one thing differs between them — the height of the box, and
            with it the distance from the body to the wall. The sphere control shares the box with the
            default-clearance orbit and differs only in the shape of the body. Each comparison moves one
            thing.
          </p>
        </div>
        <div>
          <h3>How the numbers were derived</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every period, waveform statistic, orientation bin and extrapolation on this page is recomputed
            at build time from the published orientation traces by the same procedure as the campaign's
            own analysis tool, and Jeffery's targets — T·gammadot = {PERIOD_TARGET}, a modulation of{" "}
            {jefferyClosedForm.modulation}, rates of {jefferyClosedForm.slow} and{" "}
            {jefferyClosedForm.fast} — are evaluated from the aspect ratio and the shear rate rather than
            transcribed. A test pins the re-derivation against the tool's printed report, down to the
            individual pi-crossing times, so the two cannot drift apart silently.
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
              "The run files are the raw record of each simulation: one line per time step, carrying the unit vector along the body's symmetry axis, neither smoothed nor resampled. The orbit runs are concatenations of three segments each, with the overlap a restart replays trimmed away; the restart times themselves travel in the run table, so any masking this page applies can be reproduced or rejected. Alongside them, the gate report carries the derived periods and waveform statistics, the crossings file carries the times the period is read from, the bin file carries the orientation-resolved waveform, and the extrapolation file carries the two wall laws. All quantities are nondimensional in campaign box units with unit viscosity. The bundle also contains the campaign datasheet from which the validation ledger is generated, plus the extract of just the rows this page publishes."
          }
        ]}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 32 }}>
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
          rows={jefferyReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={jefferyDownloads} />
      </div>
    </Section>
  );
}

export function JefferyOrbitPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "orbit", label: "The Orbit" },
    { id: "clearance", label: "Wall Clearance" },
    { id: "control", label: "Sphere Control" },
    { id: "validation", label: "Validation" },
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
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / Jeffery Orbit
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">Jeffery orbit</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>DNS validation</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Jeffery:{" "}
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "var(--primary)"
                  }}
                >
                  Tumbling Orbit
                </span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A prolate spheroid tumbling freely in planar Couette flow, measured against
                Jeffery&apos;s 1922 closed form — and a wall-clearance rung that turns the period residual
                from an unknown into a quantity.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Aspect ratio" value={String(jefferyH8.re)} />
              <KpiBox label="Orbits per run" value={(jefferyH8.analysis.halfTurns / 2).toFixed(2)} />
              <KpiBox label="Re_a" value={String(jefferyH8.reynolds)} />
              <KpiBox label="Period vs Jeffery" value={H8_DEV} good />
              <KpiBox label="Waveform rms" value={`${(jefferyH8.analysis.orient.rmsResidual * 100).toFixed(2)}%`} good />
              <KpiBox label="Wall shift" value={points(jefferyWall.shift, 2)} />
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
      {tab === "orbit" && <OrbitTab />}
      {tab === "clearance" && <ClearanceTab />}
      {tab === "control" && <ControlTab />}
      {tab === "validation" && <ValidationTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
