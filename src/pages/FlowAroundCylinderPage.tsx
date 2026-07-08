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
  VideoBlock
} from "../components";
import {
  fac3Bibliography,
  fac3DofRows,
  fac3Downloads,
  fac3DragTimeRows,
  fac3ErrorRows,
  fac3GeometryAsset,
  fac3MeshAsset,
  fac3PlotSpecs,
  fac3ReferenceRows,
  fac3SteadyComparisonRows,
  fac3VideoAsset,
  type Fac3DragTimeRow,
  type Fac3DofRow,
  type Fac3ErrorRow,
  type Fac3SteadyComparisonRow
} from "../data/fac3";

function number(value: number) {
  return value.toLocaleString();
}

function DofTable() {
  return (
    <DataTable<Fac3DofRow>
      columns={[
        { id: "level", header: "Level", render: row => row.level },
        { id: "cells", header: "# cells", align: "right", render: row => row.cells },
        { id: "name", header: "Name", render: row => row.name },
        { id: "dofu", header: "# DOF u", align: "right", render: row => number(row.dofu) },
        { id: "dofp", header: "# DOF p", align: "right", render: row => number(row.dofp) },
        { id: "doft", header: "Total DOF", align: "right", render: row => number(row.doft) }
      ]}
      rows={fac3DofRows}
      getRowKey={(row, index) => `${row.level}-${row.name}-${index}`}
    />
  );
}

function SteadyComparisonTable() {
  return (
    <DataTable<Fac3SteadyComparisonRow>
      columns={[
        { id: "numCells", header: "Cells", render: row => row.numCells },
        { id: "name", header: "Software", render: row => row.name },
        { id: "drag", header: "cD", align: "right", render: row => row.drag },
        { id: "lift", header: "cL", align: "right", render: row => row.lift },
        { id: "errDrag", header: "%Err cD", align: "right", render: row => row.errDrag },
        { id: "errLift", header: "%Err cL", align: "right", render: row => row.errLift }
      ]}
      rows={fac3SteadyComparisonRows}
      getRowKey={(row, index) => `${row.numCells}-${row.name}-${index}`}
    />
  );
}

