import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarks, getBenchmarkBySlug } from "./benchmarks";

describe("benchmark registry", () => {
  it("has unique ids and slugs", () => {
    expect(new Set(benchmarks.map(b => b.id)).size).toBe(benchmarks.length);
    expect(new Set(benchmarks.map(b => b.slug)).size).toBe(benchmarks.length);
  });

  it("resolves benchmarks by slug", () => {
    expect(getBenchmarkBySlug("bubble3")?.id).toBe("rb3");
    expect(getBenchmarkBySlug("does-not-exist")).toBeUndefined();
  });

  it("every active benchmark has a comparison axis and an existing asset directory", () => {
    for (const benchmark of benchmarks.filter(b => b.status === "active")) {
      expect(benchmark.comparisonAxis, benchmark.id).toBeDefined();
      const dir = resolve(process.cwd(), "public/benchmark-assets", benchmark.id);
      expect(existsSync(dir), dir).toBe(true);
    }
  });

  it("keeps RB3 as the only active benchmark for now", () => {
    expect(benchmarks.filter(b => b.status === "active").map(b => b.id)).toEqual(["rb3"]);
  });
});
