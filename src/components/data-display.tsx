import type { ReactNode } from "react";
import { Button, Icon } from "./ui";

export interface DataColumn<Row> {
  id: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  render: (row: Row) => ReactNode;
}

export function DataTable<Row>({
  columns,
  rows,
  getRowKey
}: {
  columns: DataColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, index: number) => string;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--divider)",
                  background: "var(--surface-alt)",
                  textAlign: column.align ?? "left",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--fg3)",
                  fontWeight: 500
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)} style={{ borderBottom: "1px solid var(--divider)" }}>
              {columns.map(column => (
                <td key={column.id} style={{ padding: "12px 16px", textAlign: column.align ?? "left" }}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface DownloadItem {
  label: string;
  href: string;
  description?: string;
}

export function DownloadTable({ items }: { items: DownloadItem[] }) {
  return (
    <DataTable
      columns={[
        {
          id: "file",
          header: "File",
          render: item => (
            <div>
              <div style={{ fontWeight: 500 }}>{item.label}</div>
              {item.description && <div style={{ color: "var(--fg2)", fontSize: 12, marginTop: 2 }}>{item.description}</div>}
            </div>
          )
        },
        {
          id: "action",
          header: "Action",
          align: "right",
          render: item => (
            <Button
              variant="stroked"
              size="sm"
              leading={<Icon name="download" size={14} />}
              onClick={() => window.open(item.href, "_blank", "noopener,noreferrer")}
            >
              Download
            </Button>
          )
        }
      ]}
      rows={items}
      getRowKey={item => item.href}
    />
  );
}

export interface ReferenceItem {
  id: string;
  text: ReactNode;
}

export function ReferenceList({ items }: { items: ReferenceItem[] }) {
  return (
    <ol style={{ margin: 0, paddingLeft: 22, color: "var(--fg2)", lineHeight: 1.65 }}>
      {items.map(item => (
        <li key={item.id} style={{ marginBottom: 10 }}>
          {item.text}
        </li>
      ))}
    </ol>
  );
}
