import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Fraunces, Work_Sans } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { sgkara } from "@/lib/fonts/sgkara";
import { metadataBase } from "@/lib/metadata";
import "../globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-worksans",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: metadataBase(),
    title: {
      default: t("siteTitle"),
      template: t("titleTemplate"),
    },
    description: t("siteDescription"),
    openGraph: {
      type: "website",
      siteName: t("siteTitle"),
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
  const fontClass = locale === "fa" ? sgkara.className : "font-sans";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`h-full antialiased ${sgkara.variable} ${fraunces.variable} ${workSans.variable}`}
    >
      <body className={`min-h-full flex flex-col ${fontClass}`}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
