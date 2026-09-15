// Builds a benchmark page's Validation ledger from the DNS validation datasheet.
//
// The datasheet (scripts/source-data/dns/dns_validation_datasheet.csv, curated
// from the FeatFloWer repository) is the single source of truth for every
// quantitative claim in the DNS campaign: one row per claim, nine columns
//
//     suite,case,quantity,expected,expected_source,measured,rel_error,tolerance,verdict
//
// Ledger rows are NEVER hand-transcribed into the site. A page selects the cases
// it owns and this module emits the rendered rows, so a corrected datasheet
// propagates by re-running the converter.
import { readFileSync } from "node:fs";
import { parseCsvRecords } from "./csv.mjs";

/** Verdict vocabulary used by the campaign; anything else is a datasheet error. */
export const VERDICTS = new Set(["PASS", "RECORDED", "RESOLVED", "FAIL", "OPEN", "n/a"]);

/**
 * Strip internal run bookkeeping from datasheet prose.
 *
 * Scheduler job ids identify runs on the group's cluster and mean nothing to a
 * visitor. Everything else — resolutions, timings, partition names, corrections —
 * is real provenance and is kept verbatim.
 */
export function sanitize(text) {
  return text
    // Parenthetical asides that cross-reference another datasheet row by case id
    // — "(row d32_phi_ladder)", "(design row d32_wide_design)", "(the
    // investigation trail lives in rows a, b, c)". A page publishes a selected
    // subset of the datasheet, so these pointers dangle on the site: they name
    // rows the reader cannot see. The whole aside goes rather than just the
    // reference, because a partial strip leaves broken punctuation behind, and an
    // aside built around a row pointer is bookkeeping by construction.
    .replace(/\s*\((?:[^()]|\([^()]*\))*\brows?\s+[a-z][a-z0-9]*_[a-z0-9_]+(?:[^()]|\([^()]*\))*\)/gi, "")
    // "jobs 141665 E1 / 141666 E2" — a job list whose entries are labelled with
    // the case each one ran. The general rule below stops at the first label and
    // would leave "E1 / 141666 E2" behind, so this runs first. At least one
    // separator-and-job repetition is required, which is what keeps it off prose
    // like "job 141389 byte-identical".
    .replace(/\bjobs?\s+\d{5,7}\s+\w{1,4}(?:\s*[-+/]\s*\d{5,7}\s+\w{1,4})+/gi, "")
    // "job 137402", "jobs 137390+137391", "jobs 140208-140214",
    // "jobs 139196/97,139288 + 139310/11/13/14". A comma only continues the list
    // when it is followed by another job-sized number, so prose like
    // "job 140410, 109 ranks" keeps its rank count.
    .replace(/\bjobs?\s+\d+(?:\s*[-+/]\s*\d+|\s*,\s*\d{5,7}\b)*/gi, "")
    // bare "(137877)" cross-references
    .replace(/\s*\(\s*\d{5,7}\s*\)/g, "")
    // Bare scheduler ids left over once the "job" keyword is gone — "vs 141392
    // reference", "Twin 141658 byte-identical", "synced reruns 137383-5". Scoped
    // to the campaign's own id range so it cannot touch a measured value: every
    // number a datasheet row quotes is either shorter or written as a decimal.
    // The lookbehind is what makes the decimal case hold: a word boundary sits
    // after the decimal point too, so an unguarded match eats the fraction of a
    // quoted semi-axis such as "a=0.132283" and leaves "a=0." behind.
    .replace(/(?<![.\d])\b1[34]\d{4}(?:\s*-\s*\d{1,6})?\b/g, "")
    // tidy the punctuation the removals leave behind
    // A list separator stranded between a removal and the next punctuation —
    // "(twin-certified lineage 141389/141658 - NOT ...)" leaves "lineage / - NOT".
    .replace(/\s+[-+/]\s+(?=[-,;.)])/g, " ")
    .replace(/\(\s*[,;:]\s*/g, "(")
    .replace(/[,;]\s*(?=[,;])/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,;:.])/g, "$1")
    .replace(/^\s*[,;:]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Read the curated datasheet into records. */
export function readDatasheet(path) {
  return parseCsvRecords(readFileSync(path, "utf-8"));
}

/**
 * Select and render the ledger rows for one benchmark page.
 *
 * @param {object[]} records  parsed datasheet records
 * @param {(record: object) => boolean} predicate  which cases this page owns
 * @returns {object[]} rows ready for the ValidationLedger component
 */
export function buildLedger(records, predicate) {
  const selected = records.filter(predicate);
  if (!selected.length) throw new Error("validation ledger selected no datasheet rows");

  return selected.map((record, index) => {
    const verdict = record.verdict.trim().toUpperCase();
    if (!VERDICTS.has(verdict) && verdict !== "N/A") {
      throw new Error(`unknown verdict "${record.verdict}" for case ${record.case}`);
    }
    return {
      id: `${record.case}-${index}`,
      suite: record.suite.trim(),
      case: record.case.trim(),
      quantity: sanitize(record.quantity),
      expected: sanitize(record.expected),
      expectedSource: sanitize(record.expected_source),
      measured: sanitize(record.measured),
      relError: record.rel_error.trim(),
      tolerance: record.tolerance.trim(),
      verdict: verdict === "N/A" ? "OPEN" : verdict
    };
  });
}
