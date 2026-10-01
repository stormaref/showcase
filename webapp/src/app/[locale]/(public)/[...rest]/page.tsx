import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string; rest: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("metaTitle") };
}

// Unknown paths under a locale land here, so they get the localized 404
// (../not-found.tsx) inside the site header and footer instead of Next's
// bare default page.
export default function CatchAllPage() {
  notFound();
}
