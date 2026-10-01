import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { apiFetch, type BlogPost, type Paginated } from "@/lib/api";
import { getBrandInfo, getSiteName } from "@/lib/brand-info";
import { formatDate } from "@/lib/format";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/blog",
    title: t("blogTitle"),
    description: t("blogDescription", { name: brand.name }),
    siteName: await getSiteName(),
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-24">
      <header>
        <h1 className="text-4xl font-extralight tracking-tight text-ink md:text-6xl rtl:leading-[1.35]">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-gray-500">
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
            <Link
              href={`/blog/${post.slug}`}
              className={`group grid cursor-pointer gap-6 py-10 ${post.og_image_url ? "sm:grid-cols-[1fr_12rem] sm:items-start sm:gap-10 md:grid-cols-[1fr_15rem]" : ""}`}
            >
              <div className="min-w-0">
                {post.published_at && (
                  <time dateTime={post.published_at} className="text-sm text-gray-500">
                    {formatDate(post.published_at, locale)}
                  </time>
                )}
                <h2 className="mt-3 text-2xl font-light tracking-tight text-ink transition group-hover:text-clay md:text-3xl rtl:leading-[1.45]">
                  {post.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-gray-500">
                  {post.excerpt}
                </p>
              </div>
              {post.og_image_url && (
                // Thumbnail sits beside the text from sm up, above it on phones.
                <div className="relative -order-1 aspect-[4/3] overflow-hidden bg-gray-100 sm:order-none">
                  <Image
                    src={post.og_image_url}
                    alt=""
                    fill
                    sizes="(min-width:768px) 15rem, (min-width:640px) 12rem, 100vw"
                    className="object-cover motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-105"
                  />
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
