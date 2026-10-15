// Discovery and validation of the ten Cate simulation series for
// scripts/convert-sedimentation-data.mjs (FeatFloWer, campaign_runs.csv) and
// scripts/convert-sedimentation-feat3-data.mjs (FEAT3, feat3_runs.csv), kept apart
// so the skip-and-check rules can be tested on a fixture folder
// (src/data/sedimentation-campaign.test.ts).
//
// A case/level pair is published when both of its text files exist
// (vel<CASE>_L<n>.txt, pos<CASE>_L<n>.txt). A pair with neither file is skipped
// and logged, never filled in. A pair with only one of the two, or without its
// row in the runs CSV, is an error, and so is a row that disagrees with its
// file: step count, end time, peak settling velocity and its time, start height.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsvRecords } from "./csv.mjs";

/** Sphere radius and diameter [m], and the initial sphere-centre height: eight diameters above the floor. */
export const SPHERE_RADIUS = 0.0075;
export const SPHERE_DIAMETER = 0.015;
export const START_HEIGHT = 0.1275;

export const CASES = ["E1", "E2", "E3", "E4"];
export const LEVELS = ["l2", "l3", "l4"];

/** Gap height in diameters from the raw centre height; rounded to drop float noise such as 8.000000000000002. */
export const gapHeight = z => Number(((z - SPHERE_RADIUS) / SPHERE_DIAMETER).toPrecision(12));

/** Curve colour per case and dash per level, shared by every code's plot files. */
export const caseColors = { E1: "#5fb8ff", E2: "#f5b84b", E3: "#7bd88f", E4: "#ef6f6c" };
export const levelDashes = { l2: "dot", l3: "dash", l4: "solid" };

export const levelTag = level => level.toUpperCase();
export const campaignName = (prefix, caseId, level) => `${prefix}${caseId}_${levelTag(level)}.txt`;

