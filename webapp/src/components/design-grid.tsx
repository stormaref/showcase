import { Fragment } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Design } from "@/lib/api";
import { formatSizeLabel } from "@/lib/format";

type DesignGridProps = {
  items: Design[];
  useThumb?: boolean;
  showCaption?: boolean;
  className?: string;
  compact?: boolean;
};

export function DesignGrid({
  items,
  useThumb = false,
  showCaption = true,
  className = "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3",
  compact = false,
}: DesignGridProps) {
  const locale = useLocale();

  // Thumbnails are 400px wide, too small for cards on 2x screens, so by
  // default hand the optimizer the original and let it resize to `sizes`.
  const imageSrc = (item: Design) =>
    useThumb
      ? item.primary_thumb_url || item.primary_image_url
      : item.primary_image_url || item.primary_thumb_url;

  return (
    <div className={className}>
      {items.map((item) => {
        const src = imageSrc(item);
        const types = (item.types ?? []).map((tp) => tp.name).join(" · ");
        return (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="group block cursor-pointer"
          >
            <figure>
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {src && (
                  <Image
                    src={src}
                    alt={item.alt_text || item.title}
                    fill
                    sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 50vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
                  />
                )}
                {/* Hairline frame: most swatches are near-white on a near-white page. */}
                <span
                  className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-ink/10"
                  aria-hidden
                />
              </div>
              <figcaption className="mt-3 sm:mt-5">
                {item.brand?.name && (
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-600 sm:text-xs sm:tracking-[0.2em]">
                    {item.brand.name}
                  </p>
                )}
                <p className="mt-1 text-sm text-ink transition group-hover:text-clay sm:mt-1.5 sm:text-lg sm:font-light">
                  {item.title}
                </p>
                {types && <p className="mt-1 text-xs text-gray-600">{types}</p>}
                {item.sizes.length > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    {item.sizes.map((size, i) => (
                      <Fragment key={size.id}>
                        {i > 0 && " · "}
                        <bdi dir="ltr">{formatSizeLabel(size.label, locale)}</bdi>
                      </Fragment>
                    ))}
                  </p>
                )}
                {!compact && showCaption && item.caption && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 max-sm:hidden">
                    {item.caption}
                  </p>
                )}
              </figcaption>
            </figure>
          </Link>
        );
      })}
    </div>
  );
}
