// Builds the FEAT3 contribution to the Particle Sedimentation page: the same four
// ten Cate cases (E1-E4) at mesh levels L2, L3 and L4, computed with FEAT3 on the
// same quarter-box meshes as the FeatFloWer curves, so a level means the same
// cells across the sphere diameter for both codes (D/h = 11.4, 23.9, 49.1).
//
// Companion to scripts/convert-sedimentation-data.mjs (the FeatFloWer curves, the
// PIV references and the core downloads) and scripts/convert-sedimentation-lubrication.mjs.
// All three write into public/benchmark-assets/sedimentation/ and merge into its
// manifest; this one owns only the paths below, so the three can run in any order.
//
// Inputs (curated under scripts/source-data/sedimentation/feat3/, copied unchanged
// from the FEAT3 runs):
//   vel<CASE>_L<n>.txt   headerless "t[s] u_z[m/s]", one row per 1 ms step from
//                        t = 0.001, negative = settling
//   pos<CASE>_L<n>.txt   headerless "t[s] z[m]", the raw sphere-centre height
//   feat3_runs.csv       one row per run: case, level, steps, dt_s, t_end_s,
//                        peak_vz_m_s, t_peak_s, D_over_h, plus provenance columns
//                        (rundir, slurm_job, binary, ranks, solver_note) that are
//                        published in the download and never quoted on the page
//
// The row convention is the FeatFloWer campaign's, and so are the rules
// (scripts/lib/sedimentation-campaign.mjs): a case/level pair is published when
// both of its files exist, a missing pair is skipped and logged, and every
// published series must agree with its feat3_runs.csv row (steps, end time, peak
// settling velocity and its time, start height). D_over_h must match the level.
//
// Outputs:
//   public/benchmark-assets/sedimentation/plots/{velocity,position}/feat3-<CASE>-l<n>.json
//   public/benchmark-assets/sedimentation/downloads/feat3/
//       feat3_vel<CASE>_L<n>.txt, feat3_pos<CASE>_L<n>.txt   the series, unchanged
//       feat3_runs.csv                                       the run table, unchanged
//       sedimentation-feat3.zip                              all of the above
//   src/data/generated/sedimentation-feat3.json             the run table the page renders
//
// The download names carry a feat3_ prefix so that no file shares a name with
// the FeatFloWer series on the page or in the site-wide reference-data index.
//
// Run with: node scripts/convert-sedimentation-feat3-data.mjs
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";
import {
  CASES,
  LEVELS,
  START_HEIGHT,
  campaignName,
  caseColors,
  cellsAcrossDiameter,
  gapHeight,
  levelDashes,
  levelTag,
  readCampaignSeries
} from "./lib/sedimentation-campaign.mjs";
import { createDeflatedZip } from "./lib/zip.mjs";

const CODE = "feat3";
const LABEL = "FEAT3";
const MARKER = "triangle-up";
const MARKER_SIZE = 8;
const root = resolve(import.meta.dirname, "..");
const sourceDir = "scripts/source-data/sedimentation/feat3";
const runsCsvName = "feat3_runs.csv";
const outDir = resolve(root, "public/benchmark-assets/sedimentation");
const generatedPath = resolve(root, "src/data/generated/sedimentation-feat3.json");
const ZIP_PATH = "downloads/feat3/sedimentation-feat3.zip";
const ZIP_FOLDER = "sedimentation-feat3";

/** Cells across the sphere diameter per level, shared with the FeatFloWer meshes. */
const CELLS_ACROSS_DIAMETER = { l2: 11.4, l3: 23.9, l4: 49.1 };

const metrics = {
  velocity: { label: "Velocity", prefix: "vel", transform: value => value },
  position: { label: "Position", prefix: "pos", transform: gapHeight }
};

const plotPath = (metricId, caseId, level) => `plots/${metricId}/${CODE}-${caseId}-${level}.json`;
const downloadName = (prefix, caseId, level) => `${CODE}_${campaignName(prefix, caseId, level)}`;

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

// ---- inputs -------------------------------------------------------------------

