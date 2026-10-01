import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import logoMark from "@/assets/images/logo-mark.png";
import logoMarkDark from "@/assets/images/logo-mark-dark.png";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { NavLink } from "@/components/nav-link";
import { ProductsNavMenu } from "@/components/products-nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getBrandInfo, phoneTelHref, whatsappHref } from "@/lib/brand-info";
import { getTileTypes } from "@/lib/tile-types";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const brand = await getBrandInfo(locale);
  const tileTypes = await getTileTypes(locale);
  const tel = phoneTelHref(brand.phone);

  // Solid below md: backdrop-filter would trap the mobile sheet's fixed
  // positioning inside the header.
  return (
    <header className="sticky top-0 z-40 h-[var(--header-h)] border-b border-gray-200 bg-paper md:bg-paper/95 md:backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-10">
        {/* The logo mark carries the brand on its own; the wordmark beside it
            stays localised (the full lockup is Persian-only) and steps aside on
            narrow phones, so the link is named explicitly. */}
        <Link
          href="/"
          aria-label={brand.name}
          className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-ink transition hover:opacity-60"
        >
          {/* Both variants render; CSS picks one so first paint is right
              without waiting for JS. */}
          <Image src={logoMark} alt="" aria-hidden loading="eager" className="h-10 w-auto dark:hidden" />
          <Image
            src={logoMarkDark}
            alt=""
            aria-hidden
            loading="eager"
            className="hidden h-10 w-auto dark:block"
          />
          <span className="hidden sm:inline">{brand.name}</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-8 text-sm font-medium tracking-normal text-gray-600">
            <NavLink href="/">{t("home")}</NavLink>
            <ProductsNavMenu
              label={t("designs")}
              allLabel={t("allProducts")}
              types={tileTypes}
            />
            <NavLink href="/brands">{t("brands")}</NavLink>
            <NavLink href="/blog">{t("blog")}</NavLink>
            <NavLink href="/about">{t("about")}</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle label={t("darkMode")} />
          </div>
        </div>
        <MobileNav
          types={tileTypes}
          phoneHref={tel === "tel:" ? "" : tel}
          whatsappHref={whatsappHref(brand.whatsapp)}
        />
      </div>
    </header>
  );
}
