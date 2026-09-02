import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Equation,
  Icon,
  KpiBox,
  ReferenceList,
  Section,
  Tabs,
  useTabParam,
  ValidationLedger
} from "../components";
import { ViscometerSchematic } from "../components/viscometer-schematic";
import {
  closureName,
  percent,
  viscometerBaseline,
  viscometerDownloads,
  viscometerEinstein,
  viscometerGateRows,
  viscometerGatedLadder,
  viscometerGates,
  viscometerInstrument,
  viscometerLadderRows,
  viscometerLoadedRungs,
  viscometerPairDecay,
  viscometerPairs,
  viscometerPairsSpecs,
  viscometerParameterRows,
  viscometerPhi20,
  viscometerReferenceRows,
  viscometerReferences,
  viscometerTorqueSpecs,
  viscometerValidationRows,
  viscometerViscositySpecs,
  type ViscometerGateRow,
  type ViscometerGatedRung,
  type ViscometerLadderRow,
  type ViscometerPair,
  type ViscometerParameterRow,
  type ViscometerRung
} from "../data/numerical-viscometer";

const T_EXACT = viscometerInstrument.torqueExact.toFixed(2);
const T_EXACT_LONG = viscometerInstrument.torqueExact.toFixed(4);
const CORRECTION = viscometerInstrument.transposeCorrection.toFixed(3);
const ETA = viscometerEinstein.eta.toFixed(4);
const ETA_PSTD = viscometerEinstein.etaPstd.toFixed(4);
const ETA_COMPOSITE = viscometerEinstein.etaComposite.toFixed(4);
const ETA_NAIVE = viscometerEinstein.etaNaive.toFixed(4);
const PHI = viscometerEinstein.phi.toFixed(2);
const N_PARTICLES = String(viscometerEinstein.particles);
const PHI_MAX = viscometerPhi20.phi.toFixed(2);
const ETA_MAX = viscometerPhi20.eta.toFixed(4);

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "Suspend rigid spheres in a liquid and the mixture resists shear more than the liquid alone. Einstein derived the dilute limit of that excess in 1906 and corrected it in 1911: to first order in the particle volume fraction, the effective viscosity rises by two and a half times the concentration, and by nothing else — not the particle size, not the size distribution, not the shear rate."
          },
          { type: "equation", value: "$\\eta \\equiv \\frac{\\mu_{\\mathrm{eff}}}{\\mu} = 1 + \\frac{5}{2}\\,\\phi$", block: true },
          {
            type: "paragraph",
            text:
              "The law is a century old and universally quoted, which makes it an unusually demanding thing to reproduce by direct numerical simulation. There is no fitted parameter to hide in. Getting the coefficient right means resolving the disturbance flow around every single sphere, transporting each of them correctly through a moving-boundary treatment, and then summing what they do into one collective torque — the fictitious-boundary method, the rigid-body coupling and the force metrology all measured at once, by a single number."
          },
          { type: "heading", level: 3, text: "An instrument with an exact reading" },
          {
            type: "paragraph",
            text:
              "This benchmark builds a viscometer to do the measuring. It is a Searle-type Couette cell: an annular gap with a rotating inner surface and a static outer wall, the numerical counterpart of the rotational rheometer a laboratory would reach for. Its virtue is that the empty instrument can be solved in closed form. Closing the cell with free-slip symmetry planes instead of end plates removes the end effects, leaving an axially uniform annular Couette flow whose torque on the bob is exactly"
          },
          {
            type: "equation",
            value: "$T_{\\mathrm{exact}} = \\frac{4\\pi\\mu\\Omega}{r_i^{-2} - r_a^{-2}}\\,H$",
            block: true
          },
          {
            type: "paragraph",
            text:
              `which at the operating point of this case is ${T_EXACT_LONG}. So before anything is suspended in the gap, the instrument can be calibrated against a number that owes nothing to another simulation, another code or a digitised experimental curve.`
          },
          { type: "heading", level: 3, text: "What is then measured" },
          {
            type: "paragraph",
            text:
              "With the empty cell certified, the effective viscosity of a suspension is a ratio of two readings taken with the same instrument: the torque needed to turn the bob through the suspension, over the torque needed to turn it through the pure fluid."
          },
          { type: "equation", value: "$\\eta = \\frac{T(\\phi)}{T(0)}$", block: true },
          {
            type: "paragraph",
            text:
              `At ${"φ"} = ${PHI} the instrument reads ${ETA}. That is not the naive ${ETA_NAIVE} of the dilute law, and it should not be: the spheres are kept half a diameter clear of both walls, so the gap carries thin particle-free layers at either side that shear more easily than the bulk. Einstein's coefficient applies where the particles are, and the composite of those layers with the loaded core is what the measurement has to be compared against. Computed from the concentration field the run itself produced, that composite target is ${ETA_COMPOSITE}, and the measurement lands ${percent(viscometerEinstein.deviationComposite)} from it.`
          },
          { type: "heading", level: 3, text: "And then past it" },
          {
            type: "paragraph",
            text:
              `Einstein's law is first order in concentration, so it has an expiry date. The ladder walks up to ${"φ"} = ${PHI_MAX}, where the instrument reads ${ETA_MAX} — more than seventy per cent above the pure fluid — and at every rung the measurement lands on the closure that governs it: Einstein while particles are effectively alone, Batchelor once they interact in pairs, and a concentrated closure past the point where that series expires. Three regimes, no tuned parameter, one instrument. The two densest rungs were then each run twice over, to price what the mesh leaves out of the films between nearly touching spheres.`
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={viscometerReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry" },
          {
            type: "paragraph",
            text:
              `Lengths are in particle diameters, d = 1. The cell is an annulus of inner radius ${viscometerInstrument.rInner} and outer radius ${viscometerInstrument.rOuter}, so the gap is five particle diameters wide at a radius ratio of one half. The height is ${viscometerInstrument.height} and both ends are free-slip symmetry planes. The inner surface — the bob — is not a meshed body but an un-meshed hole running through the full height of the cell, with the rotation prescribed on its wall.`
          },
          {
            type: "paragraph",
            text:
              "That construction is what makes the flow quasi-two-dimensional. There are no end plates to drive secondary circulation and no axial variation to resolve, so the empty cell is a pure annular Couette flow and its torque is analytic. The same choice keeps the instrument honest once it is loaded: the suspension sees a uniform shear field over the whole height rather than a core plus two end regions."
          },
          {
            type: "paragraph",
            text:
              "The configuration mirrors a legacy FeatFloWer viscometer study at the same gap-to-diameter ratio and the same radius ratio, restated here in dimensionless form so that the operating point can be chosen for the physics rather than inherited from a rig."
          }
        ]}
      />
      <ViscometerSchematic />
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Operating point" },
          {
            type: "paragraph",
            text:
              `The bob turns at ${"Ω"} = ${viscometerInstrument.omega}, giving a surface speed of ${viscometerInstrument.bobSpeed.toFixed(
                2
              )} and a particle Reynolds number of about 0.5 — inertia is present but small, which is the regime Einstein's result belongs to. The Taylor number is 156, comfortably below the onset of Taylor vortices, so the base flow is the laminar circular one and stays that way. The gap is resolved at eight to nine elements per particle diameter on an 18,800-hexahedron O-grid, partitioned into 108 subdomains.`
          }
        ]}
      />
      <div style={{ display: "grid", gap: 32, marginTop: 24 }}>
        <div>
          <h3>Case parameters</h3>
          <DataTable<ViscometerParameterRow>
            columns={[
              {
                id: "symbol",
                header: "Symbol",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.symbol}</span>
                )
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
            rows={viscometerParameterRows}
            getRowKey={row => `${row.symbol}-${row.quantity}`}
          />
        </div>

        <div>
          <h3>Two torque estimators</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The torque on the bob is measured twice, by two routes that share almost no code. The volume-form
            estimator integrates the deformation stress over the fluid; the reaction estimator sums what the
            solver applies at the rotating boundary. They do not agree outright, and they are not meant to: the
            reaction form does not carry the transpose term over the enclosed hole, so the two differ by exactly
          </p>
          <Equation block>{"$\\Delta T = 2\\mu\\Omega V_{\\mathrm{hole}}$"}</Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            which is {CORRECTION} for this cell. The offset depends only on the enclosed, particle-free volume,
            so it is a fixed property of the geometry and not of what is suspended in the gap. Adding it back
            turns a second, independent reading of the same torque into a cross-check on the first.
          </p>
        </div>

        <div>
          <h3>Observables</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every number on this page is a plateau statistic of the torque history: the mean over the settled
            window, with its scatter about that mean. The empty instrument is averaged over t ={" "}
            {viscometerBaseline.window[0]}–{viscometerBaseline.window[1]} and the suspension over t ={" "}
            {viscometerEinstein.window[0]}–{viscometerEinstein.window[1]}, the latter after the seeding transient
            has run out.
          </p>
        </div>
      </div>
    </Section>
  );
}

function BaselineTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>The empty instrument, against an exact answer</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Nothing is suspended in the gap; the bob simply turns until the flow is steady. Four gates then decide
          whether the instrument may be used: the torque it reports, the velocity field it produces, the
          agreement between its two independent torque estimators, and the steadiness of the reading. All four
          pass, with wide margins.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The torque plateaus at {viscometerBaseline.torqueDna.toFixed(4)} against the analytic {T_EXACT_LONG},
          a deviation of {percent(viscometerGates.torque)} on a gate of three per cent. The azimuthal velocity
          profile follows the exact Couette solution to a pointwise mean error of{" "}
          {(viscometerGates.profileMeanError * 100).toFixed(2)} per cent, with the prescribed values on the bob
          and the outer wall reproduced exactly. And the reading is machine-steady: over the whole averaging
          window the plateau varies by less than one part in a million of its own value.
        </p>
      </div>

      <div style={{ marginTop: 32, maxWidth: 900 }}>
        <h3>Acceptance gates</h3>
        <DataTable<ViscometerGateRow>
          columns={[
            { id: "gate", header: "Gate", render: row => <span style={{ fontWeight: 500 }}>{row.gate}</span> },
            {
              id: "reference",
              header: "Reference",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.reference}</span>
            },
            {
              id: "measured",
              header: "Measured",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.measured}</span>
            },
            {
              id: "deviation",
              header: "Deviation",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.deviation}</span>
              )
            },
            {
              id: "tolerance",
              header: "Tolerance",
              align: "right",
              render: row => <span style={{ color: "var(--fg3)", fontSize: 12 }}>{row.tolerance}</span>
            }
          ]}
          rows={viscometerGateRows}
          getRowKey={row => row.gate}
        />
      </div>

      <div style={{ marginTop: 44, maxWidth: 900 }}>
        <h3>What the two estimators separate</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The measured offset between the two estimators is {viscometerBaseline.gap.toFixed(3)} against the
          analytic {CORRECTION}, and once it is added back the reaction estimator reads{" "}
          {viscometerGates.correctedTorque.toFixed(4)} — the exact analytic torque, to better than one part in
          ten thousand. That is a useful thing to know rather than a curiosity: it places the whole of the{" "}
          {percent(viscometerGates.torque)} residual in the volume-form estimator, where it belongs, as the
          discretisation error of a deformation-stress integral. The instrument's systematic error is
          identified, not merely bounded.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={viscometerTorqueSpecs} defaultMetric="torque" />
      </div>
      <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 900, marginTop: 20 }}>
        Both runs share one time axis: the suspension is started from the empty instrument's own converged state
        at t = {viscometerBaseline.window[1]},
        so the step in the curve is the particles arriving. The start-up transient runs off the top of the frame
        by two orders of magnitude and is cropped, which is what makes the plateaus legible.
      </p>
    </Section>
  );
}

function LadderTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>Three concentrations, three closures</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Each rung is a fresh suspension seeded into the certified Couette field of the empty instrument by random
          sequential addition, held half a diameter clear of both walls, density-matched closely enough that gravity
          can be switched off entirely. There is no settling to confound the reading — only shear. The number the
          instrument returns is the ratio of the torque it takes to turn the bob through the suspension to the torque
          it takes to turn it through the pure fluid.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The interest is in what the ladder walks through. Einstein&apos;s law is first order in concentration and
          stops being enough once particles start to feel each other; Batchelor&apos;s second-order term takes over,
          and past that the series itself expires and a concentrated closure is needed. Each rung lands on the closure
          valid at its own concentration, and overshoots the one it has outgrown — which is the same statement read
          twice.
        </p>
      </div>

      <div style={{ marginTop: 32, maxWidth: 980 }}>
        <h3>The ladder</h3>
        <DataTable<ViscometerGatedRung>
          columns={[
            {
              id: "phi",
              header: "phi",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.phi.toFixed(2)}</span>
              )
            },
            {
              id: "n",
              header: "Spheres",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.particles}</span>
            },
            {
              id: "eta",
              header: "Measured eta",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                  {row.eta.toFixed(4)} ± {row.etaPstd.toFixed(4)}
                </span>
              )
            },
            { id: "closure", header: "Valid closure", render: row => closureName(row.closure) },
            {
              id: "target",
              header: "Composite target",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.etaComposite.toFixed(4)}</span>
            },
            {
              id: "dev",
              header: "Deviation",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                  {percent(row.deviationComposite)}
                </span>
              )
            }
          ]}
          rows={viscometerGatedLadder}
          getRowKey={row => row.run}
        />
        <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
          Every rung inside one per cent of the closure that governs it, with no tuned parameter anywhere in the
          chain. The targets are composites: the closure evaluated pointwise over the concentration field the run
          itself produced, which is what accounts for the particle-free layers at the two walls.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={viscometerViscositySpecs} defaultMetric="viscosity" />
      </div>
      <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 900, marginTop: 20 }}>
        The dashed curves are the plain closures, each evaluated at a single volume fraction. They are orientation
        only, and they sit above the measurements for a reason the page has already given: a real cell carries
        particle-free layers at its walls, so the instrument reads less than a uniform suspension would. The gate
        targets are the open diamonds — the same closures composed over the measured concentration field.
      </p>

      <div style={{ marginTop: 44, maxWidth: 900, display: "grid", gap: 32 }}>
        <div>
          <h3>Where each closure runs out</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            A closure outside its range does not fail quietly here; it is exceeded by a margin the instrument
            resolves. That is the ladder&apos;s second reading, and it is what makes the agreements above
            non-trivial.
          </p>
          <DataTable<{ id: string; phi: string; closure: string; target: string; deviation: string; verdict: string }>
            columns={[
              {
                id: "phi",
                header: "phi",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.phi}</span>
              },
              { id: "closure", header: "Closure", render: row => row.closure },
              {
                id: "target",
                header: "Composite target",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.target}</span>
              },
              {
                id: "deviation",
                header: "Measured vs target",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.deviation}</span>
                )
              },
              { id: "verdict", header: "Reading", render: row => <span style={{ color: "var(--fg2)" }}>{row.verdict}</span> }
            ]}
            rows={viscometerGatedLadder.flatMap(rung =>
              rung.composites.map(entry => ({
                id: `${rung.run}-${entry.closure}`,
                phi: rung.phi.toFixed(2),
                closure: closureName(entry.closure),
                target: entry.eta.toFixed(4),
                deviation: percent(entry.deviation),
                verdict: entry.gate ? "Governs this concentration" : "Outgrown — exceeded by the measurement"
              }))
            )}
            getRowKey={row => row.id}
          />
        </div>

        <div>
          <h3>A metrology cross-check that costs nothing</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The offset between the two torque estimators is predicted to depend only on the enclosed, particle-free
            hole volume — so however many spheres crowd the gap, and whether or not the lubrication model is running,
            it should not move. It does not. Across every loaded rung of the ladder it is measured at{" "}
            {CORRECTION} to five significant digits, the largest departure from the analytic value being{" "}
            {percent(
              viscometerLoadedRungs.reduce(
                (worst, rung) => (Math.abs(rung.gapDeviation) > Math.abs(worst) ? rung.gapDeviation : worst),
                0
              ),
              4
            )}
            . The second estimator therefore stays an independent check on the first at every concentration, not
            only in the empty cell.
          </p>
          <DataTable<ViscometerRung>
            columns={[
              {
                id: "rung",
                header: "Rung",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    phi = {row.phi.toFixed(2)}
                    {row.lubrication ? ", lubricated" : ""}
                  </span>
                )
              },
              {
                id: "gap",
                header: "Measured offset",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{Math.abs(row.gap).toFixed(4)}</span>
              },
              {
                id: "dev",
                header: "vs analytic",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{percent(row.gapDeviation, 4)}</span>
              }
            ]}
            rows={viscometerLoadedRungs}
            getRowKey={row => row.run}
          />
        </div>

        <div>
          <h3>Status of the ladder</h3>
          <DataTable<ViscometerLadderRow>
            columns={[
              {
                id: "label",
                header: "Rung",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.label}</span>
                )
              },
              { id: "status", header: "Reference", render: row => row.status },
              { id: "detail", header: "Note", render: row => <span style={{ color: "var(--fg2)" }}>{row.detail}</span> }
            ]}
            rows={viscometerLadderRows}
            getRowKey={row => row.label}
          />
        </div>
      </div>
    </Section>
  );
}

