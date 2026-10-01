import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { iranYekan } from "@/lib/fonts/iranyekan";
import { workSans } from "@/lib/fonts/worksans";
import { getSiteName } from "@/lib/brand-info";
import { metadataBase } from "@/lib/metadata";
import { ThemeFallback } from "@/components/theme-fallback";
import { ThemeScript, themeColor } from "@/lib/theme";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport = { themeColor };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const siteName = await getSiteName();
  return {
    metadataBase: metadataBase(),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: t("siteDescription"),
    openGraph: {
      type: "website",
      siteName,
      locale: locale === "fa" ? "fa_IR" : "en_US",
      alternateLocale: locale === "fa" ? ["en_US"] : ["fa_IR"],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "fa" ? "rtl" : "ltr";
  const fontClass = locale === "fa" ? iranYekan.className : "font-sans";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`h-full antialiased ${iranYekan.variable} ${workSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className={`min-h-full flex flex-col ${fontClass}`}>
        <ThemeFallback />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
