// Builds the DKT (drafting-kissing-tumbling) benchmark assets.
//
// Inputs (curated under scripts/source-data/):
//   dkt/*.dat                        two-column series exported from the DNS
//                                    rundirs by tools/dkt_export_series.py in the
//                                    FeatFloWer repository
//   dns/dns_validation_datasheet.csv the campaign's claim ledger
//
// Outputs:
//   public/benchmark-assets/dkt/     Plotly traces, downloads, manifest
//   src/data/generated/dkt-validation.json  Validation-tab rows
//
// Run with: node scripts/convert-dkt-data.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";
import { createStoredZip } from "./lib/zip.mjs";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/dkt");
const outDir = resolve(root, "public/benchmark-assets/dkt");
const generatedDir = resolve(root, "src/data/generated");

// A "run" is a contact-model variant of one initial condition, all at D/h = 8.
// `group` is the SeriesGroup it feeds.
//
// Selection policy
// ----------------
// Post-contact trajectories are published from runs computed with resolved
// rigid-body rotation (libs/pe >= de855b6). The D/h = 16 frictional run predates
// that and is not republished as a curve; the resolution statement it supports is
// the pre-contact one (kissing time, unaffected by contact kinematics), which the
// campaign datasheet carries as a ledger row.
const runs = {
  "fric-dh8": { label: "Dry friction · D/h = 8", color: "#f5b84b", group: "fric" },
  nofric: { label: "Frictionless", color: "#7bd88f", group: "nofric" },
  axisym: { label: "Axisymmetric (no offset)", color: "#5fb8ff", group: "axisym" }
};

// Time-series metrics: x = time, y = quantity.
const metrics = {
  tilt: { label: "Tilt angle", stem: "tilt" },
  separation: { label: "Centre separation", stem: "separation" },
  "velocity-leader": { label: "Leader vertical velocity", stem: "vz_leader" },
  "velocity-trailer": { label: "Trailer vertical velocity", stem: "vz_trailer" }
};

// Parametric metric: x = x-position, y = z-position.
const trajectoryStems = { leader: "xz_leader", trailer: "xz_trailer" };

const seriesStems = [...Object.values(metrics).map(m => m.stem), ...Object.values(trajectoryStems)];

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

function traceFromPairs(pairs, { name, color, dash }) {
  return {
    x: pairs.map(([x]) => x),
    y: pairs.map(([, y]) => y),
    type: "scatter",
    mode: "lines",
    name,
    line: { color, ...(dash ? { dash } : {}) },
    marker: { color }
  };
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId: "dkt" });

const entries = [];
const zipEntries = [];

// ---- time-series metrics ----------------------------------------------------
for (const [metricId, metric] of Object.entries(metrics)) {
  for (const [runId, run] of Object.entries(runs)) {
    const sourceName = `${runId}_${metric.stem}.dat`;
    const pairs = parsePairs(resolve(srcDir, sourceName));
    const newPath = `plots/${metricId}/${runId}.json`;
    writeJson(
      resolve(outDir, newPath),
      traceFromPairs(pairs, { name: run.label, color: run.color })
    );
    entries.push({
      oldPath: `scripts/source-data/dkt/${sourceName}`,
      newPath,
      metric: metricId,
      seriesGroupId: run.group,
      kind: "code",
      label: `${run.label} ${metric.label}`,
      sourceShape: "single-trace",
      derived: true
    });
  }
}

// ---- trajectory (two traces per run, so leader/trailer become variants) ------
for (const [runId, run] of Object.entries(runs)) {
  const traces = Object.entries(trajectoryStems).map(([which, stem]) =>
    traceFromPairs(parsePairs(resolve(srcDir, `${runId}_${stem}.dat`)), {
      name: which === "leader" ? "Leader" : "Trailer",
      color: run.color,
      dash: which === "trailer" ? "dot" : undefined
    })
  );
  const newPath = `plots/trajectory/${runId}.json`;
  writeJson(resolve(outDir, newPath), traces);
  entries.push({
    oldPath: `scripts/source-data/dkt/${runId}_xz_leader.dat`,
    newPath,
    metric: "trajectory",
    seriesGroupId: run.group,
    kind: "code",
    label: `${run.label} x-z trajectory`,
    sourceShape: "trace-array",
    derived: true
  });
}

// ---- downloads --------------------------------------------------------------
for (const runId of Object.keys(runs)) {
  for (const stem of seriesStems) {
    const sourceName = `${runId}_${stem}.dat`;
    const newPath = `downloads/${sourceName}`;
    mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
    copyFileSync(resolve(srcDir, sourceName), resolve(outDir, newPath));
    entries.push({
      oldPath: `scripts/source-data/dkt/${sourceName}`,
      newPath,
      kind: "download",
      label: sourceName
    });
    zipEntries.push({ name: `dkt/${sourceName}`, data: readFileSync(resolve(outDir, newPath)) });
  }
}

const datasheetName = "dns_validation_datasheet.csv";
const datasheetSource = `scripts/source-data/dns/${datasheetName}`;
copyFileSync(resolve(root, datasheetSource), resolve(outDir, `downloads/${datasheetName}`));
entries.push({
  oldPath: datasheetSource,
  newPath: `downloads/${datasheetName}`,
  kind: "download",
  label: datasheetName
});
zipEntries.push({
  name: `dkt/${datasheetName}`,
  data: readFileSync(resolve(outDir, `downloads/${datasheetName}`))
});

writeFileSync(resolve(outDir, "downloads/dkt.zip"), createStoredZip(zipEntries));
entries.push({
  oldPath: "generated from dkt downloads",
  newPath: "downloads/dkt.zip",
  kind: "download",
  label: "dkt.zip"
});

writeManifest(outDir, "dkt", entries, preserved);

// ---- validation ledger ------------------------------------------------------
// Generated from the datasheet, never hand-written. `dkt*` covers the case
// family including the dt-floor prerequisite probes and the t_kiss audit.
//
// Selection policy
// ----------------
// The contact-model study was measured twice. The first pass ran on binaries that
// did not integrate rigid-body rotation, so post-contact tilt was not a physical
// measurement; both contact models were repeated once rotation was resolved. The
// site publishes the current reading only — the campaign datasheet offered under
// Reference Data carries every row, superseded ones included.
//
// Withheld: the pre-rotation contact rows, whose post-contact numbers no longer
// match the curves this page plots. Their pre-contact content survives in
// `dkt_tkiss_correction`, which carries the kissing times for both rungs. The
// rerun rows are withheld too: they are written as corrections to the superseded
// runs rather than as statements of the result.
const SUPERSEDED = new Set([
  "dkt_offset",
  "dkt16_offset",
  "dkt_nofric",
  "dkt_nofric_long"
]);

// Published in addition to the `dkt*` family: D2.3 rows that state the contact
// result outright rather than correcting an earlier reading. They are named after
// the campaign task rather than the run, so the case-prefix rule alone misses them.
const PUBLISHED_EXTRAS = new Set(["d23_result"]);

const records = readDatasheet(resolve(root, datasheetSource));
const ledger = buildLedger(records, record => {
  const id = record.case.trim();
  return PUBLISHED_EXTRAS.has(id) || (/^dkt/i.test(id) && !SUPERSEDED.has(id));
});
writeJson(resolve(generatedDir, "dkt-validation.json"), {
  source: datasheetSource,
  generatedBy: "scripts/convert-dkt-data.mjs",
  rows: ledger
});

console.log(
  `Generated ${entries.length} dkt manifest entries in ${relative(root, outDir)} ` +
    `and ${ledger.length} validation rows`
);
