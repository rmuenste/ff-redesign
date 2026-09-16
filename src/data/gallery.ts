// ===== Gallery registry =====
//
// The rendered stills of the validation cases, in the order the campaign tells
// its story: one body, then a pair, then a crowd, then the two non-spherical
// cases. The gallery page, the cross-link figure on each benchmark page and the
// benchmarks index all read this one array, so a new render is added here and
// appears in every place at once.
//
// `sources` is the WebP width ladder as it sits on disk under
// `public/benchmark-assets/<id>/media/gallery/`; `full` is the largest of them.
// The PNG masters that these were derived from are deliberately not shipped.

import { benchmarkAssetPath } from "./assets";
import { benchmarks } from "./benchmarks";

/** The four families the filter row offers, in display order. */
export const galleryFamilies = ["single body", "pairs", "collective", "non-spherical"] as const;

export type GalleryFamily = (typeof galleryFamilies)[number];

export interface GallerySource {
  /** Resolved, base-path aware URL of one rung of the width ladder. */
  src: string;
  /** Intrinsic pixel width, used for the `srcset` descriptor. */
  width: number;
}

export interface GalleryItem {
  /** Same string as the benchmark id — the gallery has one still per benchmark. */
  id: string;
  benchmarkId: string;
  title: string;
  /** One line: what the reader is looking at. */
  caption: string;
  /** One line: which run, and which moment of it. */
  provenance: string;
  family: GalleryFamily;
  /** Intrinsic aspect ratio, width / height. */
  aspect: number;
  /** `object-position` for the uniform 3:2 card crop. */
  focal: string;
  sources: GallerySource[];
  /** Largest rung of the ladder: the lightbox image and the "Full size" link. */
  full: string;
  alt: string;
  kind: "image" | "video";
  /** Still shown while a future `kind: "video"` item loads. */
  poster?: string;
}

function galleryAsset(benchmarkId: string, file: string) {
  return benchmarkAssetPath(benchmarkId, `media/gallery/${file}`);
}

function ladder(benchmarkId: string, files: [string, number][]): GallerySource[] {
  return files.map(([file, width]) => ({ src: galleryAsset(benchmarkId, file), width }));
}

const sedimentationSources = ladder("sedimentation", [
  ["ten_cate_gallery_1200.webp", 1200],
  ["ten_cate_gallery.webp", 2400]
]);

const dktSources = ladder("dkt", [
  ["dkt_strobe_600w.webp", 600],
  ["dkt_strobe_1000w.webp", 1000],
  ["dkt_strobe_1500w.webp", 1500]
]);

const hinderedSources = ladder("hindered-settling", [
  ["hindered_gallery_600w.webp", 600],
  ["hindered_gallery_1000w.webp", 1000],
  ["hindered_gallery_1500w.webp", 1500]
]);

const viscometerSources = ladder("numerical-viscometer", [
  ["viscometer_lab_600w.webp", 600],
  ["viscometer_lab_1000w.webp", 1000],
  ["viscometer_lab_1500w.webp", 1500],
  ["viscometer_lab_2000w.webp", 2000]
]);

const oberbeckSources = ladder("oberbeck-spheroid-drag", [
  ["oberbeck_gallery_600w.webp", 600],
  ["oberbeck_gallery_1000w.webp", 1000],
  ["oberbeck_gallery_1500w.webp", 1500],
  ["oberbeck_gallery_2000w.webp", 2000]
]);

const jefferySources = ladder("jeffery-orbit", [
  ["jeffery_gallery_1200.webp", 1200],
  ["jeffery_gallery.webp", 2400]
]);

function largest(sources: GallerySource[]) {
  return sources.reduce((best, source) => (source.width > best.width ? source : best)).src;
}

