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
  rb2Cases,
  rb2Downloads,
  rb2FormatRows,
  rb2GeometryAsset,
  rb2NotationRows,
  rb2PhysicalRows,
  rb2PlotSpecs,
  rb2References,
  rb2SixCodesAsset,
  type Rb2CaseId
} from "../data/rb2";

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "In the absence of analytical solutions for the considered two-phase flow problem class, validation of mathematical modeling is best accomplished with numerical benchmarking. Pure numerical benchmarks are of limited use if they cannot be employed for quantitative comparisons."
          },
          {
            type: "paragraph",
            text:
              "The benchmark tracks a single two-dimensional bubble rising in a liquid column. Two benchmark configurations define rigorous quantities for direct topological parameters, such as interface deformation, and indirect quantities, such as velocity."
          }
        ]}
      />
      <Figure
        src={rb2SixCodesAsset}
        alt="Two-dimensional rising bubble shapes produced by six different codes"
        caption="Numerical simulations of a two-dimensional rising bubble for six different codes with identical problem formulations."
      />
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={rb2References} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and flow configurations" },
          {
            type: "paragraph",
            text:
              "The initial configuration is identical for both test cases: a circular bubble of radius 0.25 centered in a 1 by 2 rectangular domain. The density of the bubble is smaller than the surrounding fluid. No-slip boundary conditions are used at the top and bottom boundaries, while free slip is imposed on the vertical walls."
          },
          { type: "equation", value: "$r_0 = 0.25,\\quad (x,y) = (0.5, 0.5)$", block: true },
          { type: "equation", value: "$(\\rho_2 < \\rho_1),\\quad \\mathbf{u}=0$", block: true }
        ]}
      />
      <Figure
        src={rb2GeometryAsset}
        alt="Initial 2D rising bubble geometry and boundary conditions"
        caption="Initial configuration and boundary conditions for the 2D rising bubble test cases."
      />
      <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
        The evolution of the bubbles should be tracked for 3 time units. Case 1 models a rising bubble with <Equation>$Re=35$</Equation>, <Equation>$Eo=10$</Equation>, and density and viscosity ratios equal to 10. Case 2 uses <Equation>$Re=35$</Equation>, <Equation>$Eo=125$</Equation>, density ratio 1000, and viscosity ratio 100.
      </p>
      <DataTable
        columns={[
          { id: "position", header: "Test case", render: row => row.position },
          { id: "p1", header: "rho1", align: "right", render: row => row.p1 },
          { id: "p2", header: "rho2", align: "right", render: row => row.p2 },
          { id: "mu1", header: "mu1", align: "right", render: row => row.mu1 },
          { id: "mu2", header: "mu2", align: "right", render: row => row.mu2 },
          { id: "g", header: "g", align: "right", render: row => row.g },
          { id: "sigma", header: "sigma", align: "right", render: row => row.sigma },
          { id: "re", header: "Re", align: "right", render: row => row.re },
          { id: "eo", header: "Eo", align: "right", render: row => row.eo },
          { id: "rel", header: "rho1/rho2", align: "right", render: row => row.rel },
          { id: "relmu", header: "mu1/mu2", align: "right", render: row => row.relmu }
        ]}
        rows={rb2PhysicalRows}
        getRowKey={row => String(row.position)}
      />
    </Section>
  );
}

function ResultsTab() {
  const [caseId, setCaseId] = useState<Rb2CaseId>("case-1");

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {rb2Cases.map(testCase => (
          <button
            key={testCase.id}
            type="button"
            className="focus-ring"
            onClick={() => setCaseId(testCase.id)}
            style={{
              border: 0,
              borderRadius: 4,
              background: caseId === testCase.id ? "var(--primary)" : "var(--surface-alt)",
              color: caseId === testCase.id ? "var(--on-primary)" : "var(--fg1)",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "9px 12px",
              textAlign: "left"
            }}
          >
            <span style={{ display: "block", fontWeight: 500 }}>{testCase.label}</span>
            <span style={{ display: "block", fontSize: 11, opacity: 0.78, marginTop: 2 }}>
              Re {testCase.re} · Eo {testCase.eo}
            </span>
          </button>
        ))}
      </div>
      <ComparisonPanel specs={rb2PlotSpecs[caseId]} defaultMetric="shape" />
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
              "The benchmark data is provided as ASCII text files. File names use the notation c#g#l#, where c# is the test case, g# is the group, and l# is the refinement level."
          }
        ]}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 32 }}>
        <DataTable
          columns={[
            { id: "abbreviation", header: "Abbreviation", render: row => row.abbreviation },
            { id: "description", header: "Description", render: row => row.description }
          ]}
          rows={rb2NotationRows}
          getRowKey={row => row.abbreviation}
        />
        <DataTable
          columns={[
            { id: "column", header: "Column", render: row => row.column },
            { id: "quantity", header: "Quantity", render: row => row.quantity }
          ]}
          rows={rb2FormatRows}
          getRowKey={row => row.column}
        />
        <DownloadTable items={rb2Downloads} />
        <div>
          <h3>Usage</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Quantity files can be plotted with standard postprocessing tools. Columns 1 through 5 contain time, mass or area, circularity, center of mass, and rise velocity.
          </p>
          <pre style={{ overflowX: "auto", padding: 16, background: "var(--surface-alt)", border: "1px solid var(--divider)", borderRadius: 4, color: "var(--fg2)" }}>
            <code>{'plot "c1g1l4.txt" using 1:2 with lines title "Bubble mass/area"\\nplot "c1g1l4.txt" using 1:3 with lines title "Circularity"\\nplot "c1g1l4.txt" using 1:4 with lines title "Center of mass"\\nplot "c1g1l4.txt" using 1:5 with lines title "Rise velocity"'}</code>
          </pre>
        </div>
      </div>
    </Section>
  );
}

export function RisingBubble2DPage() {
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
            <Icon name="arrow_back" size={14} /> Catalogue / Two-Phase / RB2
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">RB2</Chip>
                <Chip>Two-Phase</Chip>
                <Chip>2D</Chip>
                <Chip>Code Comparison</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Rising Bubble <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>2D</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A quantitative two-dimensional bubble dynamics benchmark with two cases, three refinement levels, and code-to-code comparisons across shape and scalar quantities.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Cases" value="2" />
              <KpiBox label="Levels" value="3" />
              <KpiBox label="Metrics" value="5" />
              <KpiBox label="Codes" value="3-4" />
              <KpiBox label="Re" value="35" />
              <KpiBox label="Time" value="0-3s" />
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
