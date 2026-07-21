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
    <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-gray-500">
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 text-4xl font-extralight tracking-tight text-ink md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-gray-500">
          {t("subtitle")}
        </p>
      </header>
      {brands.length === 0 ? (
        <p className="mt-16 font-light text-gray-500">{t("empty")}</p>
      ) : (
        <BrandGrid
          brands={brands}
          visitLabel={t("visit")}
          productsLabel={t("viewProducts")}
          className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
        />
      )}
    </div>
  );
}
