"use client";

import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { isActivePath } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import type { DesignType } from "@/lib/api";

type MobileNavProps = {
  types: DesignType[];
  /** tel: link, or "" to hide the Call button. */
  phoneHref: string;
  /** wa.me link, or "" to hide the WhatsApp button. */
  whatsappHref: string;
};

const MD_QUERY = "(min-width: 48rem)";

// Phone-only menu: a button in the header that opens a full-height sheet under
// it. The header itself must not use backdrop-filter below md, or it becomes
// the containing block for this fixed sheet.
export function MobileNav({ types, phoneHref, whatsappHref }: MobileNavProps) {
  const t = useTranslations("nav");
  const tc = useTranslations("contact");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  // Close on route change (back/forward included), adjusting state during render.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    // The sheet is md:hidden; don't leave the page scroll-locked behind it
    // if the viewport grows past md while it is open.
    const mq = window.matchMedia(MD_QUERY);
    function onBreakpoint(e: MediaQueryListEvent) {
      if (e.matches) setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  const close = () => setOpen(false);

  const linkClass = (href: string) =>
    `block py-3 text-2xl font-light transition hover:text-clay ${
      isActivePath(pathname, href) ? "text-clay" : "text-ink"
    }`;
  const current = (href: string) => (isActivePath(pathname, href) ? "page" : undefined);

  return (
    <div
      className="md:hidden"
      onBlur={(e) => {
        // Tabbing past the sheet would land on page content hidden behind it.
        const next = e.relatedTarget as Node | null;
        if (next && !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={sheetId}
        aria-label={t("menu")}
        className="-me-2 flex size-11 items-center justify-center text-ink transition hover:text-clay"
      >
        {open ? (
          <X className="size-6" strokeWidth={1.5} aria-hidden />
        ) : (
          <Menu className="size-6" strokeWidth={1.5} aria-hidden />
        )}
      </button>

      <div
        id={sheetId}
        hidden={!open}
        className="fixed inset-0 top-[var(--header-h)] z-40 overflow-y-auto overscroll-contain bg-paper"
      >
        <nav aria-label={t("menu")} className="px-6 pt-6">
          <ul className="divide-y divide-gray-200">
            <li>
              <Link href="/" onClick={close} aria-current={current("/")} className={linkClass("/")}>
                {t("home")}
              </Link>
            </li>
            <li className="pb-3">
              <Link
                href="/products"
                onClick={close}
                aria-current={current("/products")}
                className={linkClass("/products")}
              >
                {t("designs")}
              </Link>
              {types.length > 0 && (
                <ul className="flex flex-col border-s border-gray-200 ps-4">
                  {types.map((tp) => (
                    <li key={tp.id}>
                      <Link
                        href={`/products?type=${tp.id}`}
                        onClick={close}
                        className="block py-2.5 text-base text-gray-600 transition hover:text-clay"
                      >
                        {tp.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <Link
                href="/brands"
                onClick={close}
                aria-current={current("/brands")}
                className={linkClass("/brands")}
              >
                {t("brands")}
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                onClick={close}
                aria-current={current("/blog")}
                className={linkClass("/blog")}
              >
                {t("blog")}
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={close}
                aria-current={current("/about")}
                className={linkClass("/about")}
              >
                {t("about")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-3 px-6 pt-6 pb-10">
          {phoneHref && (
            <a
              href={phoneHref}
              className="flex min-h-12 items-center justify-center gap-2 bg-clay px-5 text-base font-medium text-paper transition hover:bg-clay-dark"
            >
              <Phone className="size-5" strokeWidth={1.5} aria-hidden />
              {tc("call")}
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 border border-ink px-5 text-base font-medium text-ink transition hover:bg-ink hover:text-paper"
            >
              <MessageCircle className="size-5" strokeWidth={1.5} aria-hidden />
              {tc("whatsapp")}
            </a>
          )}
          <div className="mt-2 flex items-center justify-center gap-4">
            <LocaleSwitcher onNavigate={close} className="text-base" />
            <ThemeToggle label={t("darkMode")} />
          </div>
        </div>
      </div>
    </div>
  );
}
