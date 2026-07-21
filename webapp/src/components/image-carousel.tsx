"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CarouselSlide = {
  src: string;
  alt: string;
};

type ImageCarouselProps = {
  images: CarouselSlide[];
  className?: string;
  labels?: {
    previous?: string;
    next?: string;
    slide?: string;
  };
};

export function ImageCarousel({ images, className, labels }: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setActiveIndex(clamped);
  }, [images.length]);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    const { scrollLeft, clientWidth } = track;
    const index = Math.round(scrollLeft / Math.max(clientWidth, 1));
    setActiveIndex(Math.max(0, Math.min(index, images.length - 1)));
  }, [images.length]);

  if (images.length === 0) return null;

  const showControls = images.length > 1;
  const prevLabel = labels?.previous ?? "Previous image";
  const nextLabel = labels?.next ?? "Next image";

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="w-full shrink-0 snap-start"
            aria-label={labels?.slide ? `${labels.slide} ${i + 1}` : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="aspect-[4/3] w-full object-cover md:aspect-[16/9]"
            />
          </div>
        ))}
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={() => scrollTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label={prevLabel}
            className="absolute start-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink transition hover:bg-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollTo(activeIndex + 1)}
            disabled={activeIndex === images.length - 1}
            aria-label={nextLabel}
            className="absolute end-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink transition hover:bg-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`${labels?.slide ?? "Slide"} ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
                className={cn(
                  "h-0.5 w-6 transition",
                  i === activeIndex ? "bg-white" : "bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
