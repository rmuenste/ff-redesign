import type { ReactNode } from "react";
import { MathJax } from "better-react-mathjax";
import { Card } from "./ui";

export function Equation({
  children,
  block = false
}: {
  children: string;
  block?: boolean;
}) {
  return (
    <MathJax inline={!block} dynamic>
      {children}
    </MathJax>
  );
}

export function Figure({
  src,
  alt,
  caption
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
}) {
  return (
    <figure style={{ margin: "32px 0", textAlign: "center" }}>
      <img src={src} alt={alt} style={{ maxWidth: "100%", height: "auto", borderRadius: 4, border: "1px solid var(--divider)" }} />
      {caption && <figcaption style={{ color: "var(--fg2)", fontSize: 13, marginTop: 10 }}>{caption}</figcaption>}
    </figure>
  );
}

export function VideoBlock({
  src,
  title,
  poster
}: {
  src: string;
  title?: ReactNode;
  poster?: string;
}) {
  return (
    <div style={{ margin: "32px 0" }}>
      {title && <h3 style={{ fontSize: 20, fontWeight: 400 }}>{title}</h3>}
      <video controls poster={poster} style={{ width: "100%", maxWidth: 760, borderRadius: 4, border: "1px solid var(--divider)" }}>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

export function PlotPanel({
  title,
  meta,
  children
}: {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div className="overline">{title}</div>
        {meta && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)", marginTop: 4 }}>{meta}</div>}
      </div>
      <Card style={{ padding: 24 }}>{children}</Card>
    </div>
  );
}
