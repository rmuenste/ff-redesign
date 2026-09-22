// Builds the hindered-settling (D3.2) benchmark assets.
//
// Inputs (curated under scripts/source-data/):
//   hindered-settling/ladder_6d.csv        plateau statistics per run, walled 6d column
//   hindered-settling/ladder_wide.csv      the same for the 12d control column
//   hindered-settling/terminal_velocity.csv single-particle reference per column
//   hindered-settling/history_*.dat        two-column settling histories (t, U/u_t)
//   dns/dns_validation_datasheet.csv       the campaign's claim ledger
//
// The ladder statistics are produced by tools/d32_ladder_analysis.py in the
// FeatFloWer repository (plateau window t = 15-25, radius 0.5, cross-section area
// 36 for the 6d column and 144 for the 12d control), so the published table cannot
// drift from the campaign's own analysis. The histories are the instantaneous mean
// swarm velocity from the same per-step particle records, sampled every fifth step.
//
// Outputs:
//   public/benchmark-assets/hindered-settling/       Plotly traces, downloads, manifest
//   src/data/generated/hindered-settling.json        tables and fitted exponents
//   src/data/generated/hindered-settling-validation.json  Validation-tab rows
//
// Run with: node scripts/convert-hindered-settling-data.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parseCsvRecords } from "./lib/csv.mjs";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";
import { createStoredZip } from "./lib/zip.mjs";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/hindered-settling");
const outDir = resolve(root, "public/benchmark-assets/hindered-settling");
const generatedDir = resolve(root, "src/data/generated");

/** Cloud sizes on the ladder, in plot order. */
const CLOUD_SIZES = [20, 40, 80, 120];

/** Unbounded-suspension Richardson-Zaki / Rowe exponent band. */
const ROWE_BAND = [2.7, 3.0];

const SIZE_COLORS = { 20: "#5fb8ff", 40: "#f5b84b", 80: "#7bd88f", 120: "#ef6f6c" };
const COLUMN_COLORS = { confined: "#5fb8ff", wide: "#ef6f6c" };

function readLadder(name) {
  return parseCsvRecords(readFileSync(resolve(srcDir, name), "utf-8")).map(record => ({
    n: Number(record.N),
    seed: Number(record.seed),
    u: Number(record.U),
    uStd: Number(record.U_std),
    uOverUt: Number(record.U_over_ut),
    phiCloud: Number(record.phi_cloud),
    phiEnvelope: Number(record.phi_envelope),
    spread: Number(record.spread)
  }));
}

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

/**
 * Richardson-Zaki exponent, least squares through the origin:
 * ln(U/u_t) = n * ln(1 - phi). Through-origin is the right constraint because a
 * vanishing cloud must settle at the single-particle terminal velocity.
 */
function richardsonZakiFit(rows, phiOf) {
  const points = rows.map(row => [Math.log(1 - phiOf(row)), Math.log(row.uOverUt)]);
  const sxx = points.reduce((sum, [x]) => sum + x * x, 0);
  const sxy = points.reduce((sum, [x, y]) => sum + x * y, 0);
  const n = sxy / sxx;
  const residuals = points.map(([x, y]) => y - n * x);
  const rms = Math.sqrt(residuals.reduce((sum, e) => sum + e * e, 0) / residuals.length);
  return { n, rms, count: points.length };
}

/** Mean over a numeric list. */
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Group ladder rows by cloud size, preserving ladder order. */
function bySize(rows) {
  return CLOUD_SIZES.map(n => ({ n, rows: rows.filter(row => row.n === n) })).filter(
    entry => entry.rows.length
  );
}

function markerTrace(x, y, { name, color, symbol = "circle" }) {
  return {
    x,
    y,
    type: "scatter",
    mode: "markers",
    name,
    marker: { color, symbol, size: 9 },
    line: { color }
  };
}

