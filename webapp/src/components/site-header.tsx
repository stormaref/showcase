import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("company");

  const links = [
    { href: "/" as const, label: t("home") },
    { href: "/gallery" as const, label: t("gallery") },
    { href: "/blog" as const, label: t("blog") },
  ];

  return (
    <header className="border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {tc("name")}
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
