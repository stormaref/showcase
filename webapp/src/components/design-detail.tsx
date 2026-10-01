import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CatalogBackLink } from "@/components/catalog-back-link";
import { ImageCarousel } from "@/components/image-carousel";
import {
  ProductContactBar,
  ProductContactCard,
  productContactLinks,
} from "@/components/product-contact";
import { ProductImageGrid } from "@/components/product-image-grid";
import type { Design } from "@/lib/api";
import type { BrandInfo } from "@/lib/brand-info";
import {
  carouselSlides,
  imagesForSizeAndType,
  showcaseImages,
} from "@/lib/design-images";
import { formatSizeLabel } from "@/lib/format";
import { siteUrl } from "@/lib/locale";

type DesignDetailProps = {
  design: Design;
  brand: BrandInfo;
  locale: string;
};

// Showcase column: ~1.1/2.1 of the 1200px content width on desktop.
const SHOWCASE_SIZES = "(min-width: 1280px) 640px, (min-width: 1024px) 52vw, 100vw";

export async function DesignDetail({ design, brand, locale }: DesignDetailProps) {
  const t = await getTranslations("designDetail");
  const alt = design.alt_text || design.title;
  const types = design.types ?? [];
  const finishes = design.finishes ?? [];
  const firstType = types[0];
  const hasSpecs =
    Boolean(design.brand) || types.length > 0 || design.sizes.length > 0 || finishes.length > 0;

  let showcase = carouselSlides(showcaseImages(design.images), alt);
  if (showcase.length === 0 && design.primary_image_url) {
    showcase = [{ src: design.primary_image_url, alt }];
  }

  // Explicit category x size combinations; older cached responses without a
  // variant list fall back to the full cartesian product. Sizes without
  // photos are left out here; they still show as chips in the spec list.
  const variantSet = design.variants
    ? new Set(design.variants.map((v) => `${v.type_id}:${v.size_id}`))
    : null;
  const galleries = types
    .map((type) => ({
      type,
      sizes: design.sizes
        .filter((size) => !variantSet || variantSet.has(`${type.id}:${size.id}`))
        .map((size) => {
          const label = formatSizeLabel(size.label, locale);
          return {
            size,
            label,
            slides: carouselSlides(
              imagesForSizeAndType(design.images, size.id, type.id),
              `${design.title} — ${type.name} ${label}`,
            ),
          };
        })
        .filter((entry) => entry.slides.length > 0),
    }))
    .filter((section) => section.sizes.length > 0);

  const productUrl = `${siteUrl()}/${locale}/products/${design.id}`;
  const contact = productContactLinks(
    brand,
    t("whatsappMessage", { title: design.title, url: productUrl }),
  );

  // The carousel sits inside the labelled showcase section, so it takes no name of its own.
  const carouselLabels = {
    previous: t("previousImage"),
    next: t("nextImage"),
    slide: t("slide"),
  };
  const gridLabels = {
    enlarge: t("enlargeImage"),
    close: t("closeImage"),
    previous: t("previousImage"),
    next: t("nextImage"),
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-6 md:px-10 md:pb-24 md:pt-10">
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
            <li>
              <CatalogBackLink className="group inline-flex items-center gap-1.5 py-2 transition hover:text-ink">
                <ArrowLeft
                  className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1"
                  aria-hidden
                />
                {t("products")}
              </CatalogBackLink>
            </li>
            {firstType && (
              <li className="flex items-center gap-2">
                <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
                <Link
                  href={`/products?type=${firstType.id}`}
                  className="py-2 transition hover:text-ink"
                >
                  {firstType.name}
                </Link>
              </li>
            )}
            <li className="hidden min-w-0 items-center gap-2 sm:flex">
              <ChevronRight className="size-3.5 shrink-0 rtl:rotate-180" aria-hidden />
              <span aria-current="page" className="truncate text-ink">
                {design.title}
              </span>
            </li>
          </ol>
        </nav>

        <div className="mt-6 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-12">
          <section aria-label={t("showcase")}>
            {showcase.length > 1 ? (
              <ImageCarousel
                images={showcase}
                slideClassName="aspect-square"
                imageClassName="object-contain"
                sizes={SHOWCASE_SIZES}
                className="bg-gray-100"
                labels={carouselLabels}
              />
            ) : showcase.length === 1 ? (
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={showcase[0].src}
                  alt={showcase[0].alt}
                  fill
                  sizes={SHOWCASE_SIZES}
                  loading="eager"
                  fetchPriority="high"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-cream px-6 text-center text-sm text-gray-600">
                {t("noShowcaseImages")}
              </div>
            )}
          </section>

          <div className="mt-8 lg:mt-0">
            <h1 className="text-3xl font-light tracking-tight text-ink md:text-5xl">
              {design.title}
            </h1>
            {design.caption && (
              <p className="mt-4 text-lg font-light leading-relaxed text-gray-600">
                {design.caption}
              </p>
            )}

            {hasSpecs && (
              <dl className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
                {design.brand && (
                  <SpecRow label={t("specBrand")}>
                    {design.brand.website_url ? (
                      <a
                        href={design.brand.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-gray-300 underline-offset-4 transition hover:decoration-ink"
                      >
                        {design.brand.name}
                      </a>
                    ) : (
                      design.brand.name
                    )}
                  </SpecRow>
                )}
                {types.length > 0 && (
                  <SpecRow label={t("specType")}>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {types.map((type) => (
                        <li key={type.id}>
                          <Link
                            href={`/products?type=${type.id}`}
                            className="underline decoration-gray-300 underline-offset-4 transition hover:decoration-ink"
                          >
                            {type.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </SpecRow>
                )}
                {design.sizes.length > 0 && (
                  <SpecRow label={t("specSizes")}>
                    <ul className="flex flex-wrap gap-2">
                      {design.sizes.map((size) => (
                        <li
                          key={size.id}
                          className="border border-gray-300 bg-white px-3 py-1 text-sm text-ink"
                        >
                          <bdi dir="ltr">{formatSizeLabel(size.label, locale)}</bdi>
                        </li>
                      ))}
                    </ul>
                  </SpecRow>
                )}
                {finishes.length > 0 && (
                  <SpecRow label={t("specFinishes")}>
                    <ul className="flex flex-wrap gap-2">
                      {finishes.map((finish) => (
                        <li
                          key={finish.id}
                          className="bg-clay-soft px-3 py-1 text-sm text-ink"
                        >
                          {finish.name}
                        </li>
                      ))}
                    </ul>
                  </SpecRow>
                )}
              </dl>
            )}

            {contact && (
              <div className="mt-8">
                <ProductContactCard links={contact} locale={locale} />
              </div>
            )}
          </div>
        </div>

        {galleries.length > 0 && (
          <section aria-labelledby="product-photos" className="mt-20 md:mt-28">
            <h2
              id="product-photos"
              className="text-2xl font-light tracking-tight text-ink md:text-3xl"
            >
              {t("photosBySize")}
            </h2>
            <div className="mt-8 space-y-14">
              {galleries.map(({ type, sizes }) => (
                <div key={type.id}>
                  <h3 className="border-t border-gray-200 pt-6 text-xl font-light text-ink md:text-2xl">
                    {type.name}
                  </h3>
                  <div className="mt-8 space-y-10">
                    {sizes.map(({ size, label, slides }) => (
                      <article key={`${type.id}-${size.id}`}>
                        <h4 className="mb-4 text-base font-medium text-ink">
                          {t("size")} <bdi dir="ltr">{label}</bdi>
                        </h4>
                        <ProductImageGrid
                          images={slides}
                          locale={locale}
                          labels={gridLabels}
                        />
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {contact && <ProductContactBar links={contact} />}
    </div>
  );
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="text-base text-ink">{children}</dd>
    </div>
  );
}
