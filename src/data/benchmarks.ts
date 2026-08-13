import type { BenchmarkMeta } from "./types";

export const benchmarks: BenchmarkMeta[] = [
  {
    id: "rb3",
    slug: "bubble3",
    title: "Three-Dimensional Rising Bubble",
    shortTitle: "Rising Bubble 3D",
    tag: "RB3",
    suite: "Core benchmarks",
    model: "Two-Phase",
    dimension: "3D",
    reynolds: 35,
    levels: 3,
    summary:
      "A buoyancy-driven two-phase benchmark for a single bubble rising through a viscous medium in a cuboid domain.",
    thumb: "bubble",
    tabs: ["Introduction", "Definition", "Results", "Reference Data"],
    comparisonAxis: "level",
    status: "active"
  },
  {
    id: "rb2",
    slug: "2d-rising-bubble",
    title: "Two-Dimensional Rising Bubble",
    shortTitle: "Rising Bubble 2D",
    tag: "RB2",
    suite: "Core benchmarks",
    model: "Two-Phase",
    dimension: "2D",
    reynolds: "35 / 125",
    levels: 3,
    summary:
      "A quantitative two-dimensional bubble dynamics benchmark with case-based cross-code comparisons.",
    thumb: "bubble-2d",
    tabs: ["Introduction", "Definition", "Results", "Reference Data"],
    comparisonAxis: "code",
    status: "active"
  },
  {
    id: "fac3",
    slug: "fac3",
    title: "Flow Around A Cylinder",
    shortTitle: "Flow Around Cylinder 3D",
    tag: "FAC",
    suite: "Core benchmarks",
    model: "Newtonian",
    dimension: "3D",
    reynolds: "20 / 100",
    levels: 4,
    summary:
      "A laminar incompressible Navier-Stokes benchmark comparing drag and lift around a cylindrical obstacle.",
    thumb: "cylinder",
    tabs: ["Introduction", "Definition", "Results", "Reference Data", "Conclusion and Bibliography"],
    comparisonAxis: "code",
    status: "active"
  },
  {
    id: "sedimentation",
    slug: "particle-sedimentation",
    title: "Sedimentation of a Single Spherical Particle",
    shortTitle: "Particle Sedimentation",
    tag: "SED",
    suite: "Core benchmarks",
    model: "Particulate",
    dimension: "3D",
    reynolds: "1.5-31.9",
    levels: 2,
    summary:
      "A particulate-flow benchmark comparing the motion of a settling sphere and induced flow field against experimental data.",
    thumb: "sediment",
    tabs: ["Introduction", "Definition", "Results", "Reference Data"],
    comparisonAxis: "code",
    status: "active"
  },
  {
    id: "dkt",
    slug: "drafting-kissing-tumbling",
    title: "Drafting, Kissing and Tumbling of Two Spheres",
    shortTitle: "Drafting-Kissing-Tumbling",
    tag: "DKT",
    suite: "DNS validation",
    model: "Particulate",
    dimension: "3D",
    reynolds: 86,
    levels: 2,
    summary:
      "Two settling spheres reproduce the classical Fortes sequence: the trailing sphere drafts in the leader's wake, the pair touches, tumbles, and separates with the roles exchanged.",
    thumb: "dkt-pair",
    tabs: ["Introduction", "Definition", "Results", "Contact Model", "Validation", "Reference Data"],
    comparisonAxis: "code",
    status: "active"
  }
];

/** Catalogue facet values, in display order, derived from the registry. */
export const benchmarkSuites = Array.from(new Set(benchmarks.map(benchmark => benchmark.suite)));

export function getBenchmarkBySlug(slug: string) {
  return benchmarks.find(benchmark => benchmark.slug === slug);
}
