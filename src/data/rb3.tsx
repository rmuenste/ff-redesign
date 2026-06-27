import type { DownloadItem } from "../components";
import { benchmarkAssetPath } from "./assets";

export type Rb3MetricId = "sphericity" | "mass" | "size" | "surface";
export type Rb3LevelId = "l1" | "l2" | "l3";

export const rb3Levels: Array<{ id: Rb3LevelId; label: string; detail: string; dof: string }> = [
  { id: "l1", label: "L1", detail: "Coarse", dof: "83,332 DOF" },
  { id: "l2", label: "L2", detail: "Medium", dof: "627,460 DOF" },
  { id: "l3", label: "L3", detail: "Fine", dof: "4,867,588 DOF" }
];

export const rb3Metrics: Array<{ id: Rb3MetricId; label: string; yAxis: string }> = [
  { id: "sphericity", label: "Sphericity", yAxis: "Sphericity" },
  { id: "mass", label: "Mass conservation", yAxis: "Mass Conservation" },
  { id: "size", label: "Bubble size", yAxis: "Bubble Size" },
  { id: "surface", label: "Bubble surface", yAxis: "Bubble Surface" }
];

export interface Rb3MeshRow {
  lvl: number;
  mx: number;
  my: number;
  mz: number;
  nx: number;
  ny: number;
  nz: number;
  nel: number;
  nq2: number;
  tdof: number;
}

export const rb3MeshRows: Rb3MeshRow[] = [
  { lvl: 1, mx: 16, my: 16, mz: 32, nx: 8, ny: 8, nz: 16, nel: 2048, nq2: 18785, tdof: 83332 },
  { lvl: 2, mx: 32, my: 32, mz: 64, nx: 16, ny: 16, nz: 32, nel: 16384, nq2: 140481, tdof: 627460 },
  { lvl: 3, mx: 64, my: 64, mz: 128, nx: 32, ny: 32, nz: 64, nel: 131072, nq2: 1085825, tdof: 4867588 },
  { lvl: 4, mx: 128, my: 128, mz: 128, nx: 64, ny: 64, nz: 256, nel: 1048576, nq2: 8536833, tdof: 38341636 }
];

export interface Rb3PhysicalRow {
  position: number;
  p1: number;
  p2: number;
  mu1: number;
  mu2: number;
  g: number;
  sigma: number;
  re: number;
  eo: number;
  rel: number;
  relmu: number;
}

export const rb3PhysicalRows: Rb3PhysicalRow[] = [
  { position: 1, p1: 1000, p2: 100, mu1: 10, mu2: 1, g: 0.98, sigma: 24.5, re: 35, eo: 10, rel: 10, relmu: 10 }
];

export const rb3Downloads: DownloadItem[] = [
  { label: "sphericity.json", href: benchmarkAssetPath("rb3", "downloads/sphericity.json"), description: "Sphericity reference data" },
  { label: "mass.json", href: benchmarkAssetPath("rb3", "downloads/mass.json"), description: "Mass conservation reference data" },
  { label: "size.json", href: benchmarkAssetPath("rb3", "downloads/size.json"), description: "Bubble size reference data" },
  { label: "surface.json", href: benchmarkAssetPath("rb3", "downloads/surface.json"), description: "Bubble surface reference data" }
];

export function rb3PlotPath(metric: Rb3MetricId, level: Rb3LevelId) {
  return benchmarkAssetPath("rb3", `plots/${metric}/${level}.json`);
}

export const rb3GeometryAsset = benchmarkAssetPath("rb3", "media/geometry-3d.png");
export const rb3VideoAsset = benchmarkAssetPath("rb3", "media/rising-bubble.mp4");
