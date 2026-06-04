import { routing, type Locale } from "@/i18n/routing";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function localeAlternates(path: string): Record<string, string> {
  const base = siteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutLocale = normalized.replace(/^\/(en|fa)/, "") || "/";
  const result: Record<string, string> = {};
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? `/${locale}` : `/${locale}`;
    const p = withoutLocale === "/" ? prefix : `${prefix}${withoutLocale}`;
    result[locale] = `${base}${p}`;
  }
  return result;
}

export function apiLocaleParam(locale: string): string {
  return routing.locales.includes(locale as Locale) ? locale : routing.defaultLocale;
}
