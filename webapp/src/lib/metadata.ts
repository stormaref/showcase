import type { Metadata } from "next";
import { localeAlternates, siteUrl } from "@/lib/locale";

export function metadataBase(): URL {
  return new URL(siteUrl());
}

function ogLocale(locale: string): string {
  return locale === "fa" ? "fa_IR" : "en_US";
}

function alternateOgLocale(locale: string): string[] {
  return locale === "fa" ? ["en_US"] : ["fa_IR"];
}

function canonicalUrl(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const suffix = normalized === "/" ? "" : normalized;
  return `${siteUrl()}/${locale}${suffix}`;
}

export type PageMetadataInput = {
  locale: string;
  path: string;
  title: string;
  description: string;
  siteName: string;
  images?: string[];
  type?: "website" | "article";
  publishedTime?: string;
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const {
    locale,
    path,
    title,
    description,
    siteName,
    images,
    type = "website",
    publishedTime,
  } = input;

  const url = canonicalUrl(locale, path);
  const openGraph: Metadata["openGraph"] = {
    type,
    locale: ogLocale(locale),
    alternateLocale: alternateOgLocale(locale),
    siteName,
    title,
    description,
    url,
    ...(images?.length ? { images } : {}),
    ...(type === "article" && publishedTime
      ? { publishedTime }
      : {}),
  };

  const twitter: Metadata["twitter"] = {
    card: "summary_large_image",
    title,
    description,
    ...(images?.length ? { images } : {}),
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: localeAlternates(path),
    },
    openGraph,
    twitter,
  };
}
