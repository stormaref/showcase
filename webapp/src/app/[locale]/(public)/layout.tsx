import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Padding lives on the inner span so it can't fight sr-only's reset. */}
      <a href="#main" className="sr-only focus:not-sr-only focus:block">
        <span className="block bg-ink px-6 py-3 text-sm text-white">{t("skipToContent")}</span>
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
