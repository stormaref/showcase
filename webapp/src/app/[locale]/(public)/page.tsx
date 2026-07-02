import { getTranslations, setRequestLocale } from "next-intl/server";
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

  return (
    <>
      <section className="bg-gradient-to-b from-clay-soft/70 via-cream/40 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <p className="text-sm font-semibold uppercase tracking-widest text-clay">
            {t("eyebrow")}
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-bold tracking-tight text-gray-900 md:text-7xl">
            {brand.name}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-gray-600">
            {brand.tagline}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="cursor-pointer rounded-full bg-clay px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-clay/25 transition duration-200 hover:-translate-y-0.5 hover:bg-clay-dark hover:shadow-lg hover:shadow-clay/30"
            >
              {t("viewDesigns")}
            </Link>
            <Link
              href="/blog"
              className="cursor-pointer rounded-full border border-gray-300 bg-white/60 px-7 py-3.5 text-sm font-semibold text-gray-800 transition duration-200 hover:border-clay hover:text-clay"
            >
              {t("readBlog")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-sand py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            {t("aboutTitle")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            {brand.about}
          </p>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              {t("brandsTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
              {t("brandsSubtitle")}
            </p>
            <BrandGrid
              brands={brands}
              visitLabel={t("brandsVisit")}
              productsLabel={t("viewAll")}
              className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </section>
      )}

      <section className="border-y border-gray-200 bg-sand py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            {t("servicesTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
            {t("servicesSubtitle")}
          </p>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md"
              >
                <span
                  className="mb-4 block h-1 w-8 rounded-full bg-gradient-to-r from-clay to-clay-light"
                  aria-hidden
                />
                <h3 className="font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {service.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {designs.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {t("designsTitle")}
                </h2>
                <p className="mt-2 text-gray-600">{t("designsSubtitle")}</p>
              </div>
              <Link
                href="/products"
                className="shrink-0 text-sm font-medium text-clay transition hover:text-clay-dark"
              >
                {t("viewAll")} →
              </Link>
            </div>
            <DesignGrid
              items={designs}
              useThumb
              showCaption={false}
              compact
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </section>
      )}

      <section className="border-y border-gray-200 bg-sand py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            {t("contactTitle")}
          </h2>
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-6 text-center text-gray-600">
            <address className="not-italic leading-relaxed">
              <span className="block">{brand.addressLine1}</span>
              <span className="block">{brand.addressLine2}</span>
              <span className="block">{brand.addressLine3}</span>
            </address>
            <p>
              <a
                href={phoneTelHref(brand.phone)}
                className="text-lg font-semibold text-clay transition hover:text-clay-dark"
              >
                {brand.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${brand.email}`}
                className="text-gray-600 transition hover:text-clay hover:underline"
              >
                {brand.email}
              </a>
            </p>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {t("latestPosts")}
              </h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-clay transition hover:text-clay-dark"
              >
                {t("viewAll")} →
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block cursor-pointer">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-clay">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">
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
