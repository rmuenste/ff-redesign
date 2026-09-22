import type { DownloadItem, ReferenceItem } from "../components";
import { benchmarkAssetPath } from "./assets";
import generated from "./generated/fsi.json";
import type { PlotSpec, SeriesGroup } from "./types";

// The FSI benchmark of Turek and Hron, migrated from the featflow.de pages
// (en/benchmarks/cfdbenchmarking/fsi_benchmark*). Every table below is published
// data, extracted from the visible tables of those pages; tables the pages kept
// inside HTML comments are not migrated. Plots and the last-period statistics in
// `fsiGenerated` come from scripts/convert-fsi-data.mjs.

const ID = "fsi";

export const fsiGenerated = generated;

// ---- Media ---------------------------------------------------------------------

export const fsiGeometryAsset = benchmarkAssetPath(ID, "media/geometry.jpg");
export const fsiStructureAsset = benchmarkAssetPath(ID, "media/structure.jpg");
export const fsiIntegrationPathAsset = benchmarkAssetPath(ID, "media/integration-path.jpg");
export const fsiCoarseMeshAsset = benchmarkAssetPath(ID, "media/coarse-mesh.png");
export const fsiCfd3DragAsset = benchmarkAssetPath(ID, "media/cfd3-drag.png");
export const fsiCfd3LiftAsset = benchmarkAssetPath(ID, "media/cfd3-lift.png");

// ---- Definition ----------------------------------------------------------------

export interface FsiGeometryRow {
  quantity: string;
  symbol: string;
  value: string;
}

// The legacy table lists B at (0.2, 0.2), the cylinder centre; its own text and
// structure figure place B at the upstream end of the cylinder, (0.15, 0.2), as
// in Turek and Hron (2006). The text is followed here.
export const fsiGeometryRows: FsiGeometryRow[] = [
  { quantity: "Channel length", symbol: "L", value: "2.5" },
  { quantity: "Channel height", symbol: "H", value: "0.41" },
  { quantity: "Cylinder centre", symbol: "C", value: "(0.2, 0.2)" },
  { quantity: "Cylinder radius", symbol: "r", value: "0.05" },
  { quantity: "Elastic structure length", symbol: "l", value: "0.35" },
  { quantity: "Elastic structure thickness", symbol: "h", value: "0.02" },
  { quantity: "Control point (at t = 0), end of the structure", symbol: "A", value: "(0.6, 0.2)" },
  { quantity: "Control point, upstream end of the cylinder", symbol: "B", value: "(0.15, 0.2)" }
];

export interface FsiSolidMaterialRow {
  material: string;
  density: string;
  poisson: string;
  young: string;
  shear: string;
}

export const fsiSolidMaterials: FsiSolidMaterialRow[] = [
  { material: "Polybutadiene", density: "910", poisson: "0.50", young: "1.6", shear: "0.53" },
  { material: "Polyurethane", density: "1200", poisson: "0.50", young: "25", shear: "8.3" },
  { material: "Polypropylene", density: "1100", poisson: "0.42", young: "900", shear: "317" },
  { material: "PVC", density: "1400", poisson: "0.42", young: "1500", shear: "528" },
  { material: "Steel", density: "7800", poisson: "0.29", young: "210000", shear: "81400" },
  { material: "Cork", density: "180", poisson: "0.25", young: "32", shear: "12.8" }
];

export interface FsiFluidMaterialRow {
  material: string;
  density: string;
  kinematic: string;
  dynamic: string;
}

// The legacy page shows this table under the solid table's header; its LaTeX
// source gives the real columns: density, kinematic and dynamic viscosity.
export const fsiFluidMaterials: FsiFluidMaterialRow[] = [
  { material: "Air", density: "1.23", kinematic: "0.015", dynamic: "0.018" },
  { material: "Acetone", density: "790", kinematic: "0.405", dynamic: "0.32" },
  { material: "Ethyl alcohol", density: "790", kinematic: "1.4", dynamic: "1.1" },
  { material: "Vegetable oil", density: "920", kinematic: "76.1", dynamic: "70" },
  { material: "Water", density: "1000", kinematic: "1.14", dynamic: "1.14" },
  { material: "Blood", density: "1035", kinematic: "3–4", dynamic: "3–4" },
  { material: "Glycerine", density: "1260", kinematic: "1127", dynamic: "1420" },
  { material: "Honey", density: "1420", kinematic: "7042", dynamic: "10000" },
  { material: "Mercury", density: "13594", kinematic: "0.0114", dynamic: "1.55" }
];

