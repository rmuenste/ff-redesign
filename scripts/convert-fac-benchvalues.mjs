import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const angularAssets = resolve(root, "../ff-angular/src/assets");
const outDir = resolve(root, "public/benchmark-assets/fac3");

function ensureParent(file) {
  mkdirSync(dirname(file), { recursive: true });
}

function copyAsset(oldPath, newPath, extra = {}) {
  const source = join(angularAssets, oldPath);
  const target = join(outDir, newPath);
  if (!existsSync(source)) throw new Error(`Missing source asset: ${oldPath}`);
  ensureParent(target);
  copyFileSync(source, target);
  return { oldPath, newPath, ...extra };
}

function readBenchValues() {
  const source = join(angularAssets, "files/fac3d/BenchValues.txt");
  const lines = readFileSync(source, "utf-8").trim().split(/\r?\n/);
  return lines.slice(1).map((line, index) => {
    const values = line.trim().split(/\s+/).map(Number);
    if (values.length !== 4 || values.some(Number.isNaN)) {
      throw new Error(`Invalid BenchValues row ${index + 2}: ${line}`);
    }
    return values;
  });
}

function writeTrace(metric, rows, column, title) {
  const target = join(outDir, `plots/${metric}.json`);
  const trace = {
    x: rows.map(row => row[0]),
    y: rows.map(row => row[column]),
    type: "scatter",
    mode: "lines",
    name: "FeatFloWer"
  };
  ensureParent(target);
  writeFileSync(target, JSON.stringify(trace, null, 2) + "\n");
  return {
    oldPath: "files/fac3d/BenchValues.txt",
    newPath: `plots/${metric}.json`,
    metric,
    seriesGroupId: "featflower",
    kind: "reference",
    label: title,
    sourceShape: "single-trace",
    derived: true
  };
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const rows = readBenchValues();
const entries = [
  copyAsset("fac_geo_3d.png", "media/fac-geometry.png", { kind: "media", label: "FAC geometry" }),
  copyAsset("meshV3_side_new.png", "media/base-mesh.png", { kind: "media", label: "Base mesh" }),
  copyAsset("fac3d.mp4", "media/fac3d.mp4", { kind: "media", label: "FAC video" }),
  copyAsset("files/fac3d/BenchValues.txt", "downloads/BenchValues.txt", { kind: "download", label: "BenchValues reference data" }),
  writeTrace("drag", rows, 1, "Drag coefficient"),
  writeTrace("lift", rows, 2, "Lift coefficient")
];

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify({ benchmarkId: "fac3", entries }, null, 2) + "\n"
);

console.log(`Converted ${rows.length} BenchValues rows into FAC Drag/Lift Plotly JSON.`);
