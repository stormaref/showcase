import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { apiFetch, type BlogPost, type Paginated } from "@/lib/api";
import { getBrandInfo } from "@/lib/brand-info";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/blog",
    title: t("blogTitle"),
    description: t("blogDescription"),
    siteName: brand.name,
  });
}

export default async function BlogListPage() {
  const locale = await getLocale();
  const t = await getTranslations("blog");

  let posts: BlogPost[] = [];
  try {
    const data = await apiFetch<Paginated<BlogPost>>(
      "/api/v1/public/posts?limit=20",
      { locale, next: { revalidate: 60 } },
    );
    posts = data.items;
  } catch {
    /* empty */
  }

  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg text-gray-600">{t("subtitle")}</p>
      <ul className="mt-12 divide-y divide-gray-200">
        {posts.length === 0 && (
          <li className="py-8 text-gray-500">{t("empty")}</li>
        )}
        {posts.map((post) => (
          <li key={post.id} className="py-8">
            <Link href={`/blog/${post.slug}`} className="group block cursor-pointer">
              <time className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString(dateLocale)
                  : ""}
              </time>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 group-hover:text-clay">
                {post.title}
              </h2>
              <p className="mt-2 text-gray-600">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
