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
  useTabParam
} from "../components";
import {
  fsiBibliography,
  fsiBundleContents,
  fsiCfd1Rows,
  fsiCfd2Rows,
  fsiCfd3DragAsset,
  fsiCfd3LiftAsset,
  fsiCfd3Rows,
  fsiCoarseMeshAsset,
  fsiCsm1Rows,
  fsiCsm2Rows,
  fsiCsm3PlotSpecs,
  fsiCsm3Rows,
  fsiDownloads,
  fsiFluidMaterials,
  fsiFsi1Rows,
  fsiFsi2PlotSpecs,
  fsiFsi2Rows,
  fsiFsi3PlotSpecs,
  fsiFsi3Rows,
  fsiGenerated,
  fsiGeometryAsset,
  fsiGeometryRows,
  fsiIntegrationPathAsset,
  fsiMeshRows,
  fsiNondimensionalRows,
  fsiParameterTables,
  fsiReferenceColumns,
  fsiSolidMaterials,
  fsiStructureAsset,
  fsiTestCases,
  type FsiFsi1Row,
  type FsiParameterRow,
  type FsiPeriodicRow,
  type FsiSteadyDisplacementRow,
  type FsiSteadyForceRow
} from "../data/fsi";

const prose = { color: "var(--fg2)", lineHeight: 1.65 } as const;

function count(value: number) {
  return value.toLocaleString("en-US");
}

/** Published steady values carry six significant digits; keep their trailing zeros. */
function six(value: number) {
  return value.toPrecision(6);
}

function CaseHeading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 32 }}>
      <Overline style={{ marginBottom: 8 }}>{label}</Overline>
      <h2 style={{ margin: 0, fontSize: 24 }}>{children}</h2>
    </div>
  );
}

function TableBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// ---- Tables --------------------------------------------------------------------

function SteadyForceTable({ rows }: { rows: FsiSteadyForceRow[] }) {
  return (
    <DataTable<FsiSteadyForceRow>
      columns={[
        { id: "level", header: "Level", render: row => row.level },
        { id: "nel", header: "# el", align: "right", render: row => count(row.nel) },
        { id: "ndof", header: "# dof", align: "right", render: row => count(row.ndof) },
        { id: "drag", header: "Drag [N]", align: "right", render: row => six(row.drag) },
        { id: "lift", header: "Lift [N]", align: "right", render: row => six(row.lift) }
      ]}
      rows={rows}
      getRowKey={row => row.level}
    />
  );
}

function SteadyDisplacementTable({ rows }: { rows: FsiSteadyDisplacementRow[] }) {
  return (
    <DataTable<FsiSteadyDisplacementRow>
      columns={[
        { id: "level", header: "Level", render: row => row.level },
        { id: "nel", header: "# el", align: "right", render: row => count(row.nel) },
        { id: "ndof", header: "# dof", align: "right", render: row => count(row.ndof) },
        { id: "ux", header: "u_x(A) [10⁻³ m]", align: "right", render: row => six(row.ux) },
        { id: "uy", header: "u_y(A) [10⁻³ m]", align: "right", render: row => six(row.uy) }
      ]}
      rows={rows}
      getRowKey={row => row.level}
    />
  );
}

type PeriodicColumn = "ux" | "uy" | "drag" | "lift";

const PERIODIC_HEADERS: Record<PeriodicColumn, string> = {
  ux: "u_x(A)",
  uy: "u_y(A)",
  drag: "Drag",
  lift: "Lift"
};

function PeriodicTable({ rows, columns, headers = PERIODIC_HEADERS }: { rows: FsiPeriodicRow[]; columns: PeriodicColumn[]; headers?: Record<PeriodicColumn, string> }) {
  return (
    <DataTable<FsiPeriodicRow>
      columns={[
        { id: "dt", header: "Δt [s]", render: row => row.dt },
        { id: "level", header: "Level", render: row => row.level },
        { id: "nel", header: "# el", align: "right", render: row => count(row.nel) },
        { id: "ndof", header: "# dof", align: "right", render: row => count(row.ndof) },
        ...columns.map(column => ({ id: column, header: headers[column], align: "right" as const, render: (row: FsiPeriodicRow) => row[column] ?? "–" }))
      ]}
      rows={rows}
      getRowKey={row => `${row.dt}-${row.level}`}
    />
  );
}

