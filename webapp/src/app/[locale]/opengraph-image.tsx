import { getTranslations } from "next-intl/server";
import { getSiteName } from "@/lib/brand-info";
import {
  renderSocialImage,
  socialImageContentType,
  socialImageSize,
} from "@/lib/social-image";

export const alt = "Aseman Roshan Tejarat";
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return renderSocialImage({
    title: await getSiteName(),
    tagline: t("siteDescription"),
    locale,
  });
}
