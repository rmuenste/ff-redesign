import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Equation,
  Figure,
  GalleryFigure,
  Icon,
  KpiBox,
  ReferenceList,
  Section,
  Tabs,
  useTabParam,
  ValidationLedger
} from "../components";
import {
  sedimentationBrennerBands,
  sedimentationDownloads,
  sedimentationLandedFraction,
  sedimentationLubricationCases,
  sedimentationLubricationRows,
  sedimentationLubricationSpecs,
  sedimentationPhysicalRows,
  sedimentationPlotSpecs,
  sedimentationReferenceRows,
  sedimentationReferences,
  sedimentationDecomposition,
  sedimentationDtLadder,
  sedimentationSetupAsset,
  sedimentationValidationRows,
  type SedimentationBrennerBand,
  type SedimentationDecompositionFit,
  type SedimentationDtRow,
  type SedimentationLubricationCase,
  type SedimentationPhysicalRow
} from "../data/sedimentation";

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <GalleryFigure id="sedimentation" />
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "This benchmark examines the sedimentation of a single spherical particle in a confined tank. It validates particulate-flow methods against experiments and lattice-Boltzmann simulations of a sphere settling through silicone oil over particle Reynolds numbers from 1.5 to 31.9."
          },
          {
            type: "paragraph",
            text:
              "The experiment uses Particle Image Velocimetry (PIV), so the page compares simulation position and velocity curves directly with measured particle-motion references in interactive plots."
          },
          {
            type: "paragraph",
            text:
              "The observables focus on the sphere trajectory, the vertical settling velocity, and the near-wall deceleration caused by lubrication forces as the sphere approaches the tank bottom."
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <h3>Reference</h3>
        <ReferenceList items={sedimentationReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and flow configuration" },
          {
            type: "paragraph",
            text:
              "A Nylon sphere settles under gravity in a confined rectangular tank filled with silicone oil. The internal tank dimensions are 100 x 100 x 160 mm, the particle diameter is 15 mm, and the sphere center is initially 127.5 mm above the bottom wall."
          },
          { type: "equation", value: "$d_p = 15\\,\\mathrm{mm},\\quad \\mathbf{u}=0\\text{ on all walls}$", block: true },
          {
            type: "paragraph",
            text:
              "No-slip boundary conditions are imposed on the container walls and on the moving particle surface. The confined geometry is part of the benchmark, so wall effects are represented consistently in the experiment and simulations."
          }
        ]}
      />
      <Figure
        src={sedimentationSetupAsset}
        alt="Experimental setup and boundary conditions for a settling sphere"
        caption="Experimental setup and boundary conditions for the settling-sphere benchmark."
      />
      <div style={{ display: "grid", gap: 24, marginTop: 24 }}>
        <div>
          <h3>Particle and fluid properties</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The particle density is <Equation>{"$\\rho_p = 1120\\,\\mathrm{kg/m^3}$"}</Equation>. The four experimental cases vary the silicone-oil density and viscosity to cover low and moderately inertial settling regimes.
          </p>
          <DataTable<SedimentationPhysicalRow>
            columns={[
              { id: "case", header: "Case", render: row => row.case },
              { id: "rhoF", header: "rho_f [kg/m3]", align: "right", render: row => row.rhoF },
              { id: "muF", header: "mu_f [Pa s]", align: "right", render: row => row.muF },
              { id: "re", header: "Re", align: "right", render: row => row.re },
              { id: "st", header: "St", align: "right", render: row => row.st }
            ]}
            rows={sedimentationPhysicalRows}
            getRowKey={row => row.case}
          />
        </div>
        <div>
          <h3>Key equations</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The Reynolds and Stokes numbers are defined from the terminal settling velocity and the fluid properties:
          </p>
          <Equation block>{"$Re = \\frac{\\rho_f u_\\infty d_p}{\\mu_f},\\quad St = \\frac{1}{9}\\frac{\\rho_p d_p u_\\infty}{\\rho_f \\nu}$"}</Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The reference paper adds a near-wall lubrication force to its lattice-Boltzmann cases, because below one
            grid spacing its method resolves no squeeze film at all. That correction is the paper&apos;s Eq. 10, and it
            is what distinguishes its S18/S19 runs from S16/S17:
          </p>
          <Equation block>{"$F_{lub} = -6\\pi\\mu_f d_p u_\\perp\\left(\\frac{d_p}{h}-\\frac{d_p}{D_0}\\right)$"}</Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The E1–E4 results on this page carry no such term. They resolve the near-wall flow directly at D/h ≈ 24,
            with the fictitious-boundary method alone and no lubrication correction of any kind. A separate study of
            what a sub-grid model adds on top of that resolved film, on these same fixtures, is on the Lubrication tab.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ResultsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ display: "grid", gap: 28 }}>
        <div style={{ maxWidth: 900 }}>
          <h3>Live sedimentation curves</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Velocity and normalized position are rendered from converted Plotly traces. The L2/L3 switch changes the simulation curves only; PIV markers remain the same reference data for each case.
          </p>
        </div>
        <ComparisonPanel specs={sedimentationPlotSpecs} defaultMetric="velocity" />
      </div>
    </Section>
  );
}

