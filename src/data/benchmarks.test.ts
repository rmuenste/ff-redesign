import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarks, getBenchmarkBySlug } from "./benchmarks";

describe("benchmark registry", () => {
  it("has unique ids and slugs", () => {
    expect(new Set(benchmarks.map(b => b.id)).size).toBe(benchmarks.length);
    expect(new Set(benchmarks.map(b => b.slug)).size).toBe(benchmarks.length);
  });

  it("keys each thumbnail motif to the benchmark physics", () => {
    const thumbs = Object.fromEntries(benchmarks.map(b => [b.id, b.thumb]));
    expect(thumbs).toEqual({ rb3: "bubble", rb2: "bubble-2d", fac3: "cylinder", sedimentation: "sediment" });
  });

  it("resolves benchmarks by slug", () => {
    expect(getBenchmarkBySlug("bubble3")?.id).toBe("rb3");
    expect(getBenchmarkBySlug("2d-rising-bubble")?.id).toBe("rb2");
    expect(getBenchmarkBySlug("fac3")?.id).toBe("fac3");
    expect(getBenchmarkBySlug("particle-sedimentation")?.id).toBe("sedimentation");
    expect(getBenchmarkBySlug("does-not-exist")).toBeUndefined();
  });

  it("every active benchmark has a comparison axis and an existing asset directory", () => {
    for (const benchmark of benchmarks.filter(b => b.status === "active")) {
      expect(benchmark.comparisonAxis, benchmark.id).toBeDefined();
      const dir = resolve(process.cwd(), "public/benchmark-assets", benchmark.id);
      expect(existsSync(dir), dir).toBe(true);
    }
  });

  it("keeps migrated benchmarks active and future pages planned", () => {
    expect(benchmarks.filter(b => b.status === "active").map(b => b.id)).toEqual(["rb3", "rb2", "fac3", "sedimentation"]);
    expect(benchmarks.filter(b => b.status === "planned").map(b => b.id)).toEqual([]);
  });
});
