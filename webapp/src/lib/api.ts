const publicBase =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export function apiBaseUrl() {
  return publicBase.replace(/\/$/, "");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    next: init?.next ?? { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md?: string;
  content_html?: string;
  status: string;
  meta_title: string;
  meta_description: string;
  og_image_key?: string;
  og_image_url?: string;
  image_url?: string;
  published_at?: string;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  caption: string;
  alt_text: string;
  object_key: string;
  image_url: string;
  thumb_url: string;
  sort_order: number;
  is_published: boolean;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function mediaUrl(key?: string) {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}
