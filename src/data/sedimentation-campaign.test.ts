import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cellsAcrossDiameter, readCampaignSeries } from "../../scripts/lib/sedimentation-campaign.mjs";

// The converter's discovery rules, on a synthetic fixture folder: what happens
// when a case/level pair has not been exported, is half exported, or disagrees
// with its row in campaign_runs.csv.

const HEADER = "case,level,rundir,slurm_job,binary,steps,dt_s,t_end_s,peak_vz_m_s,t_peak_s";
const CASES = ["E1", "E2"];
const LEVELS = ["l2", "l3"];

let root: string;
let logged: string[];

/** A three-step run that settles at -0.02 m/s and peaks at t = 0.002 s. */
function writeRun(caseId: string, level: string, { velocity = true, position = true } = {}) {
  const tag = level.toUpperCase();
  if (velocity) writeFileSync(join(root, "campaign", `vel${caseId}_${tag}.txt`), "0.001 0\n0.002 -0.02\n0.003 -0.01\n");
  if (position) writeFileSync(join(root, "campaign", `pos${caseId}_${tag}.txt`), "0.001 0.1275\n0.002 0.12748\n0.003 0.12747\n");
}

function row(caseId: string, level: string, overrides: Partial<Record<"steps" | "peak", string>> = {}) {
  return `${caseId},${level.toUpperCase()},rundir,1,binary,${overrides.steps ?? 3},0.0010d0,0.003,${overrides.peak ?? "-0.02"},0.002`;
}

function writeCsv(rows: string[]) {
  writeFileSync(join(root, "campaign", "campaign_runs.csv"), `${[HEADER, ...rows].join("\n")}\n`);
}

const read = () =>
  readCampaignSeries({
    root,
    campaignDir: "campaign",
    cases: CASES,
    levels: LEVELS,
    startHeight: 0.1275,
    log: (message: string) => logged.push(message)
  });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sedimentation-campaign-"));
  mkdirSync(join(root, "campaign"));
  logged = [];
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("readCampaignSeries", () => {
  it("publishes every exported pair, in case-then-level order, with the summary numbers", () => {
    for (const caseId of CASES) for (const level of LEVELS) writeRun(caseId, level);
    writeCsv(CASES.flatMap(caseId => LEVELS.map(level => row(caseId, level))));
    const { series, missing } = read();
    expect(series.map(run => `${run.caseId}-${run.level}`)).toEqual(["E1-l2", "E1-l3", "E2-l2", "E2-l3"]);
    expect(missing).toEqual([]);
    expect(series[0]).toMatchObject({ steps: 3, dt: 0.001, tEnd: 0.003, peakVz: -0.02, tPeak: 0.002 });
    expect(logged).toEqual([]);
  });

  it("skips a pair that has not been exported and logs it, with or without its CSV row", () => {
    writeRun("E1", "l3");
    writeRun("E2", "l2");
    writeRun("E2", "l3");
    // E1 L2: no files, no row. Nothing is invented for it.
    writeCsv([row("E1", "l3"), row("E2", "l2"), row("E2", "l3")]);
    let result = read();
    expect(result.series.map(run => `${run.caseId}-${run.level}`)).toEqual(["E1-l3", "E2-l2", "E2-l3"]);
    expect(result.missing).toEqual([{ case: "E1", level: "l2" }]);
    expect(logged).toEqual(["skip E1 L2: not exported"]);

    // A row that arrives before its files is still a skip.
    logged = [];
    writeCsv([row("E1", "l2"), row("E1", "l3"), row("E2", "l2"), row("E2", "l3")]);
    result = read();
    expect(result.missing).toEqual([{ case: "E1", level: "l2" }]);
    expect(logged[0]).toMatch(/^skip E1 L2: not exported \(listed in campaign_runs\.csv, files absent\)$/);

    // And once the files land, the same call publishes it.
    writeRun("E1", "l2");
    expect(read().series.map(run => `${run.caseId}-${run.level}`)).toEqual(["E1-l2", "E1-l3", "E2-l2", "E2-l3"]);
  });

  it("refuses a half-exported pair", () => {
    for (const caseId of CASES) for (const level of LEVELS) writeRun(caseId, level, { position: !(caseId === "E1" && level === "l2") });
    writeCsv(CASES.flatMap(caseId => LEVELS.map(level => row(caseId, level))));
    expect(read).toThrow(/E1 L2: only .*velE1_L2\.txt exported/);
  });

  it("refuses an exported series without its CSV row", () => {
    for (const caseId of CASES) for (const level of LEVELS) writeRun(caseId, level);
    writeCsv([row("E1", "l3"), row("E2", "l2"), row("E2", "l3")]);
    expect(read).toThrow(/E1 L2: series exported but no row/);
  });

  it("refuses a CSV row that disagrees with its file", () => {
    for (const caseId of CASES) for (const level of LEVELS) writeRun(caseId, level);
    writeCsv([row("E1", "l2", { steps: "4" }), row("E1", "l3"), row("E2", "l2"), row("E2", "l3")]);
    expect(read).toThrow(/3 rows, .* says 4 steps/);
    writeCsv([row("E1", "l2", { peak: "-0.03" }), row("E1", "l3"), row("E2", "l2"), row("E2", "l3")]);
    expect(read).toThrow(/peak -0\.02 at t = 0\.002, .* says -0\.03/);
  });
});

