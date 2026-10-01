"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CarouselSlide = {
  src: string;
  alt: string;
};

type ImageCarouselProps = {
  images: CarouselSlide[];
  className?: string;
  /** Aspect ratio of each slide, e.g. "aspect-square". */
  slideClassName?: string;
  /** Fit of the image inside the slide, e.g. "object-contain". */
  imageClassName?: string;
  /** Responsive `sizes` for next/image; defaults to full viewport width. */
  sizes?: string;
  labels?: {
    carousel?: string;
    previous?: string;
    next?: string;
    slide?: string;
  };
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ImageCarousel({
  images,
  className,
  slideClassName = "aspect-[4/3] md:aspect-[16/9]",
  imageClassName = "object-cover",
  sizes = "100vw",
  labels,
}: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(clamped);
  }, [images.length]);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    // scrollLeft runs negative in RTL, so measure the distance from the start.
    const { scrollLeft, clientWidth } = track;
    const index = Math.round(Math.abs(scrollLeft) / Math.max(clientWidth, 1));
    setActiveIndex(Math.max(0, Math.min(index, images.length - 1)));
  }, [images.length]);

  if (images.length === 0) return null;

  const total = images.length;
  const showControls = total > 1;
  const prevLabel = labels?.previous ?? "Previous image";
  const nextLabel = labels?.next ?? "Next image";
  const slideLabel = labels?.slide ?? "Slide";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels?.carousel}
      className={cn("relative", className)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideLabel} ${i + 1} / ${total}`}
            className={cn("relative w-full shrink-0 snap-start", slideClassName)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={sizes}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              className={imageClassName}
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
            disabled={activeIndex === total - 1}
            aria-label={nextLabel}
            className="absolute end-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink transition hover:bg-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          </button>
          {/* Dark pill keeps the dots visible on light tiles. */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div className="flex rounded-full bg-ink/30 px-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`${slideLabel} ${i + 1} / ${total}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className="group flex h-6 w-8 items-center justify-center"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-1 w-5 rounded-full transition",
                      i === activeIndex
                        ? "bg-white"
                        : "bg-white/50 group-hover:bg-white/80",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
