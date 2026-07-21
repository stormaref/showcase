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
    <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <header>
        <h1 className="text-4xl font-extralight tracking-tight text-ink md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-gray-500">
          {t("subtitle")}
        </p>
      </header>
      <ul className="mt-16">
        {posts.length === 0 && (
          <li className="border-t border-gray-200 py-10 font-light text-gray-500">
            {t("empty")}
          </li>
        )}
        {posts.map((post) => (
          <li key={post.id} className="border-t border-gray-200">
            <Link href={`/blog/${post.slug}`} className="group block cursor-pointer py-10">
              <time className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString(dateLocale)
                  : ""}
              </time>
              <h2 className="mt-3 text-2xl font-light tracking-tight text-ink transition group-hover:text-clay md:text-3xl">
                {post.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-gray-500">
                {post.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
