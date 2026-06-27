export type LegacyRoute = "home" | "benchmarks" | "detail" | "rb2" | "fac3" | "gallery";

const benchmarkSlugRoutes: Record<string, LegacyRoute> = {
  bubble3: "detail",
  "2d-rising-bubble": "rb2",
  fac3: "fac3"
};

export function legacyRouteForBenchmarkSlug(slug: string): LegacyRoute | null {
  return benchmarkSlugRoutes[slug] ?? null;
}

export function pathForLegacyRoute(route: LegacyRoute): string {
  if (route === "home") return "/";
  if (route === "benchmarks") return "/benchmarks";
  if (route === "detail") return "/benchmarks/bubble3";
  if (route === "rb2") return "/benchmarks/2d-rising-bubble";
  if (route === "fac3") return "/benchmarks/fac3";
  return "/gallery";
}

export function legacyRouteForPath(pathname: string): LegacyRoute {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/benchmarks/bubble3")) return "detail";
  if (pathname.startsWith("/benchmarks/2d-rising-bubble")) return "rb2";
  if (pathname.startsWith("/benchmarks/fac3")) return "fac3";
  if (pathname.startsWith("/benchmarks")) return "benchmarks";
  if (pathname.startsWith("/gallery")) return "gallery";
  return "home";
}
