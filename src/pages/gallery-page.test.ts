import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { galleryItems } from "../data/gallery";

/**
 * The vitest setup here runs in a node environment with no DOM (see
 * vitest.config.ts), so the gallery page cannot be mounted and driven. What can
 * still be held in place is the wiring and the behavioural contract as written:
 * the route, the cross-links on the benchmark pages, and the handful of
 * attributes and parameters that the lightbox's keyboard, URL and accessibility
 * behaviour is built on. These are the things a refactor silently drops.
 *
 * Everything with real logic in it — the running order, the neighbours, the
 * filter, the width ladders — lives in src/data/gallery.ts and is tested against
 * the shipped files in src/data/gallery.test.ts.
 */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf-8");

const APP = read("src/App.tsx");
const PAGE = read("src/pages/GalleryPage.tsx");
const FIGURE = read("src/components/gallery-figure.tsx");
const INDEX = read("src/BenchmarksIndex.jsx");

describe("gallery route", () => {
  it("serves /gallery from the page, with the nav label kept", () => {
    expect(APP).toContain('<Route path="/gallery" element={<GalleryPage />} />');
    expect(APP).toContain('import { GalleryPage } from "./pages/GalleryPage";');
    expect(APP).toContain('"/gallery": "13 Gallery"');
  });

  it("leaves no placeholder behind", () => {
    expect(APP).not.toContain("Gallery.jsx");
  });
});

describe("gallery page contract", () => {
  it("keeps the open still in the URL, so a still can be linked to", () => {
    expect(PAGE).toContain("useSearchParams");
    expect(PAGE).toContain('searchParams.get("view")');
    expect(PAGE).toContain('searchParams.get("family")');
  });

  it("pushes on open and replaces while cycling, so Back closes the lightbox", () => {
    // The open path is the only setSearchParams call without `replace: true`.
    const pushes = PAGE.split("setSearchParams").filter(chunk => chunk.startsWith("(current"));
    expect(pushes).toHaveLength(1);
    expect(PAGE).toContain("navigate(-1)");
  });

  it("announces itself as a modal dialog and traps the keyboard", () => {
    expect(PAGE).toContain('role="dialog"');
    expect(PAGE).toContain('aria-modal="true"');
    for (const key of ["Escape", "ArrowLeft", "ArrowRight", "Tab"]) {
      expect(PAGE, key).toContain(`"${key}"`);
    }
  });

  it("locks the page behind the scrim and respects reduced motion", () => {
    expect(PAGE).toContain('document.body.style.overflow = "hidden"');
    expect(PAGE).toContain("prefers-reduced-motion: reduce");
  });

  it("guards every window access, so the route prerenders", () => {
    for (const match of PAGE.matchAll(/window\./g)) {
      const line = PAGE.slice(0, match.index).split("\n").length;
      expect(PAGE.split("\n").slice(Math.max(0, line - 6), line).join("\n"), `line ${line}`).toMatch(
        /typeof window === "undefined"|useEffect/
      );
    }
  });

  it("serves the grid responsively, cropped about each still's focal point", () => {
    expect(PAGE).toContain('loading="lazy"');
    expect(PAGE).toContain("gallerySrcSet(item)");
    expect(PAGE).toContain("gallerySizes(CARD_WIDTH)");
    expect(PAGE).toContain('objectFit: "cover"');
    expect(PAGE).toContain("objectPosition: item.focal");
    // The lightbox shows the full frame instead.
    expect(PAGE).toContain('objectFit: "contain"');
  });

  it("offers both ways out of a still: the benchmark page and the full-size file", () => {
    expect(PAGE).toContain("Open benchmark page");
    expect(PAGE).toContain("Full size");
    expect(PAGE).toContain('rel="noopener noreferrer"');
  });

  it("reads the stills from the registry rather than naming files", () => {
    expect(PAGE).not.toMatch(/\.webp/);
    expect(PAGE).not.toMatch(/\.png/);
  });
});

describe("gallery cross-links", () => {
  const pages: [string, string][] = [
    ["src/pages/ParticleSedimentationPage.tsx", "sedimentation"],
    ["src/pages/DraftingKissingTumblingPage.tsx", "dkt"],
    ["src/pages/HinderedSettlingPage.tsx", "hindered-settling"],
    ["src/pages/NumericalViscometerPage.tsx", "numerical-viscometer"],
    ["src/pages/OberbeckSpheroidDragPage.tsx", "oberbeck-spheroid-drag"],
    ["src/pages/JefferyOrbitPage.tsx", "jeffery-orbit"]
  ];

  it("opens every DNS benchmark's Introduction tab with that benchmark's still", () => {
    for (const [path, id] of pages) {
      const source = read(path);
      expect(source, path).toContain(`<GalleryFigure id="${id}" />`);
      const intro = source.indexOf("function IntroductionTab()");
      const figure = source.indexOf("<GalleryFigure");
      const renderer = source.indexOf("<ContentRenderer", intro);
      expect(intro, path).toBeGreaterThanOrEqual(0);
      // At the top of the Introduction tab, ahead of its prose.
      expect(figure, path).toBeGreaterThan(intro);
      expect(figure, path).toBeLessThan(renderer);
    }
    expect(pages.map(([, id]) => id).sort()).toEqual(galleryItems.map(item => item.id).sort());
  });

  it("keeps the schematics the pages already carried", () => {
    expect(read("src/pages/DraftingKissingTumblingPage.tsx")).toContain("<DktSchematic />");
    expect(read("src/pages/NumericalViscometerPage.tsx")).toContain("<ViscometerSchematic");
    expect(read("src/pages/OberbeckSpheroidDragPage.tsx")).toContain("<OberbeckSchematic");
    expect(read("src/pages/JefferyOrbitPage.tsx")).toContain("<JefferySchematic");
  });

  it("links the figure at the gallery with the same still open", () => {
    expect(FIGURE).toContain("`/gallery?view=${item.id}`");
    expect(FIGURE).toContain("View in gallery");
    expect(FIGURE).toContain('loading="lazy"');
  });

  it("uses the render on the index card, and keeps MeshThumb where there is none", () => {
    expect(INDEX).toContain("galleryItemById(benchmark.id)");
    expect(INDEX).toContain("objectPosition: still.focal");
    expect(INDEX).toContain("<MeshThumb variant={variant} shape={benchmark.thumb}/>");
    // rb2, rb3 and fac3 have no still yet, so the drawn thumbnail still matters.
    const withStill = new Set(galleryItems.map(item => item.id));
    expect(["rb3", "rb2", "fac3"].some(id => withStill.has(id))).toBe(false);
  });
});
