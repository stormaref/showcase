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
      <span
        className="block h-1 w-12 rounded-full bg-gradient-to-r from-clay to-ochre"
        aria-hidden
      />
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">{t("subtitle")}</p>
      <ul className="mt-12 divide-y divide-gray-200">
        {posts.length === 0 && (
          <li className="py-8 text-gray-500">{t("empty")}</li>
        )}
        {posts.map((post) => (
          <li key={post.id} className="py-9">
            <Link href={`/blog/${post.slug}`} className="group block cursor-pointer">
              <time className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString(dateLocale)
                  : ""}
              </time>
              <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900 transition group-hover:text-clay">
                {post.title}
              </h2>
              <p className="mt-3 leading-relaxed text-gray-600">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
