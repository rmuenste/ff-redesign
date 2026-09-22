import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AssetManifest } from "./types";

const RB3_DIR = resolve(process.cwd(), "public/benchmark-assets/rb3");
const RB2_DIR = resolve(process.cwd(), "public/benchmark-assets/rb2");
const FAC3_DIR = resolve(process.cwd(), "public/benchmark-assets/fac3");
const FSI_DIR = resolve(process.cwd(), "public/benchmark-assets/fsi");
const SEDIMENTATION_DIR = resolve(process.cwd(), "public/benchmark-assets/sedimentation");
const DKT_DIR = resolve(process.cwd(), "public/benchmark-assets/dkt");
const HINDERED_DIR = resolve(process.cwd(), "public/benchmark-assets/hindered-settling");
const VISCOMETER_DIR = resolve(process.cwd(), "public/benchmark-assets/numerical-viscometer");
const OBERBECK_DIR = resolve(process.cwd(), "public/benchmark-assets/oberbeck-spheroid-drag");
const JEFFERY_DIR = resolve(process.cwd(), "public/benchmark-assets/jeffery-orbit");
const CANONICAL_METRICS = new Set(["sphericity", "mass", "size", "surface"]);
const RB2_METRICS = new Set(["shape", "center-of-mass", "circularity", "rise-velocity", "mass"]);
const RB2_CASES = new Set(["case-1", "case-2"]);
const RB2_CODES = new Set(["tp2d", "freelife", "moonmd", "featflower"]);