export interface FsiTestCase {
  id: string;
  family: "CFD" | "CSM" | "FSI";
  structure: string;
  rhoS: string;
  nuS: string;
  muS: string;
  rhoF: string;
  nuF: string;
  meanVelocity: string;
  gravity: string;
  reynolds: string;
  solution: string;
}

/**
 * All nine tests in one table. Densities in 10^3 kg/m^3, shear modulus in
 * 10^6 kg/(m s^2), kinematic viscosity in 10^-3 m^2/s, velocity in m/s,
 * gravity in m/s^2. The CFD tests treat the structure as rigid.
 */
export const fsiTestCases: FsiTestCase[] = [
  { id: "CFD1", family: "CFD", structure: "rigid", rhoS: "–", nuS: "–", muS: "–", rhoF: "1", nuF: "1", meanVelocity: "0.2", gravity: "0", reynolds: "20", solution: "steady" },
  { id: "CFD2", family: "CFD", structure: "rigid", rhoS: "–", nuS: "–", muS: "–", rhoF: "1", nuF: "1", meanVelocity: "1", gravity: "0", reynolds: "100", solution: "steady" },
  { id: "CFD3", family: "CFD", structure: "rigid", rhoS: "–", nuS: "–", muS: "–", rhoF: "1", nuF: "1", meanVelocity: "2", gravity: "0", reynolds: "200", solution: "periodic" },
  { id: "CSM1", family: "CSM", structure: "elastic, no fluid", rhoS: "1", nuS: "0.4", muS: "0.5", rhoF: "1", nuF: "1", meanVelocity: "0", gravity: "2", reynolds: "0", solution: "steady" },
  { id: "CSM2", family: "CSM", structure: "elastic, no fluid", rhoS: "1", nuS: "0.4", muS: "2.0", rhoF: "1", nuF: "1", meanVelocity: "0", gravity: "2", reynolds: "0", solution: "steady" },
  { id: "CSM3", family: "CSM", structure: "elastic, no fluid", rhoS: "1", nuS: "0.4", muS: "0.5", rhoF: "1", nuF: "1", meanVelocity: "0", gravity: "2", reynolds: "0", solution: "time-dependent from rest" },
  { id: "FSI1", family: "FSI", structure: "elastic", rhoS: "1", nuS: "0.4", muS: "0.5", rhoF: "1", nuF: "1", meanVelocity: "0.2", gravity: "0", reynolds: "20", solution: "steady" },
  { id: "FSI2", family: "FSI", structure: "elastic", rhoS: "10", nuS: "0.4", muS: "0.5", rhoF: "1", nuF: "1", meanVelocity: "1", gravity: "0", reynolds: "100", solution: "periodic" },
  { id: "FSI3", family: "FSI", structure: "elastic", rhoS: "1", nuS: "0.4", muS: "2.0", rhoF: "1", nuF: "1", meanVelocity: "2", gravity: "0", reynolds: "200", solution: "periodic" }
];

/** Non-dimensional parameters as published: density ratio, Young modulus, Aeroelastic number. */
export const fsiNondimensionalRows = [
  { id: "CSM1", beta: "1", young: "1.4 × 10⁶", ae: "–" },
  { id: "CSM2", beta: "1", young: "5.6 × 10⁶", ae: "–" },
  { id: "CSM3", beta: "1", young: "1.4 × 10⁶", ae: "–" },
  { id: "FSI1", beta: "1", young: "–", ae: "3.5 × 10⁴" },
  { id: "FSI2", beta: "10", young: "–", ae: "1.4 × 10³" },
  { id: "FSI3", beta: "1", young: "–", ae: "1.4 × 10³" }
];

// ---- Published result tables ---------------------------------------------------

export interface FsiMeshRow {
  level: string;
  refine: number;
  nel: number;
  ndof: number;
}

export interface FsiSteadyForceRow {
  level: string;
  nel: number;
  ndof: number;
  drag: number;
  lift: number;
}

