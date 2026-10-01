import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ContactList, ContactPrimary, hasContactDetails } from "@/components/contact-details";
import { getBrandInfo, getSiteName } from "@/lib/brand-info";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/about",
    title: t("aboutTitle"),
    description: t("aboutDescription", { name: brand.name }),
    siteName: await getSiteName(),
  });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("about");
  const c = await getTranslations("contact");
  const brand = await getBrandInfo(locale);

  // Admin text keeps blank lines between paragraphs; render them as such.
  const paragraphs = brand.about
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const mapSrc = brand.mapEmbedUrl.trim();
  const hasContact = hasContactDetails(brand);

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <header className="max-w-3xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-5 text-4xl font-extralight tracking-tight text-ink md:text-6xl rtl:leading-[1.35]">
            {brand.name}
          </h1>
          {brand.tagline && (
            <p className="mt-5 text-lg leading-relaxed text-gray-600 md:text-xl">{brand.tagline}</p>
          )}
        </header>

        {paragraphs.length > 0 && (
          <div className="mt-14 max-w-prose space-y-6 md:mt-20">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0 && paragraphs.length > 1
                    ? "whitespace-pre-line text-xl font-light leading-loose text-ink md:text-2xl"
                    : "whitespace-pre-line text-lg font-light leading-loose text-gray-700 md:text-xl"
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Contact details beside the map; the map shows once the admin pastes
          a Google Maps embed in company info. */}
      {(hasContact || mapSrc) && (
        <section aria-labelledby="about-contact" className="border-t border-gray-200 bg-cream">
          <div
            className={`mx-auto grid max-w-7xl gap-14 px-6 py-20 md:px-10 md:py-28 ${
              mapSrc ? "lg:grid-cols-[2fr_3fr] lg:gap-16" : ""
            }`}
          >
            <div>
              <p className="eyebrow">{t("contactEyebrow")}</p>
              <h2
                id="about-contact"
                className="mt-5 text-3xl font-light tracking-tight text-ink md:text-4xl rtl:leading-[1.35]"
              >
                {c("heading")}
              </h2>
              <ContactPrimary brand={brand} locale={locale} />
              <ContactList
                brand={brand}
                locale={locale}
                columns={mapSrc ? 1 : 2}
                className="mt-10"
              />
            </div>
            {mapSrc && (
              <div className="relative overflow-hidden border border-gray-200 bg-gray-100 max-lg:aspect-[4/3] lg:min-h-[28rem]">
                <iframe
                  src={mapSrc}
                  title={t("mapTitle", { name: brand.name })}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 size-full border-0"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10 md:py-20">
          <h2 className="text-2xl font-light tracking-tight text-ink md:text-3xl rtl:leading-[1.35]">
            {t("ctaTitle")}
          </h2>
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 bg-clay px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-clay-dark"
          >
            {t("ctaButton")}
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </section>
    </>
  );
}