function LubricationTab({ onOpenSedimentation }: { onOpenSedimentation: () => void }) {
  const dilute = viscometerPairs[0];
  const dense = viscometerPairs[1];

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>What the unresolved film is worth</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Every rung above was measured with the fluid solver alone. At eight to nine elements per diameter the
          squeeze film between two nearly touching spheres is not resolved, and the question is what that costs. The
          rigid-body engine carries a sub-grid lubrication model for exactly this, in the deficit form that adds only
          what the resolved flow is missing, armed at a gap of two grid cells.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The two densest rungs were therefore run twice. Same cloud, particle for particle; same deck; same binary.
          The single difference between the members of each pair is one switch in the rigid-body configuration. That
          makes the difference in viscosity an attribution rather than a comparison.
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
            Sub-grid lubrication adds {percent(dense.delta, 1)} to the suspension viscosity at{" "}
            {"φ"} = {dense.phi.toFixed(2)} and {percent(dilute.delta, 1)} at {"φ"} = {dilute.phi.toFixed(2)}. The
            contribution decays by a factor of {viscometerPairDecay.eta.toFixed(1)} between the two, tracking the
            number of near-contact films the model acts on, which falls by{" "}
            {viscometerPairDecay.pairs.toFixed(1)}. Unresolved films matter where films are routine, and by a
            quantified amount.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 36, maxWidth: 980 }}>
        <h3>The pairs</h3>
        <DataTable<ViscometerPair>
          columns={[
            {
              id: "phi",
              header: "phi",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.phi.toFixed(2)}</span>
              )
            },
            {
              id: "without",
              header: "eta, model off",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.etaWithout.toFixed(4)}</span>
            },
            {
              id: "with",
              header: "eta, model on",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.etaWith.toFixed(4)}</span>
            },
            {
              id: "delta",
              header: "Contribution",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{percent(row.delta)}</span>
              )
            },
            {
              id: "pairs",
              header: "Films per step",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{Math.round(row.activePairs)}</span>
            },
            {
              id: "saturated",
              header: "of which saturated",
              align: "right",
              render: row => (
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {Math.round(row.saturatedPairs)} ({Math.round((row.saturatedPairs / row.activePairs) * 100)}%)
                </span>
              )
            }
          ]}
          rows={viscometerPairs}
          getRowKey={row => row.run}
        />
        <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
          Plateau means over the settled window of each run. Film counts are the solver&apos;s own per-step
          lubrication diagnostics, averaged over the same window the viscosity is read from.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={viscometerPairsSpecs} defaultMetric="pairs" />
      </div>

      <div style={{ marginTop: 44, maxWidth: 900, display: "grid", gap: 32 }}>
        <div>
          <h3>Why the decay is the result</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            A correction that grew or held steady as the suspension thinned would point at something acting
            everywhere — a numerical offset rather than a film. Instead it falls almost exactly as fast as the films
            themselves become rare: {viscometerPairDecay.eta.toFixed(1)} against{" "}
            {viscometerPairDecay.pairs.toFixed(1)}. What the model adds is proportional to how often two surfaces
            are close, which is what a lubrication term should do and is the cleanest available evidence that it is
            modelling the right thing at suspension scale.
          </p>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The practical reading for anyone choosing a resolution: at {"φ"} = {dilute.phi.toFixed(2)} the
            unresolved film is worth under one per cent and can reasonably be neglected; by{" "}
            {"φ"} = {dense.phi.toFixed(2)} it is approaching three, and a suspension viscosity quoted without it is
            low by about that much at this resolution.
          </p>
        </div>

        <div>
          <h3>The model, and where it was certified</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The same model is gated at single-particle scale on the settling-sphere benchmark, against an exact
            wall-approach solution and against the classical experiment. That is where the deficit form is chosen
            and quantified; this page is where it is used in anger.
          </p>
          <Button
            variant="stroked"
            size="sm"
            onClick={onOpenSedimentation}
            trailing={<Icon name="arrow_forward" size={14} />}
          >
            Particle Sedimentation · Lubrication
          </Button>
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
          One row per quantitative claim, generated from the campaign datasheet that is offered in full under
          Reference Data and reproduced as the campaign wrote it, apart from internal run identifiers. Both
          rungs of the instrument are gated against a prediction rather than against another simulation: the
          empty cell against the exact annular-Couette torque, the suspension against the composite-Einstein
          target built from its own measured concentration field.
        </p>
      </div>
      <ValidationLedger rows={viscometerValidationRows} />
      <div style={{ marginTop: 36, maxWidth: 900, display: "grid", gap: 20 }}>
        <div>
          <h3>Controlled comparison</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The two runs are the same instrument. They share the mesh, the partitioning, the binary and the
            operating point, and the suspension run starts from the baseline's own converged field. The only
            variable between the two readings that form {"η"} is the presence of the {N_PARTICLES} spheres,
            which is what makes the ratio a measurement of the suspension and not of the cell.
          </p>
        </div>
        <div>
          <h3>How the numbers were derived</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every torque, plateau and deviation on this page is recomputed at build time from the published
            torque histories, and the analytic references — the exact torque {T_EXACT_LONG} and the transpose
            correction {CORRECTION} — are recomputed from the geometry on the Definition tab. Nothing is
            transcribed, so a corrected run table propagates to the prose. The gate percentages the ledger
            quotes are the campaign's own, taken against its rounded reference {T_EXACT}.
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
              "The torque histories are the raw record of each run: one line per time step, carrying the time and both torque estimators, neither smoothed nor trimmed. Alongside them, the lubrication files carry the solver's per-step count of near-contact films, the run table carries the plateau window and the switch settings of every rung, the closure file carries the targets composed from the measured concentration field, and the profile file carries the velocity-profile gate. All quantities are nondimensional with unit sphere diameter, and torques are signed about the axis of rotation. The bundle also contains the campaign datasheet from which the validation ledger is generated."
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
          rows={viscometerReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={viscometerDownloads} />
      </div>
    </Section>
  );
}