/** CSM1 / CSM2: displacements of A in 10^-3 m. */
export interface FsiSteadyDisplacementRow {
  level: string;
  nel: number;
  ndof: number;
  ux: number;
  uy: number;
}

export interface FsiFsi1Row {
  level: string;
  nel: number;
  ndof: number;
  ux: string;
  uy: string;
  drag: string;
  lift: string;
}

/**
 * A periodic result, as the legacy tables print it: "mean ± amplitude [frequency]".
 * `dt` is the time step of the block the row belongs to.
 */
export interface FsiPeriodicRow {
  dt: string;
  level: string;
  nel: number;
  ndof: number;
  ux?: string;
  uy?: string;
  drag?: string;
  lift?: string;
}

export const fsiMeshRows: FsiMeshRow[] = [
  { level: "0+0", refine: 0, nel: 62, ndof: 1338 },
  { level: "1+0", refine: 1, nel: 248, ndof: 5032 },
  { level: "2+0", refine: 2, nel: 992, ndof: 19488 },
  { level: "3+0", refine: 3, nel: 3968, ndof: 76672 },
  { level: "4+0", refine: 4, nel: 15872, ndof: 304128 },
  { level: "5+0", refine: 5, nel: 63488, ndof: 1211392 },
  { level: "6+0", refine: 6, nel: 253952, ndof: 4835328 },
  { level: "7+0", refine: 7, nel: 1015808, ndof: 19320832 }
];

export const fsiCfd1Rows: FsiSteadyForceRow[] = [
  { level: "0+0", nel: 144, ndof: 3032, drag: 14.1635, lift: 1.15592 },
  { level: "1+0", nel: 576, ndof: 11536, drag: 14.2236, lift: 1.11747 },
  { level: "2+0", nel: 2304, ndof: 44960, drag: 14.273, lift: 1.11692 },
  { level: "3+0", nel: 9216, ndof: 177472, drag: 14.288, lift: 1.11852 },
  { level: "4+0", nel: 36864, ndof: 705152, drag: 14.2919, lift: 1.11896 },
  { level: "5+0", nel: 147456, ndof: 2811136, drag: 14.2927, lift: 1.11904 },
  { level: "5+1", nel: 150528, ndof: 2869504, drag: 14.2929, lift: 1.11906 },
  { level: "5+2", nel: 156672, ndof: 2986240, drag: 14.2929, lift: 1.11905 },
  { level: "5+3", nel: 168960, ndof: 3219712, drag: 14.2929, lift: 1.11905 },
  { level: "6+0", nel: 589824, ndof: 11225600, drag: 14.2929, lift: 1.11905 }
];

export const fsiCfd2Rows: FsiSteadyForceRow[] = [
  { level: "0+0", nel: 144, ndof: 3032, drag: 133.188, lift: 11.8522 },
  { level: "1+0", nel: 576, ndof: 11536, drag: 134.996, lift: 11.0739 },
  { level: "2+0", nel: 2304, ndof: 44960, drag: 136.355, lift: 10.5337 },
  { level: "3+0", nel: 9216, ndof: 177472, drag: 136.61, lift: 10.5303 },
  { level: "4+0", nel: 36864, ndof: 705152, drag: 136.678, lift: 10.5347 },
  { level: "5+0", nel: 147456, ndof: 2811136, drag: 136.696, lift: 10.5349 },
  { level: "5+1", nel: 150528, ndof: 2869504, drag: 136.7, lift: 10.5346 },
  { level: "5+2", nel: 156672, ndof: 2986240, drag: 136.701, lift: 10.5343 },
  { level: "5+3", nel: 168960, ndof: 3219712, drag: 136.701, lift: 10.534 },
  { level: "6+0", nel: 589824, ndof: 11225600, drag: 136.7, lift: 10.5343 }
];

