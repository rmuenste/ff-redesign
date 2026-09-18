import type { TouchEvent as ReactTouchEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Chip, Overline, Section } from "../components";
import { FlowCanvas } from "../Primitives.jsx";
import {
  galleryFamilies,
  galleryFamilyFromParam,
  galleryFamilyLabel,
  galleryFamilyParam,
  galleryItemById,
  galleryItems,
  galleryNeighbours,
  gallerySizes,
  gallerySrcAt,
  gallerySrcSet,
  type GalleryFamily,
  type GalleryItem
} from "../data/gallery";
import { benchmarks } from "../data/benchmarks";

/** Card column width the grid never exceeds — what `sizes` is hinted against. */
const CARD_WIDTH = 520;

/**
 * Whether the reader has asked for less motion. Read in an effect rather than at
 * render, so the first paint (and the prerendered shell, which has no window)
 * never touches matchMedia.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** One still in the grid, cropped to the uniform 3:2 card about its focal point. */
function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen: () => void }) {
  return (
    <button type="button" className="gallery-card focus-ring" onClick={onOpen}>
      <div className="gallery-frame">
        <img
          src={gallerySrcAt(item, CARD_WIDTH)}
          srcSet={gallerySrcSet(item)}
          sizes={gallerySizes(CARD_WIDTH)}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: item.focal,
            display: "block"
          }}
        />
      </div>
      <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg1)" }}>{item.title}</span>
        <Chip>{galleryFamilyLabel(item.family)}</Chip>
      </div>
    </button>
  );
}

