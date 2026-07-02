import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { apiFetch, type BlogPost, type Design, type Paginated } from "@/lib/api";
import { siteUrl } from "@/lib/locale";

// Generated at request time so Docker builds don't depend on the API being reachable.
export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 10_000;

function staticRoutesFor(base: string): MetadataRoute.Sitemap {
  const staticPaths = ["", "/products", "/brands", "/blog"];
  const routes: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      routes.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: path === "/blog" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/blog" ? 0.9 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${base}/${l}${path}`]),
          ),
        },
      });
    }
  }

  return routes;
}

async function fetchWithTimeout<T>(
  path: string,
  locale: string,
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, {
      locale,
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticRoutes = staticRoutesFor(base);

  const [postsByLocale, designsByLocale] = await Promise.all([
    Promise.all(
      routing.locales.map((locale) =>
        fetchWithTimeout<Paginated<BlogPost>>(
          `/api/v1/public/posts?limit=100&locale=${locale}`,
          locale,
        ),
      ),
    ),
    Promise.all(
      routing.locales.map((locale) =>
        fetchWithTimeout<{ items: Design[] }>(
          "/api/v1/public/designs",
          locale,
        ),
      ),
    ),
  ]);

  const postRoutes: MetadataRoute.Sitemap = [];
  for (const [i, data] of postsByLocale.entries()) {
    if (!data) continue;
    const locale = routing.locales[i];
    for (const p of data.items) {
      postRoutes.push({
        url: `${base}/${locale}/blog/${p.slug}`,
        lastModified: p.published_at ? new Date(p.published_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${base}/${l}/blog/${p.slug}`]),
          ),
        },
      });
    }
  }

  const designRoutes: MetadataRoute.Sitemap = [];
  for (const [i, data] of designsByLocale.entries()) {
    if (!data) continue;
    const locale = routing.locales[i];
    for (const d of data.items) {
      designRoutes.push({
        url: `${base}/${locale}/products/${d.id}`,
        changeFrequency: "weekly",
        priority: 0.75,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${base}/${l}/products/${d.id}`]),
          ),
        },
      });
    }
  }

  return [...staticRoutes, ...postRoutes, ...designRoutes];
}