export const fsiCfd3Rows: FsiPeriodicRow[] = [
  { dt: "0.01", level: "1+0", nel: 576, ndof: 11536, drag: "416.8 ± 3.3578 [4.3825]", lift: "-24.702 ± 342.38 [4.3825]" },
  { dt: "0.01", level: "2+0", nel: 2304, ndof: 44960, drag: "437.29 ± 5.3462 [4.3825]", lift: "-11.085 ± 429.88 [4.3825]" },
  { dt: "0.01", level: "3+0", nel: 9216, ndof: 177472, drag: "438.99 ± 5.4419 [4.3825]", lift: "-10.289 ± 433.09 [4.3825]" },
  { dt: "0.01", level: "4+0", nel: 36864, ndof: 705152, drag: "439.38 ± 5.4639 [4.3825]", lift: "-9.9868 ± 434.79 [4.3825]" },
  { dt: "0.005", level: "1+0", nel: 576, ndof: 11536, drag: "416.83 ± 3.4023 [4.3956]", lift: "-23.897 ± 346.72 [4.3956]" },
  { dt: "0.005", level: "2+0", nel: 2304, ndof: 44960, drag: "437.41 ± 5.5856 [4.3956]", lift: "-12.673 ± 434.74 [4.3956]" },
  { dt: "0.005", level: "3+0", nel: 9216, ndof: 177472, drag: "439.05 ± 5.5804 [4.3956]", lift: "-11.837 ± 436.17 [4.3956]" },
  { dt: "0.005", level: "4+0", nel: 36864, ndof: 705152, drag: "439.45 ± 5.6183 [4.3956]", lift: "-11.893 ± 437.81 [4.3956]" }
];

export const fsiCsm1Rows: FsiSteadyDisplacementRow[] = [
  { level: "2+0", nel: 320, ndof: 6468, ux: -7.17301, uy: -66.0263 },
  { level: "3+0", nel: 1280, ndof: 25092, ux: -7.18372, uy: -66.0817 },
  { level: "4+0", nel: 5120, ndof: 98820, ux: -7.18656, uy: -66.0965 },
  { level: "4+1", nel: 6260, ndof: 120512, ux: -7.18738, uy: -66.1008 },
  { level: "4+2", nel: 8552, ndof: 164092, ux: -7.18766, uy: -66.1023 },
  { level: "4+3", nel: 13148, ndof: 251448, ux: -7.18777, uy: -66.1029 },
  { level: "5+0", nel: 20480, ndof: 392196, ux: -7.18739, uy: -66.1009 },
  { level: "5+1", nel: 22772, ndof: 435776, ux: -7.18767, uy: -66.1023 }
];

export const fsiCsm2Rows: FsiSteadyDisplacementRow[] = [
  { level: "2+0", nel: 320, ndof: 6468, ux: -0.468011, uy: -16.9536 },
  { level: "3+0", nel: 1280, ndof: 25092, ux: -0.468734, uy: -16.9684 },
  { level: "4+0", nel: 5120, ndof: 98820, ux: -0.468925, uy: -16.9723 },
  { level: "4+1", nel: 6260, ndof: 120512, ux: -0.468980, uy: -16.9735 },
  { level: "4+2", nel: 8552, ndof: 164092, ux: -0.468999, uy: -16.9739 },
  { level: "4+3", nel: 13148, ndof: 251448, ux: -0.469006, uy: -16.9740 },
  { level: "5+0", nel: 20480, ndof: 392196, ux: -0.468981, uy: -16.9735 },
  { level: "5+1", nel: 22772, ndof: 435776, ux: -0.469000, uy: -16.9739 }
];

export const fsiCsm3Rows: FsiPeriodicRow[] = [
  { dt: "0.02", level: "2+0", nel: 320, ndof: 6468, ux: "-14.384 ± 14.389 [1.0956]", uy: "-64.271 ± 64.595 [1.0956]" },
  { dt: "0.02", level: "3+0", nel: 1280, ndof: 25092, ux: "-14.402 ± 14.406 [1.0956]", uy: "-64.352 ± 64.679 [1.0956]" },
  { dt: "0.02", level: "4+0", nel: 5120, ndof: 98820, ux: "-14.404 ± 14.408 [1.0956]", uy: "-64.371 ± 64.695 [1.0956]" },
  { dt: "0.01", level: "2+0", nel: 320, ndof: 6468, ux: "-14.632 ± 14.636 [1.0978]", uy: "-64.744 ± 64.907 [1.0978]" },
  { dt: "0.01", level: "3+0", nel: 1280, ndof: 25092, ux: "-14.645 ± 14.650 [1.0978]", uy: "-64.765 ± 64.946 [1.0978]" },
  { dt: "0.01", level: "4+0", nel: 5120, ndof: 98820, ux: "-14.645 ± 14.650 [1.0978]", uy: "-64.766 ± 64.948 [1.0978]" },
  { dt: "0.005", level: "2+0", nel: 320, ndof: 6468, ux: "-14.279 ± 14.280 [1.0995]", uy: "-63.541 ± 65.094 [1.0995]" },
  { dt: "0.005", level: "3+0", nel: 1280, ndof: 25092, ux: "-14.299 ± 14.299 [1.0995]", uy: "-63.594 ± 65.154 [1.0995]" },
  { dt: "0.005", level: "4+0", nel: 5120, ndof: 98820, ux: "-14.305 ± 14.305 [1.0995]", uy: "-63.607 ± 65.160 [1.0995]" }
];

