// The DNS campaign expresses every claim as a verdict. The site's `Chip` is
// purely presentational, so this adds the semantic status badge.
//
// Styling lives in src/styles.css (`.verdict-*`) rather than inline, because the
// bright brand hues need different values in light mode — see the design system's
// requirement that new components are checked against both themes. Each badge
// always renders its literal verdict word, so colour is never the only signal.
export type Verdict = "PASS" | "RECORDED" | "RESOLVED" | "FAIL" | "OPEN";

const VERDICT_CLASS: Record<Verdict, string> = {
  PASS: "verdict-pass",
  RESOLVED: "verdict-resolved",
  RECORDED: "verdict-recorded",
  OPEN: "verdict-open",
  FAIL: "verdict-fail"
};

const VERDICT_TITLE: Record<Verdict, string> = {
  PASS: "Gate met",
  RESOLVED: "Issue investigated and closed",
  RECORDED: "Measured and kept, but not gated",
  OPEN: "Still under investigation",
  FAIL: "Gate not met"
};

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`chip verdict ${VERDICT_CLASS[verdict]}`} title={VERDICT_TITLE[verdict]}>
      {verdict}
    </span>
  );
}
