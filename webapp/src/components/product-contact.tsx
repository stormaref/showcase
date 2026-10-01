import { getTranslations } from "next-intl/server";
import { Clock, Phone } from "lucide-react";
import { phoneTelHref, whatsappHref, type BrandInfo } from "@/lib/brand-info";
import { localizeDigits } from "@/lib/format";

export type ProductContactLinks = {
  telHref: string;
  whatsappHref: string;
  phone: string;
  hours: string;
};

/** Call and WhatsApp links for a product enquiry; null when neither is set. */
export function productContactLinks(
  brand: BrandInfo,
  whatsappMessage: string,
): ProductContactLinks | null {
  const tel = brand.phone.trim() ? phoneTelHref(brand.phone) : "";
  const telHref = tel === "tel:" ? "" : tel;
  const waHref = whatsappHref(brand.whatsapp, whatsappMessage);
  if (!telHref && !waHref) return null;
  return {
    telHref,
    whatsappHref: waHref,
    phone: brand.phone.trim(),
    hours: brand.hours.trim(),
  };
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const callClass =
  "inline-flex h-12 flex-1 items-center justify-center gap-2 bg-clay px-5 text-sm font-medium text-white transition hover:bg-clay-dark";
const whatsappClass =
  "inline-flex h-12 flex-1 items-center justify-center gap-2 border border-ink/20 bg-white px-5 text-sm font-medium text-ink transition hover:border-ink";

type ProductContactCardProps = {
  links: ProductContactLinks;
  locale: string;
};

export async function ProductContactCard({ links, locale }: ProductContactCardProps) {
  const t = await getTranslations("designDetail");
  return (
    <section
      aria-labelledby="product-enquiry"
      className="border border-gray-200 bg-cream p-6"
    >
      <h2 id="product-enquiry" className="text-lg font-medium text-ink">
        {t("enquiryTitle")}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
        {t("enquiryText")}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {links.telHref && (
          <a href={links.telHref} className={callClass}>
            <Phone className="size-4" aria-hidden />
            <span>{t("call")}</span>
            <bdi dir="ltr" className="font-normal opacity-90">
              {localizeDigits(links.phone, locale)}
            </bdi>
          </a>
        )}
        {links.whatsappHref && (
          <a
            href={links.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={whatsappClass}
          >
            <WhatsAppIcon className="size-4 text-[#1a9e4b]" />
            {t("whatsapp")}
          </a>
        )}
      </div>
      {links.hours && (
        <p className="mt-4 flex items-start gap-2 text-sm text-gray-600">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{links.hours}</span>
        </p>
      )}
    </section>
  );
}

type ProductContactBarProps = {
  links: ProductContactLinks;
};

/**
 * Phone-only bar pinned to the bottom of the viewport. It's sticky rather than
 * fixed, so it parks at the end of the product content instead of covering
 * the site footer, and takes up its own space (no padding needed).
 */
export async function ProductContactBar({ links }: ProductContactBarProps) {
  const t = await getTranslations("designDetail");
  return (
    <div className="sticky inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex gap-3 px-4 py-3">
        {links.telHref && (
          <a href={links.telHref} className={callClass}>
            <Phone className="size-4" aria-hidden />
            {t("call")}
          </a>
        )}
        {links.whatsappHref && (
          <a
            href={links.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={whatsappClass}
          >
            <WhatsAppIcon className="size-4 text-[#1a9e4b]" />
            {t("whatsapp")}
          </a>
        )}
      </div>
    </div>
  );
}