const pct = (value: number, digits = 0) => `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)}%`;
const ms = (seconds: number) => `${Math.round(seconds * 1000)} ms`;
const mm = (metres: number) => `${(metres * 1000).toFixed(3)} mm`;

function LubricationTab({ onOpenViscometer }: { onOpenViscometer: () => void }) {
  const clamp = sedimentationLubricationCases[0];

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>What a sub-grid model adds to an already-resolved film</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The rigid-body engine now carries a switchable sub-grid lubrication model — the Kroupa et al. resistance
          set with its wall terms, Vinogradova slip and a saturation cut-off. Switching it on in a resolved
          simulation is not as simple as adding the classical force, because the flow solver is already carrying
          most of the squeeze film. Adding the full resistance on top of that counts the same physics twice.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          For CFD-coupled runs the model therefore runs in a <em>deficit</em> form: every resistance coefficient is
          reduced by its own value at the gap where the model switches on, so only the part of the film the resolved
          flow does <em>not</em> carry is added. Activation is tied to the mesh rather than to the particle — a clamp
          sets it at {clamp.clampFactor} grid cells, {mm(clamp.activationGap)} on these fixtures, which is where the
          mesh stops resolving the film. In its leading normal term the deficit form reduces to the paper&apos;s
          Eq. 10.
        </p>
      </div>

      <div style={{ marginTop: 36, maxWidth: 900 }}>
        <h3>Why the deficit form, measured</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The choice is not a matter of taste. A separate wall-approach benchmark drives a sphere towards a wall at
          constant velocity, where the drag has an exact solution, and scores each candidate against it in the two
          bands that matter — between one and two cells of gap, and inside the last cell.
        </p>
        <DataTable<SedimentationBrennerBand>
          columns={[
            { id: "label", header: "Configuration", render: row => <span style={{ fontWeight: 500 }}>{row.label}</span> },
            {
              id: "band1",
              header: "1-2 cells of gap",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{pct(row.band1h2h, 1)}</span>
            },
            {
              id: "band2",
              header: "Last cell",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{pct(row.bandSub1h, 1)}</span>
            }
          ]}
          rows={sedimentationBrennerBands}
          getRowKey={row => row.model}
        />
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, marginTop: 12 }}>
          Deviations from the exact wall-approach drag. The resolved method alone is short of it, which is the gap a
          sub-grid model is there to close; the full resistance set overshoots by about three quarters, which is the
          double-counting made visible; the deficit form is the one that lands closest to the exact answer in both
          bands. It is the configuration used for everything below.
        </p>
      </div>

      <div style={{ marginTop: 44, maxWidth: 900 }}>
        <h3>The lubricated rerun</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The two lowest-Reynolds fixtures of this benchmark were rerun with the model in its production
          configuration. The decks are identical to the published E1 and E2 runs; the single difference is that
          lubrication is switched on. The baselines are therefore the very curves on the Results tab, which makes the
          pair a controlled comparison rather than two similar simulations.
        </p>
      </div>

      <div style={{ marginTop: 28 }}>
        <ComparisonPanel specs={sedimentationLubricationSpecs} defaultMetric="approach" />
      </div>

      <div style={{ marginTop: 44, maxWidth: 900, display: "grid", gap: 32 }}>
        <div>
          <h3>Through the film band</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Above the activation gap the two runs are the same simulation — the deficit form is inert there by
            construction. Below it the sphere decelerates more gradually, which is the behaviour the paper reports
            for its own lubricated cases.
          </p>
          <DataTable<SedimentationLubricationCase>
            columns={[
              {
                id: "case",
                header: "Case",
                render: row => (
                  <span>
                    <span style={{ fontWeight: 500 }}>{row.id}</span>
                    <span style={{ color: "var(--fg3)", fontSize: 12 }}> · Re = {row.re}</span>
                  </span>
                )
              },
              {
                id: "one",
                header: "Speed at 1 cell",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>{pct(-row.reductions[0].reduction)}</span>
                )
              },
              {
                id: "half",
                header: "Speed at 1/2 cell",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>{pct(-row.reductions[1].reduction)}</span>
                )
              },
              {
                id: "steps",
                header: "Steps with the model active",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.activeSteps}</span>
              },
              {
                id: "force",
                header: "Peak |F_lub| / buoyant weight",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.peakForceRatio.toFixed(2)}</span>
              }
            ]}
            rows={sedimentationLubricationCases}
            getRowKey={row => row.id}
          />
        </div>

        <div>
          <h3>And it lands</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            This is the part worth checking. The paper notes that its own lubrication force makes the approach run
            on unrealistically long — the sphere never quite arrives. Here the descent stays finite: the time from
            the activation gap to rest grows by roughly a tenth, and both runs settle at the same resting gap. The
            deficit form, the saturation cut-off and the hard-contact response between them keep the film from
            becoming an infinite cushion.
          </p>
          <DataTable<SedimentationLubricationCase>
            columns={[
              {
                id: "case",
                header: "Case",
                render: row => (
                  <span>
                    <span style={{ fontWeight: 500 }}>{row.id}</span>
                    <span style={{ color: "var(--fg3)", fontSize: 12 }}> · Re = {row.re}</span>
                  </span>
                )
              },
              {
                id: "base",
                header: "To rest, no F_lub",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{ms(row.landing.base)}</span>
              },
              {
                id: "lub",
                header: "To rest, with model",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{ms(row.landing.lubricated)}</span>
              },
              {
                id: "delta",
                header: "Change",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{pct(row.landing.increase)}</span>
                )
              },
              {
                id: "gap",
                header: "Resting gap",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {mm(row.restingGap.base)} / {mm(row.restingGap.lubricated)}
                  </span>
                )
              }
            ]}
            rows={sedimentationLubricationCases}
            getRowKey={row => row.id}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            Time from the activation gap until the settling speed has fallen to{" "}
            {(sedimentationLandedFraction * 100).toFixed(0)} per cent of its value there. Resting gaps are quoted
            without and with the model.
          </p>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>Scope</h3>
          <div
            style={{
              borderLeft: "3px solid var(--accent)",
              background: "var(--surface-alt)",
              borderRadius: 4,
              padding: "16px 20px"
            }}
          >
            <p style={{ margin: 0, color: "var(--fg1)", lineHeight: 1.65 }}>
              At this resolution the correction is modest by construction. The resolved flow already carries most of
              the film, so the model has little left to supply — its peak force never exceeds a quarter of the
              sphere&apos;s buoyant weight. The paper&apos;s method had no resolved film below one grid spacing at
              all and needed the full force. The digitised PIV cannot tell the two curves apart here either: the
              approach window holds about a dozen samples at velocities near the measurement floor, and the
              simulation-to-experiment differences documented on the Validation tab are larger than the effect. What
              certifies the model quantitatively is the wall-approach benchmark above; what this rerun certifies is
              the qualitative behaviour and the absence of the landing pathology in the production configuration.
            </p>
          </div>
        </div>

        <div>
          <h3>Validation ledger</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The three campaign claims behind this tab: the wall-approach benchmark that scored the candidate model
            forms, the implementation of the form it selected, and this rerun.
          </p>
          <div style={{ marginTop: 16 }}>
            <ValidationLedger rows={sedimentationLubricationRows} />
          </div>
        </div>

        <div>
          <h3>At suspension scale</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            What the same model does to the bulk viscosity of a sheared suspension, rather than to a single sphere
            approaching a wall, belongs to the numerical viscometer: a concentration ladder there carries a
            with-and-without pair at its densest rung.
          </p>
          <Button variant="stroked" size="sm" onClick={onOpenViscometer} trailing={<Icon name="arrow_forward" size={14} />}>
            Numerical Viscometer
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ValidationTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 860, display: "grid", gap: 20, marginBottom: 32 }}>
        <h3 style={{ margin: 0 }}>What convergence looks like on this benchmark</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The settling peak was measured across three mesh levels for all four cases. Refinement is not monotone:
          coarse meshes overshoot the peak by three to four per cent, the finest meshes undershoot by around two, and
          the intermediate level lands close to the reference partly because the two errors cancel. The practical
          consequence is that agreement at one resolution is not evidence of convergence, and mesh resolution should
          never be chosen to make a curve match.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The step from the intermediate to the finest level shifts the peak by 2.1 to 2.4 percentage points, and it
          does so almost identically for every case despite an eightfold range in Reynolds number. The dominant
          spatial error therefore comes from how the sphere surface is represented on the mesh, not from the flow
          regime — which is why the four ladders lie nearly on top of one another.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The lowest-Reynolds case is the hard one: it sits about three per cent below the experiment at the
          intermediate level and moves further away under refinement. That gap is not specific to this solver. The
          same discrepancy appears in the original paper, whose own lattice-Boltzmann result is about five per cent
          below its own experiment for that case; our finest configurations agree with those published simulations to
          within one per cent across all four cases. A two-per-cent gate against the experiment is unreachable by
          simulation there, so the reference band for the Stokes case has to include the paper's simulations as well
          as its measurements.
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
            Two configuration notes for anyone reproducing this case. The rigid-body solver integrates at its own
            configured stepsize, so <span className="code-inline">stepsize_</span> must be set equal to the CFD time
            step; a mismatch runs the coupling at the wrong rate and produces plausible-looking but wrong transients.
            And when comparing against the two lowest-Reynolds cases, use the printed velocity ratios from the
            paper's Table II rather than the digitised curves — the digitised peaks run three to four per cent fast.
          </p>
        </div>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          With the stepsize synchronised, the timestep study is stable at every step size tried — an earlier reading
          of these runs reported a stability floor, and that was the mismatch above rather than a property of the
          method. Choose the timestep against your error budget, not against stability. The remaining dependence is
          genuine but sub-linear:
        </p>
      </div>

      <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", marginBottom: 36 }}>
        <div>
          <h4 style={{ margin: "0 0 12px" }}>Timestep ladder, Re = 31.9 at D/h = 23.9</h4>
          <DataTable<SedimentationDtRow>
            columns={[
              { id: "dt", header: "dt [ms]", render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.dtMs}</span> },
              {
                id: "error",
                header: "Peak error vs Table II",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {row.errorPct > 0 ? "+" : ""}
                    {row.errorPct.toFixed(2)}%
                  </span>
                )
              }
            ]}
            rows={sedimentationDtLadder}
            getRowKey={row => `${row.level}-${row.dtMs}`}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            Halving the step moves the peak by about half a percentage point each time, so the apparent order is
            below one rather than the second order the time scheme would suggest on its own.
          </p>
        </div>

        <div>
          <h4 style={{ margin: "0 0 12px" }}>Fitted error split, Re = 31.9</h4>
          <DataTable<SedimentationDecompositionFit>
            columns={[
              { id: "order", header: "Assumed order", render: row => <span style={{ fontFamily: "var(--font-mono)" }}>p = {row.order}</span> },
              ...["L2", "L3", "L4"].map(level => ({
                id: level,
                header: `Spatial ${level}`,
                align: "right" as const,
                render: (row: SedimentationDecompositionFit) => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {row.spatialPp[level] > 0 ? "+" : ""}
                    {row.spatialPp[level]?.toFixed(2)}
                  </span>
                )
              })),
              {
                id: "temporal",
                header: "Temporal at 1 ms",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.temporalPpAt1ms.toFixed(2)}</span>
              }
            ]}
            rows={sedimentationDecomposition.E4 ?? []}
            getRowKey={row => `p${row.order}`}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            Percentage points, from an additive fit to the whole ladder. The temporal order is not pinned, so both
            readings are shown; they agree on the structure. The spatial term reaches zero within its uncertainty at
            the finest level, and the temporal term is negative while the coarse spatial terms are positive — which
            is the cancellation that makes the intermediate mesh at 1 ms look better than it is.
          </p>
        </div>
      </div>

      <h3>Validation ledger</h3>
      <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 860, marginBottom: 24 }}>
        One row per quantitative claim, generated from the DNS campaign datasheet. Rows marked RECORDED were measured
        and kept but not gated; RESOLVED rows record an issue that was investigated and closed.
      </p>
      <ValidationLedger rows={sedimentationValidationRows} />
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
              "Every downloadable sedimentation source file is a two-column text file. The live position plot normalizes simulation height as (raw - 0.0075) / 0.015; PIV position files are already normalized as h/d_p and are copied without transformation."
          }
        ]}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 32 }}>
        <DataTable
          columns={[
            { id: "fileType", header: "File family", render: row => row.fileType },
            { id: "pattern", header: "Pattern", render: row => row.pattern },
            { id: "column1", header: "Column 1", render: row => row.column1 },
            { id: "column2", header: "Column 2", render: row => row.column2 }
          ]}
          rows={sedimentationReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={sedimentationDownloads} />
      </div>
    </Section>
  );
}

export function ParticleSedimentationPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
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
            style={{ display: "flex", alignItems: "center", gap: 6, border: 0, background: "transparent", color: "var(--fg2)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, marginBottom: 12 }}
          >
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / SED
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">SED</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>PIV References</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Particle <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>Sedimentation</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A confined settling-sphere benchmark comparing FEM-FBM simulations at L2/L3 against PIV particle-motion measurements for four Reynolds-number regimes.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Cases" value="4" />
              <KpiBox label="Re" value="1.5-31.9" />
              <KpiBox label="Levels" value="2" />
              <KpiBox label="Metrics" value="2" />
              <KpiBox label="Particle" value="15 mm" />
              <KpiBox label="Tank" value="100x100x160" />
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
      {tab === "results" && <ResultsTab />}
      {tab === "lubrication" && (
        <LubricationTab onOpenViscometer={() => navigate("/benchmarks/numerical-viscometer")} />
      )}
      {tab === "validation" && <ValidationTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
