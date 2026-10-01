import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getBrandInfo, phoneTelHref } from "@/lib/brand-info";
import { localizeDigits } from "@/lib/format";

// Localized 404 for every notFound() under the public layout: unknown paths
// (via [...rest]), unknown products and unknown blog posts. It renders inside
// the public chrome, so visitors keep the header and footer.
export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");
  const c = await getTranslations("contact");
  const brand = await getBrandInfo(locale);
  const phoneDisplay = localizeDigits(brand.phone, locale);

  return (
    <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
      <p className="eyebrow">{localizeDigits("404", locale)}</p>
      <h1 className="mt-5 text-4xl font-extralight tracking-tight text-ink md:text-5xl rtl:leading-[1.35]">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-gray-600">
        {t("text")}
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Link
          href="/products"
          className="cursor-pointer bg-clay px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-clay-dark"
        >
          {t("products")}
        </Link>
        <Link
          href="/"
          className="group inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-ink transition hover:text-clay"
        >
          {t("home")}
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
      {brand.phone && (
        <p className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-200 pt-8 text-base text-gray-600">
          {t("callPrompt")}
          <a
            href={phoneTelHref(brand.phone)}
            aria-label={c("callAria", { phone: phoneDisplay })}
            className="inline-flex items-center gap-2 text-ink transition hover:text-clay"
          >
            <Phone className="size-4" aria-hidden />
            <bdi dir="ltr">{phoneDisplay}</bdi>
          </a>
        </p>
      )}
    </div>
  );
}
