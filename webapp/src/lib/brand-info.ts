import { apiFetch, type BrandInfoResponse, type HeroTextTone } from "@/lib/api";

export type BrandInfo = {
  name: string;
  tagline: string;
  about: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  phone: string;
  email: string;
  /** Admin-managed home hero image; empty string falls back to the bundled default. */
  heroImageUrl: string;
  /** Colour of the type over the hero image: dark for light photos, light for dark ones. */
  heroTextTone: HeroTextTone;
  /** WhatsApp number in any common form (0912…, +98912…, ۰۹۱۲…). */
  whatsapp: string;
  /** Instagram handle or profile URL. */
  instagram: string;
  /** Telegram handle or t.me URL. */
  telegram: string;
  /** Map link (Neshan, Balad, Google Maps…). */
  mapUrl: string;
  /** Free-text opening hours, localised. */
  hours: string;
};

// Used only when the API is unreachable. Contact details stay empty so the
// site never shows made-up numbers or addresses; components hide empty blocks.
const fallbacks: Record<string, BrandInfo> = {
  en: emptyBrand("Aseman Roshan Tejarat"),
  fa: emptyBrand("آسمان روشن تجارت"),
};

function emptyBrand(name: string): BrandInfo {
  return {
    name,
    tagline: "",
    about: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    phone: "",
    email: "",
    heroImageUrl: "",
    heroTextTone: "dark",
    whatsapp: "",
    instagram: "",
    telegram: "",
    mapUrl: "",
    hours: "",
  };
}

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
    heroImageUrl: row.hero_image_url ?? "",
    heroTextTone: row.hero_text_tone === "light" ? "light" : "dark",
    whatsapp: row.whatsapp ?? "",
    instagram: row.instagram ?? "",
    telegram: row.telegram ?? "",
    mapUrl: row.map_url ?? "",
    hours: row.hours ?? "",
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

/** Site title: always the English company name from the admin company info, on every locale. */
export async function getSiteName(): Promise<string> {
  const brand = await getBrandInfo("en");
  return brand.name.trim() || fallbacks.en.name;
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Persian/Arabic-Indic digits → ASCII, so admin input in either script dials. */
export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = FA_DIGITS.indexOf(d);
    return String(fa >= 0 ? fa : AR_DIGITS.indexOf(d));
  });
}

/**
 * International E.164-style digits for an Iranian-market number, without "+".
 * "021 8821 7705" → "982188217705", "0098…" → "98…", "+98…" → "98…".
 * Returns "" when there are no digits.
 */
export function internationalDigits(phone: string): string {
  const raw = toLatinDigits(phone).trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `98${digits.slice(1)}`;
  return digits;
}

export function phoneTelHref(phone: string): string {
  const digits = internationalDigits(phone);
  return digits ? `tel:+${digits}` : "tel:";
}

/** wa.me link, optionally with a prefilled message. "" when there is no number. */
export function whatsappHref(number: string, text?: string): string {
  const digits = internationalDigits(number);
  if (!digits) return "";
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/** Accepts "@handle", "handle" or a full URL. "" when empty. */
export function instagramHref(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

/** Accepts "@handle", "handle" or a full t.me URL. "" when empty. */
export function telegramHref(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://t.me/${v.replace(/^@/, "")}`;
}
