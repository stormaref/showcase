import { getLocale, getTranslations } from "next-intl/server";
import { getBrandInfo, phoneTelHref } from "@/lib/brand-info";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const brand = await getBrandInfo(locale);

  return (
    <footer className="mt-auto border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-gray-500">
        <p>
          {brand.addressLine1}, {brand.addressLine3} ·{" "}
          <a href={phoneTelHref(brand.phone)} className="hover:text-gray-900">
            {brand.phone}
          </a>
        </p>
        <p className="mt-3">
          © {new Date().getFullYear()} {brand.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
