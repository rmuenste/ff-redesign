import type { DownloadItem } from "../components";
import { benchmarkAssetPath } from "./assets";
import type { PlotSpec, SeriesGroup } from "./types";

export type Fac3MetricId = "drag" | "lift";

function fac3PlotPath(metric: Fac3MetricId) {
  return benchmarkAssetPath("fac3", `plots/${metric}.json`);
}

const featflowerReferenceGroup: SeriesGroup = {
  id: "featflower",
  label: "FeatFloWer",
  // FAC live plots are the finest FeatFloWer reference time series. Cross-code
  // comparison remains table-based, matching the Angular page.
  kind: "reference",
  color: "var(--primary)",
  source: { kind: "single-trace", asset: { path: fac3PlotPath("drag") } },
  variantStrategy: { kind: "single-trace" },
  highlight: true
};

function fac3SeriesGroup(metric: Fac3MetricId): SeriesGroup {
  return {
    ...featflowerReferenceGroup,
    source: { kind: "single-trace", asset: { path: fac3PlotPath(metric) } }
  };
}

export const fac3PlotSpecs: Record<Fac3MetricId, PlotSpec> = {
  drag: {
    id: "fac3-drag",
    title: "Drag coefficient",
    metric: "drag",
    comparisonAxis: "code",
    seriesGroups: [fac3SeriesGroup("drag")],
    defaultSeriesGroupIds: ["featflower"],
    compareModes: ["overlay"],
    defaultCompareMode: "overlay",
    preserveSourceColorsWhenSingleGroup: false,
    axisLabels: { x: "Time [s]", y: "Drag coefficient" },
    axisRanges: { x: [0, 8], y: [-0.5, 3.5] }
  },
  lift: {
    id: "fac3-lift",
    title: "Lift coefficient",
    metric: "lift",
    comparisonAxis: "code",
    seriesGroups: [fac3SeriesGroup("lift")],
    defaultSeriesGroupIds: ["featflower"],
    compareModes: ["overlay"],
    defaultCompareMode: "overlay",
    preserveSourceColorsWhenSingleGroup: false,
    axisLabels: { x: "Time [s]", y: "Lift coefficient" },
    axisRanges: { x: [0, 8], y: [-0.015, 0.005] }
  }
};

export const fac3GeometryAsset = benchmarkAssetPath("fac3", "media/fac-geometry.png");
export const fac3MeshAsset = benchmarkAssetPath("fac3", "media/base-mesh.png");
export const fac3VideoAsset = benchmarkAssetPath("fac3", "media/fac3d.mp4");

export const fac3Downloads: DownloadItem[] = [
  {
    label: "BenchValues.zip",
    href: benchmarkAssetPath("fac3", "downloads/BenchValues.zip"),
    description: "Reference time series (BenchValues.txt) with Time, Drag, Lift, and Z-Force columns"
  }
];

export interface Fac3DofRow {
  level: string;
  cells: string;
  name: string;
  dofu: number;
  dofp: number;
  doft: number;
}

export const fac3DofRows: Fac3DofRow[] = [
  { level: "", name: "CFX", cells: "", dofu: 21828, dofp: 7276, doft: 29104 },
  { level: "L1", name: "OpenFOAM", cells: "6144", dofu: 18423, dofp: 6144, doft: 24567 },
  { level: "", name: "FeatFlow", cells: "", dofu: 174624, dofp: 24576, doft: 199200 },
  { level: "", name: "CFX", cells: "", dofu: 160776, dofp: 53592, doft: 214368 },
  { level: "L2", name: "OpenFOAM", cells: "49152", dofu: 147456, dofp: 49152, doft: 196608 },
  { level: "", name: "FeatFlow", cells: "", dofu: 1286208, dofp: 196608, doft: 1482816 },
  { level: "", name: "CFX", cells: "", dofu: 1232400, dofp: 410800, doft: 1643200 },
  { level: "L3", name: "OpenFOAM", cells: "393216", dofu: 1179648, dofp: 393216, doft: 1572864 },
  { level: "", name: "FeatFlow", cells: "", dofu: 9859200, dofp: 1572864, doft: 11432064 },
  { level: "", name: "CFX", cells: "", dofu: 9647136, dofp: 3215712, doft: 12862848 },
  { level: "L4", name: "OpenFOAM", cells: "9437184", dofu: 9437184, dofp: 3145728, doft: 12582912 },
  { level: "", name: "FeatFlow", cells: "", dofu: 77177104, dofp: 12582912, doft: 89760016 }
];

