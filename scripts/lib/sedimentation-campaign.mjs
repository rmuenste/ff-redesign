// Discovery and validation of the ten Cate campaign series for
// scripts/convert-sedimentation-data.mjs, kept apart so the skip-and-check rules
// can be tested on a fixture folder (src/data/sedimentation-campaign.test.ts).
//
// A case/level pair is published when both of its text files exist
// (vel<CASE>_L<n>.txt, pos<CASE>_L<n>.txt). A pair with neither file is skipped
// and logged, never filled in. A pair with only one of the two, or without its
// row in campaign_runs.csv, is an error, and so is a row that disagrees with its
// file: step count, end time, peak settling velocity and its time, start height.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsvRecords } from "./csv.mjs";

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
 */

/**
 * @param {object} options
 * @param {string} options.root directory the relative paths resolve against
 * @param {string} options.campaignDir folder of the series and campaign_runs.csv, relative to root
 * @param {string[]} options.cases e.g. ["E1", "E2", "E3", "E4"]
 * @param {string[]} options.levels e.g. ["l2", "l3", "l4"]
 * @param {number} options.startHeight expected first sphere-centre height [m]
 * @param {(message: string) => void} [options.log]
 * @returns {{ series: CampaignSeries[], missing: Array<{ case: string, level: string }> }}
 *   `series` in case-then-level order
 */
export function readCampaignSeries({ root, campaignDir, cases, levels, startHeight, log = console.log }) {
  const runsCsv = `${campaignDir}/campaign_runs.csv`;
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
        log(`skip ${label}: not exported${row ? " (listed in campaign_runs.csv, files absent)" : ""}`);
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

      series.push({ caseId, level, files, velocity, position, steps, dt, tEnd, peakVz, tPeak });
    }
  }
  return { series, missing };
}
