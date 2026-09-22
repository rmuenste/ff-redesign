import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildIndex, serializeIndex } from "../../scripts/build-reference-index.mjs";
import { benchmarks } from "./benchmarks";
import {
  formatBytes,
  referenceGroups,
  referenceShared,
  referenceTotals
} from "./reference-data";

const PUBLIC = resolve(process.cwd(), "public");
const INDEX_PATH = resolve(process.cwd(), "src/data/generated/reference-index.json");
const APP = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf-8");
const NAV = readFileSync(resolve(process.cwd(), "src/Nav.jsx"), "utf-8");
const PRERENDER = readFileSync(resolve(process.cwd(), "scripts/prerender-routes.mjs"), "utf-8");

/** Benchmark id -> the page component that serves its route. */
const PAGE_FILES: Record<string, string> = {
  rb3: "RisingBubble3DPage.tsx",
  rb2: "RisingBubble2DPage.tsx",
  fac3: "FlowAroundCylinderPage.tsx",
  sedimentation: "ParticleSedimentationPage.tsx",
  fsi: "FsiBenchmarkPage.tsx",
  dkt: "DraftingKissingTumblingPage.tsx",
  "hindered-settling": "HinderedSettlingPage.tsx",
  "numerical-viscometer": "NumericalViscometerPage.tsx",
  "oberbeck-spheroid-drag": "OberbeckSpheroidDragPage.tsx",
  "jeffery-orbit": "JefferyOrbitPage.tsx"
};

/** Strip the Vite base path so an href can be resolved against public/. */
function publicPath(href: string) {
  return resolve(PUBLIC, href.replace(/^.*?(benchmark-assets\/)/, "$1"));
}

describe("generated reference index", () => {
  it("is committed in sync with a fresh scan of the manifests", () => {
    // The page imports the committed JSON, so a stale file would ship stale
    // sizes. `npm run build` regenerates it; this catches a commit that forgot to.
    expect(readFileSync(INDEX_PATH, "utf-8")).toBe(serializeIndex(buildIndex()));
  });

  it("derives a non-empty group for every benchmark that publishes data", () => {
    expect(referenceGroups.length).toBeGreaterThanOrEqual(10);
    for (const group of referenceGroups) {
      expect(group.files.length, group.benchmark.id).toBeGreaterThan(0);
      expect(group.bytes, group.benchmark.id).toBeGreaterThan(0);
    }
    expect(referenceTotals.files).toBe(
      referenceGroups.reduce((sum, group) => sum + group.files.length, 0)
    );
  });

  it("keeps the page in catalogue order and never invents a benchmark", () => {
    const registryOrder = benchmarks.map(benchmark => benchmark.id);
    const groupOrder = referenceGroups.map(group => group.benchmark.id);
    expect(groupOrder).toEqual(registryOrder.filter(id => groupOrder.includes(id)));
  });

  it("points every download at a file that exists on disk", () => {
    for (const group of referenceGroups) {
      for (const file of group.files) {
        expect(existsSync(publicPath(file.href)), file.href).toBe(true);
        expect(file.bytes, file.name).toBeGreaterThan(0);
        expect(file.format.length, file.name).toBeGreaterThan(0);
      }
    }
  });

  it("links each group back to its benchmark's Reference Data tab", () => {
    for (const group of referenceGroups) {
      expect(group.href).toBe(`/benchmarks/${group.benchmark.slug}?tab=reference-data`);
      // The target route must actually be served.
      expect(APP).toContain(`path="/benchmarks/${group.benchmark.slug}"`);
    }
  });

  it("carries the curated per-file descriptions the benchmark pages already show", () => {
    const described = referenceGroups.flatMap(group => group.files.filter(file => file.description));
    expect(described.length).toBeGreaterThan(10);
    // Every zip bundle is described somewhere: those are the entry points.
    for (const group of referenceGroups) {
      const zips = group.files.filter(file => file.name.endsWith(".zip"));
      for (const zip of zips) expect(zip.description, `${group.benchmark.id}/${zip.name}`).toBeTruthy();
    }
  });

  it("lists a file offered by several benchmarks once, as a shared asset", () => {
    const datasheet = referenceShared.find(file => file.name === "dns_validation_datasheet.csv");
    expect(datasheet, "the DNS datasheet is offered by more than one benchmark").toBeDefined();
    expect(datasheet!.offeredBy.length).toBeGreaterThan(1);
    expect(existsSync(publicPath(datasheet!.href))).toBe(true);
    // Shared entries are flagged in the per-benchmark groups too, so the page can
    // present them without claiming each benchmark ships its own copy.
    for (const benchmark of datasheet!.offeredBy) {
      const group = referenceGroups.find(entry => entry.benchmark.id === benchmark.id);
      expect(group?.files.find(file => file.name === datasheet!.name)?.shared).toBe(true);
    }
  });
});

describe("reference-data route", () => {
  it("is served by the app and reachable from the navbar", () => {
    expect(APP).toContain('path="/reference-data"');
    expect(NAV).toContain('navigate("/reference-data")');
    // The navbar button must not fall back to the catalogue any more.
    expect(NAV).not.toMatch(/Reference data[\s\S]{0,80}navigate\("\/benchmarks"\)/);
  });

  it("gets a prerendered shell so the deep link returns 200", () => {
    expect(PRERENDER).toMatch(/STATIC_ROUTES = \[[^\]]*"reference-data"/);
  });

  it("honours the ?tab= deep link on every benchmark page it links to", () => {
    // A page that went back to plain useState would swallow the deep link
    // silently: the link would resolve, the page would open on Introduction.
    for (const group of referenceGroups) {
      const page = resolve(process.cwd(), "src/pages", PAGE_FILES[group.benchmark.id]);
      const source = readFileSync(page, "utf-8");
      expect(source, group.benchmark.id).toContain("useTabParam");
      expect(source, group.benchmark.id).toContain('id: "reference-data"');
    }
  });

  it("is regenerated by the build before type-checking", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"));
    expect(pkg.scripts.build).toMatch(/build-reference-index\.mjs.*tsc -b/);
  });
});

describe("byte formatting", () => {
  it("reports each magnitude in the unit a reader wants", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 kB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
