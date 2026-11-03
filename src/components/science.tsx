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
  const math = (
    <MathJax inline={!block} dynamic>
      {children}
    </MathJax>
  );
  // A block equation is one unbreakable line; on a phone it can be wider than
  // the column, so it scrolls inside this box rather than widening the page.
  return block ? <div className="equation-block">{math}</div> : math;
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

/** One `<source>` of a video; `type` may carry a codecs parameter. */
export interface VideoSource {
  src: string;
  type: string;
}

/**
 * A titled video player. `src` is a single H.264 MP4. `sources` lists several
 * encodings in order of preference instead, e.g. an AV1 WebM followed by an
 * H.264 MP4 for browsers without AV1: the browser plays the first `type` it
 * supports.
 */
export function VideoBlock({
  src,
  sources,
  title,
  poster
}: {
  src?: string;
  sources?: VideoSource[];
  title?: ReactNode;
  poster?: string;
}) {
  const list = sources ?? (src ? [{ src, type: "video/mp4" }] : []);
  return (
    <div style={{ margin: "32px 0" }}>
      {title && <h3 style={{ fontSize: 20, fontWeight: 400 }}>{title}</h3>}
      <video controls poster={poster} style={{ width: "100%", maxWidth: 760, borderRadius: 4, border: "1px solid var(--divider)" }}>
        {list.map(source => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
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
