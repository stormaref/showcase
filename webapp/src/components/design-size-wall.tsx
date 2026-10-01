"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SizeWallTile = {
  key: string;
  typeId: string;
  label: string;
  widthMm: number;
  heightMm: number;
  tileSrc: string;
  decorSrc: string;
};

export type SizeWallCategory = {
  id: string;
  name: string;
  previewSrc: string;
};

type DesignSizeWallProps = {
  categories: SizeWallCategory[];
  tiles: SizeWallTile[];
  alt: string;
  labels: {
    categoryHeading: string;
    categoryHint: string;
    heading: string;
    hint: string;
    noDecor: string;
  };
};

// Height of the tallest size when the row has room to draw it at full scale.
const MAX_TILE_PX = 280;
// Fixed gap so the space left for tiles splits exactly in proportion to their
// widths, keeping every tile on the same mm-to-px scale.
const GAP_PX = 24;
// On narrow screens the row stops shrinking at this width per tile and
// scrolls instead, so small sizes stay tappable.
const MIN_TILE_PX = 56;

const headingClass = "text-[13px] font-medium uppercase tracking-[0.25em] text-gray-500";

function preload(src: string) {
  if (!src) return;
  const img = new Image();
  img.src = src;
}

/**
 * The sizes of a design drawn to scale from their real dimensions, with the
 * decoration photo of the selected size underneath. When the design comes in
 * several categories, visitors pick one first and then see its sizes.
 */
export function DesignSizeWall({ categories, tiles, alt, labels }: DesignSizeWallProps) {
  const categoryHeadingId = useId();
  const headingId = useId();
  const panelId = useId();
  const sizesRef = useRef<HTMLElement>(null);
  const pickedByVisitor = useRef(false);
  const chooseCategory = categories.length > 1;
  const [categoryId, setCategoryId] = useState(chooseCategory ? "" : (categories[0]?.id ?? ""));
  const visible = tiles.filter((tile) => tile.typeId === categoryId);
  const [selectedKey, setSelectedKey] = useState(visible[0]?.key ?? "");
  const selected = visible.find((tile) => tile.key === selectedKey) ?? visible[0];

  // Bring the sizes into view after a category pick, unless they already are.
  useEffect(() => {
    const el = sizesRef.current;
    if (!pickedByVisitor.current || !el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.75) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [categoryId]);

  function selectCategory(id: string) {
    pickedByVisitor.current = true;
    setCategoryId(id);
    setSelectedKey(tiles.find((tile) => tile.typeId === id)?.key ?? "");
  }

  // One scale across all categories, so switching between them keeps sizes
  // comparable whenever the row is not width-constrained.
  const maxHeightMm = Math.max(1, ...tiles.map((tile) => tile.heightMm));
  const widthSumMm = visible.reduce((sum, tile) => sum + tile.widthMm, 0);
  const gaps = GAP_PX * Math.max(visible.length - 1, 0);
  const idealWidth = (MAX_TILE_PX * widthSumMm) / maxHeightMm + gaps;
  const minWidth = Math.min(idealWidth, MIN_TILE_PX * visible.length + gaps);
  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <div className="space-y-16 md:space-y-20">
      {chooseCategory && (
        <section aria-labelledby={categoryHeadingId}>
          <h2 id={categoryHeadingId} className={headingClass}>
            {labels.categoryHeading}
          </h2>
          <p className="mt-2 text-sm font-light text-gray-500">{labels.categoryHint}</p>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const active = category.id === categoryId;
              const sizes = tiles
                .filter((tile) => tile.typeId === category.id)
                .map((tile) => tile.label);
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCategory(category.id)}
                  className="group cursor-pointer text-start"
                >
                  <span
                    className={cn(
                      "block aspect-[4/3] overflow-hidden bg-gray-100 outline-1 outline-offset-4 transition",
                      active
                        ? "outline outline-ink"
                        : "outline outline-transparent group-hover:outline-gray-300",
                    )}
                  >
                    {category.previewSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.previewSrc}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "mt-4 block text-lg transition",
                      active ? "font-normal text-ink" : "font-light text-gray-700 group-hover:text-ink",
                    )}
                  >
                    {category.name}
                  </span>
                  <span className="mt-1 block text-xs font-light text-gray-500">
                    {sizes.join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selected && (
        <section
          ref={sizesRef}
          aria-labelledby={headingId}
          className="scroll-mt-[calc(var(--header-h)+2rem)]"
        >
          <h2 id={headingId} className={headingClass}>
            {chooseCategory && categoryName
              ? `${labels.heading} · ${categoryName}`
              : labels.heading}
          </h2>
          <p className="mt-2 text-sm font-light text-gray-500">{labels.hint}</p>

          <div className="-mx-6 mt-10 overflow-x-auto px-6 pb-2 pt-2 md:-mx-2 md:px-2">
            <div
              className="mx-auto flex items-end"
              style={{ gap: GAP_PX, width: `min(100%, ${idealWidth}px)`, minWidth }}
            >
              {visible.map((tile) => {
                const active = tile.key === selected.key;
                return (
                  <button
                    key={tile.key}
                    type="button"
                    aria-pressed={active}
                    aria-controls={panelId}
                    onClick={() => setSelectedKey(tile.key)}
                    onPointerEnter={() => preload(tile.decorSrc)}
                    onFocus={() => preload(tile.decorSrc)}
                    className="group flex min-w-0 cursor-pointer flex-col items-center"
                    style={{ flex: `${tile.widthMm} 1 0px` }}
                  >
                    <span
                      className={cn(
                        "block w-full overflow-hidden bg-gray-100 outline-1 outline-offset-4 transition",
                        active
                          ? "outline outline-ink"
                          : "outline outline-transparent group-hover:outline-gray-300",
                      )}
                      style={{ aspectRatio: `${tile.widthMm} / ${tile.heightMm}` }}
                    >
                      {tile.tileSrc && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tile.tileSrc}
                          alt={`${alt} — ${tile.label}`}
                          className="size-full object-cover"
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        "mt-4 whitespace-nowrap text-xs transition",
                        active
                          ? "font-medium text-ink"
                          : "font-light text-gray-500 group-hover:text-ink",
                      )}
                    >
                      {tile.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <figure id={panelId} className="mt-12">
            {selected.decorSrc ? (
              <div className="overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={selected.key}
                  src={selected.decorSrc}
                  alt={`${alt} — ${selected.label}`}
                  className="aspect-[4/3] w-full animate-fade-in object-cover motion-reduce:animate-none md:aspect-[16/9]"
                />
              </div>
            ) : (
              <p className="border border-gray-200 bg-cream px-6 py-14 text-center text-sm font-light text-gray-500">
                {labels.noDecor}
              </p>
            )}
            <figcaption
              aria-live="polite"
              className="mt-4 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500"
            >
              {[selected.label, categoryName].filter(Boolean).join(" · ")}
            </figcaption>
          </figure>
        </section>
      )}
    </div>
  );
}
