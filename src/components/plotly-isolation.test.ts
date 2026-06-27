import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(process.cwd(), "src");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx|jsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("Plotly import isolation", () => {
  it("react-plotly.js is imported by only src/components/comparison.tsx", () => {
    // Match real imports only (not the `declare module` in the .d.ts shim).
    const importPattern = /(from\s+["']react-plotly\.js["']|import\(\s*["']react-plotly\.js["']\s*\))/;
    const importers = walk(SRC).filter(file => {
      if (file.endsWith(".d.ts") || file.endsWith("plotly-isolation.test.ts")) return false;
      return importPattern.test(readFileSync(file, "utf-8"));
    });

    expect(importers.map(f => f.replace(SRC + "/", "src/"))).toEqual(["src/components/comparison.tsx"]);
  });
});
