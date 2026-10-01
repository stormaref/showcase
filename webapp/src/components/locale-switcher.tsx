"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { iranYekan } from "@/lib/fonts/iranyekan";

// Only two locales, so the switcher is a single link to the other one on the
// same path, named in that language ("English" on /fa, "فارسی" on /en).
const OTHER: Record<Locale, { locale: Locale; label: string; fontClass: string }> = {
  en: { locale: "fa", label: "فارسی", fontClass: iranYekan.className },
  fa: { locale: "en", label: "English", fontClass: "font-sans" },
};

export function LocaleSwitcher({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const target = OTHER[locale] ?? OTHER.en;

  return (
    <Link
      href={pathname}
      locale={target.locale}
      hrefLang={target.locale}
      lang={target.locale}
      onClick={onNavigate}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 px-2 text-sm text-gray-600 transition hover:text-ink ${target.fontClass} ${className}`}
    >
      <Languages className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      {target.label}
    </Link>
  );
}
