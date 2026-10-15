// Builds the core plot assets of the Particle Sedimentation page (ten Cate
// cases E1-E4): the campaign's settling velocity and sphere height at mesh
// levels L2, L3 and L4, the digitised PIV references, the downloads and the
// per-run summary the page quotes.
//
// Inputs:
//   scripts/source-data/sedimentation/campaign/
//     vel<CASE>_L<n>.txt     headerless "time[s] v_z[m/s]", one row per time step
//     pos<CASE>_L<n>.txt     headerless "time[s] z[m]", raw sphere-centre height
//     campaign_runs.csv      one row per exported run (steps, dt, end time, peak)
//   scripts/source-data/sedimentation/ref_<CASE>.dat      PIV velocity
//   scripts/source-data/sedimentation/case_<CASE>_h.csv   PIV gap height h/d_p
//   scripts/source-data/sedimentation/sedimentation-setup.png
//
// A case/level pair is published when both of its text files exist. A pair that
// has not been exported is skipped and logged, never filled in; exporting it
// into the same folder (and its row into campaign_runs.csv) and re-running this
// script is all it takes to publish it. Every published series must have its row
// in campaign_runs.csv, and the row must agree with the file (step count, end
// time, peak settling velocity and its time), so nothing the page states about a
// run can drift from the curve it draws. The rules live in
// scripts/lib/sedimentation-campaign.mjs.
//
// Outputs:
//   public/benchmark-assets/sedimentation/plots/{velocity,position}/<CASE>-l<n>.json
//   public/benchmark-assets/sedimentation/plots/{velocity,position}/<CASE>-piv.json
//   public/benchmark-assets/sedimentation/downloads/*  (+ sedimentation.zip)
//   public/benchmark-assets/sedimentation/media/sedimentation-setup.png
//   src/data/generated/sedimentation-runs.json
//
// plots/lubrication/ and downloads/lubrication/ belong to
// scripts/convert-sedimentation-lubrication.mjs, and plots/{velocity,position}/feat3-*
// and downloads/feat3/ to scripts/convert-sedimentation-feat3-data.mjs; this script
// leaves them, and their manifest entries, untouched. Its own curves are the
// <CASE>-*.json files in the two curve folders, so the FEAT3 curves next to them
// survive a re-run in either order.
//
// Run with: node scripts/convert-sedimentation-data.mjs
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";
import {
  CASES,
  LEVELS,
  START_HEIGHT,
  campaignName,
  caseColors,
  gapHeight,
  codeDashes,
  levelTag,
  parsePairs,
  readCampaignSeries
} from "./lib/sedimentation-campaign.mjs";
import { createDeflatedZip } from "./lib/zip.mjs";

const root = resolve(import.meta.dirname, "..");
const sourceDir = "scripts/source-data/sedimentation";
const campaignDir = `${sourceDir}/campaign`;
const runsCsv = `${campaignDir}/campaign_runs.csv`;
const outDir = resolve(root, "public/benchmark-assets/sedimentation");
const generatedPath = resolve(root, "src/data/generated/sedimentation-runs.json");

const cases = CASES;
const levels = LEVELS;
const metrics = {
  velocity: {
    label: "Velocity",
    prefix: "vel",
    pivFile: caseId => `ref_${caseId}.dat`,
    transform: value => value
  },
  position: {
    label: "Position",
    prefix: "pos",
    pivFile: caseId => `case_${caseId}_h.csv`,
    // Gap height in diameters.
    transform: gapHeight
  }
};
const pivSymbols = {
  E1: "square-open",
  E2: "circle-open",
  E3: "triangle-up-open",
  E4: "diamond-open"
};

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

// ---- inputs -------------------------------------------------------------------

const { series, missing } = readCampaignSeries({
  root,
  campaignDir,
  cases,
  levels,
  startHeight: START_HEIGHT
});
if (!series.length) throw new Error(`no campaign series found in ${campaignDir}`);

// ---- assets -------------------------------------------------------------------

