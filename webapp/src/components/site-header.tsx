import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getBrandInfo } from "@/lib/brand-info";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const brand = await getBrandInfo(locale);

  const links = [
    { href: "/" as const, label: t("home") },
    { href: "/products" as const, label: t("designs") },
    { href: "/brands" as const, label: t("brands") },
    { href: "/blog" as const, label: t("blog") },
  ];

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
          <nav className="flex gap-7 text-sm font-medium text-gray-700">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition hover:text-clay"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
