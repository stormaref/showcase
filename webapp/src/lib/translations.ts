import type { GalleryTranslation, PostTranslation } from "@/lib/api";

export type LocaleTab = "en" | "fa";

export const emptyPostTranslation = (): PostTranslation => ({
  locale: "en",
  slug: "",
  title: "",
  excerpt: "",
  content_md: "",
  meta_title: "",
  meta_description: "",
});

export const emptyGalleryTranslation = (): GalleryTranslation => ({
  locale: "en",
  title: "",
  caption: "",
  alt_text: "",
});

export function postTranslationsFromRecord(
  record?: Record<string, PostTranslation>,
): Record<LocaleTab, PostTranslation> {
  return {
    en: record?.en ?? { ...emptyPostTranslation(), locale: "en" },
    fa: record?.fa ?? { ...emptyPostTranslation(), locale: "fa" },
  };
}

export function galleryTranslationsFromRecord(
  record?: Record<string, GalleryTranslation>,
): Record<LocaleTab, GalleryTranslation> {
  return {
    en: record?.en ?? { ...emptyGalleryTranslation(), locale: "en" },
    fa: record?.fa ?? { ...emptyGalleryTranslation(), locale: "fa" },
  };
}
