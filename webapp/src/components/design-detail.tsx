import { getTranslations } from "next-intl/server";
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/products"
        className="text-sm font-medium text-gray-600 transition hover:text-clay"
      >
        ← {t("backToCatalog")}
      </Link>

      <section className="mt-8">
        <h2 className="sr-only">{t("showcase")}</h2>
        {showcaseSlides.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
          <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-sm text-gray-500">
            {t("noShowcaseImages")}
          </p>
        )}
      </section>

      <header className="mt-10 max-w-2xl">
        {design.brand && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">
            {design.brand.website_url ? (
              <a
                href={design.brand.website_url}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-clay-dark"
              >
                {design.brand.name}
              </a>
            ) : (
              design.brand.name
            )}
          </p>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          {design.title}
        </h1>
        {design.caption && (
          <p className="mt-4 text-lg text-gray-600">{design.caption}</p>
        )}
        {finishes.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {finishes.map((finish) => (
              <li
                key={finish.id}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600"
              >
                {finish.name}
              </li>
            ))}
          </ul>
        )}
      </header>

      {types.length > 0 && design.sizes.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-clay">
            {t("availableIn")}
          </h2>
          <div className="mt-10 space-y-16">
            {types.map((type) => (
              <div key={type.id}>
                <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                <div className="mt-8 space-y-12">
                  {design.sizes.map((size) => {
                    const sizeImgs = imagesForSizeAndType(
                      design.images,
                      size.id,
                      type.id,
                    );
                    const slides = carouselSlides(sizeImgs, alt);
                    return (
                      <article
                        key={`${type.id}-${size.id}`}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
                      >
                        <header className="mb-6">
                          <h4 className="text-xl font-semibold text-gray-900">
                            {size.label}
                          </h4>
                          <p className="mt-1 text-sm font-medium text-gray-600">
                            {design.title}
                          </p>
                          {design.caption && (
                            <p className="mt-2 text-sm text-gray-500">{design.caption}</p>
                          )}
                        </header>
                        {slides.length > 0 ? (
                          <div className="overflow-hidden rounded-lg">
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
                          <p className="text-sm text-gray-500">{t("noVariantImages")}</p>
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