function DragTimeTable({ title, rows }: { title: string; rows: Fac3DragTimeRow[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <DataTable<Fac3DragTimeRow>
        columns={[
          { id: "case", header: "Case", render: row => row.case },
          { id: "cells", header: "# cells", align: "right", render: row => number(row.cells) },
          { id: "dragmax", header: "cDmax", align: "right", render: row => row.dragmax },
          { id: "liftmax", header: "cLmax", align: "right", render: row => row.liftmax },
          { id: "liftmin", header: "cLmin", align: "right", render: row => row.liftmin },
          { id: "tstep", header: "Tstep [s]", align: "right", render: row => row.tstep },
          { id: "time", header: "Time [s]", align: "right", render: row => row.time }
        ]}
        rows={rows}
        getRowKey={row => row.case}
      />
    </div>
  );
}

function ErrorTable({ title, rows }: { title: string; rows: Fac3ErrorRow[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <DataTable<Fac3ErrorRow>
        columns={[
          { id: "name", header: "Case", render: row => row.name },
          { id: "errcdmax", header: "%Err cDmax", align: "right", render: row => row.errcdmax },
          { id: "errclmin", header: "%Err cLmin", align: "right", render: row => row.errclmin },
          { id: "errl2cd", header: "%Err L2 cD", align: "right", render: row => row.errl2cd },
          { id: "errl2cl", header: "%Err L2 cL", align: "right", render: row => row.errl2cl },
          { id: "errlinfcd", header: "%Err Linf cD", align: "right", render: row => row.errlinfcd },
          { id: "errlinfcl", header: "%Err Linf cL", align: "right", render: row => row.errlinfcl }
        ]}
        rows={rows}
        getRowKey={row => row.name}
      />
    </div>
  );
}

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "Flow around a cylinder is a well-known benchmark for evaluating numerical algorithms for incompressible Navier-Stokes equations in the laminar case. In analogy to the 2D case, a cuboid-shaped domain with a cylindrical obstacle is simulated for Re = 20 and Re = 100."
          },
          {
            type: "paragraph",
            text:
              "The benchmark problems are studied with OpenFOAM, ANSYS-CFX, and the in-house code FeatFloWer. The comparison focuses on drag and lift coefficients on the cylinder and on the computational behavior of the different solver strategies."
          }
        ]}
      />
      <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          Because the codes employ different numerical techniques, the benchmark is also used to investigate three practical solver questions:
        </p>
        <ul style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0, paddingLeft: 22 }}>
          <li>Can incompressible flow be solved efficiently without multigrid components, especially for the pressure Poisson problem?</li>
          <li>Which time stepping strategy is preferable: a fully coupled iteration or an operator-splitting pressure-correction scheme?</li>
          <li>Does higher order discretization in space or time justify its added algebraic cost?</li>
        </ul>
      </div>
      <VideoBlock src={fac3VideoAsset} title="Flow around a cylinder 3D" />
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
              "The solvers are tested in two benchmark configurations with an incompressible Newtonian fluid whose kinematic viscosity is 10^-3 m^2/s. Conservation of mass and momentum are written as:"
          },
          { type: "equation", block: true, value: "$\\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u}\\cdot\\nabla\\mathbf{u} = -\\nabla p + \\nu\\Delta\\mathbf{u}$" },
          { type: "equation", block: true, value: "$\\nabla\\cdot\\mathbf{u}=0$" },
          {
            type: "paragraph",
            text:
              "The Reynolds number is defined with the mean velocity of the imposed parabolic inflow profile and the cylinder diameter."
          },
          { type: "equation", block: true, value: "$Re=\\frac{UD}{\\nu}$" }
        ]}
      />
      <Figure src={fac3GeometryAsset} alt="FAC3D geometry and boundary conditions" caption="Initial configuration and boundary conditions for the benchmark." />
      <Figure src={fac3MeshAsset} alt="FAC3D base mesh" caption="Base mesh for the benchmark." />
      <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
        The 3D mesh is obtained by extruding the 2D mesh in the z direction. The first computational level is produced by two successive refinements of the coarsest mesh and contains 6144 cells, which the source page describes as a balance between accuracy and cost.
      </p>
      <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
        The software tools use different spatial discretizations, so equal cell counts do not imply equal degrees of freedom. OpenFOAM and CFX have comparable DOF counts, while FeatFlow has more DOF on the same mesh because it uses a higher order finite element approximation. The table lists degrees of freedom with respect to cell counts for the corresponding mesh levels.
      </p>
      <DofTable />
      <div style={{ marginTop: 32, display: "grid", gap: 18 }}>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The inflow conditions use parabolic velocity profiles for the steady and unsteady benchmark configurations:
        </p>
        <Equation block>{"$$\\begin{aligned}\\mathbf{U}(0,y,z)&=16U_m yz(H-y)(H-z)/H^4,\\quad V=W=0\\\\\\mathbf{U}(0,y,z)&=16U_m yz\\sin(\\pi t/8)(H-y)(H-z)/H^4,\\quad V=W=0\\end{aligned}$$"}</Equation>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>The drag and lift forces on the cylinder are evaluated by integrating stresses over the cylinder surface.</p>
        <Equation block>{"$$\\begin{aligned}\\mathbf{F}_D &= \\int_S \\left(\\rho\\nu\\frac{\\partial v_t}{\\partial n}n_y - pn_x\\right)\\,dS\\\\\\mathbf{F}_L &=-\\int_S \\left(\\rho\\nu\\frac{\\partial v_t}{\\partial n}n_x - pn_y\\right)\\,dS\\end{aligned}$$"}</Equation>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The first benchmark problem at Re = 20 is simulated toward a steady state. The second benchmark is unsteady with a fixed simulation time of T = 8s: the inflow starts from zero, reaches a transient state, and returns to zero at the end of the half period.
        </p>
      </div>
    </Section>
  );
}

function ResultsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ display: "grid", gap: 36 }}>
        <div>
          <h3>Live reference curves</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 820 }}>
            Drag and lift are rendered live from the reference time series with Plotly, so fixed zoom figures are replaced by interactive zooming and panning.
          </p>
          <ComparisonPanel specs={fac3PlotSpecs} defaultMetric="drag" />
        </div>
        <div>
          <h3>Steady test case (Re = 20)</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 900 }}>
            The Re = 20 case is used first to establish accuracy. The qualitative results were indistinguishable even on the coarsest level, and the table preserves the original comparison of drag and lift values for CFX, OpenFOAM, and FeatFlow across mesh levels.
          </p>
          <SteadyComparisonTable />
        </div>
        <div style={{ color: "var(--fg2)", lineHeight: 1.65, maxWidth: 980 }}>
          <p>
            The second benchmark is the challenging unsteady case. It runs for 8 seconds with a time-varying inflow profile and fixed time steps. The source page notes that adaptive time stepping produced oscillations in sensitive quantities, especially lift, for some solver configurations.
          </p>
          <p>
            The comparison criteria are the maximum drag coefficient, the minimum lift coefficient, and normalized L2 and Linf errors against the reference solution. The reference and comparison solutions are linearly interpolated to a common discrete time grid before the error norms are evaluated.
          </p>
          <p>
            FeatFlow shows the expected convergence behavior with mesh refinement; levels 3 and 4 are effectively identical in the reported study, so the finest FeatFlow result is used as the reference time series for the live Drag/Lift plots above.
          </p>
        </div>
        <DragTimeTable title="FeatFloWer results" rows={fac3DragTimeRows.featflow} />
        <ErrorTable title="Error calculations for FeatFloWer results" rows={fac3ErrorRows.featflow} />
        <DragTimeTable title="OpenFOAM results" rows={fac3DragTimeRows.openfoam} />
        <ErrorTable title="Error calculations for OpenFOAM results" rows={fac3ErrorRows.openfoam} />
        <DragTimeTable title="CFX results" rows={fac3DragTimeRows.cfx} />
        <ErrorTable title="Error calculations for CFX results" rows={fac3ErrorRows.cfx} />
        <DragTimeTable title="Finest level results and FeatFloWer level 2" rows={fac3DragTimeRows.comparison} />
        <ErrorTable title="Comparison of FeatFloWer level 2 with OpenFOAM and CFX level 4" rows={fac3ErrorRows.comparison} />
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
              "BenchValues.txt contains the reference time series used by the live plots in the Results tab. The fourth column, Z-Force, is preserved in the download and is not plotted here."
          }
        ]}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 32 }}>
        <DataTable
          columns={[
            { id: "column", header: "Column", align: "right", render: row => row.column },
            { id: "quantity", header: "Quantity", render: row => row.quantity }
          ]}
          rows={fac3ReferenceRows}
          getRowKey={row => String(row.column)}
        />
        <DownloadTable items={fac3Downloads} />
      </div>
    </Section>
  );
}

function ConclusionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 100 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Conclusion" },
          {
            type: "paragraph",
            text:
              "The benchmark computations replace the existing reference results for the second test case. FeatFloWer results at mesh level 3 can already be considered mesh independent, while level 4 confirms a fully converged solution."
          },
          {
            type: "paragraph",
            text:
              "The comparison shows that FeatFloWer level 2 on 4 nodes has a similar accuracy to other codes at level 4 on 24 nodes. The benchmark remains a motivation for CFD software developers to compare computational performance and accuracy."
          },
          {
            type: "paragraph",
            text:
              "The study concludes that efficient laminar incompressible-flow solvers still depend strongly on suitable multigrid techniques, especially for coupled solvers and pressure-Poisson solves. Fully coupled implicit solvers allow larger time steps, but the extra nonlinear iterations can offset that advantage."
          },
          {
            type: "paragraph",
            text:
              "The higher order discretization used by FeatFlow leads to denser systems, but the reported accuracy and efficiency indicate that higher order methods in space and time are worthwhile for these benchmark cases."
          },
          { type: "heading", level: 3, text: "Acknowledgements" },
          {
            type: "paragraph",
            text:
              "The authors thank the German Research Foundation (DFG) for partially supporting the work under SFB708 (TP B7) and SPP1423 (Tu102/32-1), Sulzer Innotec, Sulzer Markets and Technology AG, and the LiDOng team at ITMC TU Dortmund."
          }
        ]}
      />
      <div style={{ marginTop: 32 }}>
        <h3>Bibliography</h3>
        <ReferenceList items={fac3Bibliography} />
      </div>
    </Section>
  );
}

export function FlowAroundCylinderPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("introduction");
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "reference-data", label: "Reference Data" },
    { id: "conclusion", label: "Conclusion and Bibliography" }
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
            <Icon name="arrow_back" size={14} /> Catalogue / Newtonian / FAC
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">FAC</Chip>
                <Chip>Newtonian</Chip>
                <Chip>3D</Chip>
                <Chip>Live Drag/Lift</Chip>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(42px, 5vw, 64px)", margin: "0 0 12px" }}>
                Flow Around <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>Cylinder</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A laminar incompressible Navier-Stokes benchmark comparing drag and lift around a cylindrical obstacle across solver families and mesh levels.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <KpiBox label="Cases" value="2" />
              <KpiBox label="Re" value="20 / 100" />
              <KpiBox label="Levels" value="4" />
              <KpiBox label="Codes" value="3" />
              <KpiBox label="Metrics" value="Drag / Lift" />
              <KpiBox label="Time" value="0-8s" />
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
      {tab === "conclusion" && <ConclusionTab />}
    </div>
  );
}
