import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { apiFetch, type BlogPost } from "@/lib/api";
import { getBrandInfo, getSiteName, phoneTelHref } from "@/lib/brand-info";
import { formatDate, localizeDigits } from "@/lib/format";
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
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt;
    return buildPageMetadata({
      locale,
      path: `/blog/${slug}`,
      title,
      description,
      siteName: await getSiteName(),
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
  const c = await getTranslations("contact");
  const brandPromise = getBrandInfo(locale);

  // Any API failure (unknown slug, unpublished post) renders the localized 404.
  let post: BlogPost;
  try {
    post = await apiFetch<BlogPost>(`/api/v1/public/posts/${slug}`, {
      locale,
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }
  const brand = await brandPromise;
  const phoneDisplay = localizeDigits(brand.phone, locale);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
      <header>
        {post.published_at && (
          <time dateTime={post.published_at} className="text-sm text-gray-500">
            {formatDate(post.published_at, locale)}
          </time>
        )}
        <h1 className="mt-4 text-4xl font-extralight leading-[1.1] tracking-tight text-ink md:text-5xl rtl:leading-[1.35]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-6 text-lg font-light leading-relaxed text-gray-500">
            {post.excerpt}
          </p>
        )}
      </header>
      {post.og_image_url && (
        <div className="relative mt-12 aspect-[16/9] overflow-hidden bg-gray-100">
          <Image
            src={post.og_image_url}
            alt=""
            fill
            loading="eager"
            sizes="(min-width:768px) 43rem, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div
        className={`text-[17px] md:text-lg ${post.og_image_url ? "mt-12" : "mt-12 border-t border-gray-200 pt-12"}`}
      >
        {post.content_html ? (
          <MarkdownContent html={post.content_html} />
        ) : (
          <p className="text-gray-500">{t("contentUnavailable")}</p>
        )}
      </div>

      {/* Next step: from reading to choosing tiles */}
      <aside className="mt-16 border-y border-gray-200 bg-cream px-6 py-10 md:px-10 md:py-12">
        <h2 className="text-2xl font-light tracking-tight text-ink md:text-3xl rtl:leading-[1.45]">
          {t("ctaTitle")}
        </h2>
        <p className="mt-3 max-w-xl text-base font-light leading-relaxed text-gray-600">
          {t("ctaText")}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/products"
            className="cursor-pointer bg-clay px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-clay-dark"
          >
            {t("ctaButton")}
          </Link>
          {brand.phone && (
            <a
              href={phoneTelHref(brand.phone)}
              aria-label={c("callAria", { phone: phoneDisplay })}
              className="inline-flex cursor-pointer items-center gap-2.5 text-[13px] font-medium tracking-[0.12em] text-ink transition hover:text-clay"
            >
              <Phone className="size-4" aria-hidden />
              <bdi dir="ltr">{phoneDisplay}</bdi>
            </a>
          )}
        </div>
      </aside>

      <p className="mt-12">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500 transition hover:text-ink"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1"
            aria-hidden
          />
          {t("backToBlog")}
        </Link>
      </p>
    </article>
  );
}
