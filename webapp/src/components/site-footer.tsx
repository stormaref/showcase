import Image from "next/image";
import { Briefcase, Camera, Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import logo from "@/assets/images/logo.png";
import logoDark from "@/assets/images/logo-dark.png";
import { MapLink } from "@/components/map-link";
import {
  getBrandInfo,
  instagramHref,
  linkedinHref,
  mapLinks,
  phoneTelHref,
  telegramHref,
  whatsappHref,
} from "@/lib/brand-info";
import { localizeDigits } from "@/lib/format";

type Channel = {
  key: string;
  icon: LucideIcon;
  /** Omitted for plain text (opening hours). */
  href?: string;
  external?: boolean;
  content: React.ReactNode;
};

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const contact = await getTranslations("contact");
  const brand = await getBrandInfo(locale);

  const links = [
    { href: "/products" as const, label: nav("designs") },
    { href: "/brands" as const, label: nav("brands") },
    { href: "/blog" as const, label: nav("blog") },
    { href: "/about" as const, label: nav("about") },
  ];

  const address = [brand.addressLine1, brand.addressLine2, brand.addressLine3]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(locale === "fa" ? "، " : ", ");
  const tel = phoneTelHref(brand.phone);
  const whatsapp = whatsappHref(brand.whatsapp);
  const instagram = instagramHref(brand.instagram);
  const telegram = telegramHref(brand.telegram);
  const linkedin = linkedinHref(brand.linkedin);
  const map = mapLinks(brand);
  const email = brand.email.trim();
  const hours = brand.hours.trim();

  // Numbers are shown left-to-right with the locale's digits; hrefs keep the raw value.
  const number = (value: string) => <bdi dir="ltr">{localizeDigits(value.trim(), locale)}</bdi>;

  const channels: Channel[] = [];
  if (tel !== "tel:") {
    channels.push({ key: "phone", icon: Phone, href: tel, content: number(brand.phone) });
  }
  if (whatsapp) {
    channels.push({
      key: "whatsapp",
      icon: MessageCircle,
      href: whatsapp,
      external: true,
      content: contact("whatsapp"),
    });
  }
  if (email) {
    channels.push({
      key: "email",
      icon: Mail,
      href: `mailto:${email}`,
      content: <bdi dir="ltr">{email}</bdi>,
    });
  }
  if (instagram) {
    channels.push({
      key: "instagram",
      icon: Camera,
      href: instagram,
      external: true,
      content: contact("instagram"),
    });
  }
  if (telegram) {
    channels.push({
      key: "telegram",
      icon: Send,
      href: telegram,
      external: true,
      content: contact("telegram"),
    });
  }
  if (linkedin) {
    channels.push({
      key: "linkedin",
      icon: Briefcase,
      href: linkedin,
      external: true,
      content: contact("linkedin"),
    });
  }
  if (hours) {
    channels.push({
      key: "hours",
      icon: Clock,
      content: (
        <>
          <span className="sr-only">{contact("hours")}: </span>
          {localizeDigits(hours, locale)}
        </>
      ),
    });
  }

  const hasContact = address || map || channels.length > 0;

  return (
    <footer className="mt-auto border-t border-gray-200 bg-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 md:px-10">
        <div>
          {/* display:none drops the hidden variant from the a11y tree, so
              only one alt is ever exposed. */}
          <Image src={logo} alt={brand.name} className="h-20 w-auto dark:hidden" />
          <Image src={logoDark} alt={brand.name} className="hidden h-20 w-auto dark:block" />
          {brand.tagline && (
            <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-gray-600">
              {brand.tagline}
            </p>
          )}
        </div>
        <nav aria-label={t("explore")}>
          <h2 className="text-xs font-medium text-gray-600">{t("explore")}</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm font-medium text-gray-600">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="w-fit transition hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {hasContact && (
          <div className="text-sm font-light leading-relaxed text-gray-600">
            <h2 className="text-xs font-medium text-gray-600">{t("contact")}</h2>
            {(address || map) && (
              <div className="mt-4 flex gap-3">
                <MapPin className="mt-1 size-4 shrink-0 text-clay" strokeWidth={1.5} aria-hidden />
                <div>
                  {address && (
                    <address className="not-italic">{localizeDigits(address, locale)}</address>
                  )}
                  {map && (
                    <MapLink
                      links={map}
                      className="mt-1 inline-block text-ink underline decoration-gray-300 underline-offset-4 transition hover:text-clay hover:decoration-clay"
                    >
                      {contact("viewOnMap")}
                    </MapLink>
                  )}
                </div>
              </div>
            )}
            {channels.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2.5">
                {channels.map(({ key, icon: Icon, href, external, content }) => (
                  <li key={key} className="flex items-start gap-3">
                    <Icon className="mt-1 size-4 shrink-0 text-clay" strokeWidth={1.5} aria-hidden />
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-ink transition hover:text-clay"
                      >
                        {content}
                      </a>
                    ) : (
                      <span>{content}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="bg-cocoa">
        <p className="mx-auto max-w-7xl px-6 py-4 text-xs font-light text-white/70 md:px-10">
          © {localizeDigits(String(new Date().getFullYear()), locale)} {brand.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
