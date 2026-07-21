import { ArrowRight } from "lucide-react";
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
          className="flex flex-col rounded-2xl border border-gray-200 bg-shell p-6 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-clay/50 hover:shadow-lg hover:shadow-clay/10"
        >
          <Link
            href={`/products?brand=${brand.id}`}
            className="group flex flex-1 cursor-pointer flex-col items-center"
          >
            <div className="flex h-24 w-full items-center justify-center rounded-t-[3rem] rounded-b-xl bg-cream">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  loading="lazy"
                  className="max-h-16 max-w-[150px] object-contain"
                />
              ) : (
                <span className="font-display text-lg font-semibold text-gray-900">
                  {brand.name}
                </span>
              )}
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold text-gray-900 transition group-hover:text-clay">
              {brand.name}
            </h3>
            {brand.description && (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {brand.description}
              </p>
            )}
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay transition group-hover:text-clay-dark">
              {productsLabel}
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500 transition hover:text-clay"
            >
              {visitLabel}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
