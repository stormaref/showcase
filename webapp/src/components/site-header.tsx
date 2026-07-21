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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.35em] text-ink transition hover:opacity-60"
        >
          {brand.name}
        </Link>
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-8 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
            <Link href="/" className="transition hover:text-ink">
              {t("home")}
            </Link>
            <ProductsNavMenu
              label={t("designs")}
              allLabel={t("allProducts")}
              types={tileTypes}
            />
            <Link href="/brands" className="transition hover:text-ink">
              {t("brands")}
            </Link>
            <Link href="/blog" className="transition hover:text-ink">
              {t("blog")}
            </Link>
          </nav>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
