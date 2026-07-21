import { Link } from "@/i18n/navigation";
import type { Design } from "@/lib/api";

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
  className = "grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3",
  compact = false,
}: DesignGridProps) {
  const thumbSrc = (item: Design) =>
    useThumb
      ? item.primary_thumb_url || item.primary_image_url
      : item.primary_image_url || item.primary_thumb_url;

  const meta = (item: Design) => {
    const types = (item.types ?? []).map((tp) => tp.name);
    const sizes = item.sizes.map((s) => s.label);
    return [types.join(" · "), sizes.join(" · ")].filter(Boolean);
  };

  return (
    <div className={className}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/products/${item.id}`}
          className="group block cursor-pointer"
        >
          <figure>
            <div className="overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc(item)}
                alt={item.alt_text || item.title}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <figcaption className="mt-5">
              {item.brand?.name && (
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                  {item.brand.name}
                </p>
              )}
              <p className="mt-1.5 text-lg font-light text-ink transition group-hover:text-clay">
                {item.title}
              </p>
              {meta(item).map((line, i) => (
                <p key={i} className="mt-1 text-xs font-light text-gray-500">
                  {line}
                </p>
              ))}
              {!compact && showCaption && item.caption && (
                <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">
                  {item.caption}
                </p>
              )}
            </figcaption>
          </figure>
        </Link>
      ))}
    </div>
  );
}