const manifest = JSON.parse(readFileSync(resolve(RB3_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const rb2Manifest = JSON.parse(readFileSync(resolve(RB2_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const fac3Manifest = JSON.parse(readFileSync(resolve(FAC3_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const fsiManifest = JSON.parse(readFileSync(resolve(FSI_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const sedimentationManifest = JSON.parse(readFileSync(resolve(SEDIMENTATION_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const dktManifest = JSON.parse(readFileSync(resolve(DKT_DIR, "manifest.json"), "utf-8")) as AssetManifest;
const hinderedManifest = JSON.parse(
  readFileSync(resolve(HINDERED_DIR, "manifest.json"), "utf-8")
) as AssetManifest;
const viscometerManifest = JSON.parse(
  readFileSync(resolve(VISCOMETER_DIR, "manifest.json"), "utf-8")
) as AssetManifest;
const oberbeckManifest = JSON.parse(
  readFileSync(resolve(OBERBECK_DIR, "manifest.json"), "utf-8")
) as AssetManifest;
const jefferyManifest = JSON.parse(
  readFileSync(resolve(JEFFERY_DIR, "manifest.json"), "utf-8")
) as AssetManifest;

function listPlotFiles(): string[] {
  const plotsDir = resolve(RB3_DIR, "plots");
  return readdirSync(plotsDir, { withFileTypes: true }).flatMap(metricDir =>
    metricDir.isDirectory()
      ? readdirSync(resolve(plotsDir, metricDir.name)).map(file => `plots/${metricDir.name}/${file}`)
      : []
  );
}

function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = resolve(dir, entry.name);
    return entry.isDirectory() ? listFiles(abs, rel) : [rel];
  });
}

/**
 * Gallery stills live under `media/gallery/` in the benchmark that owns them.
 * They are a separate population from the migrated plot and download material,
 * so the per-benchmark counts below exclude them and the shared block at the
 * bottom of this file checks them in one place. The registry that drives the
 * gallery page is src/data/gallery.ts, tested in src/data/gallery.test.ts.
 */
const isGallery = (entry: { newPath: string }) => entry.newPath.startsWith("media/gallery/");

describe("rb3 asset manifest (public/benchmark-assets/rb3/manifest.json)", () => {
  it("is the single source of truth: not duplicated in app code", () => {
    expect(existsSync(resolve(process.cwd(), "src/data/assets.ts"))).toBe(true);
    const assetsSrc = readFileSync(resolve(process.cwd(), "src/data/assets.ts"), "utf-8");
    expect(assetsSrc).not.toMatch(/rb3AssetManifest/);
  });

  it("has 19 entries", () => {
    expect(manifest.entries).toHaveLength(19);
  });

  it("every manifest newPath exists on disk", () => {
    for (const entry of manifest.entries) {
      expect(existsSync(resolve(RB3_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("every plot file on disk is covered by the manifest (no orphans)", () => {
    const mapped = new Set(manifest.entries.map(entry => entry.newPath));
    for (const plotFile of listPlotFiles()) {
      expect(mapped.has(plotFile), plotFile).toBe(true);
    }
  });

  it("uses only the canonical metric vocabulary", () => {
    for (const entry of manifest.entries) {
      if (entry.metric) expect(CANONICAL_METRICS.has(entry.metric), entry.metric).toBe(true);
    }
  });
});

describe("fac3 asset manifest (public/benchmark-assets/fac3/manifest.json)", () => {
  it("covers copied and derived FAC assets", () => {
    expect(fac3Manifest.benchmarkId).toBe("fac3");
    expect(fac3Manifest.entries).toHaveLength(7);
    for (const entry of fac3Manifest.entries) {
      expect(existsSync(resolve(FAC3_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("marks live plot JSON as derived from BenchValues.txt", () => {
    const derived = fac3Manifest.entries.filter(entry => entry.derived);
    expect(derived.map(entry => entry.newPath).sort()).toEqual(["plots/drag.json", "plots/lift.json"]);
    expect(derived.every(entry => entry.oldPath === "files/fac3d/BenchValues.txt")).toBe(true);
  });

  it("keeps BenchValues.txt as a non-derived download", () => {
    const download = fac3Manifest.entries.find(entry => entry.newPath === "downloads/BenchValues.txt");
    expect(download?.kind).toBe("download");
    expect(download?.derived).toBeUndefined();
  });

  it("does not copy or reference dropped static result images", () => {
    const forbidden = [
      "Fd_Q2P1_paper.png",
      "Fl_Q2P1_paper.png",
      "zoom_Fd_Q2P1_paper.png",
      "zoom_Fl_Q2P1_paper.png"
    ];
    const copied = listFiles(FAC3_DIR);
    const mapped = fac3Manifest.entries.flatMap(entry => [entry.oldPath, entry.newPath]);
    for (const name of forbidden) {
      expect(copied.some(file => file.endsWith(name)), name).toBe(false);
      expect(mapped.some(file => file.endsWith(name)), name).toBe(false);
    }
  });
});

describe("fsi asset manifest (public/benchmark-assets/fsi/manifest.json)", () => {
  it("maps every file on disk, and every entry exists", () => {
    expect(fsiManifest.benchmarkId).toBe("fsi");
    const mapped = new Set(fsiManifest.entries.map(entry => entry.newPath));
    for (const entry of fsiManifest.entries) {
      expect(existsSync(resolve(FSI_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
    for (const file of listFiles(FSI_DIR).filter(file => file !== "manifest.json")) {
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("derives FSI2 and FSI3 plots for four metrics and CSM3 for two metrics, three levels and three time steps", () => {
    const plots = fsiManifest.entries.filter(entry => entry.newPath.startsWith("plots/"));
    expect(plots.every(entry => entry.derived)).toBe(true);
    for (const run of ["fsi2", "fsi3"]) {
      expect(plots.filter(entry => entry.newPath.startsWith(`plots/${run}/`)).map(entry => entry.metric).sort()).toEqual(["drag", "lift", "ux", "uy"]);
    }
    const csm = plots.filter(entry => entry.newPath.startsWith("plots/csm3/"));
    expect(csm).toHaveLength(18);
    expect(new Set(csm.map(entry => entry.seriesGroupId))).toEqual(new Set(["l2", "l3", "l4"]));
  });

  it("publishes the reference files only as the zip bundle", () => {
    const downloads = fsiManifest.entries.filter(entry => entry.kind === "download").map(entry => entry.newPath);
    expect(downloads).toEqual(["downloads/fsi.zip"]);
    expect(listFiles(FSI_DIR).filter(file => file.endsWith(".point"))).toEqual([]);
  });

  it("replaces the FSI2, FSI3 and CSM3 plot images with live data and keeps only the CFD3 plots, which have none", () => {
    const media = fsiManifest.entries.filter(entry => entry.kind === "media").map(entry => entry.oldPath);
    for (const dropped of ["fsi2b_", "fsi3b_", "csm1b_svk_"]) {
      expect(media.some(path => path.includes(dropped)), dropped).toBe(false);
    }
    expect(media.filter(path => path.includes("cfd3_"))).toHaveLength(2);
  });
});

describe("rb2 asset manifest (public/benchmark-assets/rb2/manifest.json)", () => {
  it("has canonical, curated entries and no video asset", () => {
    expect(rb2Manifest.benchmarkId).toBe("rb2");
    expect(rb2Manifest.entries).toHaveLength(103);
    expect(rb2Manifest.entries.some(entry => /mp4|video|risingbubble/i.test(entry.newPath))).toBe(false);
  });

  it("every manifest newPath exists on disk", () => {
    for (const entry of rb2Manifest.entries) {
      expect(existsSync(resolve(RB2_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("every copied plot file is covered by the manifest (no orphans)", () => {
    const mapped = new Set(rb2Manifest.entries.map(entry => entry.newPath));
    for (const file of listFiles(resolve(RB2_DIR, "plots")).map(file => `plots/${file}`)) {
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("uses canonical case/metric/code-level plot paths", () => {
    for (const entry of rb2Manifest.entries.filter(entry => entry.newPath.startsWith("plots/"))) {
      const match = /^plots\/([^/]+)\/([^/]+)\/([^-]+)-(l[1-3])\.json$/.exec(entry.newPath);
      expect(match, entry.newPath).not.toBeNull();
      if (!match) continue;
      expect(RB2_CASES.has(match[1]), entry.newPath).toBe(true);
      expect(RB2_METRICS.has(match[2]), entry.newPath).toBe(true);
      expect(RB2_CODES.has(match[3]), entry.newPath).toBe(true);
    }
  });
});

describe("sedimentation asset manifest (public/benchmark-assets/sedimentation/manifest.json)", () => {
  // The lubrication material is built by a companion converter that merges into
  // this manifest, so the counts are split: the core migration entries, and the
  // ones owned by scripts/convert-sedimentation-lubrication.mjs.
  const isLubrication = (entry: { newPath: string }) =>
    entry.newPath.startsWith("plots/lubrication/") || entry.newPath.startsWith("downloads/lubrication/");
  const coreEntries = sedimentationManifest.entries.filter(
    entry => !isLubrication(entry) && !isGallery(entry)
  );
  const lubricationEntries = sedimentationManifest.entries.filter(isLubrication);

  it("has exactly the derived plot and copied asset entries planned for migration", () => {
    expect(sedimentationManifest.benchmarkId).toBe("sedimentation");
    expect(coreEntries).toHaveLength(50);
    expect(coreEntries.filter(entry => entry.derived)).toHaveLength(24);
    expect(coreEntries.filter(entry => !entry.derived)).toHaveLength(26);
  });

  it("carries the lubrication study the companion converter merges in", () => {
    // Two cases x (baseline, lubricated, PIV, activation rule) plus one force
    // trace each; two curated series and two tables per case, plus the bundle.
    const plots = lubricationEntries.filter(entry => entry.newPath.startsWith("plots/"));
    expect(plots).toHaveLength(10);
    for (const entry of plots) {
      expect(entry.metric, entry.newPath).toMatch(/^lubrication-(approach|film)$/);
      expect(entry.derived, entry.newPath).toBe(true);
    }
    expect(plots.filter(entry => entry.seriesGroupId === "piv").every(entry => entry.kind === "reference")).toBe(true);
    expect(lubricationEntries.filter(entry => entry.kind === "download")).toHaveLength(7);
  });

  it("derives the lubrication plots from curated series, never from a rundir path", () => {
    for (const entry of lubricationEntries) {
      if (entry.oldPath.startsWith("generated from")) continue;
      expect(entry.oldPath.startsWith("scripts/source-data/"), entry.oldPath).toBe(true);
      expect(entry.oldPath).not.toMatch(/q2p1_dns_rundir|run_slurm\.log/);
    }
  });

  it("every manifest newPath exists on disk and every plot file is covered", () => {
    for (const entry of sedimentationManifest.entries) {
      expect(existsSync(resolve(SEDIMENTATION_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
    const mapped = new Set(sedimentationManifest.entries.map(entry => entry.newPath));
    for (const file of listFiles(resolve(SEDIMENTATION_DIR, "plots")).map(file => `plots/${file}`)) {
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("marks simulation plots as code and PIV plots as reference", () => {
    const plotEntries = coreEntries.filter(entry => entry.newPath.startsWith("plots/"));
    expect(plotEntries).toHaveLength(24);
    expect(plotEntries.filter(entry => /-piv\.json$/.test(entry.newPath)).every(entry => entry.kind === "reference")).toBe(true);
    expect(plotEntries.filter(entry => !/-piv\.json$/.test(entry.newPath)).every(entry => entry.kind === "code")).toBe(true);
  });

  it("does not copy dropped or scratch artifacts", () => {
    const forbidden = /ParticleSedimentationData\.txt|\.vtu$|\.pvtu$|\.tri$|_vtk|velocities\.png|positions\.png/;
    const copied = listFiles(SEDIMENTATION_DIR);
    const mapped = sedimentationManifest.entries.flatMap(entry => [entry.oldPath, entry.newPath]);
    expect(copied.some(file => forbidden.test(file))).toBe(false);
    expect(mapped.some(file => forbidden.test(file))).toBe(false);
  });

  it("keeps root scratch data ignored", () => {
    const gitignore = readFileSync(resolve(process.cwd(), ".gitignore"), "utf-8");
    for (const rule of ["/cases/", "/velE*.txt", "/posE*.txt", "/velocities.png", "/positions.png", "/plot_velocities.py", "/plot_positions.py", "/process_and_plot.sh"]) {
      expect(gitignore).toContain(rule);
    }
  });
});

describe("dkt asset manifest (public/benchmark-assets/dkt/manifest.json)", () => {
  const DKT_METRICS = new Set(["tilt", "separation", "trajectory", "velocity-leader", "velocity-trailer"]);

  it("covers every derived plot and copied download", () => {
    expect(dktManifest.benchmarkId).toBe("dkt");
    for (const entry of dktManifest.entries) {
      expect(existsSync(resolve(DKT_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("leaves no orphan files on disk", () => {
    const mapped = new Set(dktManifest.entries.map(entry => entry.newPath));
    for (const file of listFiles(DKT_DIR)) {
      if (file === "manifest.json") continue;
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("uses the canonical metric vocabulary and marks plots as derived", () => {
    const plots = dktManifest.entries.filter(entry => entry.newPath.startsWith("plots/"));
    // Three contact models x five metrics.
    expect(plots).toHaveLength(15);
    for (const entry of plots) {
      expect(DKT_METRICS.has(entry.metric!), entry.metric).toBe(true);
      expect(entry.derived, entry.newPath).toBe(true);
      expect(entry.kind).toBe("code");
    }
  });

  it("derives every plot from a curated source, never from a rundir path", () => {
    for (const entry of dktManifest.entries) {
      if (entry.oldPath.startsWith("generated from")) continue;
      expect(entry.oldPath.startsWith("scripts/source-data/"), entry.oldPath).toBe(true);
      expect(entry.oldPath).not.toMatch(/q2p1_dns_rundir|particle_force\.log/);
    }
  });

  it("ships the datasheet the validation ledger is generated from", () => {
    const datasheet = dktManifest.entries.find(entry =>
      entry.newPath === "downloads/dns_validation_datasheet.csv");
    expect(datasheet?.kind).toBe("download");
    expect(existsSync(resolve(DKT_DIR, "downloads/dkt.zip"))).toBe(true);
  });
});

describe("hindered-settling asset manifest (public/benchmark-assets/hindered-settling/manifest.json)", () => {
  const HINDERED_METRICS = new Set(["collapse", "hindrance", "history"]);

  it("every manifest newPath exists on disk", () => {
    expect(hinderedManifest.benchmarkId).toBe("hindered-settling");
    for (const entry of hinderedManifest.entries) {
      expect(existsSync(resolve(HINDERED_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("leaves no orphan files on disk", () => {
    const mapped = new Set(hinderedManifest.entries.map(entry => entry.newPath));
    for (const file of listFiles(HINDERED_DIR)) {
      if (file === "manifest.json") continue;
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("uses the canonical metric vocabulary and marks plots as derived", () => {
    const plots = hinderedManifest.entries.filter(entry => entry.newPath.startsWith("plots/"));
    // collapse: 4 sizes + fit + band; hindrance: 2 columns + reference; history: 4 sizes.
    expect(plots).toHaveLength(13);
    for (const entry of plots) {
      expect(HINDERED_METRICS.has(entry.metric!), entry.metric).toBe(true);
      expect(entry.derived, entry.newPath).toBe(true);
      expect(entry.kind).toBe("code");
    }
  });

  it("derives every plot from a curated source, never from a rundir path", () => {
    for (const entry of hinderedManifest.entries) {
      if (entry.oldPath.startsWith("generated from")) continue;
      expect(entry.oldPath.startsWith("scripts/source-data/"), entry.oldPath).toBe(true);
      expect(entry.oldPath).not.toMatch(/q2p1_dns_rundir|particle_force\.log/);
    }
  });
});

describe("numerical-viscometer asset manifest (public/benchmark-assets/numerical-viscometer/manifest.json)", () => {
  const VISCOMETER_METRICS = new Set(["torque", "viscosity", "pairs"]);

  it("every manifest newPath exists on disk", () => {
    expect(viscometerManifest.benchmarkId).toBe("numerical-viscometer");
    for (const entry of viscometerManifest.entries) {
      expect(existsSync(resolve(VISCOMETER_DIR, entry.newPath)), entry.newPath).toBe(true);
    }
  });

  it("leaves no orphan files on disk", () => {
    const mapped = new Set(viscometerManifest.entries.map(entry => entry.newPath));
    for (const file of listFiles(VISCOMETER_DIR)) {
      if (file === "manifest.json") continue;
      expect(mapped.has(file), file).toBe(true);
    }
  });

  it("uses the canonical metric vocabulary and marks plots as derived", () => {
    const plots = viscometerManifest.entries.filter(entry => entry.newPath.startsWith("plots/"));
    // torque: three estimators, the empty control at the suspension time step and
    // two references; viscosity: two measured series, the composite targets and
    // three closures; pairs: active and saturated films at each of the two
    // lubrication rungs.
    expect(plots).toHaveLength(16);
    const byMetric = (metric: string) => plots.filter(entry => entry.metric === metric).length;
    expect(byMetric("torque")).toBe(6);
    expect(byMetric("viscosity")).toBe(6);
    expect(byMetric("pairs")).toBe(4);
    for (const entry of plots) {
      expect(VISCOMETER_METRICS.has(entry.metric!), entry.metric).toBe(true);
      expect(entry.derived, entry.newPath).toBe(true);
      expect(entry.kind).toBe("code");
    }
  });

  it("derives every plot from a curated source or the case definition, never from a rundir path", () => {
    for (const entry of viscometerManifest.entries) {
      if (entry.oldPath.startsWith("generated from")) continue;
      expect(entry.oldPath.startsWith("scripts/source-data/"), entry.oldPath).toBe(true);
      expect(entry.oldPath).not.toMatch(/q2p1_dns_rundir|prot\.txt/);
    }
  });

  it("ships the datasheet the validation ledger is generated from", () => {
    const datasheet = viscometerManifest.entries.find(
      entry => entry.newPath === "downloads/dns_validation_datasheet.csv"
    );
    expect(datasheet?.kind).toBe("download");
    expect(existsSync(resolve(VISCOMETER_DIR, "downloads/numerical-viscometer.zip"))).toBe(true);
  });
});

describe("gallery stills in the asset manifests", () => {
  const manifests: [string, AssetManifest][] = [
    ["sedimentation", sedimentationManifest],
    ["dkt", dktManifest],
    ["hindered-settling", hinderedManifest],
    ["numerical-viscometer", viscometerManifest],
    ["oberbeck-spheroid-drag", oberbeckManifest],
    ["jeffery-orbit", jefferyManifest]
  ];

  it("records every gallery still as media, with a label and its source render", () => {
    for (const [id, manifest] of manifests) {
      const stills = manifest.entries.filter(isGallery);
      expect(stills.length, id).toBeGreaterThan(0);
      for (const entry of stills) {
        expect(entry.kind, entry.newPath).toBe("media");
        expect(entry.label, entry.newPath).toBeTruthy();
        expect(entry.newPath, entry.newPath).toMatch(/\.webp$/);
        expect(entry.oldPath, entry.newPath).toMatch(/^generated from blender_viz\/website_assets\//);
      }
    }
  });

  it("ships no PNG master alongside them", () => {
    for (const [id, manifest] of manifests) {
      for (const entry of manifest.entries.filter(isGallery)) {
        const dir = resolve(process.cwd(), "public/benchmark-assets", id);
        expect(existsSync(resolve(dir, entry.newPath.replace(/\.webp$/, ".png"))), entry.newPath).toBe(false);
      }
    }
  });
});
