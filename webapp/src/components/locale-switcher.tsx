"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { vazirmatn } from "@/lib/fonts/vazirmatn";

const LOCALE_OPTIONS: { locale: Locale; label: string; persian?: boolean }[] = [
  { locale: "en", label: "English" },
  { locale: "fa", label: "فارسی", persian: true },
];

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        className="flex size-9 items-center justify-center text-gray-500 transition hover:text-ink"
        aria-label={t("changeLanguage")}
      >
        <Languages className="size-5" strokeWidth={1.5} aria-hidden />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("supportedLanguages")}
          className="absolute end-0 top-full z-50 mt-4 min-w-[10rem] border border-gray-200 bg-white py-2 shadow-sm"
        >
          {LOCALE_OPTIONS.map(({ locale: l, label, persian }) => {
            const selected = l === locale;
            const itemClass = `block w-full px-5 py-2.5 text-start text-sm transition ${
              selected
                ? "bg-gray-50 font-medium text-ink"
                : "font-light text-gray-600 hover:bg-gray-50 hover:text-clay"
            } ${persian ? vazirmatn.className : ""}`;

            return (
              <li key={l} role="option" aria-selected={selected}>
                {selected ? (
                  <span className={itemClass}>{label}</span>
                ) : (
                  <Link
                    href={pathname}
                    locale={l}
                    className={itemClass}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