export const fsiFsi1Rows: FsiFsi1Row[] = [
  { level: "2+0", nel: 992, ndof: 19488, ux: "2.287080e-05", uy: "8.193038e-04", drag: "1.427359e+01", lift: "7.617550e-01" },
  { level: "3+0", nel: 3968, ndof: 76672, ux: "2.277423e-05", uy: "8.204231e-04", drag: "1.429177e+01", lift: "7.630484e-01" },
  { level: "4+0", nel: 15872, ndof: 304128, ux: "2.273175e-05", uy: "8.207084e-04", drag: "1.429484e+01", lift: "7.635608e-01" },
  { level: "5+0", nel: 63488, ndof: 1211392, ux: "2.271553e-05", uy: "8.208126e-04", drag: "1.429486e+01", lift: "7.636992e-01" },
  { level: "6+0", nel: 253952, ndof: 4835328, ux: "2.270838e-05", uy: "8.208548e-04", drag: "1.429451e+01", lift: "7.637359e-01" },
  { level: "7+0", nel: 1015808, ndof: 19320832, ux: "2.270493e-05", uy: "8.208773e-04", drag: "1.429426e+01", lift: "7.637460e-01" }
];

export const fsiFsi2Rows: FsiPeriodicRow[] = [
  { dt: "0.02", level: "2+0", nel: 992, ndof: 19488, ux: "-1.402e-2 ± 1.203e-2 [3.85]", uy: "1.25e-3 ± 7.93e-2 [1.93]", drag: "2.1010e+2 ± 7.262e+1 [3.85]", lift: "2.5e-1 ± 2.279e+2 [1.93]" },
  { dt: "0.02", level: "3+0", nel: 3968, ndof: 76672, ux: "-1.454e-2 ± 1.250e-2 [3.86]", uy: "1.25e-3 ± 8.07e-2 [1.93]", drag: "2.1306e+2 ± 7.576e+1 [3.86]", lift: "8.5e-1 ± 2.344e+2 [1.93]" },
  { dt: "0.02", level: "4+0", nel: 15872, ndof: 304128, ux: "-1.487e-2 ± 1.273e-2 [3.86]", uy: "1.24e-3 ± 8.17e-2 [1.93]", drag: "2.1283e+2 ± 7.589e+1 [3.86]", lift: "9.2e-1 ± 2.343e+2 [1.93]" },
  { dt: "0.01", level: "2+0", nel: 992, ndof: 19488, ux: "-1.401e-2 ± 1.204e-2 [3.86]", uy: "1.25e-3 ± 7.93e-2 [1.93]", drag: "2.1009e+2 ± 7.282e+1 [3.86]", lift: "5.2e-1 ± 2.286e+2 [1.93]" },
  { dt: "0.01", level: "3+0", nel: 3968, ndof: 76672, ux: "-1.454e-2 ± 1.248e-2 [3.86]", uy: "1.25e-3 ± 8.07e-2 [1.93]", drag: "2.1306e+2 ± 7.576e+1 [3.86]", lift: "8.5e-1 ± 2.344e+2 [1.93]" },
  { dt: "0.01", level: "4+0", nel: 15872, ndof: 304128, ux: "-1.487e-2 ± 1.273e-2 [3.86]", uy: "1.24e-3 ± 8.17e-2 [1.93]", drag: "2.1518e+2 ± 7.778e+1 [3.86]", lift: "8.7e-1 ± 2.380e+2 [1.93]" },
  { dt: "0.0005", level: "2+0", nel: 992, ndof: 19488, ux: "-1.401e-2 ± 1.204e-2 [3.86]", uy: "1.28e-3 ± 7.92e-2 [1.93]", drag: "2.1014e+2 ± 7.286e+1 [3.86]", lift: "4.9e-1 ± 2.287e+2 [1.93]" },
  { dt: "0.0005", level: "3+0", nel: 3968, ndof: 76672, ux: "-1.448e-2 ± 1.245e-2 [3.86]", uy: "1.24e-3 ± 8.07e-2 [1.93]", drag: "2.1305e+2 ± 7.574e+1 [3.86]", lift: "8.4e-1 ± 2.348e+2 [1.93]" },
  { dt: "0.0005", level: "4+0", nel: 15872, ndof: 304128, ux: "-1.485e-2 ± 1.270e-2 [3.86]", uy: "1.30e-3 ± 8.16e-2 [1.93]", drag: "2.1506e+2 ± 7.765e+1 [3.86]", lift: "6.1e-1 ± 2.378e+2 [1.93]" }
];

