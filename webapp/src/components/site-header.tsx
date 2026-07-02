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
    { href: "/designs" as const, label: t("designs") },
    { href: "/brands" as const, label: t("brands") },
    { href: "/blog" as const, label: t("blog") },
  ];

  return (
    <header className="border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {brand.name}
        </Link>
        <div className="flex items-center gap-8">
          <nav className="flex gap-8 text-sm text-gray-600">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition hover:text-gray-900"
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
