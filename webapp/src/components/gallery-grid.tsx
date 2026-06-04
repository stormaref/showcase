"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { GalleryItem } from "@/lib/api";

type GalleryGridProps = {
  items: GalleryItem[];
  useThumb?: boolean;
  showCaption?: boolean;
  className?: string;
  compact?: boolean;
};

export function GalleryGrid({
  items,
  useThumb = false,
  showCaption = true,
  className = "mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  compact = false,
}: GalleryGridProps) {
  const t = useTranslations("gallery");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const thumbSrc = (item: GalleryItem) =>
    useThumb ? item.thumb_url || item.image_url : item.image_url;

  const figureClass = compact
    ? "overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
    : "overflow-hidden rounded-xl border border-gray-100";

  const figcaptionClass = compact
    ? "p-4 text-sm font-medium text-gray-800"
    : "p-5";

  return (
    <>
      <div className={className}>
        {items.map((item) => (
          <figure key={item.id} className={figureClass}>
            <button
              type="button"
              onClick={() => setSelected(item)}
              className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              aria-label={t("viewImage", { title: item.title })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc(item)}
                alt={item.alt_text || item.title}
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
            <figcaption className={figcaptionClass}>
              {compact ? (
                <span className="font-medium text-gray-800">{item.title}</span>
              ) : (
                <>
                  <h2 className="font-medium text-gray-900">{item.title}</h2>
                  {showCaption && item.caption && (
                    <p className="mt-1 text-sm text-gray-500">{item.caption}</p>
                  )}
                </>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
        className="fixed inset-0 m-0 max-h-none max-w-none border-0 bg-transparent p-0 backdrop:bg-black/80 open:flex open:flex-col open:items-center open:justify-center"
      >
        {selected && (
          <div
            className="relative flex max-h-[95vh] max-w-[min(90vw,72rem)] flex-col items-center px-4 py-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute end-0 top-0 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={t("close")}
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.image_url}
              alt={selected.alt_text || selected.title}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            <div className="mt-4 max-w-full text-center text-white">
              <p className="text-lg font-medium">{selected.title}</p>
              {selected.caption && (
                <p className="mt-1 text-sm text-white/80">{selected.caption}</p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
