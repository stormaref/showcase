import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DesignSizeWall,
  type SizeWallCategory,
  type SizeWallTile,
} from "@/components/design-size-wall";
import type { Design, DesignImage } from "@/lib/api";
import { imageSrc, legacyVariantImages, variantImage } from "@/lib/design-images";

type DesignDetailProps = {
  design: Design;
};

function sizeWall(design: Design) {
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
        label: size.label,
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

export async function DesignDetail({ design }: DesignDetailProps) {
  const t = await getTranslations("designDetail");
  const alt = design.alt_text || design.title;
  const finishes = design.finishes ?? [];
  const { categories, tiles } = sizeWall(design);

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

      <div className="mt-14 md:mt-20">
        {tiles.length > 0 ? (
          <DesignSizeWall
            categories={categories}
            tiles={tiles}
            alt={alt}
            labels={{
              categoryHeading: t("chooseCategory"),
              categoryHint: t("chooseCategoryHint"),
              heading: t("availableIn"),
              hint: t("sizesHint"),
              noDecor: t("noDecorImage"),
            }}
          />
        ) : (
          <p className="border border-gray-200 bg-cream px-6 py-14 text-center text-sm font-light text-gray-500">
            {t("noSizes")}
          </p>
        )}
      </div>
    </div>
  );
}
