import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetGeneratedOutputs, writeManifest } from "../../scripts/lib/output-dir.mjs";

type Entry = { oldPath: string; newPath: string; kind: string; label: string };

const plot = (newPath: string): Entry => ({ oldPath: "source.csv", newPath, kind: "code", label: newPath });
const download = (newPath: string): Entry => ({ oldPath: "source.csv", newPath, kind: "download", label: newPath });
const still: Entry = {
  oldPath: "generated from blender_viz/website_assets/case/renders/case_600w.webp",
  newPath: "media/gallery/case_600w.webp",
  kind: "media",
  label: "Case gallery still"
};

function file(outDir: string, path: string, content = path) {
  mkdirSync(join(outDir, path, ".."), { recursive: true });
  writeFileSync(join(outDir, path), content);
}

function readManifest(outDir: string) {
  return JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf-8")) as { benchmarkId: string; entries: Entry[] };
}

/** A benchmark folder as a converter leaves it, plus the gallery's still and entry. */
function seed(outDir: string, entries: Entry[]) {
  for (const entry of entries) file(outDir, entry.newPath);
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify({ benchmarkId: "case", entries }, null, 2)}\n`);
}

describe("resetGeneratedOutputs / writeManifest", () => {
  let outDir: string;
  beforeEach(() => {
    outDir = mkdtempSync(join(tmpdir(), "output-dir-"));
  });
  afterEach(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it("clears only the owned directories and carries the gallery still and its entry through a rebuild", () => {
    const own = [plot("plots/torque/a.json"), plot("plots/torque/b.json"), download("downloads/case.zip")];
    seed(outDir, [...own, still]);

    // As a converter does: reset, rebuild under the owned paths, write the manifest.
    const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId: "case" });

    expect(existsSync(join(outDir, "plots"))).toBe(false);
    expect(existsSync(join(outDir, "downloads"))).toBe(false);
    expect(existsSync(join(outDir, "manifest.json"))).toBe(false);
    expect(readFileSync(join(outDir, still.newPath), "utf-8")).toBe(still.newPath);
    expect(preserved.entries).toEqual([still]);
    expect(preserved.insertAt).toBe(0);

    const rebuilt = [plot("plots/torque/a.json"), download("downloads/case.zip")];
    for (const entry of rebuilt) file(outDir, entry.newPath, "rebuilt");
    writeManifest(outDir, "case", rebuilt, preserved);

    expect(readManifest(outDir)).toEqual({ benchmarkId: "case", entries: [...rebuilt, still] });
    expect(readFileSync(join(outDir, still.newPath), "utf-8")).toBe(still.newPath);
    expect(existsSync(join(outDir, "plots/torque/b.json"))).toBe(false);
  });

  it("owns single files under media/ without touching the gallery next to them", () => {
    const figure: Entry = { oldPath: "fig1.jpg", newPath: "media/geometry.jpg", kind: "media", label: "Geometry" };
    seed(outDir, [plot("plots/drag.json"), figure, still]);

    const preserved = resetGeneratedOutputs(outDir, ["plots", "media/geometry.jpg"]);

    expect(existsSync(join(outDir, "media/geometry.jpg"))).toBe(false);
    expect(existsSync(join(outDir, still.newPath))).toBe(true);
    expect(preserved.entries).toEqual([still]);
  });

  it("keeps a companion's section in place, ahead of stills added after it", () => {
    const core = [plot("plots/velocity/e1.json"), download("downloads/core.zip")];
    const section = [plot("plots/lubrication/e1.json"), download("downloads/lubrication/lub.zip")];
    seed(outDir, [...core, ...section, still]);

    const preserved = resetGeneratedOutputs(outDir, ["plots/lubrication", "downloads/lubrication"], { benchmarkId: "case" });

    expect(existsSync(join(outDir, "plots/velocity/e1.json"))).toBe(true);
    expect(existsSync(join(outDir, "plots/lubrication"))).toBe(false);
    expect(preserved.entries).toEqual([...core, still]);
    expect(preserved.insertAt).toBe(core.length);

    const rebuilt = [plot("plots/lubrication/e1.json"), plot("plots/lubrication/e2.json")];
    for (const entry of rebuilt) file(outDir, entry.newPath);
    writeManifest(outDir, "case", rebuilt, preserved);
    expect(readManifest(outDir).entries).toEqual([...core, ...rebuilt, still]);
  });

  it("appends the own entries when the manifest did not have them yet, and starts from nothing", () => {
    seed(outDir, [still]);
    const preserved = resetGeneratedOutputs(outDir, ["plots"]);
    writeManifest(outDir, "case", [plot("plots/a.json")], preserved);
    expect(readManifest(outDir).entries.map(entry => entry.newPath)).toEqual([still.newPath, "plots/a.json"]);

    rmSync(outDir, { recursive: true, force: true });
    const fresh = resetGeneratedOutputs(outDir, ["plots"], { benchmarkId: "case" });
    expect(fresh).toEqual({ entries: [], insertAt: 0, owned: ["plots"] });
    writeManifest(outDir, "case", [plot("plots/a.json")], fresh, { indent: 0 });
    expect(readFileSync(join(outDir, "manifest.json"), "utf-8")).toBe(
      `${JSON.stringify({ benchmarkId: "case", entries: [plot("plots/a.json")] })}\n`
    );
  });

  it("refuses the wrong folder, unsafe ownership, undeclared entries and duplicates", () => {
    seed(outDir, [plot("plots/a.json"), still]);
    expect(() => resetGeneratedOutputs(outDir, ["plots"], { benchmarkId: "other" })).toThrow(/unexpected manifest/);
    for (const unsafe of ["", ".", "..", "../sibling", "/plots", "plots/../.."]) {
      expect(() => resetGeneratedOutputs(outDir, [unsafe]), unsafe).toThrow(/relative path inside/);
    }
    expect(existsSync(join(outDir, "plots/a.json")), "nothing is removed before the arguments pass").toBe(true);

    const preserved = resetGeneratedOutputs(outDir, ["plots", "downloads"], { benchmarkId: "case" });
    expect(() => writeManifest(outDir, "case", [{ ...still }], preserved)).toThrow(/outside the paths the converter owns/);
    expect(() => writeManifest(outDir, "case", [plot("plots/a.json"), plot("plots/a.json")], preserved)).toThrow(
      /recorded twice/
    );
    expect(existsSync(join(outDir, "manifest.json"))).toBe(false);
  });
});
