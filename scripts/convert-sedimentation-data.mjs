import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outDir = resolve(root, "public/benchmark-assets/sedimentation");

const cases = ["E1", "E2", "E3", "E4"];
const levels = ["l2", "l3"];
const metrics = {
  velocity: {
    label: "Velocity",
    simPrefix: "vel",
    pivFile: caseId => `ref_${caseId}.dat`,
    transform: value => value
  },
  position: {
    label: "Position",
    simPrefix: "pos",
    pivFile: caseId => `case_${caseId}_h.csv`,
    transform: value => (value - 0.0075) / 0.015
  }
};
const caseColors = {
  E1: "#5fb8ff",
  E2: "#f5b84b",
  E3: "#7bd88f",
  E4: "#ef6f6c"
};
const pivSymbols = {
  E1: "square-open",
  E2: "circle-open",
  E3: "triangle-up-open",
  E4: "diamond-open"
};

function parsePairs(file) {
  return readFileSync(file, "utf-8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [x, y] = line.split(/[\s,;]+/).map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Invalid numeric pair in ${file}: ${line}`);
      }
      return [x, y];
    });
}

function traceFromPairs(pairs, { name, color, mode, dash, markerSymbol }) {
  return {
    x: pairs.map(([x]) => x),
    y: pairs.map(([, y]) => y),
    type: "scatter",
    mode,
    name,
    line: { color, ...(dash ? { dash } : {}) },
    marker: { color, ...(markerSymbol ? { symbol: markerSymbol } : {}) }
  };
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function copyAsset(oldPath, newPath, extra = {}) {
  const from = resolve(root, oldPath);
  const to = resolve(outDir, newPath);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  return { oldPath, newPath, ...extra };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date("2026-01-01T00:00:00Z")) {
  const year = Math.max(date.getUTCFullYear(), 1980);
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  return { dosDate, dosTime };
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function createStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc),
      writeUInt32(data.length),
      writeUInt32(data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      name
    ]);
    localParts.push(localHeader, data);
    centralParts.push(Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc),
      writeUInt32(data.length),
      writeUInt32(data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      name
    ]));
    offset += localHeader.length + data.length;
  }

  const central = Buffer.concat(centralParts);
  return Buffer.concat([
    ...localParts,
    central,
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(central.length),
    writeUInt32(offset),
    writeUInt16(0)
  ]);
}

rmSync(outDir, { recursive: true, force: true });

const entries = [];
const zipEntries = [];

for (const [metricId, metric] of Object.entries(metrics)) {
  for (const caseId of cases) {
    for (const level of levels) {
      const angularName = `${metric.simPrefix}${caseId}${level === "l3" ? "_L3" : ""}.txt`;
      const oldPath = `../ff-angular/src/assets/sedimentation/${angularName}`;
      const source = resolve(root, oldPath);
      const pairs = parsePairs(source).map(([x, y]) => [x, metric.transform(y)]);
      const newPath = `plots/${metricId}/${caseId}-${level}.json`;
      writeJson(resolve(outDir, newPath), traceFromPairs(pairs, {
        name: `${caseId} ${level.toUpperCase()}`,
        color: caseColors[caseId],
        mode: "lines",
        dash: level === "l3" ? "dot" : undefined
      }));
      entries.push({
        oldPath,
        newPath,
        metric: metricId,
        seriesGroupId: caseId.toLowerCase(),
        kind: "code",
        label: `${caseId} ${level.toUpperCase()} ${metric.label}`,
        sourceShape: "single-trace",
        derived: true
      });
    }

    const pivName = metric.pivFile(caseId);
    const pivOldPath = `scripts/source-data/sedimentation/${pivName}`;
    const pivPairs = parsePairs(resolve(root, pivOldPath));
    const pivPath = `plots/${metricId}/${caseId}-piv.json`;
    writeJson(resolve(outDir, pivPath), traceFromPairs(pivPairs, {
      name: `${caseId} PIV`,
      color: caseColors[caseId],
      mode: "markers",
      markerSymbol: pivSymbols[caseId]
    }));
    entries.push({
      oldPath: pivOldPath,
      newPath: pivPath,
      metric: metricId,
      seriesGroupId: `${caseId.toLowerCase()}-piv`,
      kind: "reference",
      label: `${caseId} PIV ${metric.label}`,
      sourceShape: "single-trace",
      derived: true
    });
  }
}

for (const caseId of cases) {
  for (const level of levels) {
    for (const metric of Object.values(metrics)) {
      const angularName = `${metric.simPrefix}${caseId}${level === "l3" ? "_L3" : ""}.txt`;
      const oldPath = `../ff-angular/src/assets/sedimentation/${angularName}`;
      const newPath = `downloads/${angularName}`;
      entries.push(copyAsset(oldPath, newPath, {
        kind: "download",
        label: angularName
      }));
      zipEntries.push({
        name: `sedimentation/${angularName}`,
        data: readFileSync(resolve(outDir, newPath))
      });
    }
  }
}

for (const caseId of cases) {
  for (const sourceName of [`ref_${caseId}.dat`, `case_${caseId}_h.csv`]) {
    const oldPath = `scripts/source-data/sedimentation/${sourceName}`;
    const newPath = `downloads/${sourceName}`;
    entries.push(copyAsset(oldPath, newPath, {
      kind: "download",
      label: sourceName
    }));
    zipEntries.push({
      name: `sedimentation/${sourceName}`,
      data: readFileSync(resolve(outDir, newPath))
    });
  }
}

entries.push(copyAsset("../ff-angular/src/assets/sedimentation_setup.png", "media/sedimentation-setup.png", {
  kind: "media",
  label: "Sedimentation experimental setup"
}));

const zipPath = resolve(outDir, "downloads/sedimentation.zip");
mkdirSync(dirname(zipPath), { recursive: true });
writeFileSync(zipPath, createStoredZip(zipEntries));
entries.push({
  oldPath: "generated from sedimentation downloads",
  newPath: "downloads/sedimentation.zip",
  kind: "download",
  label: "sedimentation.zip"
});

writeJson(resolve(outDir, "manifest.json"), { benchmarkId: "sedimentation", entries });

console.log(`Generated ${entries.length} sedimentation manifest entries in ${relative(root, outDir)}`);
