// Renders a benchmark's validation ledger: one row per quantitative claim, with
// the expected value, what was measured, the gate applied, and a verdict.
//
// Rows are generated from the DNS validation datasheet by the page's converter
// (see scripts/lib/validation-ledger.mjs) and imported as JSON — never written by
// hand — so a datasheet correction reaches the site by re-running the converter.
import { DataTable } from "./data-display";
import { VerdictChip, type Verdict } from "./verdict";

export interface ValidationRow {
  id: string;
  suite: string;
  case: string;
  quantity: string;
  expected: string;
  expectedSource: string;
  measured: string;
  relError: string;
  tolerance: string;
  verdict: Verdict;
}

const mono = { fontFamily: "var(--font-mono)", fontSize: 12 } as const;

export function ValidationLedger({ rows }: { rows: ValidationRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <DataTable<ValidationRow>
        columns={[
          {
            id: "case",
            header: "Case",
            render: row => (
              <div style={{ minWidth: 150 }}>
                <div style={mono}>{row.case}</div>
                <div style={{ color: "var(--fg3)", fontSize: 11, marginTop: 2 }}>{row.suite}</div>
              </div>
            )
          },
          {
            id: "quantity",
            header: "Quantity",
            render: row => <div style={{ minWidth: 210 }}>{row.quantity}</div>
          },
          {
            id: "expected",
            header: "Expected",
            render: row => (
              <div style={{ minWidth: 190 }}>
                <div>{row.expected}</div>
                {row.expectedSource && (
                  <div style={{ color: "var(--fg3)", fontSize: 11, marginTop: 4 }}>{row.expectedSource}</div>
                )}
              </div>
            )
          },
          {
            id: "measured",
            header: "Measured",
            render: row => <div style={{ minWidth: 320 }}>{row.measured}</div>
          },
          {
            id: "gate",
            header: "Gate",
            render: row => (
              <div style={{ minWidth: 92 }}>
                <div style={mono}>{row.tolerance}</div>
                {row.relError && row.relError !== "n/a" && (
                  <div style={{ color: "var(--fg3)", fontSize: 11, marginTop: 2 }}>err {row.relError}</div>
                )}
              </div>
            )
          },
          {
            id: "verdict",
            header: "Verdict",
            align: "right",
            render: row => <VerdictChip verdict={row.verdict} />
          }
        ]}
        rows={rows}
        getRowKey={row => row.id}
      />
    </div>
  );
}
