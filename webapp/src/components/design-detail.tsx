import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ImageCarousel } from "@/components/image-carousel";
import type { Design } from "@/lib/api";
import {
  carouselSlides,
  imagesBySizeId,
  showcaseImages,
} from "@/lib/design-images";

type DesignDetailProps = {
  design: Design;
};

export async function DesignDetail({ design }: DesignDetailProps) {
  const t = await getTranslations("designDetail");
  const showcase = showcaseImages(design.images);
  const bySize = imagesBySizeId(design.images);
  const alt = design.alt_text || design.title;
  const showcaseSlides = carouselSlides(showcase, alt);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/designs"
        className="text-sm text-gray-500 transition hover:text-gray-900"
      >
        ← {t("backToCatalog")}
      </Link>

      <section className="mt-8">
        <h2 className="sr-only">{t("showcase")}</h2>
        {showcaseSlides.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
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
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center text-sm text-gray-400">
            {t("noShowcaseImages")}
          </p>
        )}
      </section>

      <header className="mt-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {design.title}
        </h1>
        {design.caption && (
          <p className="mt-3 text-lg text-gray-500">{design.caption}</p>
        )}
        {/* Reserved for future design metadata (SKU, material, etc.) */}
        <dl className="mt-6 hidden" aria-hidden />
      </header>

      {design.sizes.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-16">
          <h2 className="text-sm font-medium uppercase tracking-widest text-gray-400">
            {t("availableIn")}
          </h2>
          <div className="mt-10 space-y-16">
            {design.sizes.map((size) => {
              const sizeImgs = bySize.get(size.id) ?? [];
              const slides = carouselSlides(sizeImgs, alt);
              return (
                <article
                  key={size.id}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
                >
                  <header className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {size.label}
                    </h3>
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
                    <p className="text-sm text-gray-400">{t("noSizeImages")}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
