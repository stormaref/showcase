import type { Brand } from "@/lib/api";

type BrandGridProps = {
  brands: Brand[];
  visitLabel: string;
  className?: string;
};

export function BrandGrid({ brands, visitLabel, className }: BrandGridProps) {
  return (
    <ul className={className ?? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"}>
      {brands.map((brand) => (
        <li
          key={brand.id}
          className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-6 text-center"
        >
          <div className="flex h-20 items-center justify-center">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="max-h-20 max-w-[160px] object-contain"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-800">
                {brand.name}
              </span>
            )}
          </div>
          <h3 className="mt-4 font-medium text-gray-900">{brand.name}</h3>
          {brand.description && (
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {brand.description}
            </p>
          )}
          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 text-sm font-medium text-clay transition hover:text-clay-dark"
            >
              {visitLabel} →
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
