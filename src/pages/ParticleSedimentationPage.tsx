import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Equation,
  Figure,
  Icon,
  KpiBox,
  ReferenceList,
  Section,
  Tabs,
  ValidationLedger
} from "../components";
import {
  sedimentationDownloads,
  sedimentationPhysicalRows,
  sedimentationPlotSpecs,
  sedimentationReferenceRows,
  sedimentationReferences,
  sedimentationSetupAsset,
  sedimentationValidationRows,
  type SedimentationPhysicalRow
} from "../data/sedimentation";

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
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
            The simulation accounts for near-wall lubrication through a correction force based on the wall gap height.
          </p>
          <Equation block>{"$F_{lub} = -6\\pi\\mu_f d_p u_\\perp\\left(\\frac{d_p}{h}-\\frac{d_p}{D_0}\\right)$"}</Equation>
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
          With the stepsize synchronised, the time-step study is stable at every step size tried and the peak shifts
          sub-linearly, by roughly half a percentage point per halving. An earlier reading of these runs reported a
          stability floor; that was the stepsize mismatch above and has been withdrawn. A full refit of the combined
          spatial and temporal error budget is still outstanding.
        </p>
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
  const [tab, setTab] = useState("introduction");
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
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
      {tab === "validation" && <ValidationTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
