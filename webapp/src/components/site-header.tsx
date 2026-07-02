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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-gray-900 transition hover:text-clay"
        >
          {brand.name}
        </Link>
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-7 text-sm font-medium text-gray-700">
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
