import { Link } from "react-router-dom";
import { galleryItemById, gallerySizes, gallerySrcAt, gallerySrcSet } from "../data/gallery";

/** Content width of the narrow column the benchmark pages set their text in. */
const CONTENT_WIDTH = 784;

/** Portrait stills would tower over the text at content width, so they are capped. */
const PORTRAIT_WIDTH = 440;

/**
 * The rendered still of one benchmark, at the top of that benchmark's
 * Introduction tab: the image, its one-line caption, and a link into the gallery
 * with the same still already open.
 *
 * It reads src/data/gallery.ts, so a benchmark with no still in the registry
 * renders nothing rather than a broken frame — the six DNS pages carry one, the
 * older core benchmarks do not yet.
 */
export function GalleryFigure({ id }: { id: string }) {
  const item = galleryItemById(id);
  if (!item) return null;

  const width = item.aspect >= 1 ? CONTENT_WIDTH : PORTRAIT_WIDTH;

  return (
    <figure style={{ margin: "0 0 36px" }}>
      <img
        src={gallerySrcAt(item, width)}
        srcSet={gallerySrcSet(item)}
        sizes={gallerySizes(width)}
        alt={item.alt}
        loading="lazy"
        decoding="async"
        style={{
          display: "block",
          width: "100%",
          maxWidth: width,
          height: "auto",
          aspectRatio: `${item.aspect}`,
          margin: "0 auto",
          borderRadius: 4,
          border: "1px solid var(--divider)",
          background: "var(--surface-sunken)"
        }}
      />
      <figcaption
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 12,
          color: "var(--fg2)",
          fontSize: 13,
          lineHeight: 1.6
        }}
      >
        <span style={{ flex: "1 1 320px" }}>{item.caption}</span>
        <Link
          to={`/gallery?view=${item.id}`}
          className="focus-ring"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--primary)",
            textDecoration: "none",
            whiteSpace: "nowrap"
          }}
        >
          View in gallery
        </Link>
      </figcaption>
    </figure>
  );
}
