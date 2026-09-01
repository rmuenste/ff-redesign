// Builds the sub-grid lubrication material for the Particle Sedimentation page
// (campaign gate D2.2 G3).
//
// Companion to scripts/convert-sedimentation-data.mjs, which builds the core
// plot assets; kept separate for the same reason the validation converter is —
// the plot converter reads a sibling checkout that is not part of this
// repository, so it cannot be re-run here, while this material must stay
// rebuildable. Because both write into the same benchmark directory, this script
// MERGES into the existing manifest: it drops anything it previously owned (every
// path under plots/lubrication/ and downloads/lubrication/) and appends its own
// entries. Run it after the plot converter, never before.
//
// Inputs (curated under scripts/source-data/sedimentation/lubrication/):
//   approach_E{1,2}_base.csv   bottom-approach window, lubrication OFF
//   approach_E{1,2}_lub.csv    the same window with the model in production
//                              configuration, plus the lubrication force
//   cases.csv                  window, fluid density and the mesh clamp per case
//   brenner_bands.csv          the wall-approach benchmark that certifies the model
//   ../ref_E{1,2}.dat          digitised PIV, already curated for the core plots
//
// The approach files are the SED_BENCH_VEL / SED_BENCH_POS / DNS_LUB records of
// each run, one line per time step over the window and neither smoothed nor
// trimmed. Baselines are the certified lubrication-OFF runs behind the Results
// tab; the lubricated runs use identical decks with the model switched on.
//
// Everything quoted on the page is derived here: the activation gap from the mesh
// clamp, the buoyant weight from the case properties, the speed reduction at one
// and half a cell, the landing time, and the peak lubrication force.
//
// Outputs:
//   public/benchmark-assets/sedimentation/plots/lubrication/*.json
//   public/benchmark-assets/sedimentation/downloads/lubrication/*
//   src/data/generated/sedimentation-lubrication.json
//
// Run with: node scripts/convert-sedimentation-lubrication.mjs
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parseCsvRecords } from "./lib/csv.mjs";
import { createStoredZip } from "./lib/zip.mjs";

const root = resolve(import.meta.dirname, "..");
const srcDir = resolve(root, "scripts/source-data/sedimentation/lubrication");
const pivDir = resolve(root, "scripts/source-data/sedimentation");
const outDir = resolve(root, "public/benchmark-assets/sedimentation");
const generatedDir = resolve(root, "src/data/generated");

/** Case constants shared with the benchmark definition. */
const SPHERE_DIAMETER = 0.015;
const SPHERE_RADIUS = SPHERE_DIAMETER / 2;
const PARTICLE_DENSITY = 1120;
const GRAVITY = 9.81;

/**
 * The sphere is "landed" once its speed has fallen to this fraction of the speed
 * it carried at the activation gap. Any fixed fraction would do; what the page
 * reports is the RATIO of the two landing times, which is insensitive to it.
 */
const LANDED_FRACTION = 0.05;

const SERIES_COLORS = { base: "#ef6f6c", lub: "#7bd88f", piv: "var(--fg1)", activation: "var(--fg3)" };

function readSeries(name) {
  return parseCsvRecords(readFileSync(resolve(srcDir, name), "utf-8")).map(record => ({
    t: Number(record.time),
    u: Number(record.u),
    gap: Number(record.gap),
    fLub: record.f_lub === undefined || record.f_lub === "" ? null : Number(record.f_lub),
    pairs: record.n_pairs === undefined || record.n_pairs === "" ? null : Number(record.n_pairs)
  }));
}

function parsePairs(file) {
  return readFileSync(file, "utf-8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [x, y] = line.split(/[\s,;]+/).map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Invalid numeric pair in ${file}: ${line}`);
      return [x, y];
    });
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function trace(x, y, { name, color, mode = "lines", dash, symbol }) {
  return {
    x,
    y,
    type: "scatter",
    mode,
    name,
    line: { color, ...(dash ? { dash } : {}) },
    marker: { color, ...(symbol ? { symbol } : {}) }
  };
}

/** First sample at or below a gap, walking forward in time. */
function atGap(series, gap) {
  const found = series.find(point => point.gap <= gap);
  if (!found) throw new Error(`series never reaches gap ${gap}`);
  return found;
}

/**
 * Time from the activation gap until the sphere is at rest, i.e. down to
 * LANDED_FRACTION of the speed it had when the model switched on.
 */
