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
  /** LinkedIn company page URL or slug. */
  linkedin: string;
  /** Map link (Neshan, Balad, Google Maps…). */
  mapUrl: string;
  /** Google Maps embed URL for the About page iframe. */
  mapEmbedUrl: string;
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
    linkedin: "",
    mapUrl: "",
    mapEmbedUrl: "",
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
    linkedin: row.linkedin ?? "",
    mapUrl: row.map_url ?? "",
    mapEmbedUrl: row.map_embed_url ?? "",
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

/** Accepts a full URL or a company slug ("aseman-roshan"). "" when empty. */
export function linkedinHref(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://www.linkedin.com/company/${v.replace(/^@/, "")}`;
}

export type MapCoordinates = { lat: number; lng: number };

function validCoordinates(lat: number, lng: number): MapCoordinates | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Pull coordinates out of a map URL: "q=" / "ll=" / "query=" pairs, "@lat,lng"
 * paths, or the "!3d<lat>!4d<lng>" (or "!2d<lng>!3d<lat>") parts of Google's
 * "Embed a map" links. Null when the URL holds none (e.g. a named place link).
 */
export function coordinatesFromUrl(value: string): MapCoordinates | null {
  let v = value.trim();
  if (!v) return null;
  try {
    v = decodeURIComponent(v);
  } catch {
    // Keep the raw string; coordinates are rarely percent-encoded anyway.
  }
  const num = String.raw`(-?\d{1,3}(?:\.\d+)?)`;
  const pair = new RegExp(String.raw`(?:[?&](?:q|ll|query|center)=|@)` + num + String.raw`\s*,\s*` + num);
  const m = v.match(pair);
  if (m) return validCoordinates(Number(m[1]), Number(m[2]));
  const lat = v.match(new RegExp(String.raw`!3d` + num));
  const lng = v.match(new RegExp(String.raw`!4d` + num)) ?? v.match(new RegExp(String.raw`!2d` + num));
  if (lat && lng) return validCoordinates(Number(lat[1]), Number(lng[1]));
  return null;
}

/** The company's map position, from whichever admin map field carries it. */
export function mapCoordinates(brand: BrandInfo): MapCoordinates | null {
  return coordinatesFromUrl(brand.mapEmbedUrl) ?? coordinatesFromUrl(brand.mapUrl);
}

/** Links for the "View on map" control; each device picks the one it handles. */
export type MapLinks = {
  /** Android: geo: URI, so the system offers the visitor's map apps. */
  geo: string;
  /** iPhone, iPad and Mac: Apple Maps, opened by the system Maps app. */
  apple: string;
  /** Everything else (Windows/Linux browsers): the admin's link, else Google Maps. */
  web: string;
};

export function mapLinks(brand: BrandInfo): MapLinks | null {
  const admin = brand.mapUrl.trim();
  const at = mapCoordinates(brand);
  if (!at) return admin ? { geo: admin, apple: admin, web: admin } : null;
  const ll = `${at.lat},${at.lng}`;
  const label = encodeURIComponent(brand.name);
  return {
    geo: `geo:${ll}?q=${ll}(${label})`,
    apple: `https://maps.apple.com/?ll=${ll}&q=${label}`,
    web: admin || `https://www.google.com/maps/search/?api=1&query=${ll}`,
  };
}
