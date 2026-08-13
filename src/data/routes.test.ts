import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarks } from "./benchmarks";

// GitHub Pages has no rewrite rules, so scripts/prerender-routes.mjs writes an
// index.html for every client route to keep deep links at HTTP 200. A route
// added to App.tsx but missed there would deep-link as a 404 — visibly fine in
// the browser, but wrong for shared and crawled links, and easy to miss because
// `vite preview` has SPA fallback and never reproduces it. This guards the list.

const APP = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf-8");
const PRERENDER = readFileSync(resolve(process.cwd(), "scripts/prerender-routes.mjs"), "utf-8");

/** Concrete client routes declared in App.tsx (excluding "/" and the "*" catch-all). */
function declaredRoutes(): string[] {
  return [...APP.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map(match => match[1])
    .filter(path => path !== "/" && path !== "*")
    .map(path => path.replace(/^\//, ""));
}

/** STATIC_ROUTES as written in the prerender script. */
function staticRoutes(): string[] {
  const block = /export const STATIC_ROUTES = \[([^\]]*)\]/.exec(PRERENDER);
  expect(block, "STATIC_ROUTES not found in scripts/prerender-routes.mjs").not.toBeNull();
  return [...block![1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
}

describe("Pages prerender route coverage", () => {
  it("prerenders every route declared in App.tsx", () => {
    const covered = new Set([
      ...staticRoutes(),
      ...benchmarks.map(benchmark => `benchmarks/${benchmark.slug}`)
    ]);
    for (const route of declaredRoutes()) {
      expect(covered.has(route), `route "${route}" has no prerendered shell`).toBe(true);
    }
  });

  it("does not prerender routes the app does not serve", () => {
    const declared = new Set(declaredRoutes());
    for (const route of staticRoutes()) {
      expect(declared.has(route), `STATIC_ROUTES lists "${route}", which App.tsx does not declare`).toBe(true);
    }
  });

  it("keeps every registry slug reachable as a route", () => {
    const declared = new Set(declaredRoutes());
    for (const benchmark of benchmarks.filter(entry => entry.status === "active")) {
      expect(declared.has(`benchmarks/${benchmark.slug}`), benchmark.id).toBe(true);
    }
  });

  it("reads slugs from the registry with the same pattern the script uses", () => {
    const registry = readFileSync(resolve(process.cwd(), "src/data/benchmarks.ts"), "utf-8");
    const slugs = [...registry.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map(match => match[1]);
    expect(slugs.sort()).toEqual(benchmarks.map(benchmark => benchmark.slug).sort());
  });
});
