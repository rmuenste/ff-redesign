import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarks } from "../data/benchmarks";

// The hero is copied between pages rather than shared, so this pins the
// conventions in docs/benchmark-template.md ("The hero") to the registry.
// Core benchmarks are named by their tag; DNS-campaign pages by their title.

const PAGE_FILES: Record<string, string> = {
  rb3: "RisingBubble3DPage.tsx",
  rb2: "RisingBubble2DPage.tsx",
  fac3: "FlowAroundCylinderPage.tsx",
  sedimentation: "ParticleSedimentationPage.tsx",
  dkt: "DraftingKissingTumblingPage.tsx",
  "hindered-settling": "HinderedSettlingPage.tsx",
  "numerical-viscometer": "NumericalViscometerPage.tsx",
  "oberbeck-spheroid-drag": "OberbeckSpheroidDragPage.tsx",
  "jeffery-orbit": "JefferyOrbitPage.tsx"
};

const CORE = "Core benchmarks";

function sentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

describe("benchmark hero", () => {
  it("has a page for every registry entry", () => {
    expect(Object.keys(PAGE_FILES).sort()).toEqual(benchmarks.map(b => b.id).sort());
  });

  for (const benchmark of benchmarks) {
    const source = readFileSync(resolve(process.cwd(), "src/pages", PAGE_FILES[benchmark.id]), "utf-8");
    const core = benchmark.suite === CORE;
    const name = core ? benchmark.tag : benchmark.shortTitle;

    it(`${benchmark.id}: breadcrumb ends with the ${core ? "tag" : "short title"}`, () => {
      expect(source).toContain(`/> Catalogue / ${benchmark.model} / ${name}\n`);
    });

    it(`${benchmark.id}: chips are name, model, dimension, suite`, () => {
      const chips = [...source.matchAll(/<Chip( tone="solid")?>([^<{]+)<\/Chip>/g)].map(m => [m[1] ? "solid" : "plain", m[2]]);
      const hero = chips.slice(chips.findIndex(([tone]) => tone === "solid"));
      expect(hero.slice(0, 4)).toEqual([
        ["solid", core ? benchmark.tag : sentenceCase(benchmark.shortTitle)],
        ["plain", benchmark.model],
        ["plain", benchmark.dimension],
        ["plain", benchmark.suite]
      ]);
    });

    it(`${benchmark.id}: title has one white part and one primary-green part`, () => {
      const h1 = /<h1 className="display display-md"[\s\S]*?<\/h1>/.exec(source)?.[0] ?? "";
      expect(h1.match(/color: "var\(--primary\)"/g)).toHaveLength(1);
    });
  }
});