export const fsiFsi3Rows: FsiPeriodicRow[] = [
  { dt: "0.001", level: "2+0", nel: 992, ndof: 19488, ux: "-3.02e-3 ± 2.83e-3 [10.75]", uy: "1.41e-3 ± 3.547e-2 [5.37]", drag: "4.582e+2 ± 2.832e+1 [10.75]", lift: "2.41 ± 1.4558e+2 [5.37]" },
  { dt: "0.001", level: "3+0", nel: 3968, ndof: 76672, ux: "-2.78e-3 ± 2.62e-3 [10.93]", uy: "1.44e-3 ± 3.436e-2 [5.46]", drag: "4.591e+2 ± 2.663e+1 [10.93]", lift: "2.41 ± 1.5126e+2 [5.46]" },
  { dt: "0.001", level: "4+0", nel: 15872, ndof: 304128, ux: "-2.86e-3 ± 2.70e-3 [10.95]", uy: "1.45e-3 ± 3.493e-2 [5.47]", drag: "4.602e+2 ± 2.765e+1 [10.95]", lift: "2.47 ± 1.5487e+2 [5.47]" },
  { dt: "0.0005", level: "2+0", nel: 992, ndof: 19488, ux: "-3.02e-3 ± 2.85e-3 [10.75]", uy: "1.42e-3 ± 3.563e-2 [5.37]", drag: "4.587e+2 ± 2.878e+1 [10.75]", lift: "2.23 ± 1.4602e+2 [5.37]" },
  { dt: "0.0005", level: "3+0", nel: 3968, ndof: 76672, ux: "-2.78e-3 ± 2.62e-3 [10.92]", uy: "1.44e-3 ± 3.435e-2 [5.46]", drag: "4.591e+2 ± 2.662e+1 [10.92]", lift: "2.39 ± 1.5068e+2 [5.46]" },
  { dt: "0.0005", level: "4+0", nel: 15872, ndof: 304128, ux: "-2.86e-3 ± 2.70e-3 [10.92]", uy: "1.45e-3 ± 3.490e-2 [5.46]", drag: "4.602e+2 ± 2.747e+1 [10.92]", lift: "2.37 ± 1.5375e+2 [5.46]" },
  { dt: "0.00025", level: "2+0", nel: 992, ndof: 19488, ux: "-3.02e-3 ± 2.85e-3 [10.74]", uy: "1.32e-3 ± 3.573e-2 [5.36]", drag: "4.587e+2 ± 2.880e+1 [10.74]", lift: "2.23 ± 1.4600e+2 [5.33]" },
  { dt: "0.00025", level: "3+0", nel: 3968, ndof: 76672, ux: "-2.77e-3 ± 2.61e-3 [10.93]", uy: "1.43e-3 ± 3.443e-2 [5.46]", drag: "4.591e+2 ± 2.650e+1 [10.93]", lift: "2.36 ± 1.4991e+2 [5.46]" },
  { dt: "0.00025", level: "4+0", nel: 15872, ndof: 304128, ux: "-2.88e-3 ± 2.72e-3 [10.93]", uy: "1.47e-3 ± 3.499e-2 [5.46]", drag: "4.605e+2 ± 2.774e+1 [10.93]", lift: "2.50 ± 1.5391e+2 [5.46]" }
];


