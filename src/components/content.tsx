import type { ReactNode } from "react";
import { DataColumn, DataTable, DownloadItem, DownloadTable, ReferenceItem, ReferenceList } from "./data-display";
import { Equation, Figure, VideoBlock } from "./science";

export type ContentBlock<Row = Record<string, unknown>> =
  | { type: "heading"; level?: 2 | 3 | 4; text: ReactNode }
  | { type: "paragraph"; text: ReactNode }
  | { type: "equation"; value: string; block?: boolean }
  | { type: "figure"; src: string; alt: string; caption?: ReactNode }
  | { type: "video"; src: string; title?: ReactNode; poster?: string }
  | { type: "table"; columns: DataColumn<Row>[]; rows: Row[]; getRowKey: (row: Row, index: number) => string }
  | { type: "downloads"; items: DownloadItem[] }
  | { type: "references"; items: ReferenceItem[] };

export function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = `h${block.level ?? 3}` as "h2" | "h3" | "h4";
          return <Tag key={index} style={{ margin: 0 }}>{block.text}</Tag>;
        }
        if (block.type === "paragraph") {
          return <p key={index} style={{ margin: 0, color: "var(--fg2)", lineHeight: 1.65 }}>{block.text}</p>;
        }
        if (block.type === "equation") {
          return <Equation key={index} block={block.block}>{block.value}</Equation>;
        }
        if (block.type === "figure") {
          return <Figure key={index} src={block.src} alt={block.alt} caption={block.caption} />;
        }
        if (block.type === "video") {
          return <VideoBlock key={index} src={block.src} title={block.title} poster={block.poster} />;
        }
        if (block.type === "table") {
          return <DataTable key={index} columns={block.columns} rows={block.rows} getRowKey={block.getRowKey} />;
        }
        if (block.type === "downloads") {
          return <DownloadTable key={index} items={block.items} />;
        }
        return <ReferenceList key={index} items={block.items} />;
      })}
    </div>
  );
}
