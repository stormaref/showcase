import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { DesignCatalog } from "@/components/design-catalog";
import { apiFetch, type Design } from "@/lib/api";
import { getBrandInfo } from "@/lib/brand-info";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/products",
    title: t("designsTitle"),
    description: t("designsDescription"),
    siteName: brand.name,
  });
}

export default async function ProductsPage() {
  const locale = await getLocale();
  const t = await getTranslations("designs");

  let items: Design[] = [];
  try {
    const data = await apiFetch<{ items: Design[] }>(
      "/api/v1/public/designs",
      { locale, next: { revalidate: 60 } },
    );
    items = data.items;
  } catch {
    /* empty */
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-500">
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 text-4xl font-extralight tracking-tight text-ink md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-gray-500">
          {t("subtitle")}
        </p>
      </header>
      {items.length === 0 ? (
        <p className="mt-16 font-light text-gray-500">{t("empty")}</p>
      ) : (
        <Suspense fallback={<div className="mt-14 h-64 animate-pulse bg-gray-100" />}>
          <DesignCatalog items={items} />
        </Suspense>
      )}
    </div>
  );
}