function Fsi1Table() {
  return (
    <DataTable<FsiFsi1Row>
      columns={[
        { id: "level", header: "Level", render: row => row.level },
        { id: "nel", header: "# el", align: "right", render: row => count(row.nel) },
        { id: "ndof", header: "# dof", align: "right", render: row => count(row.ndof) },
        { id: "ux", header: "u_x(A) [m]", align: "right", render: row => row.ux },
        { id: "uy", header: "u_y(A) [m]", align: "right", render: row => row.uy },
        { id: "drag", header: "Drag [N]", align: "right", render: row => row.drag },
        { id: "lift", header: "Lift [N]", align: "right", render: row => row.lift }
      ]}
      rows={fsiFsi1Rows}
      getRowKey={row => row.level}
    />
  );
}

type RunStats = { mean: number; amplitude: number; frequency: number };

function formatStats(stats: RunStats, digits: number) {
  const f = (value: number) => (Math.abs(value) >= 1 ? value.toFixed(2) : value.toExponential(digits));
  return `${f(stats.mean)} ± ${f(stats.amplitude)} [${stats.frequency.toFixed(2)}]`;
}

/**
 * The site's own last-period evaluation of the downloadable reference file,
 * set against the published row it reproduces.
 */
function RecomputedTable({ run, published, publishedLabel }: { run: "fsi2" | "fsi3"; published: FsiPeriodicRow; publishedLabel: string }) {
  const stats = fsiGenerated.runs[run];
  const rows = (["ux", "uy", "drag", "lift"] as const).map(key => ({
    quantity: PERIODIC_HEADERS[key],
    published: published[key] ?? "–",
    recomputed: formatStats(stats[key], 3)
  }));
  return (
    <DataTable
      columns={[
        { id: "quantity", header: "Quantity", render: row => row.quantity },
        { id: "published", header: publishedLabel, align: "right", render: row => row.published },
        { id: "recomputed", header: `Recomputed from ${stats.file}`, align: "right", render: row => row.recomputed }
      ]}
      rows={rows}
      getRowKey={row => row.quantity}
    />
  );
}

/**
 * The family's parameter settings, laid out as the legacy pages had them:
 * parameters down the side, tests across the top. Repeated on each test tab so
 * it can be read without going back to the Definition tab, where the same
 * numbers appear once more as the combined nine-test case table.
 */
function ParameterTables({ family }: { family: "CFD" | "CSM" | "FSI" }) {
  const { tests, dimensional, nondimensional } = fsiParameterTables(family);
  const table = (rows: FsiParameterRow[], header: string) => (
    <DataTable<FsiParameterRow>
      columns={[
        { id: "parameter", header, render: row => row.parameter },
        ...tests.map((test, index) => ({ id: test, header: test, align: "right" as const, render: (row: FsiParameterRow) => row.values[index] }))
      ]}
      rows={rows}
      getRowKey={row => row.parameter}
    />
  );
  return (
    <div className="stack" style={{ gap: 24 }}>
      <h3 style={{ margin: 0 }}>Parameter settings for the {family} tests</h3>
      {table(dimensional, "Dimensional parameter")}
      {table(nondimensional, "Non-dimensional parameter")}
    </div>
  );
}