export function parsePairs(file) {
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

/** Fortran-style reals ("0.0010d0") as written by the solver decks. */
function parseReal(text, what) {
  const value = Number(String(text).trim().replace(/[dD]/, "e"));
  if (!Number.isFinite(value)) throw new Error(`${what} is not a number: ${JSON.stringify(text)}`);
  return value;
}

/**
 * @typedef {object} CampaignSeries
 * @property {string} caseId
 * @property {string} level
 * @property {{ velocity: string, position: string }} files paths relative to root
 * @property {number[][]} velocity [t, v_z] pairs
 * @property {number[][]} position [t, z] pairs
 * @property {number} steps
 * @property {number} dt
 * @property {number} tEnd
 * @property {number} peakVz
 * @property {number} tPeak
 * @property {Record<string, string>} row the run's CSV record, for columns a caller adds
 */

/**
 * @param {object} options
 * @param {string} options.root directory the relative paths resolve against
 * @param {string} options.campaignDir folder of the series and the runs CSV, relative to root
 * @param {string} [options.runsCsvName] the runs CSV in that folder (default campaign_runs.csv)
 * @param {string[]} options.cases e.g. ["E1", "E2", "E3", "E4"]
 * @param {string[]} options.levels e.g. ["l2", "l3", "l4"]
 * @param {number} options.startHeight expected first sphere-centre height [m]
 * @param {(message: string) => void} [options.log]
 * @returns {{ series: CampaignSeries[], missing: Array<{ case: string, level: string }> }}
 *   `series` in case-then-level order
 */
export function readCampaignSeries({
  root,
  campaignDir,
  runsCsvName = "campaign_runs.csv",
  cases,
  levels,
  startHeight,
  log = console.log
}) {
  const runsCsv = `${campaignDir}/${runsCsvName}`;
  const runByKey = new Map();
  for (const row of parseCsvRecords(readFileSync(resolve(root, runsCsv), "utf-8"))) {
    const level = String(row.level).toLowerCase();
    if (!cases.includes(row.case) || !levels.includes(level)) {
      throw new Error(`${runsCsv}: unexpected case/level ${row.case} ${row.level}`);
    }
    const key = `${row.case}-${level}`;
    if (runByKey.has(key)) throw new Error(`${runsCsv}: ${row.case} ${row.level} is listed twice`);
    runByKey.set(key, row);
  }

  const series = [];
  const missing = [];
  for (const caseId of cases) {
    for (const level of levels) {
      const label = `${caseId} ${levelTag(level)}`;
      const files = {
        velocity: `${campaignDir}/${campaignName("vel", caseId, level)}`,
        position: `${campaignDir}/${campaignName("pos", caseId, level)}`
      };
      const present = Object.values(files).filter(file => existsSync(resolve(root, file)));
      const row = runByKey.get(`${caseId}-${level}`);

      if (present.length === 0) {
        log(`skip ${label}: not exported${row ? ` (listed in ${runsCsvName}, files absent)` : ""}`);
        missing.push({ case: caseId, level });
        continue;
      }
      if (present.length !== 2) {
        throw new Error(`${label}: only ${present.join(", ")} exported; velocity and position come together`);
      }
      if (!row) throw new Error(`${label}: series exported but no row in ${runsCsv}`);

      const velocity = parsePairs(resolve(root, files.velocity));
      const position = parsePairs(resolve(root, files.position));
      const steps = Number(row.steps);
      const dt = parseReal(row.dt_s, `${runsCsv} ${label} dt_s`);
      const tEnd = parseReal(row.t_end_s, `${runsCsv} ${label} t_end_s`);
      const peakVz = parseReal(row.peak_vz_m_s, `${runsCsv} ${label} peak_vz_m_s`);
      const tPeak = parseReal(row.t_peak_s, `${runsCsv} ${label} t_peak_s`);

      // The file must be the run the row describes.
      for (const [id, pairs] of [["velocity", velocity], ["position", position]]) {
        if (pairs.length !== steps) throw new Error(`${files[id]}: ${pairs.length} rows, ${runsCsv} says ${steps} steps`);
        const last = pairs[pairs.length - 1][0];
        if (Math.abs(last - tEnd) > dt / 2) throw new Error(`${files[id]}: ends at t = ${last}, ${runsCsv} says ${tEnd}`);
      }
      const peak = velocity.reduce((best, pair) => (pair[1] < best[1] ? pair : best));
      if (Math.abs(peak[1] - peakVz) > 5e-7 || Math.abs(peak[0] - tPeak) > dt / 2) {
        throw new Error(`${files.velocity}: peak ${peak[1]} at t = ${peak[0]}, ${runsCsv} says ${peakVz} at ${tPeak}`);
      }
      if (Math.abs(position[0][1] - startHeight) > 1e-6) {
        throw new Error(`${files.position}: starts at z = ${position[0][1]}, expected ${startHeight}`);
      }

      series.push({ caseId, level, files, velocity, position, steps, dt, tEnd, peakVz, tPeak, row });
    }
  }
  return { series, missing };
}

/**
 * Check a runs CSV's D_over_h column against the mesh each level stands for:
 * a level is the same mesh for every code, so its cells across the sphere
 * diameter must match to the precision the page quotes.
 *
 * @param {CampaignSeries[]} series as returned by readCampaignSeries
 * @param {Record<string, number>} cellsByLevel e.g. { l2: 11.4, l3: 23.9, l4: 49.1 }
 * @param {string} runsCsv the CSV's path, for the error message
 * @returns {number[]} D_over_h per series, in series order
 */
export function cellsAcrossDiameter(series, cellsByLevel, runsCsv) {
  return series.map(run => {
    const value = Number(run.row.D_over_h);
    const expected = cellsByLevel[run.level];
    if (!(Math.abs(value - expected) < 0.05)) {
      throw new Error(
        `${runsCsv} ${run.caseId} ${levelTag(run.level)}: D_over_h = ${run.row.D_over_h}, the ${levelTag(run.level)} mesh has ${expected}`
      );
    }
    return value;
  });
}
