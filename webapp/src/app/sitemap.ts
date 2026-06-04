import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { apiFetch, type BlogPost, type Paginated } from "@/lib/api";
import { siteUrl } from "@/lib/locale";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/gallery", "/blog"];
  const staticRoutes: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      staticRoutes.push({
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

  const postRoutes: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    try {
      const data = await apiFetch<Paginated<BlogPost>>(
        `/api/v1/public/posts?limit=100&locale=${locale}`,
        { locale, next: { revalidate: 3600 } },
      );
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
    } catch {
      /* API offline */
    }
  }

  return [...staticRoutes, ...postRoutes];
}
