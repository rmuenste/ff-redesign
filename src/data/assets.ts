import type { AssetManifest } from "./types";

const basePath = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");

export const benchmarkAssetRoot = `${basePath}/benchmark-assets`;

export function benchmarkAssetPath(benchmarkId: string, path: string) {
  return `${benchmarkAssetRoot}/${benchmarkId}/${path}`;
}

export const rb3AssetManifest: AssetManifest = {
  benchmarkId: "rb3",
  entries: [
    {
      oldPath: "data/RB3sphericityL1.json",
      newPath: "plots/sphericity/l1.json",
      metric: "sphericity",
      seriesGroupId: "l1",
      kind: "level",
      label: "L1",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3sphericityL2.json",
      newPath: "plots/sphericity/l2.json",
      metric: "sphericity",
      seriesGroupId: "l2",
      kind: "level",
      label: "L2",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3sphericityL3.json",
      newPath: "plots/sphericity/l3.json",
      metric: "sphericity",
      seriesGroupId: "l3",
      kind: "level",
      label: "L3",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3bubble_massL1.json",
      newPath: "plots/mass/l1.json",
      metric: "mass",
      seriesGroupId: "l1",
      kind: "level",
      label: "L1",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3bubble_massL2.json",
      newPath: "plots/mass/l2.json",
      metric: "mass",
      seriesGroupId: "l2",
      kind: "level",
      label: "L2",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3bubble_massL3.json",
      newPath: "plots/mass/l3.json",
      metric: "mass",
      seriesGroupId: "l3",
      kind: "level",
      label: "L3",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3sizeL1.json",
      newPath: "plots/size/l1.json",
      metric: "size",
      seriesGroupId: "l1",
      kind: "level",
      label: "L1",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3sizeL2.json",
      newPath: "plots/size/l2.json",
      metric: "size",
      seriesGroupId: "l2",
      kind: "level",
      label: "L2",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3sizeL3.json",
      newPath: "plots/size/l3.json",
      metric: "size",
      seriesGroupId: "l3",
      kind: "level",
      label: "L3",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3surfaceL1.json",
      newPath: "plots/surface/l1.json",
      metric: "surface",
      seriesGroupId: "l1",
      kind: "level",
      label: "L1",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3surfaceL2.json",
      newPath: "plots/surface/l2.json",
      metric: "surface",
      seriesGroupId: "l2",
      kind: "level",
      label: "L2",
      sourceShape: "trace-array"
    },
    {
      oldPath: "data/RB3surfaceL3.json",
      newPath: "plots/surface/l3.json",
      metric: "surface",
      seriesGroupId: "l3",
      kind: "level",
      label: "L3",
      sourceShape: "trace-array"
    },
    { oldPath: "files/bubble3/sphericity.json", newPath: "downloads/sphericity.json" },
    { oldPath: "files/bubble3/mass_conservation.json", newPath: "downloads/mass.json" },
    { oldPath: "files/bubble3/size.json", newPath: "downloads/size.json" },
    { oldPath: "files/bubble3/surface.json", newPath: "downloads/surface.json" },
    { oldPath: "geometry3D.png", newPath: "media/geometry-3d.png" },
    { oldPath: "risingbubble2.mp4", newPath: "media/rising-bubble.mp4" }
  ]
};