// Only the paths this script writes are rebuilt: its <CASE>-*.json curves in the
// two curve folders and the files directly under downloads/ (in both cases the
// ones present from the last run and the ones this run will write), and the setup
// figure. The lubrication material under plots/lubrication/ and
// downloads/lubrication/, the FEAT3 curves (feat3-*.json) and downloads/feat3/, the
// films and gallery stills under media/, and all of their manifest entries stay
// where they are.
const ownCurve = /^E\d+-.+\.json$/;
const plotNames = Object.keys(metrics).flatMap(metricId => {
  const dir = resolve(outDir, "plots", metricId);
  const stale = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isFile() && ownCurve.test(entry.name)).map(entry => entry.name)
    : [];
  const fresh = cases.flatMap(caseId => [...series.filter(run => run.caseId === caseId).map(run => `${caseId}-${run.level}.json`), `${caseId}-piv.json`]);
  return [...new Set([...stale, ...fresh])].map(name => `plots/${metricId}/${name}`);
});
const downloadNames = [
  ...series.flatMap(run => Object.values(metrics).map(metric => campaignName(metric.prefix, run.caseId, run.level))),
  "campaign_runs.csv",
  ...cases.flatMap(caseId => [`ref_${caseId}.dat`, `case_${caseId}_h.csv`]),
  "sedimentation.zip"
];
const downloadsDir = resolve(outDir, "downloads");
const staleDownloads = existsSync(downloadsDir)
  ? readdirSync(downloadsDir, { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => entry.name)
  : [];
const preserved = resetGeneratedOutputs(
  outDir,
  [
    ...plotNames,
    ...[...new Set([...staleDownloads, ...downloadNames])].map(name => `downloads/${name}`),
    "media/sedimentation-setup.png"
  ],
  { benchmarkId: "sedimentation" }
);

const entries = [];
const zipEntries = [];

function copyDownload(oldPath, name, label = name) {
  const newPath = `downloads/${name}`;
  const to = resolve(outDir, newPath);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(resolve(root, oldPath), to);
  entries.push({ oldPath, newPath, kind: "download", label });
  zipEntries.push({ name: `sedimentation/${name}`, data: readFileSync(to) });
}

for (const [metricId, metric] of Object.entries(metrics)) {
  for (const caseId of cases) {
    for (const run of series.filter(entry => entry.caseId === caseId)) {
      const pairs = run[metricId].map(([x, y]) => [x, metric.transform(y)]);
      const newPath = `plots/${metricId}/${caseId}-${run.level}.json`;
      writeJson(resolve(outDir, newPath), traceFromPairs(pairs, {
        name: `${caseId} ${levelTag(run.level)}`,
        color: caseColors[caseId],
        mode: "lines",
        dash: codeDashes.featflower
      }));
      entries.push({
        oldPath: run.files[metricId],
        newPath,
        metric: metricId,
        seriesGroupId: caseId.toLowerCase(),
        kind: "code",
        label: `${caseId} ${levelTag(run.level)} ${metric.label}`,
        sourceShape: "single-trace",
        derived: true
      });
    }

    const pivOldPath = `${sourceDir}/${metric.pivFile(caseId)}`;
    const pivPath = `plots/${metricId}/${caseId}-piv.json`;
    writeJson(resolve(outDir, pivPath), traceFromPairs(parsePairs(resolve(root, pivOldPath)), {
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

for (const run of series) {
  for (const metric of Object.values(metrics)) {
    const name = campaignName(metric.prefix, run.caseId, run.level);
    copyDownload(`${campaignDir}/${name}`, name);
  }
}
copyDownload(runsCsv, "campaign_runs.csv");

for (const caseId of cases) {
  for (const name of [`ref_${caseId}.dat`, `case_${caseId}_h.csv`]) {
    copyDownload(`${sourceDir}/${name}`, name);
  }
}

const setupOldPath = `${sourceDir}/sedimentation-setup.png`;
mkdirSync(resolve(outDir, "media"), { recursive: true });
copyFileSync(resolve(root, setupOldPath), resolve(outDir, "media/sedimentation-setup.png"));
entries.push({
  oldPath: setupOldPath,
  newPath: "media/sedimentation-setup.png",
  kind: "media",
  label: "Sedimentation experimental setup"
});

writeFileSync(resolve(outDir, "downloads/sedimentation.zip"), createDeflatedZip(zipEntries));
entries.push({
  oldPath: "generated from sedimentation downloads",
  newPath: "downloads/sedimentation.zip",
  kind: "download",
  label: "sedimentation.zip"
});

writeManifest(outDir, "sedimentation", entries, preserved);

// ---- derived numbers the page quotes ----------------------------------------------

writeJson(generatedPath, {
  source: runsCsv,
  levels,
  runs: series.map(run => ({
    case: run.caseId,
    level: run.level,
    steps: run.steps,
    dtS: run.dt,
    tEndS: run.tEnd,
    peakVzMS: run.peakVz,
    tPeakS: run.tPeak
  })),
  missing
});

console.log(
  `Published ${series.length} campaign series (${missing.length} not exported yet); ` +
    `${entries.length} manifest entries in ${relative(root, outDir)}`
);
