import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarks } from "../data/benchmarks";
import { galleryItems } from "../data/gallery";

/**
 * The DNS pages speak to visitors: what was measured and how far it sits from its
 * reference, in plain language (docs/benchmark-template.md, "Visitor language").
 * This greps the copy a visitor can read on the six pages, every tab, for the
 * internal campaign vocabulary swept out on 2026-10-15, so it cannot creep back.
 *
 * The vitest setup runs in node with no DOM (see vitest.config.ts), so the pages
 * cannot be rendered. The copy is extracted from the sources instead: JSX text,
 * plus every string and template literal that reads as prose (it contains a
 * space or starts with a capital) — which leaves out ids, class names, enum
 * values and asset paths. Comments, imports and file names are dropped first.
 * Registry and gallery copy is read from the modules themselves.
 */

const PAGES: Record<string, { files: string[]; generated?: string | string[] }> = {
  sedimentation: {
    files: ["src/pages/ParticleSedimentationPage.tsx", "src/data/sedimentation.tsx"],
    // The FEAT3 run table names its code in a label the run table and legends show.
    generated: ["sedimentation-lubrication.json", "sedimentation-feat3.json"]
  },
  dkt: {
    files: ["src/pages/DraftingKissingTumblingPage.tsx", "src/data/dkt.tsx", "src/components/dkt-schematic.tsx"]
  },
  "hindered-settling": {
    files: ["src/pages/HinderedSettlingPage.tsx", "src/data/hindered-settling.tsx"],
    generated: "hindered-settling.json"
  },
  "numerical-viscometer": {
    files: [
      "src/pages/NumericalViscometerPage.tsx",
      "src/data/numerical-viscometer.tsx",
      "src/components/viscometer-schematic.tsx"
    ],
    generated: "numerical-viscometer.json"
  },
  "oberbeck-spheroid-drag": {
    files: [
      "src/pages/OberbeckSpheroidDragPage.tsx",
      "src/data/oberbeck.tsx",
      "src/components/oberbeck-schematic.tsx"
    ],
    generated: "oberbeck.json"
  },
  "jeffery-orbit": {
    files: ["src/pages/JefferyOrbitPage.tsx", "src/data/jeffery.tsx", "src/components/jeffery-schematic.tsx"],
    generated: "jeffery.json"
  }
};

/**
 * The one place whose own structure is a ladder the visitor looks at: Oberbeck's
 * Ratio Ladder tab and its table (`LadderTable` and `RatioTab` in the page). The
 * rest of that page is held to the same rule as every other page.
 */
const LADDER_PAGE = "oberbeck-spheroid-drag";
const LADDER_TAB = { label: "Ratio Ladder", from: "function LadderTable(", to: "function AbsolutesTab(" };

function withoutLadderTab(source: string) {
  const start = source.indexOf(LADDER_TAB.from);
  const end = source.indexOf(LADDER_TAB.to);
  if (start < 0 || end < start) throw new Error("the Ratio Ladder tab moved; update LADDER_TAB");
  return (source.slice(0, start) + source.slice(end)).split(`"${LADDER_TAB.label}"`).join('""');
}

/** Word-boundary, case-insensitive. */
const FORBIDDEN: RegExp[] = [
  /\bcertif(y|ied|ies|ication)\b/i,
  /\btwins?\b/i,
  /\bbitwise\b/i,
  /\bbyte-identical\b/i,
  /\bgat(e|es|ed|ing)\b/i,
  /\bpin(s|ned)?\b/i,
  /\bbinar(y|ies)\b/i,
  /\bcommit(s|ted)?\b/i,
  /\brundirs?\b/i,
  /\bjobs?\b/i,
  /\bslurm\b/i,
  /\bprotocols?\b/i,
  /\bverdicts?\b/i,
  /\bowners?\b/i,
  /\breview(s|ed)?\b/i,
  /\berrat(um|a)\b/i,
  /\bsuperseded\b/i,
  /\bstaged\b/i,
  /\bclusters?\b/i,
  /\bfritz\b/i,
  /\banchors?\b/i,
  /\bcampaign\b/i,
  // Datasheet case ids such as d61_v5_halfsize, d52_v26 or e4_l3_dt0p5.
  /\b[de]\d+_[a-z0-9_]+\b/i
];

/** Status labels: only their upper-case form is campaign bookkeeping. */
const FORBIDDEN_LABELS = /\b(RECORDED|RESOLVED|PASS)\b/;

const LADDER_WORDS = /\b(rungs?|ladders?)\b/i;

/**
 * Column headers of downloadable files, quoted verbatim on the Reference Data
 * tabs. They name what is in the files, which do not change with the prose.
 */
const FILE_HEADERS = [
  "run, rung, orientation, label, rundir",
  "suite, case, quantity, expected, expected_source, measured, rel_error, tolerance, verdict",
  "run, label, short, role, case, a, b, re, gammadot, box_x, box_y, box_h, coarse_box, h_min, inside_dofs, dt, tmin, seams, segments, rundir",
  "phi, closure, eta_composite, gate",
  "rung, label, short, level, h, scale",
  "rung, level, thin_axis_resolution, image_parameter, orientation, R_h, target, deviation, torque_null, ratio",
  "rung, window, ratio, ratio_volume_corrected, deviation"
];

const FILE_NAME = /[\w*.-]+\.(csv|dat|txt|zip|json|png|webp|mp4|pdf)\b/g;

