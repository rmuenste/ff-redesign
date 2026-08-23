import { Link } from "react-router-dom";
import {
  Button,
  Chip,
  DataTable,
  Icon,
  PageHeader,
  Section
} from "../components";
import {
  formatBytes,
  referenceGroups,
  referenceShared,
  referenceTotals,
  type ReferenceFile,
  type ReferenceGroup,
  type SharedReferenceFile
} from "../data/reference-data";

function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <Button
      variant="stroked"
      size="sm"
      leading={<Icon name="download" size={14} />}
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
      aria-label={`Download ${label}`}
    >
      Download
    </Button>
  );
}

const monoCell = { fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "nowrap" as const };

function fileColumns() {
  return [
    {
      id: "file",
      header: "File",
      render: (file: ReferenceFile) => (
        <div>
          <div style={{ fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 13 }}>{file.name}</div>
          {file.description && (
            <div style={{ color: "var(--fg2)", fontSize: 12, marginTop: 3, maxWidth: 560, lineHeight: 1.5 }}>
              {file.description}
            </div>
          )}
        </div>
      )
    },
    {
      id: "format",
      header: "Format",
      render: (file: ReferenceFile) => <span style={{ color: "var(--fg2)", fontSize: 12 }}>{file.format}</span>
    },
    {
      id: "size",
      header: "Size",
      align: "right" as const,
      render: (file: ReferenceFile) => <span style={monoCell}>{formatBytes(file.bytes)}</span>
    },
    {
      id: "action",
      header: "Action",
      align: "right" as const,
      render: (file: ReferenceFile) => <DownloadButton href={file.href} label={file.name} />
    }
  ];
}

function SharedSection() {
  if (!referenceShared.length) return null;

  return (
    <Section style={{ paddingTop: 48, paddingBottom: 8 }}>
      <div style={{ maxWidth: 900, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Shared across benchmarks</h2>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          One file, offered from more than one benchmark page. These are the same bytes wherever you take them from,
          so downloading once is enough.
        </p>
      </div>
      <DataTable<SharedReferenceFile>
        columns={[
          {
            id: "file",
            header: "File",
            render: file => (
              <div>
                <div style={{ fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 13 }}>{file.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {file.offeredBy.map(benchmark => (
                    <Link
                      key={benchmark.id}
                      to={`/benchmarks/${benchmark.slug}?tab=reference-data`}
                      style={{ textDecoration: "none" }}
                    >
                      <Chip>{benchmark.tag}</Chip>
                    </Link>
                  ))}
                </div>
              </div>
            )
          },
          { id: "format", header: "Format", render: file => <span style={{ color: "var(--fg2)", fontSize: 12 }}>{file.format}</span> },
          { id: "size", header: "Size", align: "right", render: file => <span style={monoCell}>{formatBytes(file.bytes)}</span> },
          { id: "action", header: "Action", align: "right", render: file => <DownloadButton href={file.href} label={file.name} /> }
        ]}
        rows={referenceShared}
        getRowKey={file => file.name}
      />
    </Section>
  );
}

function GroupSection({ group }: { group: ReferenceGroup }) {
  return (
    <Section style={{ paddingTop: 48, paddingBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Chip tone="solid">{group.benchmark.tag}</Chip>
            <h2 style={{ margin: 0, fontSize: 22 }}>{group.benchmark.shortTitle}</h2>
          </div>
          <p style={{ color: "var(--fg2)", lineHeight: 1.6, margin: 0, fontSize: 14 }}>{group.benchmark.summary}</p>
        </div>
        <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
          <span style={{ ...monoCell, color: "var(--fg3)" }}>
            {group.files.length} {group.files.length === 1 ? "file" : "files"} · {formatBytes(group.bytes)}
          </span>
          <Link
            to={group.href}
            style={{ color: "var(--fg2)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            Reference Data tab <Icon name="arrow_forward" size={14} />
          </Link>
        </div>
      </div>
      <DataTable<ReferenceFile>
        columns={fileColumns()}
        rows={group.files}
        getRowKey={file => file.href}
      />
    </Section>
  );
}

export function ReferenceDataPage() {
  return (
    <div>
      <PageHeader
        overline={`Reference data · ${referenceTotals.files} files · ${formatBytes(referenceTotals.bytes)}`}
        title={
          <>
            Reference data<span style={{ color: "var(--primary)" }}>.</span>
          </>
        }
        summary={
          <>
            Every published reference dataset in one place: experimental and literature references, curated
            simulation series, and the campaign ledgers behind the validation tables. Grouped by benchmark, with
            each group linking back to the page that defines and uses it.
          </>
        }
      />

      <SharedSection />

      {referenceGroups.map(group => (
        <GroupSection key={group.benchmark.id} group={group} />
      ))}

      <Section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <p style={{ color: "var(--fg3)", fontSize: 13, lineHeight: 1.65, margin: 0, maxWidth: 720 }}>
          This index is generated from the asset manifests each benchmark ships alongside its data, so it lists what
          the site actually serves. File sizes are read at build time. Formats, column conventions and units are
          documented on each benchmark's own Reference Data tab.
        </p>
      </Section>
    </div>
  );
}
