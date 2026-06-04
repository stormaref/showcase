"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Design, DesignImage } from "@/lib/api";

type DesignGridProps = {
  items: Design[];
  useThumb?: boolean;
  showCaption?: boolean;
  className?: string;
  compact?: boolean;
};

function imageSrc(img: DesignImage, useThumb: boolean) {
  if (useThumb) return img.thumb_url || img.image_url || "";
  return img.image_url || img.thumb_url || "";
}

function carouselImages(design: Design): DesignImage[] {
  const showcase = design.images.filter((img) => !img.size_id);
  const sized = design.images.filter((img) => img.size_id);
  const sorted = [...showcase, ...sized];
  if (sorted.length > 0) return sorted;
  if (design.primary_image_url) {
    return [
      {
        image_url: design.primary_image_url,
        thumb_url: design.primary_thumb_url,
        sort_order: 0,
      },
    ];
  }
  return [];
}

export function DesignGrid({
  items,
  useThumb = false,
  showCaption = true,
  className = "mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  compact = false,
}: DesignGridProps) {
  const t = useTranslations("designs");
  const [selected, setSelected] = useState<Design | null>(null);
  const [slide, setSlide] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const slides = useMemo(
    () => (selected ? carouselImages(selected) : []),
    [selected],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected) {
      setSlide(0);
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

  const thumbSrc = (item: Design) =>
    useThumb
      ? item.primary_thumb_url || item.primary_image_url
      : item.primary_image_url || item.primary_thumb_url;

  const figureClass = compact
    ? "overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
    : "overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm";

  function SizeChips({ sizes }: { sizes: Design["sizes"] }) {
    if (sizes.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {sizes.map((s) => (
          <span
            key={s.id}
            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {s.label}
          </span>
        ))}
      </div>
    );
  }

  const figcaptionClass = compact
    ? "p-4 text-sm font-medium text-gray-800"
    : "p-5";

  const current = slides[slide];

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
                className="aspect-square w-full object-cover"
              />
            </button>
            <figcaption className={figcaptionClass}>
              {compact ? (
                <>
                  <span className="font-medium text-gray-800">{item.title}</span>
                  <SizeChips sizes={item.sizes} />
                </>
              ) : (
                <>
                  <h2 className="font-medium text-gray-900">{item.title}</h2>
                  <SizeChips sizes={item.sizes} />
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
        {selected && current && (
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
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
                  className="absolute start-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  aria-label={t("prev")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s + 1) % slides.length)}
                  className="absolute end-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  aria-label={t("next")}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(current, false)}
              alt={selected.alt_text || selected.title}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            <div className="mt-4 max-w-full text-center text-white">
              <p className="text-lg font-medium">{selected.title}</p>
              {selected.sizes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    {t("availableSizes")}
                  </p>
                  <p className="mt-2 flex flex-wrap justify-center gap-2">
                    {selected.sizes.map((size) => (
                      <span
                        key={size.id}
                        className="rounded-full bg-white/15 px-3 py-0.5 text-xs"
                      >
                        {size.label}
                      </span>
                    ))}
                  </p>
                </div>
              )}
              {selected.caption && (
                <p className="mt-2 text-sm text-white/80">{selected.caption}</p>
              )}
              {slides.length > 1 && (
                <p className="mt-2 text-xs text-white/60">
                  {slide + 1} / {slides.length}
                </p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
