const basePath = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");

export const benchmarkAssetRoot = `${basePath}/benchmark-assets`;

export function benchmarkAssetPath(benchmarkId: string, path: string) {
  return `${benchmarkAssetRoot}/${benchmarkId}/${path}`;
}

// The asset manifest is authoritative as `public/benchmark-assets/<id>/manifest.json`
// — it lives next to the files it describes. App code does not import it; only tests
// read it from disk (see src/data/assets.test.ts).
