import { existsSync, openSync, readFileSync, readSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarks } from "./benchmarks";
import {
  galleryFamilies,
  galleryFamilyFromParam,
  galleryFamilyLabel,
  galleryFamilyParam,
  galleryItemById,
  galleryItems,
  galleryItemsOfFamily,
  galleryNeighbours,
  galleryOrder,
  gallerySizes,
  gallerySrcAt,
  gallerySrcSet
} from "./gallery";
import type { AssetManifest } from "./types";

/**
 * Intrinsic size of a WebP file, read straight from its header, so the declared
 * aspect ratios are checked against the shipped pixels rather than against a
 * hand-kept table. Only the simple lossy (`VP8 `), lossless (`VP8L`) and
 * extended (`VP8X`) chunk headers are handled — the three the encoder emits.
 */
function webpSize(path: string): { width: number; height: number } {
  const fd = openSync(path, "r");
  const head = Buffer.alloc(32);
  try {
    readSync(fd, head, 0, head.length, 0);
  } finally {
    closeSync(fd);
  }
  if (head.toString("ascii", 0, 4) !== "RIFF" || head.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`not a WebP file: ${path}`);
  }
  const format = head.toString("ascii", 12, 16);
  if (format === "VP8X") {
    return {
      width: head.readUIntLE(24, 3) + 1,
      height: head.readUIntLE(27, 3) + 1
    };
  }
  if (format === "VP8 ") {
    return {
      width: head.readUInt16LE(26) & 0x3fff,
      height: head.readUInt16LE(28) & 0x3fff
    };
  }
  if (format === "VP8L") {
    const bits = head.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }
  throw new Error(`unsupported WebP chunk ${format} in ${path}`);
}

/** Strip the resolved base path so a URL can be located under `public/`. */
function publicPath(src: string) {
  const index = src.indexOf("/benchmark-assets/");
  expect(index, src).toBeGreaterThanOrEqual(0);
  return resolve(process.cwd(), `public${src.slice(index)}`);
}

describe("gallery registry", () => {
  it("runs in the narrative order: one body, a pair, a crowd, the two non-spherical cases", () => {
    expect(galleryOrder).toEqual([
      "sedimentation",
      "dkt",
      "hindered-settling",
      "numerical-viscometer",
      "oberbeck-spheroid-drag",
      "jeffery-orbit"
    ]);
    expect(galleryItems.map(item => item.family)).toEqual([
      "single body",
      "pairs",
      "collective",
      "collective",
      "non-spherical",
      "non-spherical"
    ]);
  });

  it("names benchmarks that exist in the registry, one still each", () => {
    const registryIds = new Set(benchmarks.map(benchmark => benchmark.id));
    for (const item of galleryItems) {
      expect(registryIds.has(item.benchmarkId), item.benchmarkId).toBe(true);
      expect(item.id).toBe(item.benchmarkId);
      expect(benchmarks.some(benchmark => benchmark.id === item.benchmarkId && benchmark.slug), item.id).toBe(true);
    }
    expect(new Set(galleryOrder).size).toBe(galleryItems.length);
  });

  it("carries the copy every card and lightbox panel needs", () => {
    for (const item of galleryItems) {
      expect(item.title.length, item.id).toBeGreaterThan(0);
      expect(item.caption.length, item.id).toBeGreaterThan(20);
      expect(item.provenance.length, item.id).toBeGreaterThan(5);
      expect(item.alt.length, item.id).toBeGreaterThan(20);
      expect(galleryFamilies).toContain(item.family);
      expect(item.focal, item.id).toMatch(/^\d+% \d+%$/);
      expect(item.kind).toBe("image");
    }
  });

  it("says nothing about how the images were made", () => {
    const prose = galleryItems
      .flatMap(item => [item.title, item.caption, item.provenance, item.alt])
      .join(" ")
      .toLowerCase();
    for (const word of ["blender", "render", "cycles", "camera", "shader", "screenshot", "paraview"]) {
      expect(prose, word).not.toContain(word);
    }
  });
});

describe("gallery files", () => {
  it("ships every rung of every width ladder under public/", () => {
    for (const item of galleryItems) {
      expect(item.sources.length, item.id).toBeGreaterThanOrEqual(2);
      for (const source of item.sources) {
        expect(source.src, item.id).toMatch(/^\/benchmark-assets\/[^/]+\/media\/gallery\/[^/]+\.webp$/);
        expect(existsSync(publicPath(source.src)), source.src).toBe(true);
      }
    }
  });

  it("puts each still under its own benchmark's asset directory", () => {
    for (const item of galleryItems) {
      for (const source of item.sources) {
        expect(source.src.startsWith(`/benchmark-assets/${item.benchmarkId}/`), source.src).toBe(true);
      }
    }
  });

  it("orders each ladder by ascending width and points `full` at the largest rung", () => {
    for (const item of galleryItems) {
      const widths = item.sources.map(source => source.width);
      expect([...widths].sort((a, b) => a - b), item.id).toEqual(widths);
      expect(item.full).toBe(item.sources[item.sources.length - 1].src);
    }
  });

  it("declares the widths the files actually have", () => {
    for (const item of galleryItems) {
      for (const source of item.sources) {
        expect(webpSize(publicPath(source.src)).width, source.src).toBe(source.width);
      }
    }
  });

  it("declares aspect ratios that match the pixels, consistently across the ladder", () => {
    for (const item of galleryItems) {
      for (const source of item.sources) {
        const { width, height } = webpSize(publicPath(source.src));
        expect(width / height, source.src).toBeCloseTo(item.aspect, 2);
      }
    }
  });

  it("ships no PNG master next to the WebP ladder", () => {
    for (const item of galleryItems) {
      for (const source of item.sources) {
        expect(existsSync(publicPath(source.src).replace(/\.webp$/, ".png")), source.src).toBe(false);
      }
    }
  });

  it("is recorded in the asset manifest of the benchmark that owns it", () => {
    for (const item of galleryItems) {
      const manifest = JSON.parse(
        readFileSync(resolve(process.cwd(), "public/benchmark-assets", item.benchmarkId, "manifest.json"), "utf-8")
      ) as AssetManifest;
      const media = new Map(manifest.entries.map(entry => [entry.newPath, entry]));
      for (const source of item.sources) {
        const newPath = source.src.slice(source.src.indexOf("/media/gallery/") + 1);
        const entry = media.get(newPath);
        expect(entry, `${item.id}: ${newPath}`).toBeDefined();
        expect(entry!.kind, newPath).toBe("media");
        expect(entry!.label, newPath).toBeTruthy();
      }
      // And nothing else: a still dropped from the registry must leave the
      // manifest too, or it ships as dead weight.
      const stills = manifest.entries.filter(entry => entry.newPath.startsWith("media/gallery/"));
      expect(stills, item.id).toHaveLength(item.sources.length);
    }
  });
});

