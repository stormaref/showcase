import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignDetail } from "@/components/design-detail";
import { apiFetch, type Design } from "@/lib/api";
import { getBrandInfo, getSiteName } from "@/lib/brand-info";
import { formatSizeLabel } from "@/lib/format";
import { buildPageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "designDetail" });
  try {
    const design = await apiFetch<Design>(`/api/v1/public/designs/${id}`, {
      locale,
      next: { revalidate: 60 },
    });
    const description =
      design.caption || design.alt_text || fallbackDescription(design, locale);
    return buildPageMetadata({
      locale,
      path: `/products/${id}`,
      title: design.title,
      description,
      siteName: await getSiteName(),
      images: design.primary_image_url ? [design.primary_image_url] : undefined,
    });
  } catch {
    return { title: t("notFound") };
  }
}

// "{title} — {types} {sizes}" when the admin left caption and alt text empty.
function fallbackDescription(design: Design, locale: string): string {
  const separator = locale === "fa" ? "، " : ", ";
  const types = (design.types ?? []).map((type) => type.name).join(separator);
  const sizes = design.sizes
    .map((size) => formatSizeLabel(size.label, locale))
    .join(separator);
  const details = [types, sizes].filter(Boolean).join(" ");
  return details ? `${design.title} — ${details}` : design.title;
}

export default async function DesignDetailPage({ params }: Props) {
  const { id, locale } = await params;

  const brandPromise = getBrandInfo(locale);
  let design: Design;
  try {
    design = await apiFetch<Design>(`/api/v1/public/designs/${id}`, {
      locale,
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }

  return <DesignDetail design={design} brand={await brandPromise} locale={locale} />;
}
