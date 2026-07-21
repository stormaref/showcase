import { Link } from "@/i18n/navigation";
import type { Brand } from "@/lib/api";

type BrandGridProps = {
  brands: Brand[];
  visitLabel: string;
  productsLabel: string;
  className?: string;
};

export function BrandGrid({
  brands,
  visitLabel,
  productsLabel,
  className,
}: BrandGridProps) {
  return (
    <ul className={className ?? "grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"}>
      {brands.map((brand) => (
        <li key={brand.id} className="flex flex-col border-t border-gray-200 pt-8 text-center">
          <Link
            href={`/products?brand=${brand.id}`}
            className="group flex flex-1 cursor-pointer flex-col items-center"
          >
            <div className="flex h-20 items-center justify-center">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  loading="lazy"
                  className="max-h-14 max-w-[140px] object-contain opacity-80 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                />
              ) : (
                <span className="text-lg font-light uppercase tracking-[0.25em] text-ink">
                  {brand.name}
                </span>
              )}
            </div>
            <h3 className="mt-5 text-[13px] font-medium uppercase tracking-[0.22em] text-ink">
              {brand.name}
            </h3>
            {brand.description && (
              <p className="mt-3 line-clamp-2 max-w-xs text-sm font-light leading-relaxed text-gray-500">
                {brand.description}
              </p>
            )}
            <span className="mt-5 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500 underline decoration-gray-300 underline-offset-4 transition group-hover:text-clay group-hover:decoration-clay">
              {productsLabel}
            </span>
          </Link>
          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 text-xs font-light text-gray-400 transition hover:text-ink"
            >
              {visitLabel}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