// ---- Tabs ----------------------------------------------------------------------

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "This benchmark describes settings for the rigorous evaluation of methods for fluid-structure interaction (FSI). A laminar incompressible channel flow passes an elastic object, a flag attached to a fixed cylinder, which results in self-induced oscillations of the structure. Characteristic quantities of the flow and the structure, and plots of their time histories, are provided for quantitative comparison."
          },
          {
            type: "paragraph",
            text:
              "The configurations are meant to test and compare numerical methods and code implementations for FSI. The coupling mechanisms, from partitioned, weakly coupled approaches to fully coupled monolithic schemes, are of particular interest. The benchmark also allows the quality of different discretizations to be examined (FEM, FV, FD, LBM for the fluid; beam, shell or volume elements for the structure), along with the robustness and efficiency of the integrated solver components."
          },
          {
            type: "paragraph",
            text:
              "The setup builds on the flow around cylinder benchmark of Turek and Schäfer (1996) for incompressible laminar flow and on the configuration of Wall and Ramm (1998). The fluid is incompressible and laminar. The structure may be compressible, and its deformations should be significant. With the elastic part submerged in the channel flow, self-induced oscillations develop in the fluid and the structure, so that characteristic physical quantities and plots of the time-dependent results can be provided."
          },
          {
            type: "paragraph",
            text:
              "Removing the flag recovers the 2D flow around cylinder configuration exactly, which lets the flow part be validated against that older benchmark. Before the full FSI tests, partial tests check the fluid solver on its own with a rigid flag (CFD1–3) and the structural solver on its own under gravity (CSM1–3)."
          }
        ]}
      />
      <Figure src={fsiGeometryAsset} alt="Channel with the cylinder and the elastic flag behind it" caption="The computational domain: a channel of length L and height H with the cylinder and the elastic flag of length l and thickness h." />
      <div style={{ marginTop: 32 }}>
        <h3>References</h3>
        <ReferenceList items={fsiBibliography} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h3 style={{ marginTop: 0 }}>Geometry, governing equations and scales</h3>
      <p style={prose}>
        An incompressible Newtonian fluid interacts with an elastic solid. Ωᶠₜ is the domain occupied by the fluid and Ωˢₜ the one occupied by the solid at time t ∈ [0, T], and Γ⁰ₜ is the part of the boundary where the two interact.
      </p>
      <p style={prose}>
        The domain is the 2D flow around cylinder benchmark of Turek and Schäfer (1996) with an elastic bar behind the cylinder. The bar is fully attached to the fixed cylinder at its left end. The control point A(t) moves with the structure; B is fixed. The setting is intentionally non-symmetric, so that the onset of any oscillation does not depend on the precision of the computation. All lengths are in m.
      </p>
      <DataTable
        columns={[
          { id: "quantity", header: "Geometry parameter", render: row => row.quantity },
          { id: "symbol", header: "Symbol", render: row => row.symbol },
          { id: "value", header: "Value [m]", align: "right", render: row => row.value }
        ]}
        rows={fsiGeometryRows}
        getRowKey={row => row.symbol}
      />
      <Figure src={fsiStructureAsset} alt="Detail of the cylinder and the elastic bar with the control points A and B" caption="Detail of the structure: cylinder of radius r centred at C, the bar of length l and thickness h, and the control points A and B." />

      <h4>Fluid</h4>
      <p style={prose}>The fluid state is described by the velocity and pressure fields vᶠ and pᶠ. The balance equations and the constitutive law are</p>
      <Equation block>{"$$\\begin{aligned}\\varrho^f \\frac{\\partial \\mathbf{v}^f}{\\partial t} + \\varrho^f (\\nabla \\mathbf{v}^f)\\,\\mathbf{v}^f &= \\nabla\\cdot\\pmb{\\sigma}^f, \\qquad \\nabla\\cdot\\mathbf{v}^f = 0 \\qquad \\text{in } \\Omega^f_t,\\\\ \\pmb{\\sigma}^f &= -p^f\\mathbf{I} + \\varrho^f\\nu^f\\left(\\nabla\\mathbf{v}^f + (\\nabla\\mathbf{v}^f)^T\\right),\\end{aligned}$$"}</Equation>
      <p style={prose}>
        with the constant fluid density ρᶠ and the kinematic viscosity νᶠ. The Reynolds number is formed with the cylinder diameter 2r and the mean inflow velocity Ū, which is two thirds of the centreline velocity of the parabolic inflow profile:
      </p>
      <Equation block>{"$$\\mathrm{Re} = \\frac{2r\\,\\bar{U}}{\\nu^f}, \\qquad \\bar{U} = \\tfrac{2}{3}\\, v^f\\!\\left(0, \\tfrac{H}{2}, t\\right).$$"}</Equation>

      <h4>Structure</h4>
      <p style={prose}>
        The structure is elastic and compressible, described by its displacement uˢ with velocity vˢ = ∂uˢ/∂t. Written with respect to the undeformed reference configuration Ωˢ (the Lagrangian description), the balance equation is
      </p>
      <Equation block>{"$$\\varrho^s \\frac{\\partial^2 \\mathbf{u}^s}{\\partial t^2} = \\nabla\\cdot\\left(J\\,\\pmb{\\sigma}^s\\mathbf{F}^{-T}\\right) + \\varrho^s\\mathbf{g} \\qquad \\text{in } \\Omega^s, \\qquad \\mathbf{F} = \\mathbf{I} + \\nabla\\mathbf{u}^s,\\; J = \\det\\mathbf{F}.$$"}</Equation>
      <p style={prose}>
        The material is St. Venant-Kirchhoff. With the Green-Lagrange strain E = ½(FᵀF − I), the Cauchy stress σˢ and the second Piola-Kirchhoff stress Sˢ = J F⁻¹ σˢ F⁻ᵀ are (see Ciarlet 1988)
      </p>
      <Equation block>{"$$\\pmb{\\sigma}^s = \\frac{1}{J}\\,\\mathbf{F}\\left(\\lambda^s(\\operatorname{tr}\\mathbf{E})\\,\\mathbf{I} + 2\\mu^s\\mathbf{E}\\right)\\mathbf{F}^T, \\qquad \\mathbf{S}^s = \\lambda^s(\\operatorname{tr}\\mathbf{E})\\,\\mathbf{I} + 2\\mu^s\\mathbf{E}.$$"}</Equation>
      <p style={prose}>
        ρˢ is the density of the undeformed structure. Its elasticity is given by the Poisson ratio νˢ (νˢ &lt; ½ for a compressible structure) and the Young modulus E, or equivalently by the Lamé coefficients λˢ and μˢ, the shear modulus:
      </p>
      <Equation block>{"$$\\nu^s = \\frac{\\lambda^s}{2(\\lambda^s+\\mu^s)}, \\quad E = \\frac{\\mu^s(3\\lambda^s+2\\mu^s)}{\\lambda^s+\\mu^s}, \\quad \\mu^s = \\frac{E}{2(1+\\nu^s)}, \\quad \\lambda^s = \\frac{\\nu^s E}{(1+\\nu^s)(1-2\\nu^s)}.$$"}</Equation>

      <h4>Interaction conditions</h4>
      <p style={prose}>On the fluid-structure interface the stresses balance and the velocities agree, which is the no-slip condition for the flow (n is the unit normal on Γ⁰ₜ):</p>
      <Equation block>{"$$\\pmb{\\sigma}^f\\mathbf{n} = \\pmb{\\sigma}^s\\mathbf{n}, \\qquad \\mathbf{v}^f = \\mathbf{v}^s \\qquad \\text{on } \\Gamma^0_t.$$"}</Equation>

      <h4>Choice of material parameters</h4>
      <p style={prose}>
        The flow should stay laminar, which means small Reynolds numbers, yet still deform the structure significantly. A typical fluid for such experiments is glycerine. The structure has a finite thickness, to avoid high aspect ratios in the geometry, so it must be soft enough to deform: rubber-like materials such as polybutadiene and polypropylene fit. The tables give an overview of solid and fluid properties.
      </p>
      <div className="stack" style={{ gap: 24 }}>
        <DataTable
          columns={[
            { id: "material", header: "Solid", render: row => row.material },
            { id: "density", header: "ρˢ [kg/m³]", align: "right", render: row => row.density },
            { id: "poisson", header: "νˢ", align: "right", render: row => row.poisson },
            { id: "young", header: "E [10⁶ kg/(m s²)]", align: "right", render: row => row.young },
            { id: "shear", header: "μˢ [10⁶ kg/(m s²)]", align: "right", render: row => row.shear }
          ]}
          rows={fsiSolidMaterials}
          getRowKey={row => row.material}
        />
        <DataTable
          columns={[
            { id: "material", header: "Fluid", render: row => row.material },
            { id: "density", header: "ρᶠ [kg/m³]", align: "right", render: row => row.density },
            { id: "kinematic", header: "νᶠ [10⁻⁶ m²/s]", align: "right", render: row => row.kinematic },
            { id: "dynamic", header: "μᶠ [10⁻³ kg/(m s)]", align: "right", render: row => row.dynamic }
          ]}
          rows={fsiFluidMaterials}
          getRowKey={row => row.material}
        />
      </div>

      <h3 style={{ marginTop: 40 }}>The test cases</h3>
      <p style={prose}>
        Nine tests share the geometry. The CFD tests treat the flag as rigid, either with very large structural parameters (ρˢ = 10⁶ kg/m³, μˢ = 10¹² kg/(m s²)) or by solving the flow alone with a fixed flag, and validate the fluid solver. The CSM tests load the elastic bar with gravity alone, without fluid, and validate the structural solver. The FSI tests couple both: FSI1 reaches a steady state, while FSI2 and FSI3 become periodic and are the actual benchmark. Densities are in 10³ kg/m³, μˢ in 10⁶ kg/(m s²), νᶠ in 10⁻³ m²/s, Ū in m/s and g in m/s².
      </p>
      <DataTable
        columns={[
          { id: "id", header: "Test", render: row => row.id },
          { id: "structure", header: "Structure", render: row => row.structure },
          { id: "rhoS", header: "ρˢ", align: "right", render: row => row.rhoS },
          { id: "nuS", header: "νˢ", align: "right", render: row => row.nuS },
          { id: "muS", header: "μˢ", align: "right", render: row => row.muS },
          { id: "rhoF", header: "ρᶠ", align: "right", render: row => row.rhoF },
          { id: "nuF", header: "νᶠ", align: "right", render: row => row.nuF },
          { id: "u", header: "Ū", align: "right", render: row => row.meanVelocity },
          { id: "g", header: "g", align: "right", render: row => row.gravity },
          { id: "re", header: "Re", align: "right", render: row => row.reynolds },
          { id: "solution", header: "Solution", render: row => row.solution }
        ]}
        rows={fsiTestCases}
        getRowKey={row => row.id}
      />
      <p style={{ ...prose, marginTop: 24 }}>The published non-dimensional parameters are the density ratio β, the Young modulus of the structure for the CSM tests, and the aeroelastic number Ae for the FSI tests:</p>
      <Equation block>{"$$\\beta = \\frac{\\varrho^s}{\\varrho^f}, \\qquad \\mathrm{Ae} = \\frac{E^s}{\\varrho^f\\bar{U}^2}.$$"}</Equation>
      <DataTable
        columns={[
          { id: "id", header: "Test", render: row => row.id },
          { id: "beta", header: "β", align: "right", render: row => row.beta },
          { id: "young", header: "Eˢ [kg/(m s²)]", align: "right", render: row => row.young },
          { id: "ae", header: "Ae", align: "right", render: row => row.ae }
        ]}
        rows={fsiNondimensionalRows}
        getRowKey={row => row.id}
      />

      <h3 style={{ marginTop: 40 }}>Boundary and initial conditions</h3>
      <p style={prose}>A parabolic velocity profile with mean velocity Ū and maximum 1.5 Ū is prescribed at the left inflow:</p>
      <Equation block>{"$$v^f(0,y) = 1.5\\,\\bar{U}\\,\\frac{y(H-y)}{(H/2)^2} = 1.5\\,\\bar{U}\\,\\frac{4.0}{0.1681}\\,y\\,(0.41-y).$$"}</Equation>
      <p style={prose}>
        The outflow condition can be chosen by the user, for example stress-free or do-nothing. It effectively fixes a reference value for the pressure. With an incompressible fluid that value would be arbitrary, but it influences the stress, and so the deformation, of a compressible structure; the benchmark therefore sets the reference pressure at the outflow to zero mean value. No-slip holds on the top and bottom walls, the cylinder, and the fluid-structure interface Γ⁰ₜ.
      </p>
      <p style={prose}>For the non-steady tests the suggested start is a smooth increase of the inflow profile in time:</p>
      <Equation block>{"$$v^f(t,0,y) = \\begin{cases} v^f(0,y)\\,\\dfrac{1-\\cos\\left(\\frac{\\pi}{2}t\\right)}{2} & \\text{if } t < 2.0,\\\\[4pt] v^f(0,y) & \\text{otherwise.}\\end{cases}$$"}</Equation>

      <h3 style={{ marginTop: 40 }}>Measured quantities</h3>
      <p style={prose}>
        Self-induced periodic oscillations develop in the flow and the structure. They are compared for fully developed flow, over one full period of the oscillation of point A(t). The quantities of interest are:
      </p>
      <ul style={{ ...prose, paddingLeft: 22 }}>
        <li>the displacement of the end of the flag, at point A(t): u_x(A) and u_y(A);</li>
        <li>the drag and lift exerted by the fluid on the whole submerged body, cylinder and flag together;</li>
        <li>the pressure difference Δp<sup>AB</sup> = p<sup>B</sup> − p<sup>A(t)</sup> between the two control points (proposed by the benchmark, but not reported in the reference tables).</li>
      </ul>
      <p style={prose}>
        The forces are integrated over the path S = S₁ ∪ S₂, the part of the circle in contact with the fluid (S₁) plus the fluid-facing boundary of the flag (S₂), with n the outer unit normal with respect to the fluid domain. Up to numerical effects, all of these evaluations lead asymptotically to the same result:
      </p>
      <Equation block>{"$$\\begin{aligned}(F_D, F_L) = \\int_S \\pmb{\\sigma}\\mathbf{n}\\,dS &= \\int_{S_1}\\pmb{\\sigma}^f\\mathbf{n}\\,dS + \\int_{S_2}\\pmb{\\sigma}^f\\mathbf{n}\\,dS = \\int_{S_1}\\pmb{\\sigma}^f\\mathbf{n}\\,dS + \\int_{S_2}\\pmb{\\sigma}^s\\mathbf{n}\\,dS\\\\ &= \\int_{S_1}\\pmb{\\sigma}^f\\mathbf{n}\\,dS + \\int_{S_2}\\tfrac{1}{2}\\left(\\pmb{\\sigma}^s + \\pmb{\\sigma}^f\\right)\\mathbf{n}\\,dS = \\int_{S_0}\\pmb{\\sigma}\\mathbf{n}\\,dS.\\end{aligned}$$"}</Equation>
      <Figure src={fsiIntegrationPathAsset} alt="Integration path S1 around the cylinder and S2 along the flag" caption="Integration path S = S₁ ∪ S₂ for the forces; S₀ is the alternative path around the cylinder." />
      <p style={prose}>
        A periodic quantity is reported as its mean value, amplitude and frequency, written <em>mean ± amplitude [frequency]</em>. Mean and amplitude come from the maximum and minimum over the last period of the oscillation. The frequency is 1/T for the period T, or the lowest significant frequency of a Fourier analysis. A plot of the quantities over the period should be provided as well.
      </p>
      <Equation block>{"$$\\text{mean} = \\tfrac{1}{2}(\\max + \\min), \\qquad \\text{amplitude} = \\tfrac{1}{2}(\\max - \\min), \\qquad \\text{frequency} = \\frac{1}{T}.$$"}</Equation>

      <h3 style={{ marginTop: 40 }}>Discretization</h3>
      <p style={prose}>
        All reference results were computed with a fully implicit, monolithic ALE finite element method and a fully coupled multigrid solver (Hron and Turek 2006). The tests were run on a sequence of refined meshes with various time steps; the sequences show that the reference results are almost grid-independent. The FSI tests use the mesh below. The CFD and CSM tests use their own meshes, whose element counts are listed with their results.
      </p>
      <Figure src={fsiCoarseMeshAsset} alt="Coarse mesh of the channel around the cylinder and the flag" caption="Coarse mesh (level 0) of the FSI tests." />
      <DataTable
        columns={[
          { id: "level", header: "Level", render: row => row.level },
          { id: "refine", header: "# refinements", align: "right", render: row => row.refine },
          { id: "nel", header: "# el", align: "right", render: row => count(row.nel) },
          { id: "ndof", header: "# dof", align: "right", render: row => count(row.ndof) }
        ]}
        rows={fsiMeshRows}
        getRowKey={row => row.level}
      />
    </Section>
  );
}

