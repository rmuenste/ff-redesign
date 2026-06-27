import type { ReactNode } from "react";
import { Overline, Section } from "./ui";

export function PageHeader({
  overline,
  title,
  summary,
  children
}: {
  overline?: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--divider)", padding: "48px 0 40px", position: "relative", overflow: "hidden" }}>
      <Section>
        {overline && <Overline style={{ marginBottom: 16 }}>{overline}</Overline>}
        <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", margin: "0 0 16px", color: "var(--fg1)" }}>
          {title}
        </h1>
        {summary && <p style={{ fontSize: 17, color: "var(--fg2)", margin: 0, maxWidth: 720, lineHeight: 1.55 }}>{summary}</p>}
        {children}
      </Section>
    </div>
  );
}

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  active,
  onChange
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className="tab focus-ring"
          data-active={active === tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
          style={{ background: "transparent", borderLeft: 0, borderRight: 0, borderTop: 0, fontFamily: "inherit" }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
