import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { DesignCatalog } from "@/components/design-catalog";
import { apiFetch, type Design } from "@/lib/api";
import { getSiteName } from "@/lib/brand-info";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  return buildPageMetadata({
    locale,
    path: "/products",
    title: t("designsTitle"),
    description: t("designsDescription"),
    siteName: await getSiteName(),
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
    // Compact header: the catalog is the content, so products should start
    // near the top of the screen.
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-8 md:px-10 md:pb-24 md:pt-12">
      <header className="md:flex md:items-end md:justify-between md:gap-10">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-light tracking-tight text-ink md:text-4xl rtl:leading-[1.35]">
            {t("title")}
          </h1>
        </div>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 md:mt-0">
          {t("subtitle")}
        </p>
      </header>
      {items.length === 0 ? (
        <p className="mt-16 text-gray-600">{t("empty")}</p>
      ) : (
        <Suspense fallback={<div className="mt-6 h-64 animate-pulse bg-gray-100 lg:mt-8" />}>
          <DesignCatalog items={items} />
        </Suspense>
      )}
    </div>
  );
}