// ---- Plots ---------------------------------------------------------------------

export type FsiMetricId = "ux" | "uy" | "drag" | "lift";

const FSI_METRICS: Array<{ id: FsiMetricId; title: string; axis: string }> = [
  { id: "ux", title: "x-displacement of A", axis: "u_x(A) [mm]" },
  { id: "uy", title: "y-displacement of A", axis: "u_y(A) [mm]" },
  { id: "drag", title: "Drag", axis: "Drag [N]" },
  { id: "lift", title: "Lift", axis: "Lift [N]" }
];

function fsiRunSpecs(run: "fsi2" | "fsi3"): Record<FsiMetricId, PlotSpec> {
  return Object.fromEntries(
    FSI_METRICS.map(metric => {
      const group: SeriesGroup = {
        id: "featflower",
        label: "FeatFloWer",
        kind: "reference",
        color: "var(--primary)",
        source: { kind: "single-trace", asset: { path: benchmarkAssetPath(ID, `plots/${run}/${metric.id}.json`) } },
        variantStrategy: { kind: "single-trace" },
        highlight: true
      };
      const spec: PlotSpec = {
        id: `fsi-${run}-${metric.id}`,
        title: metric.title,
        metric: metric.id,
        comparisonAxis: "code",
        seriesGroups: [group],
        defaultSeriesGroupIds: ["featflower"],
        compareModes: ["overlay"],
        defaultCompareMode: "overlay",
        preserveSourceColorsWhenSingleGroup: false,
        axisLabels: { x: "Time [s]", y: metric.axis }
      };
      return [metric.id, spec];
    })
  ) as Record<FsiMetricId, PlotSpec>;
}

export const fsiFsi2PlotSpecs = fsiRunSpecs("fsi2");
export const fsiFsi3PlotSpecs = fsiRunSpecs("fsi3");

export type FsiCsmMetricId = "ux" | "uy";

const CSM_LEVELS = [
  { id: "l2", label: "Level 2", color: "var(--tu-petrol-400)" },
  { id: "l3", label: "Level 3", color: "var(--tu-orange-500)" },
  { id: "l4", label: "Level 4", color: "var(--primary)" }
];

const CSM_STEPS = [
  { id: "dt0p02", label: "Δt = 0.02" },
  { id: "dt0p01", label: "Δt = 0.01" },
  { id: "dt0p005", label: "Δt = 0.005" }
];

export const fsiCsm3PlotSpecs: Record<FsiCsmMetricId, PlotSpec> = Object.fromEntries(
  FSI_METRICS.slice(0, 2).map(metric => [
    metric.id,
    {
      id: `fsi-csm3-${metric.id}`,
      title: metric.title,
      metric: metric.id,
      comparisonAxis: "level",
      seriesSelectorLabel: "Mesh levels",
      seriesGroups: CSM_LEVELS.map(level => ({
        id: level.id,
        label: level.label,
        kind: "level",
        color: level.color,
        levelSources: Object.fromEntries(
          CSM_STEPS.map(step => [
            step.id,
            { kind: "single-trace", asset: { path: benchmarkAssetPath(ID, `plots/csm3/${metric.id}/${level.id}-${step.id}.json`) } }
          ])
        ),
        variantStrategy: { kind: "single-trace" },
        highlight: level.id === "l4"
      })),
      defaultSeriesGroupIds: ["l2", "l4"],
      levelAxis: { id: "dt", label: "Time step", options: CSM_STEPS, defaultLevelId: "dt0p005" },
      compareModes: ["overlay"],
      defaultCompareMode: "overlay",
      axisLabels: { x: "Time [s]", y: metric.axis }
    } satisfies PlotSpec
  ])
) as Record<FsiCsmMetricId, PlotSpec>;

// ---- Reference data --------------------------------------------------------------

