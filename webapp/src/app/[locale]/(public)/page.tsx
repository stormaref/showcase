import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { BrandGrid } from "@/components/brand-grid";
import { apiFetch, type BlogPost, type Design, type Paginated } from "@/lib/api";
import { getBrandInfo, phoneTelHref } from "@/lib/brand-info";
import { getBrands } from "@/lib/brands";
import { buildPageMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/",
    title: t("homeTitle"),
    description: t("homeDescription"),
    siteName: brand.name,
  });
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
      <div className="max-w-xl">
        <h2 className="text-3xl font-light tracking-tight text-ink md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-sm font-light leading-relaxed text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function QuietLink({ href, children }: { href: "/products" | "/blog"; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 cursor-pointer items-center gap-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition hover:text-clay"
    >
      {children}
      <ArrowRight
        className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden
      />
    </Link>
  );
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }
  const t = await getTranslations("home");
  const brand = await getBrandInfo(locale);
  const brands = await getBrands(locale);

  const services = [
    { title: t("services.designsTitle"), description: t("services.designsDesc") },
    { title: t("services.sizesTitle"), description: t("services.sizesDesc") },
    { title: t("services.brandsTitle"), description: t("services.brandsDesc") },
    { title: t("services.applicationsTitle"), description: t("services.applicationsDesc") },
    { title: t("services.guidanceTitle"), description: t("services.guidanceDesc") },
    { title: t("services.supplyTitle"), description: t("services.supplyDesc") },
  ];

  let posts: BlogPost[] = [];
  let designs: Design[] = [];
  try {
    const postData = await apiFetch<Paginated<BlogPost>>(
      "/api/v1/public/posts?limit=3",
      { locale: locale as string, next: { revalidate: 60 } },
    );
    posts = postData.items;
    const designData = await apiFetch<{ items: Design[] }>(
      "/api/v1/public/designs",
      { locale: locale as string, next: { revalidate: 60 } },
    );
    designs = designData.items.slice(0, 4);
  } catch {
    /* API may be offline during dev */
  }

  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  return (
    <>
      {/* Hero — quiet type block */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-20 md:px-10 md:pb-24 md:pt-28">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-500">
          {t("eyebrow")}
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-extralight leading-[1.05] tracking-tight text-ink md:text-7xl">
          {brand.tagline}
        </h1>
        <div className="mt-12 flex flex-wrap items-center gap-8">
          <Link
            href="/products"
            className="cursor-pointer bg-ink px-9 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-clay"
          >
            {t("viewDesigns")}
          </Link>
          <QuietLink href="/blog">{t("readBlog")}</QuietLink>
        </div>
      </section>

      {/* Full-bleed collection mosaic */}
      {designs.length > 0 && (
        <section aria-label={t("designsTitle")}>
          <div className="grid grid-cols-2 gap-px bg-paper lg:grid-cols-4">
            {designs.map((design) => (
              <Link
                key={design.id}
                href={`/products/${design.id}`}
                className="group relative block cursor-pointer overflow-hidden bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design.primary_thumb_url || design.primary_image_url}
                  alt={design.alt_text || design.title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent p-5 pt-14">
                  {design.brand?.name && (
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
                      {design.brand.name}
                    </p>
                  )}
                  <p className="mt-1 text-lg font-light text-white">{design.title}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mx-auto flex max-w-7xl justify-end px-6 py-6 md:px-10">
            <QuietLink href="/products">{t("viewAll")}</QuietLink>
          </div>
        </section>
      )}

      {/* About — stone band */}
      <section className="border-y border-gray-200 bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-500">
            {t("aboutTitle")}
          </p>
          <p className="mt-8 text-2xl font-light leading-relaxed text-gray-800 md:text-[1.75rem]">
            {brand.about}
          </p>
        </div>
      </section>

      {/* Services — quiet hairline grid */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <SectionHeader title={t("servicesTitle")} subtitle={t("servicesSubtitle")} />
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.title} className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-medium text-ink">{service.title}</h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-gray-500">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Brands — stone band with logo grid */}
      {brands.length > 0 && (
        <section className="border-y border-gray-200 bg-cream">
          <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
            <SectionHeader title={t("brandsTitle")} subtitle={t("brandsSubtitle")} />
            <BrandGrid
              brands={brands}
              visitLabel={t("brandsVisit")}
              productsLabel={t("viewAll")}
              className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </section>
      )}

      {/* Journal */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
          <SectionHeader
            title={t("latestPosts")}
            action={<QuietLink href="/blog">{t("viewAll")}</QuietLink>}
          />
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="border-t border-gray-200 pt-6">
                <Link href={`/blog/${post.slug}`} className="group block cursor-pointer">
                  {post.published_at && (
                    <time className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
                      {new Date(post.published_at).toLocaleDateString(dateLocale)}
                    </time>
                  )}
                  <h3 className="mt-3 text-xl font-light text-ink transition group-hover:text-clay">
                    {post.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm font-light leading-relaxed text-gray-500">
                    {post.excerpt}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Contact — centered, calm */}
      <section className="border-t border-gray-200 bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-500">
            {t("contactTitle")}
          </p>
          <p className="mt-8">
            <a
              href={phoneTelHref(brand.phone)}
              className="text-3xl font-extralight tracking-tight text-ink transition hover:text-clay md:text-5xl"
              dir="ltr"
            >
              {brand.phone}
            </a>
          </p>
          <address className="mt-8 text-sm font-light leading-loose text-gray-500 not-italic">
            <span className="block">
              {brand.addressLine1}, {brand.addressLine2}
            </span>
            <span className="block">{brand.addressLine3}</span>
          </address>
          <p className="mt-6">
            <a
              href={`mailto:${brand.email}`}
              className="text-sm text-ink underline decoration-gray-300 underline-offset-8 transition hover:text-clay hover:decoration-clay"
            >
              {brand.email}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
