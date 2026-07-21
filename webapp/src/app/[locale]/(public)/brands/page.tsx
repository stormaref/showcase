import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { BrandGrid } from "@/components/brand-grid";
import { getBrandInfo } from "@/lib/brand-info";
import { getBrands } from "@/lib/brands";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/brands",
    title: t("brandsTitle"),
    description: t("brandsDescription"),
    siteName: brand.name,
  });
}

export default async function BrandsPage() {
  const locale = await getLocale();
  const t = await getTranslations("brands");
  const brands = await getBrands(locale);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <header className="max-w-2xl">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-clay">
          <span className="h-px w-10 bg-clay" aria-hidden />
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-600">{t("subtitle")}</p>
      </header>
      {brands.length === 0 ? (
        <p className="mt-16 text-gray-500">{t("empty")}</p>
      ) : (
        <BrandGrid
          brands={brands}
          visitLabel={t("visit")}
          productsLabel={t("viewProducts")}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        />
      )}
    </div>
  );
}
