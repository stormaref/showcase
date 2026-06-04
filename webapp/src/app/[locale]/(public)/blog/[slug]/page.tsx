import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { apiFetch, type BlogPost } from "@/lib/api";
import { getBrandInfo } from "@/lib/brand-info";
import { localeAlternates, siteUrl } from "@/lib/locale";

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
    const path = `/blog/${slug}`;
    return {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      alternates: { languages: localeAlternates(path) },
      openGraph: {
        siteName: brand.name,
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt,
        images: post.image_url ? [post.image_url] : undefined,
        url: `${siteUrl()}/${locale}${path}`,
      },
    };
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
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <time className="text-sm text-gray-400">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </time>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-900">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-gray-500">{post.excerpt}</p>
        )}
      </header>
      <div className="mt-12">
        {post.content_html ? (
          <MarkdownContent html={post.content_html} />
        ) : (
          <p className="text-gray-500">{t("contentUnavailable")}</p>
        )}
      </div>
    </article>
  );
}