export function NumericalViscometerPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "baseline", label: "Baseline" },
    { id: "ladder", label: "Concentration Ladder" },
    { id: "lubrication", label: "Lubrication" },
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
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / Numerical Viscometer
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">Numerical viscometer</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>DNS validation</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Numerical Viscometer:{" "}
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "var(--primary)"
                  }}
                >
                  Suspension Viscosity
                </span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A Couette cell with an exact analytic torque, calibrated empty and then walked up a concentration
                ladder that lands on Einstein, Batchelor and Krieger-Dougherty in turn.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Ladder rungs" value={String(viscometerGatedLadder.length)} />
              <KpiBox label="Spheres" value={`225–${viscometerPhi20.particles}`} />
              <KpiBox label="Subdomains" value="108" />
              <KpiBox label="eta at phi = 0.20" value={ETA_MAX} good />
              <KpiBox
                label="Worst gate deviation"
                value={percent(
                  viscometerGatedLadder.reduce(
                    (worst, rung) =>
                      Math.abs(rung.deviationComposite) > Math.abs(worst) ? rung.deviationComposite : worst,
                    0
                  )
                )}
                good
              />
              <KpiBox label="Empty-cell torque" value={percent(viscometerGates.torque)} good />
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
      {tab === "baseline" && <BaselineTab />}
      {tab === "ladder" && <LadderTab />}
      {tab === "lubrication" && (
        <LubricationTab
          onOpenSedimentation={() =>
            navigate("/benchmarks/particle-sedimentation?tab=lubrication")
          }
        />
      )}
      {tab === "validation" && <ValidationTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
