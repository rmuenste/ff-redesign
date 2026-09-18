import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Overline, Section } from "./ui";

/**
 * Tab state backed by a `?tab=` search parameter, so a tab can be linked to from
 * outside the page — the aggregate reference-data index links straight at each
 * benchmark's Reference Data tab.
 *
 * `tabIds` is the page's own tab list: an unknown or absent parameter falls back
 * to the default rather than rendering a page with no visible tab. Switching tabs
 * replaces the history entry instead of pushing one, so Back still leaves the
 * page rather than walking the tabs the reader has already seen.
 */
export function useTabParam(tabIds: string[], defaultId: string): [string, (id: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  // Mirrored in state so a page still works when rendered outside a router with
  // search-param support (and so the first paint does not wait on the URL).
  const requested = searchParams.get("tab");
  const [fallback, setFallback] = useState(defaultId);
  const active = requested && tabIds.includes(requested) ? requested : fallback;

  const setTab = useCallback(
    (id: string) => {
      setFallback(id);
      setSearchParams(
        current => {
          const next = new URLSearchParams(current);
          if (id === defaultId) next.delete("tab");
          else next.set("tab", id);
          return next;
        },
        { replace: true }
      );
    },
    [defaultId, setSearchParams]
  );

  return [active, setTab];
}

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
        <h1 className="display display-lg" style={{ margin: "0 0 16px", color: "var(--fg1)" }}>
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
