import type { MetadataRoute } from "next";
import { apiFetch, type BlogPost, type Paginated } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/gallery`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const data = await apiFetch<Paginated<BlogPost>>(
      "/api/v1/public/posts?limit=100",
      { next: { revalidate: 3600 } },
    );
    const posts = data.items.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...posts];
  } catch {
    return staticRoutes;
  }
}