function landingTime(series, activationGap) {
  const start = atGap(series, activationGap);
  const threshold = Math.abs(start.u) * LANDED_FRACTION;
  const landed = series.find(point => point.t >= start.t && Math.abs(point.u) <= threshold);
  if (!landed) throw new Error("series never comes to rest inside the published window");
  return { start: start.t, landed: landed.t, duration: landed.t - start.t };
}

const brennerBands = parseCsvRecords(readFileSync(resolve(srcDir, "brenner_bands.csv"), "utf-8")).map(
  record => ({
    model: record.model,
    label: record.label,
    band1h2h: Number(record.band_1h_2h),
    bandSub1h: Number(record.band_sub_1h)
  })
);

const cases = parseCsvRecords(readFileSync(resolve(srcDir, "cases.csv"), "utf-8")).map(record => {
  const id = record.case;
  const hMin = Number(record.h_min);
  const clampFactor = Number(record.clamp_factor);
  // The model activates where the mesh stops resolving the squeeze film.
  const activationGap = clampFactor * hMin;
  const rhoF = Number(record.rho_f);
  const volume = (Math.PI / 6) * SPHERE_DIAMETER ** 3;
  const buoyantWeight = (PARTICLE_DENSITY - rhoF) * volume * GRAVITY;

  const base = readSeries(`approach_${id}_base.csv`);
  const lub = readSeries(`approach_${id}_lub.csv`);

  const activation = atGap(base, activationGap);
  const lubActivation = atGap(lub, activationGap);
  if (Math.abs(activation.t - lubActivation.t) > 1e-9) {
    throw new Error(`${id}: the runs reach the activation gap at different times — not a controlled pair`);
  }

  // Speed reduction where the model is meant to act: one and half a cell of gap.
  const reductions = [1, 0.5].map(cells => {
    const gap = cells * hMin;
    const a = Math.abs(atGap(base, gap).u);
    const b = Math.abs(atGap(lub, gap).u);
    return { cells, base: a, lubricated: b, reduction: 1 - b / a };
  });

  const baseLanding = landingTime(base, activationGap);
  const lubLanding = landingTime(lub, activationGap);

  const forces = lub.map(point => Math.abs(point.fLub ?? 0));
  const peakForce = Math.max(...forces);
  const activeSteps = lub.filter(point => (point.pairs ?? 0) > 0).length;

  return {
    id,
    re: Number(record.re),
    rhoF,
    window: [Number(record.window_start), Number(record.window_end)],
    hMin,
    clampFactor,
    activationGap,
    activationTime: activation.t,
    activationSpeed: Math.abs(activation.u),
    buoyantWeight,
    reductions,
    landing: {
      base: baseLanding.duration,
      lubricated: lubLanding.duration,
      increase: lubLanding.duration / baseLanding.duration - 1
    },
    peakForce,
    peakForceRatio: peakForce / buoyantWeight,
    activeSteps,
    restingGap: { base: base[base.length - 1].gap, lubricated: lub[lub.length - 1].gap },
    series: { base, lub }
  };
});

// ---- assets -----------------------------------------------------------------
const OWNED = path => path.startsWith("plots/lubrication/") || path.startsWith("downloads/lubrication/");

