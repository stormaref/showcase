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
      {items.length === 0 ? (
        <p className="mt-16 text-gray-500">{t("empty")}</p>
      ) : (
        <Suspense fallback={<div className="mt-12 h-64 animate-pulse rounded-2xl bg-gray-100" />}>
          <DesignCatalog items={items} />
        </Suspense>
      )}
    </div>
  );
}