const { series, missing } = readCampaignSeries({
  root,
  campaignDir: sourceDir,
  runsCsvName,
  cases: CASES,
  levels: LEVELS,
  startHeight: START_HEIGHT
});
if (!series.length) throw new Error(`no FEAT3 series found in ${sourceDir}`);

const cells = cellsAcrossDiameter(series, CELLS_ACROSS_DIAMETER, `${sourceDir}/${runsCsvName}`);

// ---- assets -------------------------------------------------------------------

// Owned: the feat3-*.json curves in the two curve folders (the ones from the last
// run and the ones this run writes) and downloads/feat3/. Everything else in the
// folder, and its manifest entries, belongs to the core and lubrication converters
// or the gallery.
const ownCurve = new RegExp(`^${CODE}-.+\\.json$`);
const ownedPlots = Object.keys(metrics).flatMap(metricId => {
  const dir = resolve(outDir, "plots", metricId);
  const stale = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isFile() && ownCurve.test(entry.name)).map(entry => entry.name)
    : [];
  const fresh = series.map(run => plotPath(metricId, run.caseId, run.level).split("/").pop());
  return [...new Set([...stale, ...fresh])].map(name => `plots/${metricId}/${name}`);
});
const preserved = resetGeneratedOutputs(outDir, [...ownedPlots, "downloads/feat3"], { benchmarkId: "sedimentation" });

const entries = [];
const zipEntries = [];

for (const [metricId, metric] of Object.entries(metrics)) {
  for (const run of series) {
    const pairs = run[metricId].map(([x, y]) => [x, metric.transform(y)]);
    const newPath = plotPath(metricId, run.caseId, run.level);
    const color = caseColors[run.caseId];
    writeJson(resolve(outDir, newPath), {
      x: pairs.map(([x]) => x),
      y: pairs.map(([, y]) => y),
      type: "scatter",
      mode: "lines",
      name: `${LABEL} ${run.caseId} ${levelTag(run.level)}`,
      line: { color, dash: levelDashes[run.level] },
      // A triangle reads smaller than FeatFloWer's diamond at the same size.
      marker: { color, symbol: MARKER, size: MARKER_SIZE }
    });
    entries.push({
      oldPath: run.files[metricId],
      newPath,
      metric: metricId,
      seriesGroupId: `${run.caseId.toLowerCase()}-${CODE}`,
      kind: "code",
      label: `${LABEL} ${run.caseId} ${levelTag(run.level)} ${metric.label}`,
      sourceShape: "single-trace",
      derived: true
    });
  }
}

function copyDownload(oldPath, name) {
  const newPath = `downloads/${CODE}/${name}`;
  const to = resolve(outDir, newPath);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(resolve(root, oldPath), to);
  entries.push({ oldPath, newPath, kind: "download", label: name });
  zipEntries.push({ name: `${ZIP_FOLDER}/${name}`, data: readFileSync(to) });
}

for (const run of series) {
  for (const [metricId, metric] of Object.entries(metrics)) {
    copyDownload(run.files[metricId], downloadName(metric.prefix, run.caseId, run.level));
  }
}
copyDownload(`${sourceDir}/${runsCsvName}`, runsCsvName);

writeFileSync(resolve(outDir, ZIP_PATH), createDeflatedZip(zipEntries));
entries.push({
  oldPath: "generated from FEAT3 sedimentation downloads",
  newPath: ZIP_PATH,
  kind: "download",
  label: "sedimentation-feat3.zip"
});

writeManifest(outDir, "sedimentation", entries, preserved);

// ---- the run table the page renders ------------------------------------------------

writeJson(generatedPath, {
  generatedBy: "scripts/convert-sedimentation-feat3-data.mjs",
  source: `${sourceDir}/${runsCsvName}`,
  code: CODE,
  label: LABEL,
  levels: LEVELS,
  runs: series.map((run, index) => ({
    case: run.caseId,
    level: run.level,
    steps: run.steps,
    dtS: run.dt,
    tEndS: run.tEnd,
    peakVzMS: run.peakVz,
    tPeakS: run.tPeak,
    cellsAcrossDiameter: cells[index]
  })),
  missing
});

console.log(
  `Published ${series.length} FEAT3 series (${missing.length} not exported yet); ` +
    `${entries.length} manifest entries in ${relative(root, outDir)}`
);
