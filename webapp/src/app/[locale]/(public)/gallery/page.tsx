import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { apiFetch, type GalleryItem } from "@/lib/api";
import { localeAlternates } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("galleryTitle"),
    description: t("galleryDescription"),
    alternates: { languages: localeAlternates("/gallery") },
  };
}

export default async function GalleryPage() {
  const locale = await getLocale();
  const t = await getTranslations("gallery");

  let items: GalleryItem[] = [];
  try {
    const data = await apiFetch<{ items: GalleryItem[] }>(
      "/api/v1/public/gallery",
      { locale, next: { revalidate: 60 } },
    );
    items = data.items;
  } catch {
    /* empty */
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t("title")}</h1>
      <p className="mt-2 text-gray-500">{t("subtitle")}</p>
      {items.length === 0 ? (
        <p className="mt-12 text-gray-400">{t("empty")}</p>
      ) : (
        <GalleryGrid items={items} />
      )}
    </div>
  );
}
