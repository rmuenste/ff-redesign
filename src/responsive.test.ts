import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The site has to fit a 390px phone without a horizontal scrollbar. That is
// only true while viewport-dependent layout lives in src/styles.css, where a
// media query can reach it. Inline styles cannot carry media queries, so this
// guards the handful of patterns that reintroduced overflow before the mobile
// pass: fixed multi-column inline grids, a hard-coded 48px gutter, display
// sizes with phone-hostile floors, and table wrappers that clip instead of
// scroll. e2e/mobile-layout.spec.ts measures the rendered result in a browser;
// this test catches the regression at source level, before a browser is needed.

const ROOT = process.cwd();
const SRC = resolve(ROOT, "src");
const STYLES = readFileSync(resolve(SRC, "styles.css"), "utf-8");
const TOKENS = readFileSync(resolve(ROOT, "assets/tokens.css"), "utf-8");

/** Breakpoints the stylesheet is allowed to use, and the only ones. */
const BREAKPOINTS = ["719.98px", "999.98px"];

/**
 * Inline grid templates that are allowed to stay fixed: rows nested inside a
 * card that is itself already at least ~300px wide, where a collapse would make
 * things worse. Keyed as "<repo path>:<template>".
 */
const FIXED_GRID_ALLOWLIST = new Set(["src/Home.jsx:48px 1fr auto", "src/BenchmarksIndex.jsx:1fr 1fr 1fr"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const components = walk(SRC).map(file => ({
  path: file.replace(ROOT + "/", ""),
  source: readFileSync(file, "utf-8")
}));

/** Every `pattern` hit as "path:line", for readable failure output. */
function hits(pattern: RegExp): string[] {
  const found: string[] = [];
  for (const { path, source } of components) {
    for (const match of source.matchAll(new RegExp(pattern.source, "g" + pattern.flags.replace("g", "")))) {
      const line = source.slice(0, match.index).split("\n").length;
      found.push(`${path}:${line}`);
    }
  }
  return found;
}

/** The body of the first `selector {` rule in styles.css. */
function rule(selector: string): string {
  const match = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(STYLES);
  expect(match, `${selector} rule not found in src/styles.css`).not.toBeNull();
  return match![1];
}

describe("responsive layout guard", () => {
  it("keeps fixed multi-column grids out of inline styles", () => {
    const offenders: string[] = [];
    for (const { path, source } of components) {
      for (const match of source.matchAll(/gridTemplateColumns:\s*"([^"]+)"/g)) {
        const template = match[1];
        const line = source.slice(0, match.index).split("\n").length;
        // An auto-fill/auto-fit grid is fine as long as its minimum can shrink
        // below the container: minmax(min(<px>, 100%), 1fr).
        const fluid = /auto-(fill|fit)/.test(template) && template.includes("min(");
        if (fluid || FIXED_GRID_ALLOWLIST.has(`${path}:${template}`)) continue;
        offenders.push(`${path}:${line} "${template}"`);
      }
    }
    expect(offenders, "move these to a class in src/styles.css with a phone/tablet rule").toEqual([]);
  });

  it("sizes display headlines through the .display-* classes", () => {
    expect(hits(/fontSize:\s*"clamp\(/)).toEqual([]);
    for (const cls of [".display-xl", ".display-lg", ".display-md", ".h-editorial-lg"]) {
      expect(rule(cls), `${cls} should set a clamp() font-size`).toMatch(/font-size:\s*clamp\(/);
    }
  });

  it("derives the page gutter from --gutter, never a literal 48px", () => {
    expect(TOKENS).toMatch(/--gutter:\s*clamp\(/);
    expect(rule(".section")).toContain("var(--gutter)");
    expect(rule(".section-narrow")).toContain("var(--gutter)");
    // A padding shorthand ending in 48px overrides the class gutter on the side.
    expect(hits(/padding:\s*"[^"]*\b48px"/)).toEqual([]);
  });

  it("lets wide tables scroll inside their card instead of clipping", () => {
    const dataDisplay = components.find(c => c.path === "src/components/data-display.tsx")!;
    expect(dataDisplay.source).toContain('className="card table-scroll"');
    expect(dataDisplay.source).not.toContain('overflow: "hidden"');
    const index = components.find(c => c.path === "src/BenchmarksIndex.jsx")!;
    expect(index.source).toContain('className="table-scroll"');
    expect(rule(".table-scroll")).toMatch(/overflow-x:\s*auto/);
  });

  it("lets block equations scroll without clipping their ink", () => {
    expect(rule(".equation-block")).toMatch(/overflow-x:\s*auto/);
    // Only the outer div clips; its padding must scale with the math.
    expect(rule(".equation-block")).toMatch(/padding:\s*[\d.]+em 0/);
    expect(rule('.equation-block mjx-container[jax="CHTML"][display="true"]')).toMatch(/overflow:\s*visible/);
  });

  it("uses exactly the two documented breakpoints", () => {
    const widths = [...STYLES.matchAll(/@media\s*\(max-width:\s*([^)]+)\)/g)].map(match => match[1].trim());
    expect(new Set(widths)).toEqual(new Set(BREAKPOINTS));
  });

  it("offsets sticky chrome from --toolbar-h rather than a literal nav height", () => {
    expect(hits(/\btop:\s*(64|96)\b/)).toEqual([]);
    expect(rule(".filter-bar")).toContain("var(--toolbar-h)");
    expect(rule(".panel-aside")).toContain("var(--toolbar-h)");
  });
});