export const fsiReferenceColumns = [
  { column: "1", quantity: "Time" },
  { column: "2", quantity: "Time step" },
  { column: "5", quantity: "Drag on the beam" },
  { column: "6", quantity: "Lift on the beam" },
  { column: "7", quantity: "Drag on the cylinder" },
  { column: "8", quantity: "Lift on the cylinder" },
  { column: "11", quantity: "x-displacement of A" },
  { column: "12", quantity: "y-displacement of A" }
];

/** What the bundle holds; the order matches fsiGenerated.bundle.files. */
export const fsiBundleContents = [
  { file: "ref_fsi2.point", run: "FSI2", level: "4", dt: "0.0005", detail: "Reference run, t = 10 to 14.62 s" },
  { file: "ref_fsi3.point", run: "FSI3", level: "4", dt: "0.00025", detail: "Reference run, t = 5 to 6.44 s; see the note in Results on its time step" },
  ...["2", "3", "4"].flatMap(level =>
    [
      ["", "0.02"],
      ["_0p01", "0.01"],
      ["_t0p005", "0.005"]
    ].map(([suffix, dt]) => ({
      file: `csm3_l${level}${suffix}.point`,
      run: "CSM3",
      level,
      dt,
      detail: "Displacement of A from rest, t = 0 to 10 s"
    }))
  )
];

export const fsiDownloads: DownloadItem[] = [
  {
    label: "fsi.zip",
    href: benchmarkAssetPath(ID, "downloads/fsi.zip"),
    description: `All ${fsiBundleContents.length} reference files: the FSI2 and FSI3 runs and CSM3 on three levels and three time steps`
  }
];

// ---- Bibliography ----------------------------------------------------------------

export const fsiBibliography: ReferenceItem[] = [
  {
    id: "ciarlet-1988",
    text: "P. G. Ciarlet. Mathematical Elasticity. Volume I: Three-Dimensional Elasticity, volume 20 of Studies in Mathematics and its Applications. Elsevier Science Publishers B.V., Amsterdam, 1988."
  },
  {
    id: "hron-turek-2006",
    text: "J. Hron and S. Turek. A monolithic FEM/multigrid solver for ALE formulation of fluid structure interaction with application in biomechanics. In H.-J. Bungartz and M. Schäfer, editors, Fluid-Structure Interaction: Modelling, Simulation, Optimisation, LNCSE. Springer, 2006."
  },
  {
    id: "turek-schaefer-1996",
    text: "S. Turek and M. Schäfer. Benchmark computations of laminar flow around cylinder. In E. H. Hirschel, editor, Flow Simulation with High-Performance Computers II, volume 52 of Notes on Numerical Fluid Mechanics. Vieweg, 1996. Co. F. Durst, E. Krause, R. Rannacher."
  },
  {
    id: "wall-ramm-1998",
    text: "W. A. Wall and E. Ramm. Fluid-structure interaction based upon a stabilized (ALE) finite element method. In S. Idelsohn, E. Oñate, and E. Dvorkin, editors, 4th World Congress on Computational Mechanics, New Trends and Applications, Barcelona, 1998. CIMNE."
  },
  {
    id: "turek-hron-2010-hemodynamics",
    text: "S. Turek, J. Hron, M. Mádlík, M. Razzaq, H. Wobker and J. F. Acker. Numerical simulation and benchmarking of a monolithic multigrid solver for fluid-structure interaction problems with application to hemodynamics. In H.-J. Bungartz, M. Mehl and M. Schäfer, editors, Fluid-Structure Interaction II: Modelling, Simulation, Optimisation, volume 73 of Lecture Notes in Computational Science and Engineering, pages 193–220. Springer, 2010. doi:10.1007/978-3-642-14206-2."
  },
  {
    id: "turek-hron-2010-benchmarking",
    text: "S. Turek, J. Hron, M. Razzaq, H. Wobker and M. Schäfer. Numerical benchmarking of fluid-structure interaction: a comparison of different discretization and solution approaches. In H.-J. Bungartz, M. Mehl and M. Schäfer, editors, Fluid-Structure Interaction II: Modelling, Simulation, Optimisation, volume 73 of Lecture Notes in Computational Science and Engineering, pages 413–424. Springer, 2010. doi:10.1007/978-3-642-14206-2."
  }
];
