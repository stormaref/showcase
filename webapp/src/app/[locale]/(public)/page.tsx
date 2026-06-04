import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { DesignGrid } from "@/components/design-grid";
import { apiFetch, type BlogPost, type Design, type Paginated } from "@/lib/api";
import { getBrandInfo, phoneTelHref } from "@/lib/brand-info";
import { localeAlternates } from "@/lib/locale";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: { languages: localeAlternates("/") },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }
  const t = await getTranslations("home");
  const brand = await getBrandInfo(locale);

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
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          {brand.name}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
          {brand.tagline}
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/designs"
            className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {t("viewDesigns")}
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300"
          >
            {t("readBlog")}
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            {t("aboutTitle")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            {brand.about}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
          {t("servicesTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          {t("servicesSubtitle")}
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li
              key={service.title}
              className="rounded-lg border border-gray-100 bg-white p-6"
            >
              <h3 className="font-medium text-gray-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {designs.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{t("designsTitle")}</h2>
                <p className="mt-1 text-sm text-gray-500">{t("designsSubtitle")}</p>
              </div>
              <Link href="/designs" className="shrink-0 text-sm text-gray-500 hover:text-gray-900">
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

      <section className="border-t border-gray-100 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
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
                className="font-medium text-gray-900 hover:underline"
              >
                {brand.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${brand.email}`}
                className="text-gray-500 hover:text-gray-900 hover:underline"
              >
                {brand.email}
              </a>
            </p>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">{t("latestPosts")}</h2>
              <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">
                {t("viewAll")} →
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:underline">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-500">
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
