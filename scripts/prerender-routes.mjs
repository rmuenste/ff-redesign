// Companion to the 404.html SPA fallback used by the Pages deployment.
//
// GitHub Pages has no rewrite rules. `cp dist/index.html dist/404.html` already
// makes deep links work — the app shell boots and React Router renders the right
// page from location.pathname — but the HTTP status stays 404, which matters for
// shared and crawled links.
//
// Copying the shell to <route>/index.html makes Pages resolve those paths as
// directory indexes and return a real 200. 404.html remains the catch-all for
// genuine typos, where the router's "*" route redirects home.
//
// Benchmark routes are read from the registry, so adding a benchmark needs no
// edit here. Only STATIC_ROUTES is maintained by hand, and
// src/data/routes.test.ts fails if it drifts from the <Route> list in App.tsx.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Routes that are not derived from the benchmark registry. */
export const STATIC_ROUTES = ["benchmarks", "gallery"];

/** Benchmark slugs, read from the TypeScript registry rather than imported. */
export function benchmarkSlugs(registryPath) {
  const source = readFileSync(registryPath, "utf-8");
  const slugs = [...source.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map(match => match[1]);
  if (!slugs.length) throw new Error(`no benchmark slugs found in ${registryPath}`);
  return slugs;
}

/** Every path that should get a prerendered shell, without leading slashes. */
export function collectRoutes(registryPath) {
  return [...STATIC_ROUTES, ...benchmarkSlugs(registryPath).map(slug => `benchmarks/${slug}`)];
}

export function prerender(distDir, registryPath) {
  const shell = join(distDir, "index.html");
  const routes = collectRoutes(registryPath);
  for (const route of routes) {
    const dir = join(distDir, route);
    mkdirSync(dir, { recursive: true });
    copyFileSync(shell, join(dir, "index.html"));
  }
  return routes;
}

// Run only when invoked directly, so the helpers stay importable from tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = resolve(process.argv[2] ?? "dist");
  const registry = resolve(import.meta.dirname, "../src/data/benchmarks.ts");
  const routes = prerender(dist, registry);
  console.log(`Prerendered ${routes.length} route shells: ${routes.join(", ")}`);
}
