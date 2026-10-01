"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CarouselSlide } from "@/components/image-carousel";
import { localizeDigits } from "@/lib/format";

type ProductImageGridProps = {
  images: CarouselSlide[];
  locale: string;
  labels: {
    enlarge: string;
    close: string;
    previous: string;
    next: string;
  };
};

/** Thumbnail grid; each photo opens full size in a native modal <dialog>. */
export function ProductImageGrid({ images, locale, labels }: ProductImageGridProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const total = images.length;

  function open(index: number) {
    setOpenIndex(index);
    dialogRef.current?.showModal();
  }

  function step(delta: number) {
    setOpenIndex((i) => (i === null ? i : (i + delta + total) % total));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (total < 2) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    // "Next" sits on the reading-direction end, so the arrow keys flip in RTL.
    const rtl = document.documentElement.dir === "rtl";
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    step(forward ? 1 : -1);
  }

  const current = openIndex === null ? null : images[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-haspopup="dialog"
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-gray-100"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition duration-700 motion-safe:group-hover:scale-105"
              />
              <span className="sr-only">{labels.enlarge}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenIndex(null)}
        onKeyDown={onKeyDown}
        // A click on the dark surround (the dialog itself, not its content) closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        aria-label={current?.alt}
        className="m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center bg-ink/90 p-4 text-white open:flex backdrop:bg-ink/60 md:p-10"
      >
        {current && (
          <>
            <div className="pointer-events-none relative h-full w-full">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={labels.close}
              autoFocus
              className="absolute end-4 top-4 flex size-11 items-center justify-center bg-white/90 text-ink transition hover:bg-white"
            >
              <X className="size-5" aria-hidden />
            </button>
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={labels.previous}
                  className="absolute start-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center bg-white/90 text-ink transition hover:bg-white"
                >
                  <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={labels.next}
                  className="absolute end-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center bg-white/90 text-ink transition hover:bg-white"
                >
                  <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <p className="absolute inset-x-0 bottom-4 text-center text-sm text-white/90" aria-live="polite">
                  <bdi dir="ltr">
                    {localizeDigits(`${(openIndex ?? 0) + 1} / ${total}`, locale)}
                  </bdi>
                </p>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
