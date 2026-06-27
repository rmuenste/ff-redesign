import type { BenchmarkMeta } from "./types";

export const benchmarks: BenchmarkMeta[] = [
  {
    id: "rb3",
    slug: "bubble3",
    title: "Three-Dimensional Rising Bubble",
    shortTitle: "Rising Bubble 3D",
    tag: "RB3",
    model: "Two-Phase",
    dimension: "3D",
    reynolds: 35,
    levels: 3,
    summary:
      "A buoyancy-driven two-phase benchmark for a single bubble rising through a viscous medium in a cuboid domain.",
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
    model: "Two-Phase",
    dimension: "2D",
    reynolds: "35 / 125",
    levels: 3,
    summary:
      "A quantitative two-dimensional bubble dynamics benchmark with case-based cross-code comparisons.",
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
    model: "Newtonian",
    dimension: "3D",
    reynolds: "20 / 100",
    levels: 4,
    summary:
      "A laminar incompressible Navier-Stokes benchmark comparing drag and lift around a cylindrical obstacle.",
    tabs: ["Introduction", "Definition", "Results", "Reference Data", "Conclusion and Bibliography"],
    status: "planned"
  },
  {
    id: "sedimentation",
    slug: "particle-sedimentation",
    title: "Sedimentation of a Single Spherical Particle",
    shortTitle: "Particle Sedimentation",
    tag: "SED",
    model: "Particulate",
    dimension: "3D",
    reynolds: "1.5-31.9",
    levels: 2,
    summary:
      "A particulate-flow benchmark comparing the motion of a settling sphere and induced flow field against experimental data.",
    tabs: ["Introduction", "Definition", "Results", "Reference Data"],
    status: "planned"
  }
];

export function getBenchmarkBySlug(slug: string) {
  return benchmarks.find(benchmark => benchmark.slug === slug);
}
