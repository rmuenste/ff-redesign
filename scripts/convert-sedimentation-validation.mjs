// Generates the Particle Sedimentation validation ledger from the DNS campaign
// datasheet. Companion to scripts/convert-sedimentation-data.mjs, which builds
// the plot assets; kept separate so the plot converter stays untouched.
//
// Selection policy
// ----------------
// The timestep study was measured twice. The first pass ran while the rigid-body
// solver integrated at its own configured stepsize instead of the CFD timestep,
// so those runs measured a coupling artifact; the "added-mass stability floor"
// read from them was later refuted. Every dt != 1 ms point was then re-run with
// the two timesteps synchronised (the `_sync` rundirs).
//
// Published: the spatial ladder at dt = 1 ms (explicitly unaffected by the
// defect), the cross-case matrix, the reference audit, the comparison against
// ten Cate's own simulations, the synced timestep ladder, and the rows that
// found and refuted the defect.
//
// Withheld: the first-pass, desynchronised timestep points and the temporal term
// fitted from them. They are superseded by the synced re-runs, which is where the
// published dt numbers come from.
//
// The fitted spatial/temporal split comes from the curated output of
// tools/tencate_error_decomposition.py in the FeatFloWer repository, which is the
// authority for those numbers; the datasheet's ladder row still carries a
// "refit pending" note that the tool has since superseded.
//
// Run with: node scripts/convert-sedimentation-validation.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";

const root = resolve(import.meta.dirname, "..");
const datasheetSource = "scripts/source-data/dns/dns_validation_datasheet.csv";
const decompositionSource = "scripts/source-data/dns/tencate_error_decomposition.txt";
const outPath = resolve(root, "src/data/generated/sedimentation-validation.json");

/** Spatial ladder points at the reference timestep: `e<case>[_ladder]_l<level>`. */
const SPATIAL_LADDER = /^e[1-4](?:_ladder)?_l[2-4]$/i;

/** Synthesis, audit and resolution rows carried alongside the ladder. */
const SYNTHESIS = new Set([
  "d13_matrix",
  "tc_ref_audit",
  "sim_v_sim",
  "pe_stepsize_mismatch",
  "dt_stability_refuted",
  "e4_l3_dt_ladder_sync"
]);

const records = readDatasheet(resolve(root, datasheetSource));
const rows = buildLedger(
  records,
  record => SPATIAL_LADDER.test(record.case) || SYNTHESIS.has(record.case)
);

/* ---- timestep ladder and error decomposition -------------------------------
 * Parsed from the tool's printed report rather than re-implemented, so the site
 * cannot drift from the campaign's own fit. Format, per case:
 *
 *   === E4 (reference peak -0.12224 m/s, Table II printed)
 *       <rundir>   dt=0.5ms  err=+1.41%
 *     p=1 fit: S(L2)=+5.92  S(L3)=+2.27  S(L4)=-0.02  T(1ms)=-1.51 pp  |res|max=0.10 pp
 */
function parseDecomposition(text) {
  const cases = {};
  let current = null;

  for (const line of text.split(/\r?\n/)) {
    const header = /^=== (\w+) \(reference peak\s+(-?[\d.]+)/.exec(line);
    if (header) {
      current = { case: header[1], referencePeak: Number(header[2]), points: [], fits: [] };
      cases[header[1]] = current;
      continue;
    }
    if (!current) continue;

    const point = /^\s+(\S+)\s+dt=([\d.]+)ms\s+err=([+-][\d.]+)%/.exec(line);
    if (point) {
      const rundir = point[1];
      current.points.push({
        // Rundir names are internal; keep only what identifies the run physically.
        level: /_l(\d)/.exec(rundir)?.[1] ? `L${/_l(\d)/.exec(rundir)[1]}` : "?",
        dtMs: Number(point[2]),
        errorPct: Number(point[3]),
        synced: rundir.endsWith("_sync")
      });
      continue;
    }

    const fit = /^\s+p=(\d) fit:\s+(.*?)\s+T\(1ms\)=([+-][\d.]+) pp\s+\|res\|max=([\d.]+)/.exec(line);
    if (fit) {
      const spatial = {};
      for (const [, level, value] of fit[2].matchAll(/S\(L(\d)\)=([+-][\d.]+)/g)) {
        spatial[`L${level}`] = Number(value);
      }
      current.fits.push({
        order: Number(fit[1]),
        spatialPp: spatial,
        temporalPpAt1ms: Number(fit[3]),
        maxResidualPp: Number(fit[4])
      });
    }
  }
  return cases;
}

const decomposition = parseDecomposition(readFileSync(resolve(root, decompositionSource), "utf-8"));
if (!decomposition.E4?.fits.length) {
  throw new Error("error decomposition: no fit parsed for E4");
}

// The published timestep ladder is the synced E4 series at the workhorse level,
// plus the synced point at the fine level that shows the same direction.
const dtLadder = decomposition.E4.points
  .filter(point => point.level === "L3")
  .sort((a, b) => b.dtMs - a.dtMs);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      source: datasheetSource,
      decompositionSource,
      generatedBy: "scripts/convert-sedimentation-validation.mjs",
      rows,
      dtLadder,
      decomposition: { E4: decomposition.E4.fits, E1: decomposition.E1?.fits ?? [] }
    },
    null,
    2
  )}\n`
);

console.log(
  `Generated ${rows.length} sedimentation validation rows, ` +
    `${dtLadder.length} dt-ladder points, ${decomposition.E4.fits.length} E4 fits`
);
