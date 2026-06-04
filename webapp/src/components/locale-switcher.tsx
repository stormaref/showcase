"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      {routing.locales.map((l) => (
        <span key={l}>
          {l !== routing.locales[0] && <span className="mx-1 text-gray-300">|</span>}
          {l === locale ? (
            <span className="font-medium text-gray-900">
              {l === "en" ? t("localeEn") : t("localeFa")}
            </span>
          ) : (
            <Link
              href={pathname}
              locale={l}
              className="transition hover:text-gray-900"
            >
              {l === "en" ? t("localeEn") : t("localeFa")}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
