import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ProductsNavMenu } from "@/components/products-nav-menu";
import { getBrandInfo } from "@/lib/brand-info";
import { getTileTypes } from "@/lib/tile-types";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const brand = await getBrandInfo(locale);
  const tileTypes = await getTileTypes(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-cream/95 backdrop-blur">
      <div
        className="h-0.5 bg-gradient-to-r from-clay-dark via-clay to-ochre"
        aria-hidden
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-gray-900 transition hover:text-clay"
        >
          <span
            className="inline-block size-2.5 rotate-45 bg-clay transition duration-300 group-hover:rotate-[135deg]"
            aria-hidden
          />
          {brand.name}
        </Link>
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-gray-700">
            <Link href="/" className="transition hover:text-clay">
              {t("home")}
            </Link>
            <ProductsNavMenu
              label={t("designs")}
              allLabel={t("allProducts")}
              types={tileTypes}
            />
            <Link href="/brands" className="transition hover:text-clay">
              {t("brands")}
            </Link>
            <Link href="/blog" className="transition hover:text-clay">
              {t("blog")}
            </Link>
          </nav>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
