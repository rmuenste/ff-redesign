import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  ValidationLedger
} from "../components";
import {
  hinderedConfinedRows,
  hinderedConfinementSpecs,
  hinderedDownloads,
  hinderedFit,
  hinderedParameterRows,
  hinderedPlotSpecs,
  hinderedReferenceRows,
  hinderedReferences,
  hinderedRegimeRows,
  hinderedReynoldsRange,
  hinderedRoweBand,
  hinderedTerminalByColumn,
  hinderedValidationRows,
  hinderedWideRows,
  hinderedWideSlope,
  hinderedWindow,
  swarmReynolds,
  type HinderedLadderRow,
  type HinderedParameterRow,
  type HinderedRegimeRow
} from "../data/hindered-settling";

const EXPONENT = hinderedFit.n.toFixed(2);
const COLLAPSE_RMS = `${(hinderedFit.rms * 100).toFixed(1)}%`;
const ROWE = `${hinderedRoweBand[0]}–${hinderedRoweBand[1]}`;
const WINDOW = `t = ${hinderedWindow[0]}–${hinderedWindow[1]}`;

const RE_RANGE = `${Math.round(hinderedReynoldsRange.min)}–${Math.round(hinderedReynoldsRange.max)}`;

function meanOf(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function wideMean(n: number) {
  return meanOf(hinderedWideRows.filter(row => row.n === n).map(row => row.uOverUt));
}

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "A cloud of particles settles more slowly than a single particle. Each sphere falls through fluid that its neighbours are already pushing upward, and the resulting hindrance is conventionally written as a power of the void fraction. Richardson and Zaki measured the exponent for fluidised beds, and Rowe's correlation places it between roughly 2.7 and 3.0 for inertial suspensions. That band is the standard closure in engineering models of settling and fluidisation."
          },
          {
            type: "paragraph",
            text:
              "The law is empirical, and it is calibrated on suspensions that fill their vessel. This benchmark asks what a resolved simulation measures instead of assuming: it settles clouds of 20 to 120 spheres in a walled column, fits the same power law to the result, and then repeats the identical clouds in a column of four times the cross-section to find out what the exponent is actually made of."
          },
          { type: "heading", level: 3, text: "The hindrance law" },
          {
            type: "paragraph",
            text:
              "The swarm settles at a steady plateau velocity U, normalised by the terminal velocity of a single sphere in the same column. Richardson and Zaki write the ratio as a power of the void fraction:"
          }
        ]}
      />
      <Equation block>{"$\\frac{U}{u_t} = (1-\\phi)^{\\,n}$"}</Equation>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              `Fitted through the origin — a vanishing cloud must settle at the single-particle velocity — the ladder returns n = ${EXPONENT} with a root-mean-square residual of ${COLLAPSE_RMS} over all twelve runs. The collapse is excellent and the exponent is far above the unbounded band of ${ROWE}, which is the result this page is about.`
          },
          { type: "heading", level: 3, text: "What the extra hindrance is" },
          {
            type: "paragraph",
            text:
              `The wide-column control answers that. An isolated sphere is not measurably slower in the narrow column than in one four times wider, so the extra hindrance is not wall drag acting on individual particles. What changes is where the displaced fluid goes: when the cloud spans the vessel, continuity forces the return flow back up through the cloud itself, and every particle settles against it. Widen the vessel and the return flow spreads out instead — the same clouds then settle faster than a single sphere, not slower.`
          },
          {
            type: "paragraph",
            text:
              `So n = ${EXPONENT} is a confinement law, valid for suspensions that fill their vessel, and it must not be used as an unbounded closure. That is the practical value of resolving the flow: the simulation measures the hindrance law belonging to a geometry rather than importing one calibrated on a different one.`
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <h3>Three regimes</h3>
        <DataTable<HinderedRegimeRow>
          columns={[
            { id: "regime", header: "Regime", render: row => <span style={{ fontWeight: 500 }}>{row.regime}</span> },
            { id: "geometry", header: "Geometry", render: row => row.geometry },
            { id: "law", header: "Settling law", render: row => row.law }
          ]}
          rows={hinderedRegimeRows}
          getRowKey={row => row.regime}
        />
      </div>
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={hinderedReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  const confined = hinderedTerminalByColumn["6d"];
  const wide = hinderedTerminalByColumn.wide;

  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and initial condition" },
          {
            type: "paragraph",
            text:
              "Equal spheres of diameter d settle under gravity in a closed column measuring 6d by 6d by 24d. All six faces are no-slip walls, so the vessel is part of the benchmark definition. The cloud is seeded by random sequential addition into the upper part of the column, with a minimum surface gap of 0.1 d, and three independent seeds are run at every cloud size so that the scatter of a random packing is measured rather than assumed."
          },
          {
            type: "paragraph",
            text:
              "The control geometry keeps the column height and quadruples its cross-section, 12d by 12d by 24d. The particle positions are cloned unchanged from the narrow-column runs, so the only difference between a matched pair of runs is how far away the side walls are."
          },
          {
            type: "paragraph",
            text:
              "Contact friction is set to zero throughout: these are smooth spheres in a liquid, which interact through a lubrication film rather than by dry contact."
          }
        ]}
      />
      <div style={{ display: "grid", gap: 32, marginTop: 24 }}>
        <div>
          <h3>Case parameters</h3>
          <DataTable<HinderedParameterRow>
            columns={[
              { id: "symbol", header: "Symbol", render: row => <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.symbol}</span> },
              { id: "quantity", header: "Quantity", render: row => row.quantity },
              { id: "value", header: "Value", align: "right", render: row => <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.value}</span> }
            ]}
            rows={hinderedParameterRows}
            getRowKey={row => `${row.symbol}-${row.quantity}`}
          />
        </div>

        <div>
          <h3>Observables</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The settling velocity of the swarm is the mean vertical velocity of its particles, averaged over the
            settled window {WINDOW} once the cloud has reached a steady plateau. The concentration is the measured
            cloud volume fraction, taken over the column cross-section and the vertical extent the particles occupy:
          </p>
          <Equation block>
            {"$\\phi = \\frac{N V_p}{A\\,H_{\\mathrm{cloud}}}, \\qquad U = -\\left\\langle u_z \\right\\rangle_{\\mathrm{particles}}$"}
          </Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The run tables also carry the volume fraction inside the cloud's own bounding box. In the narrow column
            the two agree to a few per cent, which is what makes the suspension vessel-filling in a measurable sense;
            in the wide column they differ by the cross-section ratio, which is what makes that cloud finite.
          </p>
        </div>

        <div>
          <h3>Terminal-velocity reference</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every ratio on this page is normalised by a single sphere settling in the same column, computed as its own
            run. The narrow column gives u_t = {confined.ut.toFixed(4)} and the wide column{" "}
            {wide.ut.toFixed(4)} ± {wide.utStd?.toFixed(4)} — a difference well inside one standard deviation, so an
            isolated particle is not measurably retarded by the walls at this Reynolds number. The swarm Reynolds
            numbers on the ladder run from {RE_RANGE}.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ladderColumns(showEnvelope: boolean) {
  const columns = [
    { id: "n", header: "N", align: "right" as const, render: (row: HinderedLadderRow) => row.n },
    { id: "seed", header: "Seed", align: "right" as const, render: (row: HinderedLadderRow) => row.seed },
    {
      id: "phi",
      header: "phi",
      align: "right" as const,
      render: (row: HinderedLadderRow) => <span style={{ fontFamily: "var(--font-mono)" }}>{row.phiCloud.toFixed(4)}</span>
    },
    ...(showEnvelope
      ? [
          {
            id: "phiEnvelope",
            header: "phi (envelope)",
            align: "right" as const,
            render: (row: HinderedLadderRow) => (
              <span style={{ fontFamily: "var(--font-mono)" }}>{row.phiEnvelope.toFixed(4)}</span>
            )
          }
        ]
      : []),
    {
      id: "u",
      header: "U",
      align: "right" as const,
      render: (row: HinderedLadderRow) => <span style={{ fontFamily: "var(--font-mono)" }}>{row.u.toFixed(4)}</span>
    },
    {
      id: "ratio",
      header: "U / u_t",
      align: "right" as const,
      render: (row: HinderedLadderRow) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{row.uOverUt.toFixed(3)}</span>
      )
    },
    {
      id: "re",
      header: "Re",
      align: "right" as const,
      render: (row: HinderedLadderRow) => Math.round(swarmReynolds(row.u))
    }
  ];
  return columns;
}

function ResultsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ display: "grid", gap: 28 }}>
        <div style={{ maxWidth: 900 }}>
          <h3>Hindered-settling ladder</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Twelve runs: four cloud sizes, three random seeds each. The collapse is plotted in the coordinates the
            power law is fitted in, so the fit is the straight line through the origin and the unbounded Rowe/RZ band
            is the pair of shallower dashed lines below it. The settling histories show the plateau each point is read
            from; the velocity spread inside a cloud grows with concentration but saturates in time at every rung, so
            no run drifts into runaway clustering.
          </p>
        </div>
        <ComparisonPanel specs={hinderedPlotSpecs} defaultMetric="collapse" />
      </div>
      <div style={{ marginTop: 44, maxWidth: 900 }}>
        <h3>Run table</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          Plateau statistics over {WINDOW}, normalised by the single-sphere terminal velocity in the same column.
        </p>
        <DataTable<HinderedLadderRow>
          columns={ladderColumns(false)}
          rows={hinderedConfinedRows}
          getRowKey={row => `${row.n}-${row.seed}`}
        />
      </div>
    </Section>
  );
}

function ConfinementTab() {
  const confined = hinderedTerminalByColumn["6d"];
  const wide = hinderedTerminalByColumn.wide;

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ maxWidth: 820, display: "grid", gap: 20 }}>
        <h3 style={{ margin: 0 }}>Practical guidance: a hindrance exponent belongs to a geometry</h3>
        <div
          style={{
            borderLeft: "3px solid var(--accent)",
            background: "var(--surface-alt)",
            borderRadius: 4,
            padding: "16px 20px"
          }}
        >
          <p style={{ margin: 0, color: "var(--fg1)", lineHeight: 1.65 }}>
            Use n = {EXPONENT} only for suspensions that fill their vessel. Unbounded homogeneous suspensions follow
            the Rowe/RZ band of {ROWE}. A finite cloud in a wide vessel is a third regime altogether: it settles{" "}
            <em>faster</em> than a single particle, and no Richardson-Zaki form describes it.
          </p>
        </div>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The control that establishes this repeats the ladder's clouds, particle for particle, in a column of four
          times the cross-section. Two measurements separate the candidate mechanisms. First, a single sphere settles
          at {confined.ut.toFixed(4)} in the narrow column against {wide.ut.toFixed(4)} ±{" "}
          {wide.utStd?.toFixed(4)} in the wide one — inside one standard deviation, so per-particle wall drag is ruled
          out as the source of the extra hindrance.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Second, the same clouds change sign. In the wide column they settle at U/u_t = {wideMean(40).toFixed(2)} at
          N = 40 and {wideMean(120).toFixed(2)} at N = 120 — enhanced rather than hindered, and growing with cloud
          size, where the narrow column hinders them more and more over the same range. Fitting the Richardson-Zaki
          form to those two rungs returns a negative exponent, n = {hinderedWideSlope.n.toFixed(2)} against the cloud's
          own envelope concentration, which is simply the statement that the form does not apply. The sign does not
          depend on how the cloud concentration is defined.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Both observations point at the same mechanism. The hindrance in the narrow column is carried by the
          collective return flow that continuity forces through a vessel-filling cloud, not by friction between a
          particle and a distant wall. Remove the confinement and the cloud's own coherent downdraft dominates
          instead, and the swarm outruns a single sphere.
        </p>
      </div>
      <div style={{ marginTop: 36 }}>
        <ComparisonPanel specs={hinderedConfinementSpecs} defaultMetric="hindrance" />
      </div>
      <div style={{ marginTop: 44, maxWidth: 900 }}>
        <h3>Control run table</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The 12d column, same clouds and same plateau window. The vessel-relative concentration falls by the
          cross-section ratio while the cloud's own envelope concentration barely moves, which is the quantitative
          difference between a vessel-filling suspension and a finite cloud.
        </p>
        <DataTable<HinderedLadderRow>
          columns={ladderColumns(true)}
          rows={hinderedWideRows}
          getRowKey={row => `${row.n}-${row.seed}`}
        />
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
          Reference Data. There is no experimental reference for this configuration, so the ladder is gated on
          internal consistency — the quality of the power-law collapse and the seed scatter — and the attribution is
          gated on mechanism. Rows marked RECORDED document behaviour that was measured and kept but not gated.
        </p>
      </div>
      <ValidationLedger rows={hinderedValidationRows} />
      <div style={{ marginTop: 36, maxWidth: 900, display: "grid", gap: 20 }}>
        <div>
          <h3>Controlled comparison</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The wide-column runs reuse the narrow-column particle positions unchanged and share the binary, the deck
            lineage, the resolution and the plateau window. The vessel cross-section is the only variable, which is
            what makes the change of sign in U/u_t an attribution rather than a correlation.
          </p>
        </div>
        <div>
          <h3>How the numbers were derived</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every plateau statistic on this page comes from the campaign's own analysis of the per-step particle
            records, over the window {WINDOW}, and the published tables are the input to the fit shown on the Results
            tab rather than a transcription of it. The exponent, its residual and the wide-column slope are recomputed
            from those tables whenever the site is built, so a corrected run table propagates to the prose.
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
              "The run tables carry one row per simulation: cloud size, seed, plateau velocity and its variation over the settled window, both concentration measures, and the inter-particle velocity spread. The settling histories are two-column text files sampled every fifth time step. All quantities are nondimensional with unit sphere diameter. The bundle also contains the campaign datasheet from which the validation ledger is generated."
          }
        ]}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 32 }}>
        <DataTable
          columns={[
            { id: "fileType", header: "Quantity", render: row => row.fileType },
            { id: "pattern", header: "Pattern", render: row => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.pattern}</span> },
            { id: "columns", header: "Columns", render: row => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.columns}</span> }
          ]}
          rows={hinderedReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={hinderedDownloads} />
      </div>
    </Section>
  );
}

export function HinderedSettlingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("introduction");
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "confinement", label: "Confinement" },
    { id: "validation", label: "Validation" },
    { id: "reference-data", label: "Reference Data" }
  ];

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
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / Hindered Settling
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">Hindered settling</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>DNS validation</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Hindered Settling of a{" "}
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>
                  Particle Cloud
                </span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                Clouds of 20 to 120 spheres settling in a walled column collapse onto a Richardson-Zaki power law —
                with an exponent that belongs to the confinement, not to the suspension.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Particles" value="20–120" />
              <KpiBox label="Seeds" value="3" />
              <KpiBox label="Runs" value={String(hinderedConfinedRows.length + hinderedWideRows.length + 2)} />
              <KpiBox label="Exponent" value={`n = ${EXPONENT}`} good />
              <KpiBox label="Collapse rms" value={COLLAPSE_RMS} good />
              <KpiBox label="Swarm Re" value={RE_RANGE} />
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
      {tab === "confinement" && <ConfinementTab />}
      {tab === "validation" && <ValidationTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
