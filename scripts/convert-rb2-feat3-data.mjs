// Builds the FEAT3 contribution to Case 1 of the 2D rising-bubble (RB2) benchmark.
//
// Inputs (curated under scripts/source-data/rb2-feat3/, copied unchanged from the
// FEAT3 run directories):
//   runs.csv              one row per site level: FEAT3 level, run directory, cells,
//                         Q2 nodes (both from the run's console.log), time step,
//                         end time and the FEAT3 commit (the run's git_revision.txt)
//   bench_l<n>.txt        the run's bench.txt: a header line
//                         "# time area circularity y_c rise_velocity", then one row
//                         per time step from t = 0 to t = 3, full resolution
//   interface_l<n>.vtp    the run's interface.0012.vtp, the interface at t = 3: ASCII
//                         VTK PolyData with one 5-point polyline per curved Q2
//                         interface edge, ordered along the edge (end node, two
//                         points on the quadratic curve around the midpoint node, end
//                         node); the polylines themselves are in no global order
//
// The site levels l1/l2/l3 are FEAT3 levels 2/3/4, matched to TP2D's h = 1/40,
// 1/80, 1/160 by the total number of degrees of freedom,
// NDOF = 2 * (Q2 nodes) + 3 * cells (Q2 velocity, P1dc pressure).
//
// Derived here:
//   - the four time series per level, every PLOT_STRIDE-th row (t = 0 and t = 3
//     always kept); y is the bench.txt column, and "mass" plots the area as a
//     percentage of the exact initial bubble area pi * r0^2 (r0 = 0.25), the unit
//     every other code's mass plot on the page is in (the legacy plot files are
//     100 * A / (pi * r0^2) of the group files' column 2);
//   - the shape at t = 3 per level, every polyline split into consecutive point
//     pairs, the segment-pair format the page's segmented-shape source reads;
//   - the key values per level, from the full-resolution bench.txt: the minimum
//     circularity and its time, the maximum rise velocity and its time, and the
//     centre of mass at t = 3. src/data/rb2.test.ts pins them.
//
// Outputs:
//   public/benchmark-assets/rb2/plots/case-1/<metric>/feat3-<level>.json
//   public/benchmark-assets/rb2/downloads/feat3-case1.zip
//       c1feat3l<n>.txt   time, area, circularity, y_c, rise velocity (no header)
//       c1feat3l<n>s.txt  shape at t = 3 as segment pairs, x and y
//   public/benchmark-assets/rb2/manifest.json   entries for the files above; every
//       other entry (the migrated legacy data of TP2D, FreeLIFE, MooNMD and
//       FeatFloWer) is carried over unchanged
//   src/data/generated/rb2-feat3.json            level table and key values
//
// Run with: node scripts/convert-rb2-feat3-data.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parseCsvRecords } from "./lib/csv.mjs";
import { resetGeneratedOutputs, writeManifest } from "./lib/output-dir.mjs";
import { createDeflatedZip } from "./lib/zip.mjs";

const BENCHMARK = "rb2";
const CASE = "case-1";
const CODE = "feat3";
const LABEL = "FEAT3";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/rb2-feat3");
const outDir = resolve(root, `public/benchmark-assets/${BENCHMARK}`);
const generatedPath = resolve(root, "src/data/generated/rb2-feat3.json");

/** Every 4th row of k = 2.5e-4 is a sample every 1e-3: 3001 points over [0, 3]. */
const PLOT_STRIDE = 4;
/** Significant digits kept in the plot JSONs (the downloads keep every digit). */
const PLOT_DIGITS = 8;
/** Interface edges at FEAT3 level 2; every refinement halves each edge. */
const INTERFACE_EDGES_L2 = 72;
/** Points per interface polyline in the .vtp. */
const POINTS_PER_EDGE = 5;

const COLUMNS = ["time", "area", "circularity", "y_c", "rise_velocity"];
const COL = Object.fromEntries(COLUMNS.map((name, index) => [name, index]));

/** Exact area of the initial bubble, radius 0.25: the 100 % of the mass plots. */
const INITIAL_AREA = Math.PI * 0.25 ** 2;