export interface Fac3SteadyComparisonRow {
  numCells: string;
  name: string;
  drag: number;
  lift: number;
  errDrag: number;
  errLift: number;
}

export const fac3SteadyComparisonRows: Fac3SteadyComparisonRow[] = [
  { numCells: "L1", name: "CFX", drag: 6.0675, lift: 0.01255, errDrag: 1.91, errLift: 33 },
  { numCells: "6144", name: "OpenFOAM", drag: 6.13408, lift: 0.01734, errDrag: 0.83, errLift: 84 },
  { numCells: "", name: "FeatFlow", drag: 6.13973, lift: 0.00956, errDrag: 0.74, errLift: 1.8 },
  { numCells: "L2", name: "CFX", drag: 6.13453, lift: 0.00817, errDrag: 0.82, errLift: 14 },
  { numCells: "49152", name: "OpenFOAM", drag: 6.19702, lift: 0.01099, errDrag: 0.19, errLift: 17 },
  { numCells: "", name: "FeatFlow", drag: 6.17433, lift: 0.009381, errDrag: 0.18, errLift: 0.21 },
  { numCells: "L3", name: "CFX", drag: 6.17481, lift: 0.00928, errDrag: 0.17, errLift: 1.3 },
  { numCells: "393216", name: "OpenFOAM", drag: 6.19362, lift: 0.01001, errDrag: 0.13, errLift: 6.5 },
  { numCells: "", name: "FeatFlow", drag: 6.1826, lift: 0.009387, errDrag: 0.04, errLift: 0.15 },
  { numCells: "L4", name: "CFX", drag: 6.18287, lift: 0.009387, errDrag: 0.04, errLift: 0.15 },
  { numCells: "3145728", name: "OpenFOAM", drag: 6.18931, lift: 0.00973, errDrag: 0.06, errLift: 3.5 },
  { numCells: "", name: "FeatFlow", drag: 6.18465, lift: 0.009397, errDrag: 0.01, errLift: 0.05 }
];

export interface Fac3DragTimeRow {
  case: string;
  cells: number;
  dragmax: number;
  liftmax: number;
  liftmin: number;
  tstep: number;
  time: string;
}

export const fac3DragTimeRows = {
  featflow: [
    { case: "FFL1", cells: 6144, dragmax: 3.2207, liftmax: 0.0027, liftmin: -0.0095, tstep: 0.01, time: "3220 x 2" },
    { case: "FFL2", cells: 49152, dragmax: 3.2877, liftmax: 0.0028, liftmin: -0.010892, tstep: 0.01, time: "17300 x 4" },
    { case: "FFL3", cells: 393216, dragmax: 3.2963, liftmax: 0.0028, liftmin: -0.010992, tstep: 0.01, time: "35550 x 24" },
    { case: "FFL4", cells: 3145728, dragmax: 3.2978, liftmax: 0.0028, liftmin: -0.010999, tstep: 0.005, time: "214473 x 48" }
  ],
  openfoam: [
    { case: "OFL2", cells: 49152, dragmax: 3.33963, liftmax: 0.0029, liftmin: -0.0128, tstep: 0.0025, time: "4850" },
    { case: "OFL3", cells: 393216, dragmax: 3.3233, liftmax: 0.0028, liftmin: -0.0118, tstep: 0.001, time: "76300 x 4" },
    { case: "OFL4", cells: 3145728, dragmax: 3.3038, liftmax: 0.0012, liftmin: -0.0112, tstep: 0.005, time: "593500 x 24" }
  ],
  cfx: [
    { case: "CFXL2", cells: 49152, dragmax: 3.3336, liftmax: 0.0028, liftmin: -0.0106, tstep: 0.01, time: "22320" },
    { case: "CFXL3", cells: 393216, dragmax: 3.3334, liftmax: 0.0028, liftmin: -0.0118, tstep: 0.005, time: "61530 x 4" },
    { case: "CFXL4", cells: 3145728, dragmax: 3.3084, liftmax: 0.0028, liftmin: -0.0113, tstep: 0.005, time: "115300 x 24" }
  ],
  comparison: [
    { case: "FFL2", cells: 49152, dragmax: 3.2877, liftmax: 0.0028, liftmin: -0.010892, tstep: 0.01, time: "17300 x 4" },
    { case: "OFL4", cells: 3145728, dragmax: 3.3038, liftmax: 0.0012, liftmin: -0.0112, tstep: 0.005, time: "593500 x 24" },
    { case: "CFXL4", cells: 3145728, dragmax: 3.3084, liftmax: 0.0028, liftmin: -0.0113, tstep: 0.005, time: "115300 x 24" }
  ]
} satisfies Record<string, Fac3DragTimeRow[]>;

