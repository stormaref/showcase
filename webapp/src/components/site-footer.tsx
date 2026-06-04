import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("company");

  return (
    <footer className="mt-auto border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-gray-500">
        <p>
          {tc("addressLine1")}, {tc("addressLine3")} ·{" "}
          <a href="tel:+15551234567" className="hover:text-gray-900">
            {tc("phone")}
          </a>
        </p>
        <p className="mt-3">
          © {new Date().getFullYear()} {tc("name")}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
