// Generates the Particle Sedimentation validation ledger from the DNS campaign
// datasheet. Companion to scripts/convert-sedimentation-data.mjs, which builds
// the plot assets; kept separate so the plot converter stays untouched.
//
// Selection policy
// ----------------
// Published: the spatial ladder measured at dt = 1 ms, the cross-case matrix,
// the reference audit, the comparison against ten Cate's own simulations, and
// the current (stepsize-synced) timestep ladder.
//
// Withheld: the earlier timestep-ladder points, the temporal term fitted from
// them, and the "added-mass stability floor" they were read as. Those runs were
// measured while the rigid-body solver integrated at its own configured stepsize
// instead of the CFD timestep, so they measured a coupling artifact. The
// datasheet rows that found and refuted this are published in their place, and
// the dt = 1 ms rows are explicitly unaffected by the defect.
//
// Run with: node scripts/convert-sedimentation-validation.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildLedger, readDatasheet } from "./lib/validation-ledger.mjs";

const root = resolve(import.meta.dirname, "..");
const datasheetSource = "scripts/source-data/dns/dns_validation_datasheet.csv";
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

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  `${JSON.stringify(
    { source: datasheetSource, generatedBy: "scripts/convert-sedimentation-validation.mjs", rows },
    null,
    2
  )}\n`
);

console.log(`Generated ${rows.length} sedimentation validation rows`);
