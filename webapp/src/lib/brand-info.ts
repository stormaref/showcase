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
    tagline: "Custom tile designs for every space",
    about:
      "Art Ceramic is a tile design studio specializing in patterns, glazes, and formats for kitchens, bathrooms, and architectural surfaces. Each design is available in multiple sizes — browse the catalog to find the right look for your project.",
    addressLine1: "42 Kiln Street",
    addressLine2: "Pottery District",
    addressLine3: "Portland, OR 97201",
    phone: "+1 (555) 123-4567",
    email: "hello@artceramic.example",
  },
  fa: {
    name: "آرت سرامیک",
    tagline: "طرح‌های کاشی سفارشی برای هر فضا",
    about:
      "آرت سرامیک استودیوی طراحی کاشی است که در نقش‌ها، لعاب‌ها و ابعاد مختلف برای آشپزخانه، حمام و سطوح معماری تخصص دارد. هر طرح در چند سایز موجود است — کاتالوگ را مرور کنید تا طرح مناسب پروژه خود را پیدا کنید.",
    addressLine1: "خیابان کوره ۴۲",
    addressLine2: "محله سفالگری",
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