function ResultsTab() {
  const fsi2Published = fsiFsi2Rows.find(row => row.dt === "0.0005" && row.level === "4+0")!;
  const fsi3Published = fsiFsi3Rows.find(row => row.dt === "0.0005" && row.level === "4+0")!;
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ gap: 36 }}>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          The full FSI tests couple the flow and the elastic flag. FSI1 reaches a steady state; FSI2 and FSI3 develop self-induced periodic oscillations and are the benchmark proper. Periodic results are given as <em>mean ± amplitude [frequency]</em>, displacements in m, forces in N.
        </p>
        <ParameterTables family="FSI" />

        <CaseHeading label="FSI1">Steady, Re = 20</CaseHeading>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          At Ū = 0.2 m/s the flag settles into a small steady deflection. Beyond level 4 the drag and lift change by less than 0.1%.
        </p>
        <TableBlock title="Displacement of A, drag and lift by mesh level">
          <Fsi1Table />
        </TableBlock>

        <CaseHeading label="FSI2">Periodic, Re = 100, heavy flag</CaseHeading>
        <div style={{ ...prose, maxWidth: 900 }}>
          <p style={{ marginTop: 0 }}>
            Ū = 1 m/s with a structure ten times denser than the fluid (β = 10). The flag swings through a large-amplitude oscillation: the tip moves by ±8 cm vertically at about 1.93 Hz, while the in-line quantities, u_x(A) and drag, oscillate at twice that frequency.
          </p>
          <p style={{ marginBottom: 0 }}>
            The reference file ref_fsi2.point (level 4, Δt = 0.0005) covers t = 10 to 14.62 s. Evaluated over its last full period, it reproduces the published level 4 row of that time step.
          </p>
        </div>
        <TableBlock title="Reference time histories">
          <ComparisonPanel specs={fsiFsi2PlotSpecs} defaultMetric="uy" />
        </TableBlock>
        <TableBlock title="The reference file against the published values">
          <RecomputedTable run="fsi2" published={fsi2Published} publishedLabel="Published, level 4, Δt = 0.0005" />
        </TableBlock>
        <TableBlock title="Results by time step and mesh level">
          <PeriodicTable rows={fsiFsi2Rows} columns={["ux", "uy", "drag", "lift"]} />
        </TableBlock>

        <CaseHeading label="FSI3">Periodic, Re = 200, stiff flag</CaseHeading>
        <div style={{ ...prose, maxWidth: 900 }}>
          <p style={{ marginTop: 0 }}>
            Ū = 2 m/s with a stiffer structure (μˢ = 2 × 10⁶ kg/(m s²)) of the fluid's density (β = 1). The oscillation is faster and smaller than in FSI2: the tip moves by about ±3.5 cm at about 5.47 Hz.
          </p>
          <p style={{ marginBottom: 0 }}>
            The reference file ref_fsi3.point covers t = 5 to 6.44 s and records a time step of 0.00025. Its last full period nevertheless reproduces the published level 4 row for Δt = 0.0005 (drag 460.2 ± 27.47), not the one for Δt = 0.00025 (460.5 ± 27.74). The file is published as recorded.
          </p>
        </div>
        <TableBlock title="Reference time histories">
          <ComparisonPanel specs={fsiFsi3PlotSpecs} defaultMetric="uy" />
        </TableBlock>
        <TableBlock title="The reference file against the published values">
          <RecomputedTable run="fsi3" published={fsi3Published} publishedLabel="Published, level 4, Δt = 0.0005" />
        </TableBlock>
        <TableBlock title="Results by time step and mesh level">
          <PeriodicTable rows={fsiFsi3Rows} columns={["ux", "uy", "drag", "lift"]} />
        </TableBlock>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          In both periodic tests the frequencies of levels 3 and 4 agree to the published precision, while the drag and lift amplitudes still change by 1–3% between those two levels.
        </p>
      </div>
    </Section>
  );
}

function CfdTestsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ gap: 36 }}>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          With the flag held rigid, three tests check the fluid solver alone: CFD1 and CFD2 are steady at Re = 20 and 100, CFD3 is periodic at Re = 200. Drag and lift act on the cylinder and the flag together. These tests use their own mesh, so the element counts differ from those of the FSI mesh.
        </p>
        <ParameterTables family="CFD" />

        <CaseHeading label="CFD1">Steady, Re = 20</CaseHeading>
        <TableBlock title="Drag and lift by mesh level">
          <SteadyForceTable rows={fsiCfd1Rows} />
        </TableBlock>

        <CaseHeading label="CFD2">Steady, Re = 100</CaseHeading>
        <TableBlock title="Drag and lift by mesh level">
          <SteadyForceTable rows={fsiCfd2Rows} />
        </TableBlock>

        <CaseHeading label="CFD3">Periodic, Re = 200</CaseHeading>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          The rigid configuration sheds vortices periodically at about 4.39 Hz. Only the plots of the original study survive for this test; no time series was published, so they are shown as they were.
        </p>
        <TableBlock title="Drag and lift by time step and mesh level">
          <PeriodicTable rows={fsiCfd3Rows} columns={["drag", "lift"]} headers={{ ...PERIODIC_HEADERS, drag: "Drag [N]", lift: "Lift [N]" }} />
        </TableBlock>
        <div className="split">
          <Figure src={fsiCfd3LiftAsset} alt="CFD3 lift over time, three periods" caption="CFD3 lift on cylinder and flag (original plot)." />
          <Figure src={fsiCfd3DragAsset} alt="CFD3 drag over time, three periods" caption="CFD3 drag on cylinder and flag (original plot)." />
        </div>
      </div>
    </Section>
  );
}

function CsmTestsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ gap: 36 }}>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          The structural tests compute the elastic bar alone, without the surrounding fluid, loaded only by gravity g = 2 m/s² acting on the structure. CSM1 and CSM2 are steady solutions for two stiffnesses. CSM3 is time-dependent: the bar starts undeformed and swings under its own weight. Displacements of A are in 10⁻³ m. The fluid parameters are listed because the legacy table gives them, though no fluid is solved.
        </p>
        <ParameterTables family="CSM" />

        <CaseHeading label="CSM1">Steady, μˢ = 0.5 × 10⁶</CaseHeading>
        <TableBlock title="Displacement of A by mesh level">
          <SteadyDisplacementTable rows={fsiCsm1Rows} />
        </TableBlock>

        <CaseHeading label="CSM2">Steady, μˢ = 2.0 × 10⁶</CaseHeading>
        <TableBlock title="Displacement of A by mesh level">
          <SteadyDisplacementTable rows={fsiCsm2Rows} />
        </TableBlock>

        <CaseHeading label="CSM3">Time-dependent, μˢ = 0.5 × 10⁶</CaseHeading>
        <p style={{ ...prose, maxWidth: 900, margin: 0 }}>
          Released from rest, the bar swings at about 1.1 Hz between its undeformed position and roughly twice its steady CSM1 deflection. Choose a time step to see its histories on three mesh levels; at plot resolution the levels lie on top of each other.
        </p>
        <TableBlock title="Displacement of A over time">
          <ComparisonPanel specs={fsiCsm3PlotSpecs} defaultMetric="uy" />
        </TableBlock>
        <TableBlock title="Displacement of A by time step and mesh level">
          <PeriodicTable rows={fsiCsm3Rows} columns={["ux", "uy"]} headers={{ ...PERIODIC_HEADERS, ux: "u_x(A) [10⁻³ m]", uy: "u_y(A) [10⁻³ m]" }} />
        </TableBlock>
      </div>
    </Section>
  );
}

function ReferenceDataTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 100 }}>
      <p style={prose}>
        The reference files are published as one bundle, fsi.zip. Each file is plain text with twelve whitespace-separated columns, one row per time step, in SI units. The columns below are documented; the others (3, 4, 9, 10) are internal to the solver output and kept as they are. The total drag and lift on the body are the sums of the beam and cylinder parts: drag = column 5 + column 7, lift = column 6 + column 8.
      </p>
      <div className="stack" style={{ marginTop: 32, gap: 32 }}>
        <DataTable
          columns={[
            { id: "column", header: "Column", align: "right", render: row => row.column },
            { id: "quantity", header: "Quantity", render: row => row.quantity }
          ]}
          rows={fsiReferenceColumns}
          getRowKey={row => row.column}
        />
        <DownloadTable items={fsiDownloads} />
        <div>
          <h3>What the bundle contains</h3>
          <DataTable
            columns={[
              { id: "file", header: "File", render: row => row.file },
              { id: "run", header: "Test", render: row => row.run },
              { id: "level", header: "Level", align: "right", render: row => row.level },
              { id: "dt", header: "Δt [s]", align: "right", render: row => row.dt },
              { id: "detail", header: "Contents", render: row => row.detail }
            ]}
            rows={fsiBundleContents}
            getRowKey={row => row.file}
          />
        </div>
      </div>
    </Section>
  );
}