describe("gallery lookups", () => {
  it("finds an item by id and shrugs off anything else", () => {
    expect(galleryItemById("jeffery-orbit")?.title).toBe("Jeffery orbit");
    expect(galleryItemById("rb3")).toBeUndefined();
    expect(galleryItemById(null)).toBeUndefined();
    expect(galleryItemById(undefined)).toBeUndefined();
    expect(galleryItemById("")).toBeUndefined();
  });

  it("wraps at both ends of the narrative order", () => {
    expect(galleryNeighbours("dkt")).toEqual({ prev: "sedimentation", next: "hindered-settling" });
    expect(galleryNeighbours("sedimentation").prev).toBe("jeffery-orbit");
    expect(galleryNeighbours("jeffery-orbit").next).toBe("sedimentation");
  });

  it("cycles inside a filtered running order", () => {
    const nonSpherical = galleryItems.filter(item => item.family === "non-spherical").map(item => item.id);
    expect(nonSpherical).toEqual(["oberbeck-spheroid-drag", "jeffery-orbit"]);
    expect(galleryNeighbours("jeffery-orbit", nonSpherical)).toEqual({
      prev: "oberbeck-spheroid-drag",
      next: "oberbeck-spheroid-drag"
    });
  });

  it("degenerates gracefully: an id outside the order, and an order of one", () => {
    expect(galleryNeighbours("rb3")).toEqual({ prev: undefined, next: undefined });
    expect(galleryNeighbours("dkt", ["dkt"])).toEqual({ prev: "dkt", next: "dkt" });
  });
});

describe("gallery responsive attributes", () => {
  it("builds a srcset with one width descriptor per rung", () => {
    const item = galleryItemById("oberbeck-spheroid-drag")!;
    expect(gallerySrcSet(item).split(", ")).toHaveLength(4);
    expect(gallerySrcSet(item)).toContain("oberbeck_gallery_2000w.webp 2000w");
  });

  it("builds a sizes hint capped at the card column width", () => {
    expect(gallerySizes(520)).toBe("(max-width: 520px) 100vw, 520px");
  });

  it("picks the narrowest rung that still covers the box, and never undershoots", () => {
    const item = galleryItemById("oberbeck-spheroid-drag")!;
    expect(gallerySrcAt(item, 400)).toContain("oberbeck_gallery_600w.webp");
    expect(gallerySrcAt(item, 600)).toContain("oberbeck_gallery_600w.webp");
    expect(gallerySrcAt(item, 601)).toContain("oberbeck_gallery_1000w.webp");
    expect(gallerySrcAt(item, 9000)).toBe(item.full);
    for (const listed of galleryItems) {
      expect(listed.sources.map(source => source.src)).toContain(gallerySrcAt(listed, 880));
    }
  });
});

describe("gallery families", () => {
  it("labels a family for a chip without changing the stored value", () => {
    expect(galleryFamilies.map(galleryFamilyLabel)).toEqual([
      "Single body",
      "Pairs",
      "Collective",
      "Non-spherical"
    ]);
  });

  it("filters to a family, and to everything when none is chosen", () => {
    expect(galleryItemsOfFamily("collective").map(item => item.id)).toEqual([
      "hindered-settling",
      "numerical-viscometer"
    ]);
    expect(galleryItemsOfFamily(null)).toEqual(galleryItems);
    expect(galleryItemsOfFamily(undefined)).toHaveLength(galleryItems.length);
  });

  it("round-trips a family through the ?family= parameter and rejects junk", () => {
    for (const family of galleryFamilies) {
      expect(galleryFamilyFromParam(galleryFamilyParam(family))).toBe(family);
    }
    expect(galleryFamilyParam("non-spherical")).toBe("non-spherical");
    expect(galleryFamilyParam("single body")).toBe("single-body");
    expect(galleryFamilyFromParam("spheres")).toBeNull();
    expect(galleryFamilyFromParam("single body")).toBeNull();
    expect(galleryFamilyFromParam(null)).toBeNull();
  });

  it("cycles inside the family the reader chose", () => {
    const collective = galleryItemsOfFamily("collective");
    expect(galleryNeighbours("hindered-settling", collective)).toEqual({
      prev: "numerical-viscometer",
      next: "numerical-viscometer"
    });
    // Same answer whether the caller passes items or bare ids.
    expect(galleryNeighbours("hindered-settling", collective.map(item => item.id))).toEqual(
      galleryNeighbours("hindered-settling", collective)
    );
  });
});
