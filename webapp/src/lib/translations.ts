import type { DesignTranslation, PostTranslation } from "@/lib/api";

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

export const emptyDesignTranslation = (): DesignTranslation => ({
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

export function designTranslationsFromRecord(
  record?: Record<string, DesignTranslation>,
): Record<LocaleTab, DesignTranslation> {
  return {
    en: record?.en ?? { ...emptyDesignTranslation(), locale: "en" },
    fa: record?.fa ?? { ...emptyDesignTranslation(), locale: "fa" },
  };
}