function Lightbox({
  item,
  cycle,
  position,
  onClose,
  onStep
}: {
  item: GalleryItem;
  /** The running order the arrows stay inside: the filtered set, or all of it. */
  cycle: GalleryItem[];
  position: number;
  onClose: () => void;
  onStep: (direction: -1 | 1) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const benchmark = benchmarks.find(entry => entry.id === item.benchmarkId);

  // The overlay owns the keyboard while it is up: arrows cycle, Escape closes,
  // and Tab is trapped so focus cannot wander into the page behind the scrim.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onStep(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onStep(1);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!dialogRef.current?.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, onStep]);

  // Lock the page behind the scrim, and hand focus to the dialog on open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Both neighbours are fetched while this one is being read, so a cycle in
  // either direction shows an image that is already in the cache.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { prev, next } = galleryNeighbours(item.id, cycle);
    for (const id of [prev, next]) {
      const neighbour = galleryItemById(id);
      if (!neighbour || neighbour.id === item.id) continue;
      const image = new Image();
      image.src = neighbour.full;
    }
  }, [cycle, item.id]);

  const onTouchEnd = (event: ReactTouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    onStep(dx < 0 ? 1 : -1);
  };

  return (
    <div
      className="gallery-scrim"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={event => {
        const touch = event.changedTouches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${item.title} — still ${position} of ${cycle.length}`}
        className={reducedMotion ? undefined : "fade-up"}
        style={{
          margin: "auto",
          maxWidth: 1240,
          width: "100%",
          padding: "24px var(--gutter)",
          display: "grid",
          gap: 20,
          justifyItems: "center"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 16
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".14em", color: "var(--fg3)" }}>
            {position} / {cycle.length}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="gallery-control focus-ring"
              aria-label="Previous still"
              onClick={() => onStep(-1)}
            >
              ←
            </button>
            <button
              type="button"
              className="gallery-control focus-ring"
              aria-label="Next still"
              onClick={() => onStep(1)}
            >
              →
            </button>
            <button
              ref={closeRef}
              type="button"
              className="gallery-control focus-ring"
              aria-label="Close the gallery viewer"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <img
          key={item.id}
          src={item.full}
          srcSet={gallerySrcSet(item)}
          sizes="100vw"
          alt={item.alt}
          decoding="async"
          style={{
            maxWidth: "100%",
            maxHeight: "min(72vh, 900px)",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            borderRadius: 4,
            border: "1px solid var(--divider)"
          }}
        />

        <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--fg1)" }}>{item.title}</h2>
            <Chip>{galleryFamilyLabel(item.family)}</Chip>
          </div>
          <p style={{ margin: 0, color: "var(--fg2)", fontSize: 14, lineHeight: 1.6 }}>{item.caption}</p>
          <p style={{ margin: 0, color: "var(--fg3)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
            {item.provenance}
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 4, flexWrap: "wrap" }}>
            {benchmark && (
              <Link to={`/benchmarks/${benchmark.slug}`} className="gallery-link focus-ring">
                Open benchmark page
              </Link>
            )}
            <a href={item.full} target="_blank" rel="noopener noreferrer" className="gallery-link focus-ring">
              Full size
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // True while the reader is on a history entry this page pushed, so closing can
  // pop it rather than leaving a stale entry Back would walk back into.
  const pushedView = useRef(false);

  const family = galleryFamilyFromParam(searchParams.get("family"));
  const shown = useMemo(
    () => (family ? galleryItems.filter(item => item.family === family) : galleryItems),
    [family]
  );

  const requested = searchParams.get("view");
  const open = galleryItemById(requested);
  // A still opened from a benchmark page may sit outside the current filter; the
  // set it cycles within is then the whole gallery rather than an empty one.
  const cycle = open && shown.some(item => item.id === open.id) ? shown : galleryItems;

  const setFamily = useCallback(
    (next: GalleryFamily | null) => {
      setSearchParams(
        current => {
          const params = new URLSearchParams(current);
          if (next) params.set("family", galleryFamilyParam(next));
          else params.delete("family");
          params.delete("view");
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const openItem = useCallback(
    (id: string) => {
      pushedView.current = true;
      setSearchParams(current => {
        const params = new URLSearchParams(current);
        params.set("view", id);
        return params;
      });
    },
    [setSearchParams]
  );

  const closeItem = useCallback(() => {
    if (pushedView.current) {
      pushedView.current = false;
      navigate(-1);
      return;
    }
    setSearchParams(
      current => {
        const params = new URLSearchParams(current);
        params.delete("view");
        return params;
      },
      { replace: true }
    );
  }, [navigate, setSearchParams]);

  const step = useCallback(
    (direction: -1 | 1) => {
      if (!open) return;
      const { prev, next } = galleryNeighbours(open.id, cycle);
      const target = direction === -1 ? prev : next;
      if (!target) return;
      setSearchParams(
        current => {
          const params = new URLSearchParams(current);
          params.set("view", target);
          return params;
        },
        { replace: true }
      );
    },
    [cycle, open, setSearchParams]
  );

  // A ?view= that names nothing (a stale link, a typo) is dropped rather than
  // left in the URL pretending something is open.
  useEffect(() => {
    if (!requested || open) return;
    setSearchParams(
      current => {
        const params = new URLSearchParams(current);
        params.delete("view");
        return params;
      },
      { replace: true }
    );
  }, [open, requested, setSearchParams]);

  const position = open ? cycle.findIndex(item => item.id === open.id) + 1 : 0;

  return (
    <div>
      <div style={{ borderBottom: "1px solid var(--divider)", padding: "48px 0 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
          <FlowCanvas palette="mixed" density={60} speed={0.5} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, var(--bg) 100%)" }} />
        <Section style={{ position: "relative" }}>
          <Overline style={{ marginBottom: 16 }}>Gallery</Overline>
          <h1 className="display display-lg" style={{ margin: 0, color: "var(--fg1)" }}>
            The benchmarks,{" "}
            <span style={{ color: "var(--primary)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>
              rendered
            </span>
            .
          </h1>
          <p style={{ fontSize: 17, color: "var(--fg2)", margin: "16px 0 0", maxWidth: 680, lineHeight: 1.55 }}>
            Stills built from the simulation data of the validation cases — the bodies, the flow
            around them and the moment each benchmark is measured at.
          </p>
        </Section>
      </div>

      <Section style={{ paddingTop: 32, paddingBottom: 120 }}>
        <div
          role="group"
          aria-label="Filter the gallery by family"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}
        >
          <FilterChip label="All" active={!family} onSelect={() => setFamily(null)} />
          {galleryFamilies.map(entry => (
            <FilterChip
              key={entry}
              label={galleryFamilyLabel(entry)}
              active={family === entry}
              onSelect={() => setFamily(entry)}
            />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 20 }}>
          {shown.map(item => (
            <GalleryCard key={item.id} item={item} onOpen={() => openItem(item.id)} />
          ))}
        </div>
      </Section>

      {open && (
        <Lightbox item={open} cycle={cycle} position={position} onClose={closeItem} onStep={step} />
      )}
    </div>
  );
}

/**
 * A Chip made operable: the chip itself is a span, so it is wrapped in a button
 * that carries the pressed state for a screen reader and the focus ring for a
 * keyboard. The active chip is the solid tone, which is how the rest of the site
 * marks a chosen chip.
 */
function FilterChip({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" className="gallery-filter focus-ring" aria-pressed={active} onClick={onSelect}>
      <Chip tone={active ? "solid" : "default"}>{label}</Chip>
    </button>
  );
}
