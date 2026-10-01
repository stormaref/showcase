import type { DesignImage, DesignImageKind } from "@/lib/api";

function bySortOrder(a: DesignImage, b: DesignImage) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

export function imageSrc(img: DesignImage, preferThumb = false) {
  if (preferThumb) {
    return img.thumb_url || img.image_url || "";
  }
  return img.image_url || img.thumb_url || "";
}

/** The tile or decoration image of one category x size variant. */
export function variantImage(
  images: DesignImage[],
  sizeId: string,
  typeId: string,
  kind: Exclude<DesignImageKind, "">,
) {
  return images.find(
    (img) => img.size_id === sizeId && img.type_id === typeId && img.kind === kind,
  );
}

/**
 * Images uploaded before tile/decoration kinds existed for a variant, falling
 * back to size-only images that predate categories.
 */
export function legacyVariantImages(
  images: DesignImage[],
  sizeId: string,
  typeId: string,
) {
  const legacy = images.filter((img) => !img.kind);
  const combo = legacy.filter(
    (img) => img.size_id === sizeId && img.type_id === typeId,
  );
  if (combo.length > 0) return combo.sort(bySortOrder);
  return legacy
    .filter((img) => img.size_id === sizeId && !img.type_id)
    .sort(bySortOrder);
}