function lineTrace(x, y, { name, color, dash }) {
  return {
    x,
    y,
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

const confined = readLadder("ladder_6d.csv");
const wide = readLadder("ladder_wide.csv");
const terminal = parseCsvRecords(readFileSync(resolve(srcDir, "terminal_velocity.csv"), "utf-8")).map(
  record => ({
    column: record.column,
    crossSection: record.cross_section,
    ut: Number(record.u_t),
    utStd: record.u_t_std ? Number(record.u_t_std) : null
  })
);

if (confined.length !== 12 || wide.length !== 6) {
  throw new Error(`unexpected ladder sizes: ${confined.length} confined, ${wide.length} wide`);
}

// The confined ladder is fitted against the vessel volume fraction: there the cloud
// fills the cross-section, so vessel and cloud-envelope concentrations coincide (the
// curated table carries both and they agree to a few per cent at every rung).
const fit = richardsonZakiFit(confined, row => row.phiCloud);

// The wide control has only two rungs, and its cloud occupies a small part of the
// cross-section, so the fair concentration is the cloud's own envelope. The sign of
// the resulting slope — not its value — is the result.
const wideSizes = bySize(wide);
const wideSlope = (() => {
  const [low, high] = wideSizes;
  const phiLow = mean(low.rows.map(row => row.phiEnvelope));
  const phiHigh = mean(high.rows.map(row => row.phiEnvelope));
  const uLow = mean(low.rows.map(row => row.uOverUt));
  const uHigh = mean(high.rows.map(row => row.uOverUt));
  return {
    n: (Math.log(uHigh) - Math.log(uLow)) / (Math.log(1 - phiHigh) - Math.log(1 - phiLow)),
    rungs: [
      { n: low.n, phiEnvelope: phiLow, uOverUt: uLow },
      { n: high.n, phiEnvelope: phiHigh, uOverUt: uHigh }
    ]
  };
})();

const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId: "hindered-settling" });

const entries = [];
const zipEntries = [];

function emitPlot(metric, id, traces, { seriesGroupId, label, shape }) {
  const newPath = `plots/${metric}/${id}.json`;
  writeJson(resolve(outDir, newPath), traces);
  entries.push({
    oldPath: `scripts/source-data/hindered-settling/${
      metric === "history" ? `history_*.dat` : `ladder_*.csv`
    }`,
    newPath,
    metric,
    seriesGroupId,
    kind: "code",
    label,
    sourceShape: shape,
    derived: true
  });
}

// ---- collapse: ln(U/u_t) against ln(1 - phi) --------------------------------
// Plotted in the coordinates the power law is fitted in, so the collapse and the
// exponent are the same statement and no log axis is needed.
for (const { n, rows } of bySize(confined)) {
  emitPlot(
    "collapse",
    `n${n}`,
    markerTrace(
      rows.map(row => Math.log(1 - row.phiCloud)),
      rows.map(row => Math.log(row.uOverUt)),
      { name: `N = ${n}`, color: SIZE_COLORS[n] }
    ),
    { seriesGroupId: `n${n}`, label: `Confined ladder, N = ${n}`, shape: "single-trace" }
  );
}

const collapseX = [Math.min(...confined.map(row => Math.log(1 - row.phiCloud))) * 1.05, 0];
emitPlot(
  "collapse",
  "fit",
  lineTrace(collapseX, collapseX.map(x => fit.n * x), {
    name: `Fit, n = ${fit.n.toFixed(2)}`,
    color: "var(--fg1)"
  }),
  { seriesGroupId: "fit", label: "Richardson-Zaki fit", shape: "single-trace" }
);

emitPlot(
  "collapse",
  "rowe",
  ROWE_BAND.map(n =>
    lineTrace(collapseX, collapseX.map(x => n * x), {
      name: `n = ${n.toFixed(1)}`,
      color: "var(--fg3)",
      dash: "dash"
    })
  ),
  { seriesGroupId: "rowe", label: "Unbounded Rowe/RZ band", shape: "trace-array" }
);

// ---- hindrance: U/u_t against cloud size, both columns -----------------------
// Cloud size is the one abscissa both geometries share unambiguously: the clouds
// are identical, only the vessel differs.
for (const [id, rows] of [["confined", confined], ["wide", wide]]) {
  emitPlot(
    "hindrance",
    id,
    markerTrace(rows.map(row => row.n), rows.map(row => row.uOverUt), {
      name: id === "confined" ? "6d column" : "12d column",
      color: COLUMN_COLORS[id],
      symbol: id === "confined" ? "circle" : "diamond"
    }),
    { seriesGroupId: id, label: `${id === "confined" ? "6d" : "12d"} column plateau`, shape: "single-trace" }
  );
}

