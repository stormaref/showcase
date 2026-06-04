import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { apiFetch, type BlogPost, type Paginated } from "@/lib/api";
import { localeAlternates } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: { languages: localeAlternates("/blog") },
  };
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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t("title")}</h1>
      <p className="mt-2 text-gray-500">{t("subtitle")}</p>
      <ul className="mt-12 divide-y divide-gray-100">
        {posts.length === 0 && (
          <li className="py-8 text-gray-400">{t("empty")}</li>
        )}
        {posts.map((post) => (
          <li key={post.id} className="py-8">
            <Link href={`/blog/${post.slug}`} className="group block">
              <time className="text-xs text-gray-400">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString(dateLocale)
                  : ""}
              </time>
              <h2 className="mt-1 text-xl font-medium text-gray-900 group-hover:underline">
                {post.title}
              </h2>
              <p className="mt-2 text-gray-500">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
