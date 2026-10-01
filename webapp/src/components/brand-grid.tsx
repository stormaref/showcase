import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Brand } from "@/lib/api";
import { cn } from "@/lib/utils";

type BrandGridProps = {
  brands: Brand[];
  visitLabel: string;
  productsLabel: string;
  /** Outer spacing only; the grid itself is laid out here. */
  className?: string;
  /** Heading level for brand names, so the page outline doesn't skip a level. */
  headingLevel?: "h2" | "h3";
};

// Uploaded logos are often dark artwork on a transparent ground, so dark mode
// sets them on a bone plate (the dark theme's ink) to keep them legible.
const logoPlate =
  "object-contain transition-opacity duration-500 group-hover:opacity-85 dark:bg-ink";

function VisitLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] text-gray-500 transition hover:text-ink",
        className ?? "mt-4",
      )}
    >
      {label}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

export function BrandGrid({
  brands,
  visitLabel,
  productsLabel,
  className,
  headingLevel: Heading = "h3",
}: BrandGridProps) {
  // A single brand gets a compact horizontal card (logo beside its name and
  // links) instead of a lonely card in a three-column grid.
  if (brands.length === 1) {
    const brand = brands[0];
    return (
      <div className={cn("flex items-center gap-6 md:gap-8", className)}>
        {brand.logo_url && (
          <div className="flex size-20 shrink-0 items-center justify-center md:size-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logo_url}
              alt=""
              loading="lazy"
              className={cn(logoPlate, "max-h-full max-w-full dark:p-2")}
            />
          </div>
        )}
        <div className="min-w-0">
          <Heading className="text-2xl font-light tracking-tight text-ink md:text-3xl rtl:leading-[1.35]">
            {brand.name}
          </Heading>
          {brand.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600 md:text-base">
              {brand.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={`/products?brand=${brand.id}`}
              className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-ink underline decoration-gray-300 underline-offset-8 transition hover:text-clay hover:decoration-clay"
            >
              {productsLabel}
              <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
            </Link>
            {brand.website_url && (
              <VisitLink href={brand.website_url} label={visitLabel} className="mt-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ul className={cn("grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {brands.map((brand) => (
        <li key={brand.id} className="flex flex-col items-center border-t border-gray-200 pt-8 text-center">
          <Link
            href={`/products?brand=${brand.id}`}
            className="group flex flex-1 cursor-pointer flex-col items-center"
          >
            <div className="flex h-20 items-center justify-center">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt=""
                  loading="lazy"
                  className={cn(logoPlate, "max-h-14 max-w-[140px] dark:p-2.5")}
                />
              ) : (
                <span aria-hidden className="text-lg font-light uppercase tracking-[0.25em] text-ink">
                  {brand.name}
                </span>
              )}
            </div>
            <Heading className="mt-5 text-[13px] font-medium uppercase tracking-[0.22em] text-ink">
              {brand.name}
            </Heading>
            {brand.description && (
              <p className="mt-3 line-clamp-2 max-w-xs text-sm font-light leading-relaxed text-gray-500">
                {brand.description}
              </p>
            )}
            <span className="mt-5 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500 underline decoration-gray-300 underline-offset-4 transition group-hover:text-clay group-hover:decoration-clay">
              {productsLabel}
            </span>
          </Link>
          {brand.website_url && <VisitLink href={brand.website_url} label={visitLabel} />}
        </li>
      ))}
    </ul>
  );
}
