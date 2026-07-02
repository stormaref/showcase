import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignDetail } from "@/components/design-detail";
import { apiFetch, type Design } from "@/lib/api";
import { getBrandInfo } from "@/lib/brand-info";
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
    const brand = await getBrandInfo(locale);
    const description = design.caption || design.alt_text;
    return buildPageMetadata({
      locale,
      path: `/products/${id}`,
      title: design.title,
      description,
      siteName: brand.name,
      images: design.primary_image_url ? [design.primary_image_url] : undefined,
    });
  } catch {
    return { title: t("notFound") };
  }
}

export default async function DesignDetailPage({ params }: Props) {
  const { id, locale } = await params;

  let design: Design;
  try {
    design = await apiFetch<Design>(`/api/v1/public/designs/${id}`, {
      locale,
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }

  return <DesignDetail design={design} />;
}
