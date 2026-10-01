import { getTranslations } from "next-intl/server";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CatalogBackLink } from "@/components/catalog-back-link";
import {
  DesignSizeWall,
  type SizeWallCategory,
  type SizeWallTile,
} from "@/components/design-size-wall";
import {
  ProductContactBar,
  productContactLinks,
} from "@/components/product-contact";
import type { Design, DesignImage } from "@/lib/api";
import type { BrandInfo } from "@/lib/brand-info";
import { imageSrc, legacyVariantImages, variantImage } from "@/lib/design-images";
import { formatSizeLabel } from "@/lib/format";
import { siteUrl } from "@/lib/locale";

type DesignDetailProps = {
  design: Design;
  brand: BrandInfo;
  locale: string;
};

function sizeWall(design: Design, locale: string) {
  // Explicit category x size combinations; older cached responses without a
  // variant list fall back to the full cartesian product.
  const variantSet = design.variants
    ? new Set(design.variants.map((v) => `${v.type_id}:${v.size_id}`))
    : null;
  const categories: SizeWallCategory[] = [];
  const tiles: SizeWallTile[] = [];
  for (const type of design.types ?? []) {
    const sizes = design.sizes.filter(
      (size) => !variantSet || variantSet.has(`${type.id}:${size.id}`),
    );
    if (sizes.length === 0) continue;
    const category: SizeWallCategory = { id: type.id, name: type.name, previewSrc: "" };
    categories.push(category);
    let firstDecor: DesignImage | undefined;
    let firstTile: DesignImage | undefined;
    for (const size of sizes) {
      const tile = variantImage(design.images, size.id, type.id, "tile");
      // Until an admin sorts older images into tile and decoration, show the
      // first of them as the decoration.
      const decor =
        variantImage(design.images, size.id, type.id, "decor") ??
        legacyVariantImages(design.images, size.id, type.id)[0];
      tiles.push({
        key: `${type.id}:${size.id}`,
        typeId: type.id,
        label: formatSizeLabel(size.label, locale),
        widthMm: size.width_mm,
        heightMm: size.height_mm,
        tileSrc: tile ? imageSrc(tile) : "",
        decorSrc: decor ? imageSrc(decor) : "",
      });
      firstDecor ??= decor;
      firstTile ??= tile;
    }
    // A category card previews the category in a room, else its tile.
    const preview = firstDecor ?? firstTile;
    category.previewSrc = preview ? imageSrc(preview, true) : "";
  }
  return { categories, tiles };
}

export async function DesignDetail({ design, brand, locale }: DesignDetailProps) {
  const t = await getTranslations("designDetail");
  const alt = design.alt_text || design.title;
  const types = design.types ?? [];
  const finishes = design.finishes ?? [];
  const firstType = types[0];
  const hasSpecs =
    Boolean(design.brand) || types.length > 0 || design.sizes.length > 0 || finishes.length > 0;
  const { categories, tiles } = sizeWall(design, locale);

  const productUrl = `${siteUrl()}/${locale}/products/${design.id}`;
  const contact = productContactLinks(
    brand,
    t("whatsappMessage", { title: design.title, url: productUrl }),
  );

  const intro = (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-light tracking-tight text-ink md:text-5xl rtl:leading-[1.35]">
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
    </div>
  );

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

        {/* The header, the category picker beside it, then the sizes drawn to
            scale, each with its own tile and room photo. */}
        <div className="mt-6">
          {tiles.length > 0 ? (
            <DesignSizeWall
              categories={categories}
              tiles={tiles}
              alt={alt}
              intro={intro}
              labels={{
                categoryHeading: t("chooseCategory"),
                categoryHint: t("chooseCategoryHint"),
                heading: t("availableIn"),
                hint: t("sizesHint"),
                noDecor: t("noDecorImage"),
              }}
            />
          ) : (
            <>
              {intro}
              <p className="mt-16 border border-gray-200 bg-cream px-6 py-14 text-center text-sm text-gray-600 md:mt-24">
                {t("noSizes")}
              </p>
            </>
          )}
        </div>
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