export function FsiBenchmarkPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "cfd-tests", label: "CFD Tests" },
    { id: "csm-tests", label: "CSM Tests" },
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
            <Icon name="arrow_back" size={14} /> Catalogue / Fluid-Structure / FSI
          </button>
          <div className="split split-hero">
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">FSI</Chip>
                <Chip>Fluid-Structure</Chip>
                <Chip>2D</Chip>
                <Chip>Core benchmarks</Chip>
              </div>
              <h1 className="display display-md" style={{ margin: "0 0 12px" }}>
                Fluid-Structure <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>Interaction</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                An elastic flag behind a cylinder in laminar channel flow: self-induced oscillations of the structure, compared through the displacement of its tip, drag and lift.
              </p>
            </div>
            <div className="kpi-grid">
              <KpiBox label="Tests" value="9" />
              <KpiBox label="Re" value="20–200" />
              <KpiBox label="Mesh levels" value="0–7" />
              <KpiBox label="Periodic" value="FSI2 / FSI3" />
              <KpiBox label="Flag l / h" value="0.35 / 0.02" />
              <KpiBox label="Material" value="St. Venant-Kirchhoff" />
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
      {tab === "cfd-tests" && <CfdTestsTab />}
      {tab === "csm-tests" && <CsmTestsTab />}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
