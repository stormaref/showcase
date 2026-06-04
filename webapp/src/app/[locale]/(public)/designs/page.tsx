import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { DesignGrid } from "@/components/design-grid";
import { apiFetch, type Design } from "@/lib/api";
import { localeAlternates } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("designsTitle"),
    description: t("designsDescription"),
    alternates: { languages: localeAlternates("/designs") },
  };
}

export default async function DesignsPage() {
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
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="mt-3 text-gray-500">{t("subtitle")}</p>
      </header>
      {items.length === 0 ? (
        <p className="mt-16 text-gray-400">{t("empty")}</p>
      ) : (
        <DesignGrid items={items} />
      )}
    </div>
  );
}
