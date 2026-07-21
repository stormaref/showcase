import { Link } from "@/i18n/navigation";
import type { Design } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  className = "mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  compact = false,
}: DesignGridProps) {
  const thumbSrc = (item: Design) =>
    useThumb
      ? item.primary_thumb_url || item.primary_image_url
      : item.primary_image_url || item.primary_thumb_url;

  const cardClass =
    "overflow-hidden rounded-2xl border border-gray-200 bg-shell shadow-sm transition duration-200 hover:-translate-y-1 hover:border-clay/50 hover:shadow-lg hover:shadow-clay/10";

  function BrandLabel({ brand }: { brand: Design["brand"] }) {
    if (!brand?.name) return null;
    return (
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">
        {brand.name}
      </p>
    );
  }

  function SizeChips({ sizes }: { sizes: Design["sizes"] }) {
    if (sizes.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sizes.map((s) => (
          <span
            key={s.id}
            className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-gray-700"
          >
            {s.label}
          </span>
        ))}
      </div>
    );
  }

  function TypeChips({ types }: { types: Design["types"] }) {
    if (!types?.length) return null;
    return (
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {types.map((tp) => (
          <span
            key={tp.id}
            className="rounded-full bg-clay-soft/70 px-2.5 py-0.5 text-xs font-medium text-clay-dark"
          >
            {tp.name}
          </span>
        ))}
      </div>
    );
  }

  const figcaptionClass = compact ? "p-5 text-sm" : "p-6";

  return (
    <div className={className}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/products/${item.id}`}
          className={cn("group block cursor-pointer", cardClass)}
        >
          <figure>
            <div className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc(item)}
                alt={item.alt_text || item.title}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <figcaption className={figcaptionClass}>
              <BrandLabel brand={item.brand} />
              {compact ? (
                <>
                  <span className="font-display text-base font-semibold text-gray-900 transition group-hover:text-clay">
                    {item.title}
                  </span>
                  <TypeChips types={item.types} />
                  <SizeChips sizes={item.sizes} />
                </>
              ) : (
                <>
                  <h2 className="font-display text-lg font-semibold text-gray-900 transition group-hover:text-clay">
                    {item.title}
                  </h2>
                  <TypeChips types={item.types} />
                  <SizeChips sizes={item.sizes} />
                  {showCaption && item.caption && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {item.caption}
                    </p>
                  )}
                </>
              )}
            </figcaption>
          </figure>
        </Link>
      ))}
    </div>
  );
}