emitPlot(
  "hindrance",
  "unhindered",
  lineTrace([0, CLOUD_SIZES[CLOUD_SIZES.length - 1] + 10], [1, 1], {
    name: "Single-particle u_t",
    color: "var(--fg3)",
    dash: "dash"
  }),
  { seriesGroupId: "unhindered", label: "Single-particle terminal velocity", shape: "single-trace" }
);

// ---- history: U/u_t against time --------------------------------------------
// One file per cloud size, holding that size's columns as traces. Grouping by
// size and varying by column keeps trace 0 the 6d column in every file, which is
// what lets the panel's positional variant selection stay meaningful for the two
// sizes that were only run confined.
const HISTORY_COLUMNS = { "6d": "6d column", wide: "12d column" };
const WIDE_SIZES = new Set([40, 120]);

for (const n of CLOUD_SIZES) {
  const prefixes = ["6d", ...(WIDE_SIZES.has(n) ? ["wide"] : [])];
  emitPlot(
    "history",
    `n${n}`,
    prefixes.map(prefix => {
      const pairs = parsePairs(resolve(srcDir, `history_${prefix}_n${n}.dat`));
      return lineTrace(pairs.map(([x]) => x), pairs.map(([, y]) => y), {
        name: HISTORY_COLUMNS[prefix],
        color: SIZE_COLORS[n]
      });
    }),
    { seriesGroupId: `n${n}`, label: `Settling history, N = ${n}`, shape: "trace-array" }
  );
}

// ---- downloads --------------------------------------------------------------
const downloadNames = [
  "ladder_6d.csv",
  "ladder_wide.csv",
  "terminal_velocity.csv",
  ...["6d_n20", "6d_n40", "6d_n80", "6d_n120", "wide_n40", "wide_n120"].map(
    stem => `history_${stem}.dat`
  )
];

for (const name of downloadNames) {
  const newPath = `downloads/${name}`;
  mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
  copyFileSync(resolve(srcDir, name), resolve(outDir, newPath));
  entries.push({
    oldPath: `scripts/source-data/hindered-settling/${name}`,
    newPath,
    kind: "download",
    label: name
  });
  zipEntries.push({
    name: `hindered-settling/${name}`,
    data: readFileSync(resolve(outDir, newPath))
  });
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
  name: `hindered-settling/${datasheetName}`,
  data: readFileSync(resolve(outDir, `downloads/${datasheetName}`))
});

writeFileSync(resolve(outDir, "downloads/hindered-settling.zip"), createStoredZip(zipEntries));
entries.push({
  oldPath: "generated from hindered-settling downloads",
  newPath: "downloads/hindered-settling.zip",
  kind: "download",
  label: "hindered-settling.zip"
});

writeManifest(outDir, "hindered-settling", entries, preserved);

// ---- tables and fits --------------------------------------------------------
writeJson(resolve(generatedDir, "hindered-settling.json"), {
  source: "scripts/source-data/hindered-settling",
  generatedBy: "scripts/convert-hindered-settling-data.mjs",
  window: [15, 25],
  terminal,
  ladder: { confined, wide },
  fit,
  wideSlope,
  roweBand: ROWE_BAND
});

// ---- validation ledger ------------------------------------------------------
// Generated from the datasheet, never hand-written.
//
// Selection policy
// ----------------
// Published: the single-particle reference, the closed phi ladder and the
// wide-column attribution verdict — the three rows that carry the result as it
// stands. Withheld: the N=40 pathfinder, superseded by the full ladder, and the
// design row for the wide column, which records submission logistics rather than a
// measurement. The datasheet download under Reference Data carries every row.
const PUBLISHED = new Set(["d32_ut_ref", "d32_phi_ladder", "d32_wide_attribution"]);

const records = readDatasheet(resolve(root, datasheetSource));
const ledger = buildLedger(records, record => PUBLISHED.has(record.case.trim()));

writeJson(resolve(generatedDir, "hindered-settling-validation.json"), {
  source: datasheetSource,
  generatedBy: "scripts/convert-hindered-settling-data.mjs",
  rows: ledger
});

console.log(
  `Generated ${entries.length} hindered-settling manifest entries in ${relative(root, outDir)}, ` +
    `RZ exponent n = ${fit.n.toFixed(2)} (rms ${fit.rms.toFixed(3)}, ${fit.count} runs), ` +
    `wide two-rung slope n = ${wideSlope.n.toFixed(2)}, and ${ledger.length} validation rows`
);
