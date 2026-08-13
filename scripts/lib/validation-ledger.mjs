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
    // "job 137402", "jobs 137390+137391"
    .replace(/\bjobs?\s+\d+(?:\s*\+\s*\d+)*/gi, "")
    // bare "(137877)" cross-references
    .replace(/\s*\(\s*\d{5,7}\s*\)/g, "")
    // tidy the punctuation the removals leave behind
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
