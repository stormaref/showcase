import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { DesignGrid } from "@/components/design-grid";
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

function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark" | "clay";
}) {
  const toneClass = {
    light: "text-clay",
    dark: "text-ochre",
    clay: "text-clay-soft",
  }[tone];
  const ruleClass = {
    light: "bg-clay",
    dark: "bg-ochre",
    clay: "bg-clay-soft",
  }[tone];
  return (
    <p
      className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] ${toneClass}`}
    >
      <span className={`h-px w-10 ${ruleClass}`} aria-hidden />
      {children}
    </p>
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
    { title: t("services.tilesTitle"), description: t("services.tilesDesc") },
    { title: t("services.potteryTitle"), description: t("services.potteryDesc") },
    { title: t("services.glazingTitle"), description: t("services.glazingDesc") },
    { title: t("services.restorationTitle"), description: t("services.restorationDesc") },
    { title: t("services.consultationTitle"), description: t("services.consultationDesc") },
    { title: t("services.workshopsTitle"), description: t("services.workshopsDesc") },
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
    designs = designData.items.slice(0, 6);
  } catch {
    /* API may be offline during dev */
  }

  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  return (
    <>
      {/* Hero — dark kiln band with terracotta glow and arch motifs */}
      <section className="texture-grain overflow-hidden bg-cocoa text-cream">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_75%_10%,rgba(176,66,28,0.4),transparent_60%)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 md:grid-cols-[1.1fr_0.9fr] md:py-32">
          <div>
            <Eyebrow tone="dark">{t("eyebrow")}</Eyebrow>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-cream md:text-7xl">
              {brand.name}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75 md:text-xl">
              {brand.tagline}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-clay px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-clay/30 transition duration-200 hover:-translate-y-0.5 hover:bg-clay-dark"
              >
                {t("viewDesigns")}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/blog"
                className="cursor-pointer rounded-full border border-cream/30 px-7 py-3.5 text-sm font-semibold text-cream transition duration-200 hover:border-clay-light hover:text-clay-light"
              >
                {t("readBlog")}
              </Link>
            </div>
          </div>
          {/* Kiln arches — decorative */}
          <div className="hidden items-end justify-center gap-4 md:flex" aria-hidden>
            <div className="h-44 w-24 rounded-t-full bg-gradient-to-b from-ochre to-clay opacity-90" />
            <div className="h-64 w-32 rounded-t-full bg-gradient-to-b from-clay to-clay-dark" />
            <div className="h-52 w-28 rounded-t-full border border-cream/25 bg-gradient-to-b from-cream/15 to-cream/5" />
          </div>
        </div>
      </section>

      {/* About — bone band, editorial pull-quote */}
      <section className="border-y border-gray-200 bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <Eyebrow>{t("aboutTitle")}</Eyebrow>
          <p className="mt-8 font-display text-2xl font-medium leading-snug text-gray-800 md:text-3xl">
            {brand.about}
          </p>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <span
                className="block h-1 w-12 rounded-full bg-gradient-to-r from-clay to-ochre"
                aria-hidden
              />
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-gray-900">
                {t("brandsTitle")}
              </h2>
              <p className="mt-3 text-lg text-gray-600">{t("brandsSubtitle")}</p>
            </div>
            <BrandGrid
              brands={brands}
              visitLabel={t("brandsVisit")}
              productsLabel={t("viewAll")}
              className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </section>
      )}

      {/* Services — dark kiln band with glazed number cards */}
      <section className="texture-grain overflow-hidden bg-cocoa py-20 text-cream md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_100%,rgba(176,66,28,0.25),transparent_60%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <span
              className="block h-1 w-12 rounded-full bg-gradient-to-r from-clay-light to-ochre"
              aria-hidden
            />
            <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-cream">
              {t("servicesTitle")}
            </h2>
            <p className="mt-3 text-lg text-cream/70">{t("servicesSubtitle")}</p>
          </div>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <li
                key={service.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition duration-200 hover:border-clay-light/40 hover:bg-white/[0.08]"
              >
                <span className="font-display text-3xl font-semibold text-ochre" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-cream">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">
                  {service.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {designs.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span
                  className="block h-1 w-12 rounded-full bg-gradient-to-r from-clay to-ochre"
                  aria-hidden
                />
                <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-gray-900">
                  {t("designsTitle")}
                </h2>
                <p className="mt-3 text-lg text-gray-600">{t("designsSubtitle")}</p>
              </div>
              <Link
                href="/products"
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-clay transition hover:text-clay-dark"
              >
                {t("viewAll")}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
            <DesignGrid
              items={designs}
              useThumb
              showCaption={false}
              compact
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </section>
      )}

      {/* Contact — full terracotta band */}
      <section className="texture-grain overflow-hidden bg-clay py-20 text-white md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_120%,rgba(34,22,17,0.35),transparent_70%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {t("contactTitle")}
          </h2>
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-5">
            <p>
              <a
                href={phoneTelHref(brand.phone)}
                className="font-display text-3xl font-semibold text-white transition hover:text-clay-soft md:text-4xl"
              >
                {brand.phone}
              </a>
            </p>
            <address className="not-italic leading-relaxed text-white/85">
              <span className="block">{brand.addressLine1}</span>
              <span className="block">{brand.addressLine2}</span>
              <span className="block">{brand.addressLine3}</span>
            </address>
            <p>
              <a
                href={`mailto:${brand.email}`}
                className="text-white/85 underline underline-offset-4 transition hover:text-white"
              >
                {brand.email}
              </a>
            </p>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="border-t border-gray-200 bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span
                  className="block h-1 w-12 rounded-full bg-gradient-to-r from-clay to-ochre"
                  aria-hidden
                />
                <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-gray-900">
                  {t("latestPosts")}
                </h2>
              </div>
              <Link
                href="/blog"
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-clay transition hover:text-clay-dark"
              >
                {t("viewAll")}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block h-full cursor-pointer rounded-2xl border border-gray-200 bg-shell p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-clay/50 hover:shadow-lg hover:shadow-clay/10"
                  >
                    {post.published_at && (
                      <time className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        {new Date(post.published_at).toLocaleDateString(dateLocale)}
                      </time>
                    )}
                    <h3 className="mt-3 font-display text-xl font-semibold text-gray-900 transition group-hover:text-clay">
                      {post.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
                      {post.excerpt}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