export interface Fac3ErrorRow {
  name: string;
  errcdmax: number;
  errclmin: number;
  errl2cd: number;
  errl2cl: number;
  errlinfcd: number;
  errlinfcl: number;
}

export const fac3ErrorRows = {
  featflow: [
    { name: "FFL1", errcdmax: 2.34, errclmin: 13.6, errl2cd: 2.09, errl2cl: 13.8, errlinfcd: 7.71, errlinfcl: 0.152 },
    { name: "FFL2", errcdmax: 0.31, errclmin: 0.91, errl2cd: 0.29, errl2cl: 1.05, errlinfcd: 1.01, errlinfcl: 0.013 },
    { name: "FFL3", errcdmax: 0.05, errclmin: 0.09, errl2cd: 0.06, errl2cl: 0.28, errlinfcd: 0.23, errlinfcl: 0.003 }
  ],
  openfoam: [
    { name: "OFL2", errcdmax: 3.0, errclmin: 16, errl2cd: 2.61, errl2cl: 14.5, errlinfcd: 10.0, errlinfcl: 0.21 },
    { name: "OFL3", errcdmax: 0.8, errclmin: 7.3, errl2cd: 0.67, errl2cl: 5.91, errlinfcd: 2.56, errlinfcl: 0.08 },
    { name: "OFL4", errcdmax: 0.2, errclmin: 1.8, errl2cd: 0.16, errl2cl: 1.47, errlinfcd: 0.61, errlinfcl: 0.02 }
  ],
  cfx: [
    { name: "CFXL2", errcdmax: 1.1, errclmin: 3.63, errl2cd: 1.52, errl2cl: 7.81, errlinfcd: 5.31, errlinfcl: 0.1 },
    { name: "CFXL3", errcdmax: 1.1, errclmin: 7.27, errl2cd: 0.98, errl2cl: 6.31, errlinfcd: 3.75, errlinfcl: 0.1 },
    { name: "CFXL4", errcdmax: 0.3, errclmin: 2.73, errl2cd: 0.29, errl2cl: 2.24, errlinfcd: 1.2, errlinfcl: 0.03 }
  ],
  comparison: [
    { name: "FFL2", errcdmax: 0.31, errclmin: 0.91, errl2cd: 0.29, errl2cl: 1.05, errlinfcd: 1.01, errlinfcl: 0.013 },
    { name: "OFL4", errcdmax: 0.2, errclmin: 1.8, errl2cd: 0.16, errl2cl: 1.47, errlinfcd: 0.61, errlinfcl: 0.02 },
    { name: "CFXL4", errcdmax: 0.3, errclmin: 2.73, errl2cd: 0.29, errl2cl: 2.24, errlinfcd: 1.2, errlinfcl: 0.03 }
  ]
} satisfies Record<string, Fac3ErrorRow[]>;

export const fac3ReferenceRows = [
  { column: 1, quantity: "Time" },
  { column: 2, quantity: "Drag" },
  { column: 3, quantity: "Lift" },
  { column: 4, quantity: "Z-Force" }
];

export const fac3Bibliography = [
  { id: "schaefer-turek-1996", text: "M. Schaefer and S. Turek, Benchmark computations of laminar flow around a cylinder, Flow Simulation with High-Performance Computers II, DFG priority research program results 1993-1995, Notes Numer. Fluid Mech., Vieweg, Wiesbaden, 1996." },
  { id: "braack-richter-2006", text: "M. Braack and T. Richter, Solutions of 3D Navier-Stokes benchmark problems with Adaptive Finite Elements, Computers and Fluids, 2006." },
  { id: "john-2002", text: "V. John, Higher order finite element methods and multigrid solvers in a benchmark problem for 3D Navier-Stokes equations, Int. J. Numer. Math. Fluids, 2002." },
  { id: "john-2006", text: "V. John, On the efficiency of linearization schemes and coupled multigrid methods in the simulation of a 3D flow around a cylinder, Int. J. Numer. Math. Fluids, 2006." },
  { id: "ferziger-peric-2002", text: "J. H. Ferziger and M. Peric, Computational Methods for Fluid Dynamics, 3rd ed., Springer, 2002." },
  { id: "openfoam-guide", text: "OpenFOAM User's guide (version 1.6), 2009." },
  { id: "cfx-theory", text: "ANSYS CFX-Solver, Release 10.0: Theory." }
];
