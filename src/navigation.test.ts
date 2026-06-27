import { describe, expect, it } from "vitest";
import { benchmarks } from "./data/benchmarks";
import { legacyRouteForBenchmarkSlug, pathForLegacyRoute } from "./navigation";

describe("benchmark navigation mapping", () => {
  it("maps every active benchmark card to its canonical page", () => {
    const expectedPaths: Record<string, string> = {
      rb3: "/benchmarks/bubble3",
      rb2: "/benchmarks/2d-rising-bubble",
      fac3: "/benchmarks/fac3"
    };

    for (const benchmark of benchmarks.filter(item => item.status === "active")) {
      const route = legacyRouteForBenchmarkSlug(benchmark.slug);
      expect(route, benchmark.id).not.toBeNull();
      expect(pathForLegacyRoute(route!), benchmark.id).toBe(expectedPaths[benchmark.id]);
    }
  });

  it("does not route planned benchmarks from active card lists", () => {
    for (const benchmark of benchmarks.filter(item => item.status === "planned")) {
      expect(legacyRouteForBenchmarkSlug(benchmark.slug), benchmark.id).toBeNull();
    }
  });
});