/** The stills, in narrative order. This order is the gallery's running order. */
export const galleryItems: GalleryItem[] = [
  {
    id: "sedimentation",
    benchmarkId: "sedimentation",
    title: "Sedimentation of a sphere",
    caption:
      "A single sphere half a diameter above the tank floor: the squeeze flow spreads along the bottom while the wake still follows the sphere down.",
    provenance: "Re = 1.5, t = 3.40 s, the moment of ten Cate's flow-field comparison",
    family: "single body",
    aspect: 4 / 3,
    focal: "50% 60%",
    sources: sedimentationSources,
    full: largest(sedimentationSources),
    alt: "A sphere settling close to the tank floor, the squeeze flow spreading sideways beneath it and the wake trailing above.",
    kind: "image"
  },
  {
    id: "dkt",
    benchmarkId: "dkt",
    title: "Drafting, kissing, tumbling",
    caption:
      "Two spheres released one above the other, shown at eight moments: the trailer drafts and catches up, the pair touches, tumbles over and separates with the roles exchanged.",
    provenance: "Frictionless contact, D/h = 8, t = 0 to 40",
    family: "pairs",
    aspect: 600 / 800,
    focal: "50% 45%",
    sources: dktSources,
    full: largest(dktSources),
    alt: "Eight stages of two settling spheres side by side: approach, contact, tumble and separation.",
    kind: "image"
  },
  {
    id: "hindered-settling",
    benchmarkId: "hindered-settling",
    title: "Hindered settling",
    caption:
      "A cloud of 120 spheres settles at 60 % of the speed of the lone sphere in the neighbouring column; colour is each sphere's own settling speed.",
    provenance: "N = 120, walled 6 d column, t = 20",
    family: "collective",
    aspect: 600 / 750,
    focal: "50% 50%",
    sources: hinderedSources,
    full: largest(hinderedSources),
    alt: "A tall column of many settling spheres coloured by their settling speed, beside a column holding a single sphere.",
    kind: "image"
  },
  {
    id: "numerical-viscometer",
    benchmarkId: "numerical-viscometer",
    title: "Numerical viscometer",
    caption:
      "A suspension of 900 neutrally buoyant spheres between a rotating bob and a fixed cup; the data plane shows how the particles bend the Couette profile.",
    provenance: "phi = 0.20 at the torque plateau, t = 250",
    family: "collective",
    aspect: 4 / 3,
    focal: "50% 55%",
    sources: viscometerSources,
    full: largest(viscometerSources),
    alt: "A Couette cell filled with hundreds of spheres between an inner rotating bob and an outer cup, cut by a coloured velocity plane.",
    kind: "image"
  },
  {
    id: "oberbeck-spheroid-drag",
    benchmarkId: "oberbeck-spheroid-drag",
    title: "Oberbeck spheroid drag",
    caption:
      "The same spheroid held along and across a slow flow: the drag across the axis is 1.145 times the drag along it.",
    provenance: "Stokes flow, aspect ratio 2, level-4 runs",
    family: "non-spherical",
    aspect: 600 / 360,
    focal: "45% 50%",
    sources: oberbeckSources,
    full: largest(oberbeckSources),
    alt: "A prolate spheroid shown twice in a slow flow, once end-on to the stream and once broadside to it.",
    kind: "image"
  },
  {
    id: "jeffery-orbit",
    benchmarkId: "jeffery-orbit",
    title: "Jeffery orbit",
    caption:
      "A spheroid tumbling in simple shear between two moving plates; the plane shows the four-lobed flow the body itself induces.",
    provenance: "t = 90, aspect ratio 2, wall clearance 8 semi-axes",
    family: "non-spherical",
    aspect: 4 / 3,
    focal: "40% 50%",
    sources: jefferySources,
    full: largest(jefferySources),
    alt: "A prolate spheroid tumbling between two shearing plates, the four-lobed disturbance flow drawn on the shear plane around it.",
    kind: "image"
  }
];

/** Narrative order as plain ids — the contract the page and its test share. */
export const galleryOrder = galleryItems.map(item => item.id);

export function galleryItemById(id: string | null | undefined) {
  if (!id) return undefined;
  return galleryItems.find(item => item.id === id);
}

/** The benchmark registry row a still belongs to, for the "open the page" link. */
export function galleryBenchmark(item: GalleryItem) {
  return benchmarks.find(benchmark => benchmark.id === item.benchmarkId);
}

/**
 * Previous and next in a running order, wrapping at both ends. Defaults to the
 * full narrative order; the lightbox passes the currently filtered set so that
 * cycling stays inside the filter the reader chose — as items or as bare ids,
 * whichever the caller already has to hand.
 */
export function galleryNeighbours(id: string, within: readonly (GalleryItem | string)[] = galleryOrder) {
  const order = within.map(entry => (typeof entry === "string" ? entry : entry.id));
  const index = order.indexOf(id);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: order[(index - 1 + order.length) % order.length],
    next: order[(index + 1) % order.length]
  };
}

/** `srcset` attribute for one item's ladder. */
export function gallerySrcSet(item: GalleryItem) {
  return item.sources.map(source => `${source.src} ${source.width}w`).join(", ");
}

/**
 * `sizes` hint. The grid card is one column of a `minmax(<min>px, 1fr)` grid, so
 * the rendered width is capped by the column, not by the viewport — a single
 * breakpoint below which a card spans the full viewport is enough.
 */
export function gallerySizes(maxWidth = 520) {
  return `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;
}

/**
 * The rung a non-`srcset` browser should get as plain `src`: the narrowest one
 * that still covers the box the image is drawn in, and the widest available if
 * none does. Everything else picks from `srcset`.
 */
export function gallerySrcAt(item: GalleryItem, width: number) {
  const covering = item.sources.find(source => source.width >= width);
  return (covering ?? item.sources[item.sources.length - 1]).src;
}

/**
 * The family as a chip reads it: sentence case, so "single body" becomes
 * "Single body". The stored values stay lowercase because they are data.
 */
export function galleryFamilyLabel(family: GalleryFamily) {
  return family.charAt(0).toUpperCase() + family.slice(1);
}

/** The items of one family, or all of them when no family is chosen. */
export function galleryItemsOfFamily(family: GalleryFamily | null | undefined) {
  if (!family) return galleryItems;
  return galleryItems.filter(item => item.family === family);
}

/** A `?family=` parameter, validated back into a family or null. */
export function galleryFamilyFromParam(value: string | null | undefined): GalleryFamily | null {
  const match = galleryFamilies.find(family => family.replace(/ /g, "-") === value);
  return match ?? null;
}

/** The inverse: the URL-safe spelling of a family. */
export function galleryFamilyParam(family: GalleryFamily) {
  return family.replace(/ /g, "-");
}