/** Plotted time series: page metric id -> bench.txt column, and the plotted unit. */
const SERIES = [
  { metric: "center-of-mass", column: COL.y_c, scale: 1 },
  { metric: "circularity", column: COL.circularity, scale: 1 },
  { metric: "rise-velocity", column: COL.rise_velocity, scale: 1 },
  { metric: "mass", column: COL.area, scale: 100 / INITIAL_AREA }
];

const ZIP_PATH = "downloads/feat3-case1.zip";
const ZIP_FOLDER = "feat3-case1";

function plotPath(metric, level) {
  return `plots/${CASE}/${metric}/${CODE}-${level}.json`;
}

function round(value) {
  return Number(value.toPrecision(PLOT_DIGITS));
}

function sourcePath(name) {
  return relative(root, resolve(srcDir, name));
}

function writeJson(path, value, { pretty = false } = {}) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)}\n`);
}

/** The group-file number format: %25.16E with a two-digit exponent, as in quantities.zip. */
function fixed(value) {
  const [mantissa, exponent] = value.toExponential(16).split("e");
  const sign = exponent.startsWith("-") ? "-" : "+";
  const digits = exponent.replace(/^[+-]/, "").padStart(2, "0");
  return `${mantissa}e${sign}${digits}`.padStart(25);
}

function readBench(name, { timeStep, endTime }) {
  const lines = readFileSync(resolve(srcDir, name), "utf-8").split("\n");
  const header = lines[0].replace(/^#\s*/, "").trim().split(/\s+/);
  if (header.join(" ") !== COLUMNS.join(" ")) {
    throw new Error(`${name}: unexpected header "${lines[0]}"`);
  }
  const rows = lines
    .slice(1)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const values = line.split(/\s+/).map(Number);
      if (values.length !== COLUMNS.length || values.some(value => !Number.isFinite(value))) {
        throw new Error(`${name} row ${index + 2}: expected ${COLUMNS.length} numeric columns`);
      }
      return values;
    });

  const steps = Math.round(endTime / timeStep);
  if (rows.length !== steps + 1) {
    throw new Error(`${name}: ${rows.length} rows, expected ${steps + 1} (t = 0 to ${endTime} in steps of ${timeStep})`);
  }
  rows.forEach((row, index) => {
    if (Math.abs(row[COL.time] - index * timeStep) > 1e-9) {
      throw new Error(`${name} row ${index + 2}: t = ${row[COL.time]}, expected ${index * timeStep}`);
    }
  });
  return rows;
}

/** Indices 0, stride, 2 * stride, ..., always ending on the last row. */
function strideIndices(length, stride) {
  const indices = [];
  for (let index = 0; index < length; index += stride) indices.push(index);
  if (indices[indices.length - 1] !== length - 1) indices.push(length - 1);
  return indices;
}

/** Row of the extreme value of a column; the first one on a tie. */
function extreme(rows, column, better) {
  let best = 0;
  for (let index = 1; index < rows.length; index += 1) {
    if (better(rows[index][column], rows[best][column])) best = index;
  }
  return rows[best];
}

function keyValues(rows) {
  const minCircularity = extreme(rows, COL.circularity, (a, b) => a < b);
  const maxRise = extreme(rows, COL.rise_velocity, (a, b) => a > b);
  const last = rows[rows.length - 1];
  return {
    minCircularity: minCircularity[COL.circularity],
    minCircularityTime: minCircularity[COL.time],
    maxRiseVelocity: maxRise[COL.rise_velocity],
    maxRiseVelocityTime: maxRise[COL.time],
    centerOfMassEnd: last[COL.y_c],
    endTime: last[COL.time]
  };
}

/** The text content of the first <DataArray> whose opening tag matches `pattern`. */
function dataArray(xml, pattern, name) {
  const match = new RegExp(`<DataArray[^>]*${pattern}[^>]*>([\\s\\S]*?)</DataArray>`).exec(xml);
  if (!match) throw new Error(`${name}: no DataArray matching ${pattern}`);
  return match[1].trim().split(/\s+/).map(Number);
}

/**
 * The interface as polylines of [x, y] points, in file order. Z is zero for this
 * 2D run and is checked, then dropped.
 */
function readInterface(name) {
  const xml = readFileSync(resolve(srcDir, name), "utf-8");
  const piece = /<Piece NumberOfPoints="(\d+)"[^>]*NumberOfLines="(\d+)"/.exec(xml);
  if (!piece) throw new Error(`${name}: no PolyData piece`);
  const [pointCount, lineCount] = [Number(piece[1]), Number(piece[2])];

  const coordinates = dataArray(xml, 'NumberOfComponents="3"', name);
  const connectivity = dataArray(xml, 'Name="connectivity"', name);
  const offsets = dataArray(xml, 'Name="offsets"', name);
  if (coordinates.length !== 3 * pointCount) throw new Error(`${name}: ${coordinates.length / 3} points, expected ${pointCount}`);
  if (offsets.length !== lineCount) throw new Error(`${name}: ${offsets.length} lines, expected ${lineCount}`);

  const points = [];
  for (let index = 0; index < pointCount; index += 1) {
    const [x, y, z] = coordinates.slice(3 * index, 3 * index + 3);
    if (z !== 0) throw new Error(`${name}: point ${index} has z = ${z}`);
    points.push([x, y]);
  }

  const lines = [];
  let start = 0;
  for (const end of offsets) {
    const line = connectivity.slice(start, end).map(index => points[index]);
    if (line.length !== POINTS_PER_EDGE) throw new Error(`${name}: polyline with ${line.length} points`);
    lines.push(line);
    start = end;
  }
  return lines;
}

/**
 * Check that the polylines close up: every end node is shared by exactly two
 * edges. A gap or a stray edge would show as a broken outline on the page.
 */
function assertClosed(lines, name) {
  const ends = new Map();
  for (const line of lines) {
    for (const [x, y] of [line[0], line[line.length - 1]]) {
      const key = `${x.toPrecision(15)} ${y.toPrecision(15)}`;
      ends.set(key, (ends.get(key) ?? 0) + 1);
    }
  }
  for (const [key, count] of ends) {
    if (count !== 2) throw new Error(`${name}: end node ${key} is shared by ${count} edges, expected 2`);
  }
}

/** Consecutive point pairs of every polyline: (p0, p1), (p1, p2), ... */
function segmentPairs(lines) {
  const pairs = [];
  for (const line of lines) {
    for (let index = 0; index + 1 < line.length; index += 1) pairs.push(line[index], line[index + 1]);
  }
  return pairs;
}

// ---- Runs -------------------------------------------------------------------

const runs = parseCsvRecords(readFileSync(resolve(srcDir, "runs.csv"), "utf-8")).map(record => ({
  siteLevel: record.site_level,
  feat3Level: Number(record.feat3_level),
  runDir: record.run_dir,
  cells: Number(record.cells),
  q2Nodes: Number(record.q2_nodes),
  timeStep: Number(record.time_step),
  endTime: Number(record.end_time),
  gitRevision: record.git_revision
}));

if (runs.map(run => run.siteLevel).join(",") !== "l1,l2,l3") {
  throw new Error(`runs.csv: expected site levels l1,l2,l3, got ${runs.map(run => run.siteLevel).join(",")}`);
}

// ---- Outputs ----------------------------------------------------------------

const owned = [
  ...runs.flatMap(run => [...SERIES.map(series => series.metric), "shape"].map(metric => plotPath(metric, run.siteLevel))),
  ZIP_PATH
];
const preserved = resetGeneratedOutputs(outDir, owned, { benchmarkId: BENCHMARK });

const entries = [];
const zipFiles = [];
const levels = [];

for (const run of runs) {
  const level = run.siteLevel;
  const benchName = `bench_${level}.txt`;
  const interfaceName = `interface_${level}.vtp`;
  const rows = readBench(benchName, run);

  // Time series.
  const indices = strideIndices(rows.length, PLOT_STRIDE);
  for (const series of SERIES) {
    const newPath = plotPath(series.metric, level);
    writeJson(resolve(outDir, newPath), {
      x: indices.map(index => round(rows[index][COL.time])),
      y: indices.map(index => round(rows[index][series.column] * series.scale)),
      type: "scatter",
      mode: "lines",
      name: LABEL
    });
    entries.push({
      oldPath: sourcePath(benchName),
      newPath,
      kind: "code",
      caseId: CASE,
      metric: series.metric,
      seriesGroupId: CODE,
      levelId: level,
      label: `${LABEL} ${level.toUpperCase()}`,
      sourceShape: "single-trace",
      derived: true
    });
  }

  // Shape at t = 3.
  const lines = readInterface(interfaceName);
  const expectedEdges = INTERFACE_EDGES_L2 * 2 ** (run.feat3Level - 2);
  if (lines.length !== expectedEdges) {
    throw new Error(`${interfaceName}: ${lines.length} interface edges, expected ${expectedEdges} at FEAT3 level ${run.feat3Level}`);
  }
  assertClosed(lines, interfaceName);
  const pairs = segmentPairs(lines);
  const shapePath = plotPath("shape", level);
  writeJson(resolve(outDir, shapePath), {
    x: pairs.map(([x]) => round(x)),
    y: pairs.map(([, y]) => round(y)),
    type: "scatter",
    mode: "lines",
    name: LABEL
  });
  entries.push({
    oldPath: sourcePath(interfaceName),
    newPath: shapePath,
    kind: "code",
    caseId: CASE,
    metric: "shape",
    seriesGroupId: CODE,
    levelId: level,
    label: `${LABEL} ${level.toUpperCase()}`,
    sourceShape: "segmented-shape",
    derived: true
  });

  // Group-format downloads, full resolution.
  zipFiles.push({
    name: `${ZIP_FOLDER}/c1feat3${level}.txt`,
    data: Buffer.from(rows.map(row => row.map(fixed).join("")).join("\n") + "\n")
  });
  zipFiles.push({
    name: `${ZIP_FOLDER}/c1feat3${level}s.txt`,
    data: Buffer.from(pairs.map(([x, y]) => fixed(x) + fixed(y)).join("\n") + "\n")
  });

  const values = keyValues(rows);
  if (Math.abs(values.endTime - run.endTime) > 1e-9) {
    throw new Error(`${benchName}: last row at t = ${values.endTime}, expected ${run.endTime}`);
  }
  levels.push({
    siteLevel: level,
    feat3Level: run.feat3Level,
    runDir: run.runDir,
    cells: run.cells,
    q2Nodes: run.q2Nodes,
    ndof: 2 * run.q2Nodes + 3 * run.cells,
    interfaceEdges: lines.length,
    timeStep: run.timeStep,
    steps: rows.length - 1,
    gitRevision: run.gitRevision,
    plotPoints: indices.length,
    shapeSegments: pairs.length / 2,
    minCircularity: values.minCircularity,
    minCircularityTime: values.minCircularityTime,
    maxRiseVelocity: values.maxRiseVelocity,
    maxRiseVelocityTime: values.maxRiseVelocityTime,
    centerOfMassEnd: values.centerOfMassEnd
  });
}

writeFileSync(resolve(outDir, ZIP_PATH), createDeflatedZip(zipFiles));
entries.push({
  oldPath: relative(root, srcDir),
  newPath: ZIP_PATH,
  kind: "download",
  label: "FEAT3 Case 1 reference data",
  derived: true
});

writeManifest(outDir, BENCHMARK, entries, preserved);

writeJson(
  generatedPath,
  {
    generatedBy: "scripts/convert-rb2-feat3-data.mjs",
    source: relative(root, srcDir),
    caseId: CASE,
    plotStride: PLOT_STRIDE,
    levels
  },
  { pretty: true }
);

for (const level of levels) {
  console.log(
    `${level.siteLevel} (FEAT3 L${level.feat3Level}, NDOF ${level.ndof}): ` +
      `min circularity ${level.minCircularity.toFixed(7)} at t = ${level.minCircularityTime.toFixed(4)}, ` +
      `max rise velocity ${level.maxRiseVelocity.toFixed(7)} at t = ${level.maxRiseVelocityTime.toFixed(4)}, ` +
      `y_c(3) ${level.centerOfMassEnd.toFixed(7)}`
  );
}
console.log(`wrote ${entries.length} manifest entries and ${zipFiles.length} files in ${ZIP_PATH}`);
