import type { ReactNode } from "react";
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
  Overline,
  ReferenceList,
  Section,
  Tabs,
  useTabParam,
  VideoBlock
} from "../components";
import {
  fac3Bibliography,
  fac3Cases,
  fac3CfxSettings,
  fac3DofRows,
  fac3DofRules,
  fac3Downloads,
  fac3DragTimeRows,
  fac3ErrorRows,
  fac3GeometryAsset,
  fac3MeshAsset,
  fac3OpenFoamSettings,
  fac3PlotSpecs,
  fac3ReferenceRows,
  fac3SteadyComparisonRows,
  fac3VideoAsset,
  type Fac3Case,
  type Fac3DragTimeRow,
  type Fac3DofRow,
  type Fac3ErrorRow,
  type Fac3SolverSettingRow,
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
              "Flow around a cylinder is a well-known benchmark for evaluating numerical algorithms for incompressible Navier-Stokes equations in the laminar case. In analogy to the 2D case, a cuboid-shaped domain with a cylindrical obstacle is simulated in two cases: a steady flow at Re = 20, and an unsteady flow whose Reynolds number follows the inflow from 0 up to 100 and back over 8 seconds."
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

function CaseTable() {
  return (
    <DataTable<Fac3Case>
      columns={[
        { id: "label", header: "Case", render: row => row.label },
        { id: "inflow", header: "Inflow", render: row => row.inflow },
        { id: "um", header: "U_m", align: "right", render: row => row.um },
        { id: "mean", header: "Mean velocity", align: "right", render: row => row.meanVelocity },
        { id: "re", header: "Re", align: "right", render: row => row.reynolds },
        { id: "time", header: "Simulated time", render: row => row.time },
        { id: "criteria", header: "Compared quantities", render: row => row.criteria },
        { id: "reference", header: "Reference", render: row => row.reference }
      ]}
      rows={fac3Cases}
      getRowKey={row => row.id}
    />
  );
}

function DofRuleTable() {
  return (
    <DataTable
      columns={[
        { id: "code", header: "Software", render: row => row.code },
        { id: "velocity", header: "# DOF u", render: row => row.velocity },
        { id: "pressure", header: "# DOF p", render: row => row.pressure }
      ]}
      rows={fac3DofRules}
      getRowKey={row => row.code}
    />
  );
}

function SolverSettingsTable({ title, rows }: { title: string; rows: Fac3SolverSettingRow[] }) {
  return (
    <div>
      <h4 style={{ margin: "0 0 12px" }}>{title}</h4>
      <DataTable<Fac3SolverSettingRow>
        columns={[
          { id: "setting", header: "Setting", render: row => row.setting },
          { id: "value", header: "Value", render: row => row.value },
          { id: "description", header: "Description", render: row => row.description }
        ]}
        rows={rows}
        getRowKey={row => row.setting}
      />
    </div>
  );
}

function CaseHeading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 32 }}>
      <Overline style={{ marginBottom: 8 }}>{label}</Overline>
      <h2 style={{ margin: 0, fontSize: 24 }}>{children}</h2>
    </div>
  );
}

