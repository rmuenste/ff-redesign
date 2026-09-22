import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// MathJax 3 is loaded as the combined tex-mml-chtml bundle from a CDN
// (better-react-mathjax's default, configured in src/main.tsx). Macros outside
// that bundle are fetched lazily, per macro, at typeset time. When such a
// request fails — an offline reader, a proxy, a blocked CDN — MathJax aborts
// with "Can't load ..." and the equation stays on the page as raw TeX. That is
// what \boldsymbol did to the FSI definition tab.
//
// So the pages use only what the bundle carries: \pmb in place of \boldsymbol,
// and nothing from the other autoloaded extensions.

const FORBIDDEN: Array<{ macro: string; instead: string }> = [
  { macro: "boldsymbol", instead: "\\pmb" },
  { macro: "cancel", instead: "a plain fraction or \\not" },
  { macro: "bbox", instead: "a styled wrapper element" },
  { macro: "require", instead: "nothing: extensions must not be pulled in at render time" },
  { macro: "unicode", instead: "the character itself" }
];

function sources(dir: string): Array<{ path: string; source: string }> {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    if (!/\.(tsx|jsx|ts)$/.test(entry.name) || entry.name.endsWith(".test.ts")) return [];
    return [{ path: full.replace(process.cwd() + "/", ""), source: readFileSync(full, "utf-8") }];
  });
}

describe("MathJax macros", () => {
  it("uses only macros the loaded bundle carries, so no equation waits on a second request", () => {
    const offenders: string[] = [];
    for (const { path, source } of sources(resolve(process.cwd(), "src"))) {
      for (const { macro, instead } of FORBIDDEN) {
        for (const match of source.matchAll(new RegExp(`\\\\\\\\${macro}\\b`, "g"))) {
          const line = source.slice(0, match.index).split("\n").length;
          offenders.push(`${path}:${line} \\${macro} — use ${instead}`);
        }
      }
    }
    expect(offenders, "these macros are autoloaded at typeset time and break the equation when the request fails").toEqual([]);
  });
});
