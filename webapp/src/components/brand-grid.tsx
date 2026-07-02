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
    <ul className={className ?? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"}>
      {brands.map((brand) => (
        <li
          key={brand.id}
          className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md"
        >
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
                  className="max-h-20 max-w-[160px] object-contain"
                />
              ) : (
                <span className="text-lg font-semibold text-gray-900">
                  {brand.name}
                </span>
              )}
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-clay">
              {brand.name}
            </h3>
            {brand.description && (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {brand.description}
              </p>
            )}
            <span className="mt-4 text-sm font-medium text-clay transition group-hover:text-clay-dark">
              {productsLabel} →
            </span>
          </Link>
          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 transition hover:text-clay"
            >
              {visitLabel}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
