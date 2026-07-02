import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBrandInfo, phoneTelHref } from "@/lib/brand-info";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const brand = await getBrandInfo(locale);

  const links = [
    { href: "/products" as const, label: nav("designs") },
    { href: "/brands" as const, label: nav("brands") },
    { href: "/blog" as const, label: nav("blog") },
  ];

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div
        className="h-1 bg-gradient-to-r from-clay-dark via-clay to-clay-light"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold tracking-tight text-white">
            {brand.name}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
            {brand.tagline}
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="w-fit transition hover:text-clay-light"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="text-sm leading-relaxed text-gray-400">
          <address className="not-italic">
            <span className="block">{brand.addressLine1}</span>
            <span className="block">{brand.addressLine3}</span>
          </address>
          <p className="mt-3">
            <a href={phoneTelHref(brand.phone)} className="transition hover:text-clay-light">
              {brand.phone}
            </a>
          </p>
          <p className="mt-1">
            <a href={`mailto:${brand.email}`} className="transition hover:text-clay-light">
              {brand.email}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <p className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-400">
          © {new Date().getFullYear()} {brand.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
