import { apiFetch, type BrandInfoResponse } from "@/lib/api";

export type BrandInfo = {
  name: string;
  tagline: string;
  about: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  phone: string;
  email: string;
};

const fallbacks: Record<string, BrandInfo> = {
  en: {
    name: "Art Ceramic",
    tagline: "Ceramic tiles for every space",
    about:
      "Art Ceramic supplies ceramic tiles in a wide range of designs and sizes for kitchens, bathrooms, floors, and architectural surfaces. Every design is offered in multiple sizes — browse the catalog to find the right one for your project.",
    addressLine1: "42 Kiln Street",
    addressLine2: "Ceramics District",
    addressLine3: "Portland, OR 97201",
    phone: "+1 (555) 123-4567",
    email: "hello@artceramic.example",
  },
  fa: {
    name: "آرت سرامیک",
    tagline: "کاشی سرامیک برای هر فضا",
    about:
      "آرت سرامیک عرضه‌کننده کاشی سرامیک در طرح‌ها و سایزهای متنوع برای آشپزخانه، حمام، کف و سطوح معماری است. هر طرح در چند سایز عرضه می‌شود — کاتالوگ را مرور کنید تا گزینه مناسب پروژه خود را پیدا کنید.",
    addressLine1: "خیابان کوره ۴۲",
    addressLine2: "محله سرامیک",
    addressLine3: "پورتلند، OR 97201",
    phone: "+1 (555) 123-4567",
    email: "hello@artceramic.example",
  },
};

function mapResponse(row: BrandInfoResponse): BrandInfo {
  return {
    name: row.name,
    tagline: row.tagline,
    about: row.about,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    addressLine3: row.address_line_3,
    phone: row.phone,
    email: row.email,
  };
}

export async function getBrandInfo(locale: string): Promise<BrandInfo> {
  try {
    const row = await apiFetch<BrandInfoResponse>("/api/v1/public/brand-info", {
      locale,
      next: { revalidate: 60 },
    });
    return mapResponse(row);
  } catch {
    return fallbacks[locale] ?? fallbacks.en;
  }
}

export function phoneTelHref(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "tel:";
  const normalized = trimmed.replace(/[^\d+]/g, "");
  if (normalized.startsWith("+")) {
    return `tel:${normalized}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `tel:+${digits}` : "tel:";
}
