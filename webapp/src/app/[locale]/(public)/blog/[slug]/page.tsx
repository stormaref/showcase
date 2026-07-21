import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { apiFetch, type BlogPost } from "@/lib/api";
import { getBrandInfo } from "@/lib/brand-info";
import { buildPageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  try {
    const post = await apiFetch<BlogPost>(`/api/v1/public/posts/${slug}`, {
      locale,
      next: { revalidate: 60 },
    });
    const brand = await getBrandInfo(locale);
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt;
    return buildPageMetadata({
      locale,
      path: `/blog/${slug}`,
      title,
      description,
      siteName: brand.name,
      images: post.og_image_url ? [post.og_image_url] : undefined,
      type: "article",
      publishedTime: post.published_at,
    });
  } catch {
    return { title: t("postNotFound") };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations("blog");
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  let post: BlogPost;
  try {
    post = await apiFetch<BlogPost>(`/api/v1/public/posts/${slug}`, {
      locale,
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header>
        <time className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </time>
        <h1 className="mt-4 text-4xl font-extralight leading-[1.1] tracking-tight text-ink md:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-6 text-lg font-light leading-relaxed text-gray-500">
            {post.excerpt}
          </p>
        )}
      </header>
      <div className="mt-12 border-t border-gray-200 pt-12">
        {post.content_html ? (
          <MarkdownContent html={post.content_html} />
        ) : (
          <p className="text-gray-500">{t("contentUnavailable")}</p>
        )}
      </div>
    </article>
  );
}