const manifestPath = resolve(outDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
if (manifest.benchmarkId !== "sedimentation") {
  throw new Error(`unexpected manifest at ${manifestPath}: ${manifest.benchmarkId}`);
}
manifest.entries = manifest.entries.filter(entry => !OWNED(entry.newPath));

for (const dir of ["plots/lubrication", "downloads/lubrication"]) {
  rmSync(resolve(outDir, dir), { recursive: true, force: true });
}

const entries = [];
const zipEntries = [];

function emitPlot(metric, id, caseId, payload, { seriesGroupId, label, oldPath }) {
  const newPath = `plots/lubrication/${metric}/${caseId.toLowerCase()}-${id}.json`;
  writeJson(resolve(outDir, newPath), payload);
  entries.push({
    oldPath,
    newPath,
    metric: `lubrication-${metric}`,
    seriesGroupId,
    kind: seriesGroupId === "piv" ? "reference" : "code",
    label,
    sourceShape: "single-trace",
    derived: true
  });
}

for (const entry of cases) {
  const sourceOf = tag => `scripts/source-data/sedimentation/lubrication/approach_${entry.id}_${tag}.csv`;

  for (const [tag, label] of [["base", "FBM, no F_lub"], ["lub", "FBM + deficit model"]]) {
    const series = entry.series[tag === "base" ? "base" : "lub"];
    emitPlot(
      "approach",
      tag,
      entry.id,
      trace(series.map(p => p.t), series.map(p => p.u), {
        name: `${entry.id} ${label}`,
        color: SERIES_COLORS[tag],
        dash: tag === "base" ? "dash" : undefined
      }),
      { seriesGroupId: tag, label: `${entry.id} approach, ${label}`, oldPath: sourceOf(tag) }
    );
  }

  // PIV over the same window, from the reference file the core plots already use.
  const pivPath = `scripts/source-data/sedimentation/ref_${entry.id}.dat`;
  const piv = parsePairs(resolve(root, pivPath)).filter(
    ([t]) => t >= entry.window[0] && t <= entry.window[1]
  );
  emitPlot(
    "approach",
    "piv",
    entry.id,
    trace(piv.map(([t]) => t), piv.map(([, u]) => u), {
      name: `${entry.id} PIV`,
      color: SERIES_COLORS.piv,
      mode: "markers",
      symbol: "square-open"
    }),
    { seriesGroupId: "piv", label: `${entry.id} PIV, approach window`, oldPath: pivPath }
  );

  // The instant the mesh clamp arms the model, drawn as a vertical rule.
  const speeds = entry.series.base.map(p => p.u);
  emitPlot(
    "approach",
    "activation",
    entry.id,
    trace([entry.activationTime, entry.activationTime], [Math.min(...speeds) * 1.05, 0], {
      name: `Activation gap, ${entry.clampFactor} cells`,
      color: SERIES_COLORS.activation,
      dash: "dot"
    }),
    {
      seriesGroupId: "activation",
      label: `${entry.id} activation gap`,
      oldPath: sourceOf("base")
    }
  );

  emitPlot(
    "film",
    "flub",
    entry.id,
    trace(
      entry.series.lub.map(p => p.t),
      entry.series.lub.map(p => Math.abs(p.fLub ?? 0) / entry.buoyantWeight),
      { name: `${entry.id} |F_lub| / buoyant weight`, color: SERIES_COLORS.lub }
    ),
    { seriesGroupId: "flub", label: `${entry.id} lubrication force`, oldPath: sourceOf("lub") }
  );
}

// ---- downloads --------------------------------------------------------------
const downloadNames = [
  ...cases.flatMap(entry => [`approach_${entry.id}_base.csv`, `approach_${entry.id}_lub.csv`]),
  "cases.csv",
  "brenner_bands.csv"
];

for (const name of downloadNames) {
  const newPath = `downloads/lubrication/${name}`;
  mkdirSync(dirname(resolve(outDir, newPath)), { recursive: true });
  copyFileSync(resolve(srcDir, name), resolve(outDir, newPath));
  entries.push({
    oldPath: `scripts/source-data/sedimentation/lubrication/${name}`,
    newPath,
    kind: "download",
    label: name
  });
  zipEntries.push({ name: `sedimentation-lubrication/${name}`, data: readFileSync(resolve(outDir, newPath)) });
}

const zipName = "downloads/lubrication/sedimentation-lubrication.zip";
writeFileSync(resolve(outDir, zipName), createStoredZip(zipEntries));
entries.push({
  oldPath: "generated from sedimentation lubrication downloads",
  newPath: zipName,
  kind: "download",
  label: "sedimentation-lubrication.zip"
});

manifest.entries.push(...entries);
writeJson(manifestPath, manifest);

// ---- derived numbers --------------------------------------------------------
writeJson(resolve(generatedDir, "sedimentation-lubrication.json"), {
  source: "scripts/source-data/sedimentation/lubrication",
  generatedBy: "scripts/convert-sedimentation-lubrication.mjs",
  sphere: { diameter: SPHERE_DIAMETER, radius: SPHERE_RADIUS, density: PARTICLE_DENSITY },
  landedFraction: LANDED_FRACTION,
  brennerBands,
  // The series stay in the published CSVs; only the statistics travel into the app.
  cases: cases.map(({ series, ...rest }) => rest)
});

const emitted = readdirSync(resolve(outDir, "plots/lubrication"), { recursive: true }).length;
console.log(
  `Generated ${entries.length} sedimentation lubrication manifest entries (${emitted} plot paths), ` +
    cases
      .map(
        entry =>
          `${entry.id}: u(1h) -${(entry.reductions[0].reduction * 100).toFixed(0)}%, ` +
          `landing +${(entry.landing.increase * 100).toFixed(0)}%, ` +
          `peak F_lub ${entry.peakForceRatio.toFixed(2)} W`
      )
      .join("; ")
);