// The FEAT3 companion converter reads its own folder and feat3_runs.csv under the
// same rules, plus a D_over_h column that must match the level's mesh.
describe("readCampaignSeries on a FEAT3 runs table", () => {
  const FEAT3_HEADER = "case,level,rundir,slurm_job,binary,steps,dt_s,t_end_s,peak_vz_m_s,t_peak_s,D_over_h,ranks,solver_note";
  const CELLS = { l2: 11.4, l3: 23.9 };

  function feat3Row(caseId: string, level: string, dOverH = level === "l2" ? "11.414" : "23.918") {
    return `${caseId},${level.toUpperCase()},rundir,1,binary,3,0.001,0.003000,-2.00000000e-02,0.002000,${dOverH},32,default-mg`;
  }

  function writeFeat3Csv(rows: string[]) {
    writeFileSync(join(root, "campaign", "feat3_runs.csv"), `${[FEAT3_HEADER, ...rows].join("\n")}\n`);
  }

  const readFeat3 = () =>
    readCampaignSeries({
      root,
      campaignDir: "campaign",
      runsCsvName: "feat3_runs.csv",
      cases: CASES,
      levels: LEVELS,
      startHeight: 0.1275,
      log: (message: string) => logged.push(message)
    });

  it("publishes every pair against feat3_runs.csv and keeps the row for the extra columns", () => {
    for (const caseId of CASES) for (const level of LEVELS) writeRun(caseId, level);
    writeFeat3Csv(CASES.flatMap(caseId => LEVELS.map(level => feat3Row(caseId, level))));
    const { series, missing } = readFeat3();
    expect(series.map(run => `${run.caseId}-${run.level}`)).toEqual(["E1-l2", "E1-l3", "E2-l2", "E2-l3"]);
    expect(missing).toEqual([]);
    expect(series[0]).toMatchObject({ steps: 3, dt: 0.001, tEnd: 0.003, peakVz: -0.02, tPeak: 0.002 });
    expect(series[0].row.solver_note).toBe("default-mg");
    expect(cellsAcrossDiameter(series, CELLS, "feat3_runs.csv")).toEqual([11.414, 23.918, 11.414, 23.918]);
  });

  it("skips and logs a missing pair, naming feat3_runs.csv", () => {
    writeRun("E1", "l3");
    writeRun("E2", "l2");
    writeRun("E2", "l3");
    writeFeat3Csv(CASES.flatMap(caseId => LEVELS.map(level => feat3Row(caseId, level))));
    const { series, missing } = readFeat3();
    expect(series).toHaveLength(3);
    expect(missing).toEqual([{ case: "E1", level: "l2" }]);
    expect(logged).toEqual(["skip E1 L2: not exported (listed in feat3_runs.csv, files absent)"]);
  });

  it("refuses a peak, step count or mesh that disagrees with the row", () => {
    for (const caseId of CASES) for (const level of LEVELS) writeRun(caseId, level);
    const rows = CASES.flatMap(caseId => LEVELS.map(level => feat3Row(caseId, level)));
    writeFeat3Csv([rows[0].replace("-2.00000000e-02", "-2.10000000e-02"), ...rows.slice(1)]);
    expect(readFeat3).toThrow(/feat3_runs\.csv says -0\.021/);
    writeFeat3Csv([rows[0].replace(",3,0.001,", ",4,0.001,"), ...rows.slice(1)]);
    expect(readFeat3).toThrow(/3 rows, .*feat3_runs\.csv says 4 steps/);
    // An L2 run that claims the L3 mesh.
    writeFeat3Csv([feat3Row("E1", "l2", "23.918"), ...rows.slice(1)]);
    expect(() => cellsAcrossDiameter(readFeat3().series, CELLS, "feat3_runs.csv")).toThrow(
      /E1 L2: D_over_h = 23\.918, the L2 mesh has 11\.4/
    );
  });
});