function stripCode(source: string) {
  let text = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/throw new Error\([^;]*\);/g, "")
    .replace(/^import[\s\S]*?from\s+"[^"]+";$/gm, "");
  for (const header of FILE_HEADERS) text = text.split(header).join("");
  return text;
}

function stripExpressions(template: string) {
  let previous = "";
  let text = template;
  while (text !== previous) {
    previous = text;
    text = text.replace(/\$\{[^{}]*\}/g, " ");
  }
  return text;
}

/** The prose a visitor can read, pulled out of one source file. */
export function visibleCopy(source: string) {
  const code = stripCode(source);
  const pieces: string[] = [];
  for (const match of code.matchAll(/>([^<>{}]+)</g)) pieces.push(match[1]);
  for (const match of code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) {
    const literal = match[1] ?? match[2] ?? stripExpressions(match[3] ?? "");
    if (/\s/.test(literal.trim()) || /^[A-Z]/.test(literal)) pieces.push(literal);
  }
  return pieces.join("\n").replace(FILE_NAME, " ");
}

function generatedLabels(file: string) {
  const labels: string[] = [];
  const walk = (value: unknown, key?: string) => {
    if (Array.isArray(value)) value.forEach(entry => walk(entry, key));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, k);
    else if (typeof value === "string" && (key === "label" || key === "short")) labels.push(value);
  };
  walk(JSON.parse(readFileSync(resolve(process.cwd(), "src/data/generated", file), "utf-8")));
  return labels.join("\n");
}

function pageCopy(id: string, { ladderTab = true } = {}) {
  const page = PAGES[id];
  const benchmark = benchmarks.find(entry => entry.id === id)!;
  const gallery = galleryItems.filter(item => item.benchmarkId === id);
  const read = (file: string) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf-8");
    return ladderTab || !file.startsWith("src/pages/") ? source : withoutLadderTab(source);
  };
  return [
    ...page.files.map(file => visibleCopy(read(file))),
    ...[page.generated ?? []].flat().map(generatedLabels),
    benchmark.title,
    benchmark.shortTitle,
    benchmark.summary,
    ...benchmark.tabs.filter(tab => ladderTab || tab !== LADDER_TAB.label),
    ...gallery.flatMap(item => [item.title, item.caption, item.provenance, item.alt])
  ].join("\n");
}

/** The lines of copy a pattern matches, so a failure names the offending text. */
function hits(copy: string, pattern: RegExp) {
  return copy
    .split("\n")
    .filter(line => pattern.test(line))
    .map(line => line.trim());
}

describe("visitor language on the DNS pages", () => {
  it("covers the six DNS pages", () => {
    expect(Object.keys(PAGES).sort()).toEqual(
      benchmarks.filter(entry => entry.id === "sedimentation" || entry.suite === "DNS validation").map(entry => entry.id).sort()
    );
  });

  it("extracts prose and skips code", () => {
    const copy = visibleCopy(
      [
        'import { gate } from "./gates";',
        "// the twin gate",
        'const tab = { id: "ladder", label: "The pinned rung" };',
        "const el = <p>Every run passes its gate, see runs.csv.</p>;"
      ].join("\n")
    );
    expect(copy).toContain("The pinned rung");
    expect(copy).toContain("Every run passes its gate");
    expect(copy).not.toMatch(/twin|ladder|runs\.csv/);
  });

  it("sedimentation: reads the FEAT3 copy, and none of the FEAT3 runs' provenance", () => {
    const copy = pageCopy("sedimentation");
    // The extraction reaches the new prose, table headers, legend labels and downloads.
    expect(copy).toContain("the newest member of the");
    expect(copy).toContain("Cells across diameter");
    expect(copy).toContain("FEAT3");
    expect(copy).toContain("All FEAT3 series and their run summary");
    // feat3_runs.csv's provenance columns are for the download only.
    for (const term of [/default-mg|gmres|mg16/i, /\branks?\b/i, /\b14\d{4}\b/, /ccnd-sedimentation/i, /solver.note/i]) {
      expect(hits(copy, term), String(term)).toEqual([]);
    }
  });

  it("sedimentation: no numbers against the paper's lattice-Boltzmann simulations", () => {
    // Those were single-resolution runs with a calibrated hydrodynamic radius, not
    // comparable with an uncalibrated refinement study; mentioning them is fine.
    const copy = pageCopy("sedimentation").replace(/\s+/g, " ");
    expect(copy).not.toMatch(/published simulations|as much a reference/i);
    for (const sentence of copy.split(/(?<=\.)\s/).filter(text => /lattice-Boltzmann|LBM/i.test(text))) {
      // Reynolds numbers and the citation are fine; a deviation or an agreement is not.
      expect(sentence, sentence).not.toMatch(/per ?cent|%|to within|agree/i);
    }
  });

  for (const id of Object.keys(PAGES)) {
    const copy = pageCopy(id);

    it(`${id}: no campaign vocabulary`, () => {
      for (const pattern of FORBIDDEN) expect(hits(copy, pattern), String(pattern)).toEqual([]);
      expect(hits(copy, FORBIDDEN_LABELS)).toEqual([]);
    });

    it(`${id}: no rung or ladder outside the Oberbeck Ratio Ladder tab`, () => {
      const outside = id === LADDER_PAGE ? pageCopy(id, { ladderTab: false }) : copy;
      expect(hits(outside, LADDER_WORDS)).toEqual([]);
    });
  }
});
