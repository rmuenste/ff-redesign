import { useNavigate } from "react-router-dom";
import {
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Equation,
  GalleryFigure,
  Icon,
  KpiBox,
  ReferenceList,
  Section,
  Tabs,
  useTabParam,
  ValidationLedger
} from "../components";
import { DktSchematic } from "../components/dkt-schematic";
import {
  dktContactSpecs,
  dktDownloads,
  dktLadderRows,
  dktParameterRows,
  dktPlotSpecs,
  dktReferenceRows,
  dktReferences,
  dktSequenceRows,
  dktValidationRows,
  type DktLadderRow,
  type DktParameterRow,
  type DktPhaseRow
} from "../data/dkt";

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <GalleryFigure id="dkt" />
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "Two equal spheres released one above the other in a quiescent viscous fluid do not simply fall together. The trailing sphere enters the wake of the leader, feels reduced drag, and catches up until the two touch. The resulting broadside doublet is hydrodynamically unstable: it rotates about its contact point until the pair is horizontal, then separates with the roles exchanged. Fortes, Joseph and Lundgren named this sequence drafting, kissing and tumbling, and it remains the standard qualitative test of a fluid-particle coupling."
          }
        ]}
      />
      <DktSchematic />
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "The measured sequence" },
          {
            type: "paragraph",
            text:
              "FeatFloWer reproduces all four stages. The table below is read directly from the simulated trajectories of the two spheres at a resolution of eight elements per diameter, using the frictionless contact appropriate to spheres immersed in a liquid; every time is a detected event, not a fitted one."
          }
        ]}
      />
      <div style={{ marginTop: 24 }}>
        <DataTable<DktPhaseRow>
          columns={[
            { id: "phase", header: "Phase", render: row => <span style={{ fontWeight: 500 }}>{row.phase}</span> },
            { id: "time", header: "Time", render: row => <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.time}</span> },
            { id: "observation", header: "Observation", render: row => row.observation }
          ]}
          rows={dktSequenceRows}
          getRowKey={row => row.phase}
        />
      </div>
      <div style={{ marginTop: 32 }}>
        <ContentRenderer
          blocks={[
            { type: "heading", level: 3, text: "How this benchmark is judged" },
            {
              type: "paragraph",
              text:
                "Tumbling is a symmetry-breaking instability, so trajectories after contact amplify small perturbations and a pointwise comparison against experiment would not be meaningful. The benchmark is therefore gated on mechanism: whether the phase sequence appears at all, and whether the kissing time is reproducible. Post-tumbling behaviour is recorded qualitatively."
            },
            {
              type: "paragraph",
              text:
                "One quantitative result does survive: the kissing time is near resolution-independent, t = 18.03 at eight elements per diameter against t = 18.34 at sixteen. Everything before contact is a pure fluid-dynamics problem and the solver converges on it."
            }
          ]}
        />
      </div>
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={dktReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and initial condition" },
          {
            type: "paragraph",
            text:
              "Two spheres of diameter d fall under gravity in a closed box measuring 6d by 6d by 24d. The leading sphere starts on the axis and the trailing sphere 1.5 d above it, displaced sideways by 0.05 d. That small offset seeds the symmetry breaking: an exactly axisymmetric initial condition reproduces drafting and kissing but can never tumble, and is kept here as a control case."
          },
          {
            type: "paragraph",
            text:
              "All six faces are no-slip walls, so wall effects are part of the benchmark definition. The problem is posed in nondimensional form with unit sphere diameter, unit gravity along the negative z axis, and a density ratio slightly above neutral buoyancy."
          }
        ]}
      />
      <div style={{ display: "grid", gap: 32, marginTop: 24 }}>
        <div>
          <h3>Case parameters</h3>
          <DataTable<DktParameterRow>
            columns={[
              { id: "symbol", header: "Symbol", render: row => <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.symbol}</span> },
              { id: "quantity", header: "Quantity", render: row => row.quantity },
              { id: "value", header: "Value", align: "right", render: row => <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.value}</span> }
            ]}
            rows={dktParameterRows}
            getRowKey={row => row.symbol}
          />
        </div>

        <div>
          <h3>Observables</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The pair axis runs from the leading to the trailing sphere centre. Its tilt away from the vertical is the
            one scalar that carries the whole sequence:
          </p>
          <Equation block>
            {"$\\theta(t) = \\arccos\\!\\left(\\frac{\\Delta z}{\\lVert \\Delta \\mathbf{x} \\rVert}\\right), \\qquad \\Delta\\mathbf{x} = \\mathbf{x}_2 - \\mathbf{x}_1$"}
          </Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            A tilt of zero is the drafting column, ninety degrees a horizontal pair, and more than ninety degrees
            means the spheres have exchanged roles. Kissing is detected at the first time the centre distance falls
            to 1.005 d, and separation at the first later time it exceeds 1.02 d.
          </p>
        </div>

        <div>
          <h3>Resolution ladder</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            D/h counts Q2 elements per sphere diameter. Velocity nodes sit at half that spacing, so nodal
            resolutions quoted in the lattice-Boltzmann and immersed-boundary literature should be halved before
            comparison. The published trajectories are computed on the first rung; the second was computed to check
            that the drafting and kissing phases are resolution-independent, and the third is prepared and awaits the
            compute allocation it needs.
          </p>
          <DataTable<DktLadderRow>
            columns={[
              { id: "level", header: "Level", render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.level}</span> },
              { id: "ratio", header: "D/h", align: "right", render: row => row.ratio },
              { id: "elements", header: "Elements", align: "right", render: row => row.elements },
              { id: "velocityDofs", header: "Velocity DOFs", align: "right", render: row => row.velocityDofs },
              {
                id: "status",
                header: "Status",
                align: "right",
                render: row => <Chip tone={row.status === "published" ? "solid" : "ghost"}>{row.status}</Chip>
              }
            ]}
            rows={dktLadderRows}
            getRowKey={row => row.level}
          />
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
          <h3>Trajectory comparison</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every curve is derived from the recorded motion of the two spheres, at eight elements per sphere
            diameter. Tilt angle tells the clearest story; the x-z trajectory shows the same tumble in the plane of
            motion, with the leader and trailer paths selectable separately. The series selector switches the contact
            model, which is the axis this case is designed to resolve.
          </p>
        </div>
        {/* TODO: a rendered tumble animation belongs here once the Gallery gains
            video hosting; VideoBlock is already available for it. */}
        <ComparisonPanel specs={dktPlotSpecs} defaultMetric="tilt" />
      </div>
    </Section>
  );
}

function ContactModelTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 820, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>Practical guidance: choose the contact friction as physics</h3>
        <div
          style={{
            borderLeft: "3px solid var(--accent)",
            background: "var(--surface-alt)",
            borderRadius: 4,
            padding: "16px 20px"
          }}
        >
          <p style={{ margin: 0, color: "var(--fg1)", lineHeight: 1.65 }}>
            The rigid-body contact model ships with dry Coulomb friction enabled — a static coefficient of 0.1 and a
            dynamic coefficient of 0.05. For spheres immersed in a liquid that is the wrong regime: set{" "}
            <span className="code-inline">staticFriction_</span> and <span className="code-inline">dynamicFriction_</span> to zero, or
            use a lubricated-contact model. The choice is quantitative — it changes how fast the doublet tumbles, not
            whether it tumbles.
          </p>
        </div>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The reason is physical rather than numerical. Smooth spheres settling in a liquid never touch dry; they
          interact through a thin lubrication film that carries almost no tangential traction. A dry friction law
          overstates the tangential coupling at the contact point, so it slows the rolling motion that carries the
          tumble.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          That is what the two runs measure, and they are a clean controlled pair: same mesh, same initial condition,
          same time step, differing only in the two friction coefficients. Their recorded motion is identical through
          the whole drafting phase — every published sample agrees to the last printed digit up to t = 18.105 — and
          first differs at t = 18.13, the first sample after the spheres touch. The contact model demonstrably does
          nothing before contact and everything after it.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Past contact both runs break symmetry: the tilt grows exponentially, doubling roughly every three time
          units. Under dry friction it reaches 16.2 degrees at t = 25, against 21.7 degrees for the frictionless
          contact at the same instant — friction retards the tumble by about a quarter in tilt at matched time. It
          sets the rate of the instability; it does not decide whether the instability occurs.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The general lesson is that contact parameters are physics, not stabilisers. They should be chosen to match
          the regime being modelled, and never tuned for numerical robustness.
        </p>
      </div>
      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={dktContactSpecs} defaultMetric="tilt" />
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
          Reference Data. This benchmark is gated on mechanism rather than on a numeric tolerance, so a verdict
          records whether the expected physical behaviour was observed, not whether a number landed inside a band.
          Rows marked RECORDED document behaviour that was measured and kept but not gated. Claims that later
          measurement superseded are not republished here; the downloadable datasheet carries the campaign's full
          record.
        </p>
      </div>
      <ValidationLedger rows={dktValidationRows} />
      <div style={{ marginTop: 36, maxWidth: 900, display: "grid", gap: 20 }}>
        <div>
          <h3>Controlled comparison</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The frictional and frictionless runs at D/h = 8 share an initial condition, a mesh and a time step, and
            differ only in two contact coefficients. Their published tilt and separation series agree to the last
            printed digit for all 725 samples through drafting, they touch at the same t = 18.03, and they first
            differ at t = 18.13 — the first sample after contact. This isolates the contact model as the only cause
            of the difference in outcome.
          </p>
        </div>
        <div>
          <h3>Reproducibility audit</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every number on this page is re-derived from the raw solver output rather than transcribed. That audit
            corrected the recorded kissing time for the offset case from 19.7 to 18.0 — the earlier figure was a
            stale reading whose source could not be recovered — and it changed the reading of the result, which is
            that the kissing time is near resolution-independent. The correction is itself a ledger row above.
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
              "Each file is a two-column text file, sampled every fifth time step from the solver's per-step particle record. Distances are in sphere diameters and times and velocities are nondimensional. The bundle also contains the campaign datasheet from which the validation ledger is generated."
          }
        ]}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 32 }}>
        <DataTable
          columns={[
            { id: "fileType", header: "Quantity", render: row => row.fileType },
            { id: "pattern", header: "Pattern", render: row => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.pattern}</span> },
            { id: "column1", header: "Column 1", render: row => row.column1 },
            { id: "column2", header: "Column 2", render: row => row.column2 }
          ]}
          rows={dktReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={dktDownloads} />
      </div>
    </Section>
  );
}

export function DraftingKissingTumblingPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "contact-model", label: "Contact Model" },
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
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / Drafting-Kissing-Tumbling
          </button>
          <div className="split split-hero">
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">Drafting-kissing-tumbling</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>DNS validation</Chip>
              </div>
              <h1 className="display display-md" style={{ margin: "0 0 12px" }}>
                Drafting, Kissing and{" "}
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
                  Tumbling
                </span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                Two settling spheres reproduce the classical Fortes sequence — drafting into the wake, kissing,
                tumbling about the contact point, and separating with the roles exchanged.
              </p>
            </div>
            <div className="kpi-grid">
              <KpiBox label="Spheres" value="2" />
              <KpiBox label="Density ratio" value="1.14" />
              <KpiBox label="D/h" value="8 / 16" />
              <KpiBox label="Kissing" value="t = 18.03" />
              <KpiBox label="Final tilt" value="107°" good />
              <KpiBox label="Runs" value="3" />
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
      {tab === "contact-model" && <ContactModelTab />}
      {tab === "validation" && <ValidationTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
