import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ImageCarousel } from "@/components/image-carousel";
import type { Design } from "@/lib/api";
import {
  carouselSlides,
  imagesForSizeAndType,
  showcaseImages,
} from "@/lib/design-images";

type DesignDetailProps = {
  design: Design;
};

export async function DesignDetail({ design }: DesignDetailProps) {
  const t = await getTranslations("designDetail");
  const showcase = showcaseImages(design.images);
  const alt = design.alt_text || design.title;
  const showcaseSlides = carouselSlides(showcase, alt);
  const types = design.types ?? [];
  const finishes = design.finishes ?? [];
  // Explicit category x size combinations; older cached responses without a
  // variant list fall back to the full cartesian product.
  const variantSet = design.variants
    ? new Set(design.variants.map((v) => `${v.type_id}:${v.size_id}`))
    : null;
  const typeSections = types
    .map((type) => ({
      type,
      sizes: design.sizes.filter(
        (size) => !variantSet || variantSet.has(`${type.id}:${size.id}`),
      ),
    }))
    .filter((section) => section.sizes.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
      <Link
        href="/products"
        className="group inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500 transition hover:text-ink"
      >
        <ArrowLeft
          className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1"
          aria-hidden
        />
        {t("backToCatalog")}
      </Link>

      <header className="mt-12 max-w-3xl">
        {design.brand && (
          <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-gray-500">
            {design.brand.website_url ? (
              <a
                href={design.brand.website_url}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-ink"
              >
                {design.brand.name}
              </a>
            ) : (
              design.brand.name
            )}
          </p>
        )}
        <h1 className="mt-4 text-4xl font-extralight tracking-tight text-ink md:text-6xl">
          {design.title}
        </h1>
        {design.caption && (
          <p className="mt-5 text-lg font-light leading-relaxed text-gray-500">
            {design.caption}
          </p>
        )}
        {finishes.length > 0 && (
          <p className="mt-5 text-xs font-light text-gray-500">
            {finishes.map((finish) => finish.name).join(" · ")}
          </p>
        )}
      </header>

      <section className="mt-12">
        <h2 className="sr-only">{t("showcase")}</h2>
        {showcaseSlides.length > 0 ? (
          <div className="overflow-hidden bg-gray-100">
            <ImageCarousel
              images={showcaseSlides}
              labels={{
                previous: t("previousImage"),
                next: t("nextImage"),
                slide: t("slide"),
              }}
            />
          </div>
        ) : (
          <p className="border border-gray-200 bg-cream px-6 py-14 text-center text-sm font-light text-gray-500">
            {t("noShowcaseImages")}
          </p>
        )}
      </section>

      {typeSections.length > 0 && (
        <section className="mt-20 md:mt-28">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.25em] text-gray-500">
            {t("availableIn")}
          </h2>
          <div className="mt-10 space-y-20">
            {typeSections.map(({ type, sizes }) => (
              <div key={type.id}>
                <h3 className="border-t border-gray-200 pt-6 text-2xl font-light tracking-tight text-ink md:text-3xl">
                  {type.name}
                </h3>
                <div className="mt-10 space-y-14">
                  {sizes.map((size) => {
                    const sizeImgs = imagesForSizeAndType(
                      design.images,
                      size.id,
                      type.id,
                    );
                    const slides = carouselSlides(sizeImgs, alt);
                    return (
                      <article key={`${type.id}-${size.id}`}>
                        <header className="mb-5 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                          <h4 className="text-lg font-medium text-ink">{size.label}</h4>
                          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-gray-400">
                            {design.title}
                          </p>
                        </header>
                        {slides.length > 0 ? (
                          <div className="overflow-hidden bg-gray-100">
                            <ImageCarousel
                              images={slides}
                              labels={{
                                previous: t("previousImage"),
                                next: t("nextImage"),
                                slide: t("slide"),
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-sm font-light text-gray-500">
                            {t("noVariantImages")}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