const prose = { color: "var(--fg2)", lineHeight: 1.65 } as const;

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and governing equations" },
          {
            type: "paragraph",
            text:
              "The domain is a channel of length 2.5 m with a square cross-section of side H = 0.41 m. A cylinder of diameter D = 0.1 m spans the channel in z, with its axis at x = 0.5 m and y = 0.2 m, so it sits slightly off the channel centre. The fluid is incompressible and Newtonian with kinematic viscosity ν = 10^-3 m^2/s, and conservation of mass and momentum are written as:"
          },
          { type: "equation", block: true, value: "$\\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u}\\cdot\\nabla\\mathbf{u} = -\\nabla p + \\nu\\Delta\\mathbf{u}$" },
          { type: "equation", block: true, value: "$\\nabla\\cdot\\mathbf{u}=0$" },
          {
            type: "paragraph",
            text:
              "The Reynolds number is defined with the mean velocity Ū of the imposed parabolic inflow profile and the cylinder diameter. For the 3D profile the mean velocity is 4/9 of the peak inflow velocity U_m."
          },
          { type: "equation", block: true, value: "$Re=\\frac{\\bar{U}D}{\\nu},\\qquad \\bar{U}=\\tfrac{4}{9}U_m$" }
        ]}
      />
      <Figure src={fac3GeometryAsset} alt="FAC3D geometry and boundary conditions" caption="Geometry and boundary conditions, shared by both cases." />

      <h3>The two test cases</h3>
      <p style={prose}>
        Both cases use the same geometry, mesh levels, and boundary conditions. They differ only in the inflow: its peak velocity U_m, and whether it is held constant or varied in time. Case 1 is the necessary condition, a well-studied steady problem with precise reference values that every code has to reproduce. Case 2 is the actual benchmark, a transient problem whose reference solution this study establishes.
      </p>
      <CaseTable />

      <div style={{ marginTop: 32, display: "grid", gap: 18 }}>
        <h3 style={{ margin: 0 }}>Boundary conditions</h3>
        <p style={{ ...prose, margin: 0 }}>
          No-slip conditions (U = V = W = 0) hold on the channel walls and on the cylinder surface, and natural do-nothing conditions are imposed at the outflow plane. At the inflow plane, Case 1 imposes the steady parabolic profile (1) with U_m = 0.45 m/s. Case 2 imposes the same profile scaled by sin(πt/8), equation (2), with U_m = 2.25 m/s. Case 2 is simulated over half a period of that ramp, 0 ≤ t ≤ 8 s: the inflow starts from zero with zero initial conditions, peaks at t = 4 s where Re = 100, and returns to zero at t = 8 s.
        </p>
        <Equation block>{"$$\\begin{aligned}\\text{Case 1:}\\quad U(0,y,z)&=16U_m yz(H-y)(H-z)/H^4,\\quad V=W=0 &&(1)\\\\\\text{Case 2:}\\quad U(0,y,z,t)&=16U_m yz\\sin(\\pi t/8)(H-y)(H-z)/H^4,\\quad V=W=0 &&(2)\\end{aligned}$$"}</Equation>

        <h3 style={{ margin: "16px 0 0" }}>Drag and lift</h3>
        <p style={{ ...prose, margin: 0 }}>
          The drag and lift forces on the cylinder are evaluated by integrating stresses over its surface S. Here n is the normal vector on S with components n_x and n_y, v_t is the tangential velocity on S, and t = (n_y, −n_x, 0) is the tangent vector.
        </p>
        <Equation block>{"$$\\begin{aligned}F_D &= \\int_S \\left(\\rho\\nu\\frac{\\partial v_t}{\\partial n}n_y - pn_x\\right)\\,dS\\\\F_L &=-\\int_S \\left(\\rho\\nu\\frac{\\partial v_t}{\\partial n}n_x - pn_y\\right)\\,dS\\end{aligned}$$"}</Equation>
        <p style={{ ...prose, margin: 0 }}>
          The forces are reported as drag and lift coefficients, normalized with the mean inflow velocity and the projected area DH, following the original DFG benchmark definition of Schäfer and Turek. In Case 2, Ū is the time-dependent mean velocity, so the coefficients are histories c_D(t) and c_L(t).
        </p>
        <Equation block>{"$$c_D=\\frac{2F_D}{\\rho\\bar{U}^2DH},\\qquad c_L=\\frac{2F_L}{\\rho\\bar{U}^2DH}$$"}</Equation>
      </div>

      <h3 style={{ marginTop: 40 }}>Mesh levels and degrees of freedom</h3>
      <Figure src={fac3MeshAsset} alt="FAC3D base mesh" caption="Coarsest 2D mesh, extruded in z to build the 3D mesh." />
      <p style={prose}>
        The 3D mesh is obtained by extruding the 2D mesh in the z direction with 4 layers of cells. The first computational level is produced by two successive refinements of this coarsest mesh, connecting opposite midpoints, and contains 6144 cells. Preliminary studies showed that this level offers a good balance between accuracy and cost. Each further level refines every cell into eight, up to 3,145,728 cells on level 4. Both cases are computed on the same four levels.
      </p>
      <p style={prose}>
        The codes use different spatial discretizations, so equal cell counts do not imply equal degrees of freedom. OpenFOAM and CFX have comparable DOF counts. FeatFlow uses a higher order finite element approximation and has about as many DOF on a given mesh as the other codes have one level finer:
      </p>
      <DofRuleTable />
      <div style={{ marginTop: 24 }}>
        <DofTable />
      </div>

      <h3 style={{ marginTop: 40 }}>Codes and discretizations</h3>
      <p style={prose}>
        Both cases are solved with the same three codes and settings. Each code discretizes the Navier-Stokes equations differently: OpenFOAM with a conventional finite volume method, ANSYS-CFX with an element-based finite volume method, and FeatFlow with a higher order Galerkin finite element method. They also solve the resulting linear and nonlinear systems differently, which mainly affects performance rather than accuracy. In FeatFlow, the finite element spaces were also chosen so that the linear solvers would be as efficient as possible.
      </p>
      <p style={prose}>
        <strong>OpenFOAM</strong> (version 1.6, solver icoFoam) discretizes in space with the finite volume method on block-structured meshes, using Gaussian integration and linear interpolation. Time stepping is equidistant, implicit Euler blended with Crank-Nicolson (blending factor 0.5). Pressure and momentum are decoupled with the PISO algorithm. The momentum equation is solved with PBiCG and a DILU preconditioner, and the pressure equation with a geometric-algebraic multigrid solver and a Gauss-Seidel smoother.
      </p>
      <SolverSettingsTable title="OpenFOAM discretization schemes and solver parameters" rows={fac3OpenFoamSettings} />
      <p style={{ ...prose, marginTop: 24 }}>
        <strong>ANSYS-CFX</strong> (version 12.0 SP1, transient solver) uses an element-based finite volume approach in space. A high resolution scheme stabilizes the convective term, and time is discretized with the second order backward Euler scheme. CFX uses a coupled solver that treats u, v, w, and p as a single system: the nonlinear equations are linearized by coefficient iteration and then solved with an algebraic multigrid solver.
      </p>
      <SolverSettingsTable title="CFX discretization schemes and solver parameters" rows={fac3CfxSettings} />
      <p style={{ ...prose, marginTop: 24 }}>
        <strong>FeatFlow</strong> (module PP3D) is a transient 3D finite element code, parallelized by domain decomposition. Velocity and pressure are discretized with the higher order Q2/P1 element pair, which is stable enough at moderate Reynolds numbers that the convective term needs no stabilization, unlike in the other two codes. Time stepping uses the second order Crank-Nicolson method, and the solution is computed with a discrete projection method. The resulting Burgers equations and the pressure Poisson equation, which enforces incompressibility, are both solved with geometric multigrid, using SSOR/SOR for velocity and UMFPACK/SOR for pressure as solver/smoother pairs.
      </p>
    </Section>
  );
}

function ResultsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ gap: 36 }}>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          The question for both cases was not whether a code can solve the problem, but how accurate and efficient it is. Case 1 establishes accuracy against known reference values, and Case 2 then compares accuracy and performance on the transient problem. Inflow and simulated time for each case are listed in the Definition tab.
        </p>

        <CaseHeading label="Case 1">Steady, Re = 20</CaseHeading>
        <div style={{ ...prose, maxWidth: 900 }}>
          <p style={{ marginTop: 0 }}>
            Constant inflow with U_m = 0.45 m/s, simulated towards the steady state. Very accurate results exist for this case, so it serves as the necessary condition before any code moves on to Case 2. The reference values are c_D = 6.18533 and c_L = 0.009401 (Braack and Richter), and the error columns below are relative to them.
          </p>
          <p style={{ marginBottom: 0 }}>
            All three codes pass on the four mesh levels. The qualitative results were indistinguishable even on the coarsest level. The lift coefficient separates the codes more clearly than drag, and FeatFlow is within 1.8% of the reference lift on level 1, where the other codes are off by 33% and 84%.
          </p>
        </div>
        <div>
          <h3>Drag and lift by mesh level</h3>
          <SteadyComparisonTable />
        </div>

        <CaseHeading label="Case 2">Unsteady, Re_max = 100</CaseHeading>
        <div style={{ ...prose, maxWidth: 980 }}>
          <p style={{ marginTop: 0 }}>
            Time-varying inflow with U_m = 2.25 m/s scaled by sin(πt/8), simulated over the fixed interval 0 ≤ t ≤ 8 s: from rest to a peak Reynolds number of 100 at t = 4 s and back to zero. Earlier studies gave c_D,max and c_L,min only as the intervals [3.2000, 3.3000] and [0.0020, 0.0040] (Schäfer and Turek), and John reported c_D,max = 3.2968. That was not precise enough to serve as a benchmark, so this case establishes a new reference solution.
          </p>
          <p>
            Adaptive time stepping suits a transient inflow, but in preliminary runs it caused numerical oscillations in the CFX and OpenFOAM results. The oscillations were invisible in the flow field and in drag, and appeared only in the more sensitive lift coefficient. They were studied with OpenFOAM on the 393,216-cell mesh, varying the maximum Courant number and the linear solver tolerances (velocity 10^-5 or 10^-6, pressure 10^-6 or 10^-7). All Case 2 runs therefore use a fixed time step, chosen as the largest value for which the solution no longer depends on it, even though this adds computational cost.
          </p>
          <p>
            The comparison criteria are the maximum drag coefficient and the minimum lift coefficient. Because lift is the more sensitive quantity, it is the better indicator of accuracy. Peak values alone say little about a whole time history, so the comparison also uses normalized L2 and L∞ errors against the reference solution. To compute them, the reference and each other solution are linearly interpolated onto a common equidistant time grid, fine enough that the L2 error no longer depends on its spacing, and the norms are taken of the differences.
          </p>
          <p style={{ marginBottom: 0 }}>
            FeatFlow shows the best convergence under mesh refinement, quadratic as its Q2 elements predict, and is already converged on level 3. Levels 3 and 4 are effectively identical, so the level 4 FeatFlow result is the reference time series for this study and for the live plots below. It is also the closest to the value reported by John. Coarse meshes were computed sequentially and fine meshes in parallel by domain decomposition, on identical dual-core AMD Opteron 250 nodes (2.4 GHz, 8 GB) with one partition per node, connected by Gigabit Ethernet. In the Time column, a factor such as × 24 is the number of nodes a run used; entries without one ran sequentially.
          </p>
        </div>
        <div>
          <h3>Reference drag and lift histories</h3>
          <p style={{ ...prose, maxWidth: 820 }}>
            The FeatFlow level 4 reference series, rendered live from BenchValues.txt.
          </p>
          <ComparisonPanel specs={fac3PlotSpecs} defaultMetric="drag" />
        </div>
        <DragTimeTable title="FeatFloWer results" rows={fac3DragTimeRows.featflow} />
        <ErrorTable title="Error calculations for FeatFloWer results" rows={fac3ErrorRows.featflow} />
        <DragTimeTable title="OpenFOAM results" rows={fac3DragTimeRows.openfoam} />
        <ErrorTable title="Error calculations for OpenFOAM results" rows={fac3ErrorRows.openfoam} />
        <DragTimeTable title="CFX results" rows={fac3DragTimeRows.cfx} />
        <ErrorTable title="Error calculations for CFX results" rows={fac3ErrorRows.cfx} />
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          The finest-level results of all three codes agree. FeatFlow on level 2 is about as accurate as OpenFOAM and CFX on level 4.
        </p>
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
      <div className="stack" style={{ marginTop: 32, gap: 32 }}>
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
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "reference-data", label: "Reference Data" },
    { id: "conclusion", label: "Conclusion and Bibliography" }
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
            <Icon name="arrow_back" size={14} /> Catalogue / Newtonian / FAC
          </button>
          <div className="split split-hero">
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">FAC</Chip>
                <Chip>Newtonian</Chip>
                <Chip>3D</Chip>
                <Chip>Live Drag/Lift</Chip>
              </div>
              <h1 className="display display-md" style={{ margin: "0 0 12px" }}>
                Flow Around <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>Cylinder</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A laminar incompressible Navier-Stokes benchmark comparing drag and lift around a cylindrical obstacle across solver families and mesh levels.
              </p>
            </div>
            <div className="kpi-grid">
              <KpiBox label="Cases" value="2" />
              <KpiBox label="Re" value="20 / ≤100" />
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
