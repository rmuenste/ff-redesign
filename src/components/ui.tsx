import type { CSSProperties, ReactNode } from "react";
import { Chip as LegacyChip, Icon as LegacyIcon, Overline as LegacyOverline } from "../Primitives.jsx";

export type IconName = string;

export function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <LegacyIcon name={name} size={size} style={style} />;
}

export function Chip({
  children,
  tone = "default",
  style
}: {
  children: ReactNode;
  tone?: "default" | "solid" | "ghost" | "accent";
  style?: CSSProperties;
}) {
  return <LegacyChip tone={tone} style={style}>{children}</LegacyChip>;
}

export function Overline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <LegacyOverline style={style}>{children}</LegacyOverline>;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  leading,
  trailing,
  style,
  onClick,
  ariaLabel,
  type = "button"
}: {
  children?: ReactNode;
  variant?: "primary" | "stroked" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
}) {
  const base: CSSProperties = {
    fontFamily: "inherit",
    fontWeight: 500,
    letterSpacing: ".01em",
    border: 0,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "background 160ms var(--ease-std), box-shadow 160ms var(--ease-std), color 160ms",
    borderRadius: 4
  };
  const sizes: Record<NonNullable<Parameters<typeof Button>[0]["size"]>, CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "10px 18px", fontSize: 13 },
    lg: { padding: "14px 24px", fontSize: 14 }
  };
  const variants: Record<NonNullable<Parameters<typeof Button>[0]["variant"]>, CSSProperties> = {
    primary: { background: "var(--primary)", color: "var(--on-primary)" },
    stroked: { background: "transparent", color: "var(--fg1)", boxShadow: "inset 0 0 0 1px var(--divider)" },
    ghost: { background: "transparent", color: "var(--fg1)" },
    accent: { background: "var(--accent)", color: "var(--on-accent)" }
  };

  return (
    <button
      aria-label={ariaLabel}
      className="focus-ring"
      type={type}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}

export function Card({
  children,
  interactive = false,
  style,
  onClick
}: {
  children: ReactNode;
  interactive?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div className={`card${interactive ? " card-interactive" : ""}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function Section({
  children,
  narrow = false,
  style
}: {
  children: ReactNode;
  narrow?: boolean;
  style?: CSSProperties;
}) {
  return <div className={narrow ? "section-narrow" : "section"} style={style}>{children}</div>;
}

export function Metric({
  label,
  value,
  good = false
}: {
  label: ReactNode;
  value: ReactNode;
  good?: boolean;
}) {
  return (
    <div>
      <div className="measure">{label}</div>
      <div className="num" style={{ fontSize: 20, color: good ? "var(--tu-green-400)" : "var(--fg1)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

export function KpiBox({
  label,
  value,
  good = false
}: {
  label: ReactNode;
  value: ReactNode;
  good?: boolean;
}) {
  return (
    <div style={{ padding: 12, background: "var(--surface-alt)", borderRadius: 4, border: "1px solid var(--divider)" }}>
      <div className="measure">{label}</div>
      <div className="num" style={{ fontSize: 18, color: good ? "var(--tu-green-400)" : "var(--fg1)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
