"use client";

import { useId, useState } from "react";
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
};

type DesignSizeWallProps = {
  categories: SizeWallCategory[];
  tiles: SizeWallTile[];
  alt: string;
  labels: {
    heading: string;
    hint: string;
    categories: string;
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

function preload(src: string) {
  if (!src) return;
  const img = new Image();
  img.src = src;
}

/**
 * The sizes of a design drawn to scale from their real dimensions, with the
 * decoration photo of the selected size underneath.
 */
export function DesignSizeWall({ categories, tiles, alt, labels }: DesignSizeWallProps) {
  const headingId = useId();
  const panelId = useId();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const visible = tiles.filter((tile) => tile.typeId === categoryId);
  const [selectedKey, setSelectedKey] = useState(visible[0]?.key ?? "");
  const selected = visible.find((tile) => tile.key === selectedKey) ?? visible[0];

  if (!selected) return null;

  function selectCategory(id: string) {
    setCategoryId(id);
    setSelectedKey(tiles.find((tile) => tile.typeId === id)?.key ?? "");
  }

  // One scale across all categories, so switching between them keeps sizes
  // comparable whenever the row is not width-constrained.
  const maxHeightMm = Math.max(1, ...tiles.map((tile) => tile.heightMm));
  const widthSumMm = visible.reduce((sum, tile) => sum + tile.widthMm, 0);
  const gaps = GAP_PX * (visible.length - 1);
  const idealWidth = (MAX_TILE_PX * widthSumMm) / maxHeightMm + gaps;
  const minWidth = Math.min(idealWidth, MIN_TILE_PX * visible.length + gaps);
  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <h2
            id={headingId}
            className="text-[13px] font-medium uppercase tracking-[0.25em] text-gray-500"
          >
            {labels.heading}
          </h2>
          <p className="mt-2 text-sm font-light text-gray-500">{labels.hint}</p>
        </div>
        {categories.length > 1 && (
          <div role="group" aria-label={labels.categories} className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCategory(category.id)}
                  className={cn(
                    "cursor-pointer border px-4 py-2 text-sm transition",
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-ink",
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
                    active ? "font-medium text-ink" : "font-light text-gray-500 group-hover:text-ink",
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
  );
}
