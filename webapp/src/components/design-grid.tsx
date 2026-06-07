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

  const cardClass = compact
    ? "overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md"
    : "overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md";

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

  function TypeChips({ types }: { types: Design["types"] }) {
    if (!types?.length) return null;
    return (
      <div className="mt-1 flex flex-wrap gap-1">
        {types.map((tp) => (
          <span
            key={tp.id}
            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          >
            {tp.name}
          </span>
        ))}
      </div>
    );
  }

  const figcaptionClass = compact
    ? "p-4 text-sm font-medium text-gray-800"
    : "p-5";

  return (
    <div className={className}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/designs/${item.id}`}
          className={cn("group block cursor-pointer", cardClass)}
        >
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbSrc(item)}
              alt={item.alt_text || item.title}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <figcaption className={figcaptionClass}>
              {compact ? (
                <>
                  <span className="font-medium text-gray-800 group-hover:text-gray-900">
                    {item.title}
                  </span>
                  <TypeChips types={item.types} />
                  <SizeChips sizes={item.sizes} />
                </>
              ) : (
                <>
                  <h2 className="font-medium text-gray-900 group-hover:underline">
                    {item.title}
                  </h2>
                  <TypeChips types={item.types} />
                  <SizeChips sizes={item.sizes} />
                  {showCaption && item.caption && (
                    <p className="mt-1 text-sm text-gray-500">{item.caption}</p>
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
