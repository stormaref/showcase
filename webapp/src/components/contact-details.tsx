import { getTranslations } from "next-intl/server";
import {
  Camera,
  Clock,
  MapPin,
  MapPinned,
  MessageCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import {
  instagramHref,
  phoneTelHref,
  telegramHref,
  whatsappHref,
  type BrandInfo,
} from "@/lib/brand-info";
import { localizeDigits } from "@/lib/format";

/** "@handle" for display, whether the admin entered a handle or a profile URL. */
function handleLabel(value: string): string {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return v.startsWith("@") ? v : `@${v}`;
  try {
    const first = new URL(v).pathname.split("/").filter(Boolean)[0];
    return first ? `@${first}` : v;
  } catch {
    return v;
  }
}

function joinAddress(brand: BrandInfo, locale: string): string {
  return [brand.addressLine1, brand.addressLine2, brand.addressLine3]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(locale === "fa" ? "، " : ", ");
}

/** Whether the admin filled in anything a contact block could show. */
export function hasContactDetails(brand: BrandInfo): boolean {
  return [
    brand.phone,
    brand.email,
    brand.addressLine1,
    brand.addressLine2,
    brand.addressLine3,
    brand.whatsapp,
    brand.instagram,
    brand.telegram,
    brand.mapUrl,
    brand.hours,
  ].some((value) => value.trim());
}

/** The phone number large, with the email under it. */
export async function ContactPrimary({ brand, locale }: { brand: BrandInfo; locale: string }) {
  const c = await getTranslations("contact");
  const phoneDisplay = localizeDigits(brand.phone, locale);
  return (
    <>
      {brand.phone && (
        <p className="mt-8">
          <a
            href={phoneTelHref(brand.phone)}
            aria-label={c("callAria", { phone: phoneDisplay })}
            className="text-3xl font-extralight tracking-tight text-ink transition hover:text-clay md:text-4xl"
          >
            <bdi dir="ltr">{phoneDisplay}</bdi>
          </a>
        </p>
      )}
      {brand.email && (
        <p className="mt-5">
          <a
            href={`mailto:${brand.email}`}
            className="text-base text-ink underline decoration-gray-300 underline-offset-8 transition hover:text-clay hover:decoration-clay"
          >
            <bdi dir="ltr">{brand.email}</bdi>
          </a>
        </p>
      )}
    </>
  );
}

type ContactItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  href?: string;
  wide?: boolean;
};

type ContactListProps = {
  brand: BrandInfo;
  locale: string;
  /** Two columns where there's room (home); one beside the map (About). */
  columns?: 1 | 2;
  className?: string;
};

/** Address, messaging, social, map and hours rows; each shows only when set. */
export async function ContactList({ brand, locale, columns = 2, className }: ContactListProps) {
  const c = await getTranslations("contact");
  const items: ContactItem[] = [];
  const address = joinAddress(brand, locale);
  if (address) {
    items.push({
      key: "address",
      icon: MapPin,
      label: c("address"),
      value: <address className="not-italic">{localizeDigits(address, locale)}</address>,
      wide: true,
    });
  }
  const whatsapp = whatsappHref(brand.whatsapp);
  if (whatsapp) {
    items.push({
      key: "whatsapp",
      icon: MessageCircle,
      label: c("whatsapp"),
      value: <bdi dir="ltr">{localizeDigits(brand.whatsapp, locale)}</bdi>,
      href: whatsapp,
    });
  }
  const instagram = instagramHref(brand.instagram);
  if (instagram) {
    items.push({
      key: "instagram",
      icon: Camera,
      label: c("instagram"),
      value: <bdi dir="ltr">{handleLabel(brand.instagram)}</bdi>,
      href: instagram,
    });
  }
  const telegram = telegramHref(brand.telegram);
  if (telegram) {
    items.push({
      key: "telegram",
      icon: Send,
      label: c("telegram"),
      value: <bdi dir="ltr">{handleLabel(brand.telegram)}</bdi>,
      href: telegram,
    });
  }
  if (brand.mapUrl.trim()) {
    items.push({
      key: "map",
      icon: MapPinned,
      label: c("map"),
      value: c("viewOnMap"),
      href: brand.mapUrl.trim(),
    });
  }
  if (brand.hours.trim()) {
    items.push({
      key: "hours",
      icon: Clock,
      label: c("hours"),
      value: <span className="whitespace-pre-line">{localizeDigits(brand.hours.trim(), locale)}</span>,
    });
  }
  if (items.length === 0) return null;

  return (
    <ul
      className={`grid content-start gap-x-10 gap-y-8 ${columns === 2 ? "sm:grid-cols-2" : ""} ${className ?? ""}`}
    >
      {items.map((item) => (
        <li
          key={item.key}
          className={`flex gap-4 border-t border-gray-200 pt-6 ${item.wide && columns === 2 ? "sm:col-span-2" : ""}`}
        >
          <item.icon className="mt-0.5 size-5 shrink-0 text-clay" strokeWidth={1.5} aria-hidden />
          <div className="min-w-0">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500">
              {item.label}
            </p>
            <div className="mt-2 text-base leading-relaxed text-ink">
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words underline decoration-gray-300 underline-offset-4 transition hover:text-clay hover:decoration-clay"
                >
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
