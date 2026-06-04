const publicBase =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export function apiBaseUrl() {
  return publicBase.replace(/\/$/, "");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number }; locale?: string },
): Promise<T> {
  const { locale, next, ...rest } = init ?? {};
  let url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  if (locale) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}locale=${encodeURIComponent(locale)}`;
  }
  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(locale ? { "Accept-Language": locale } : {}),
      ...rest.headers,
    },
    next: next ?? { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export type PostTranslation = {
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md?: string;
  meta_title: string;
  meta_description: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md?: string;
  content_html?: string;
  status: string;
  locale?: string;
  meta_title: string;
  meta_description: string;
  og_image_key?: string;
  og_image_url?: string;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  translations?: Record<string, PostTranslation>;
  has_fa?: boolean;
};

export type DesignTranslation = {
  locale: string;
  title: string;
  caption: string;
  alt_text: string;
};

export type TileSize = {
  id: string;
  width_mm: number;
  height_mm: number;
  label: string;
  in_use?: boolean;
};

export type DesignImage = {
  id?: string;
  size_id?: string | null;
  object_key?: string;
  thumb_object_key?: string;
  image_url?: string;
  thumb_url?: string;
  sort_order: number;
};

export type Design = {
  id: string;
  title: string;
  caption: string;
  alt_text: string;
  locale?: string;
  sizes: TileSize[];
  images: DesignImage[];
  primary_image_url: string;
  primary_thumb_url: string;
  sort_order: number;
  is_published: boolean;
  image_count?: number;
  translations?: Record<string, DesignTranslation>;
  has_fa?: boolean;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type BrandInfoResponse = {
  locale: string;
  name: string;
  tagline: string;
  about: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  phone: string;
  email: string;
};

export type BrandInfoTranslations = Record<string, BrandInfoResponse>;

export function mediaUrl(key?: string) {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}
