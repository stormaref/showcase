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
    <footer className="mt-auto border-t border-gray-200 bg-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 md:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-ink">
            {brand.name}
          </p>
          <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-gray-500">
            {brand.tagline}
          </p>
        </div>
        <nav className="flex flex-col gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="w-fit transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="text-sm font-light leading-relaxed text-gray-500">
          <address className="not-italic">
            <span className="block">{brand.addressLine1}</span>
            <span className="block">{brand.addressLine2}</span>
            <span className="block">{brand.addressLine3}</span>
          </address>
          <p className="mt-4">
            <a
              href={phoneTelHref(brand.phone)}
              className="text-ink transition hover:text-clay"
              dir="ltr"
            >
              {brand.phone}
            </a>
          </p>
          <p className="mt-1">
            <a href={`mailto:${brand.email}`} className="transition hover:text-ink">
              {brand.email}
            </a>
          </p>
        </div>
      </div>
      <div className="bg-ink">
        <p className="mx-auto max-w-7xl px-6 py-4 text-xs font-light text-white/60 md:px-10">
          © {new Date().getFullYear()} {brand.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
