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
  Tabs
} from "../components";
import {
  sedimentationDownloads,
  sedimentationPhysicalRows,
  sedimentationPlotSpecs,
  sedimentationReferenceRows,
  sedimentationReferences,
  sedimentationSetupAsset,
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
              "The experiment uses Particle Image Velocimetry (PIV), so the migrated page compares simulation position and velocity curves directly with measured particle-motion references. The live plots replace the static result images from the Angular page."
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
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
