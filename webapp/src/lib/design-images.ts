import type { DesignImage } from "@/lib/api";

function bySortOrder(a: DesignImage, b: DesignImage) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

export function imageSrc(img: DesignImage, preferThumb = false) {
  if (preferThumb) {
    return img.thumb_url || img.image_url || "";
  }
  return img.image_url || img.thumb_url || "";
}

export function showcaseImages(images: DesignImage[]) {
  return images
    .filter((img) => !img.size_id && !img.type_id)
    .sort(bySortOrder);
}

export function imagesBySizeAndType(
  images: DesignImage[],
  sizeId: string,
  typeId: string,
) {
  return images
    .filter((img) => img.size_id === sizeId && img.type_id === typeId)
    .sort(bySortOrder);
}

/** Legacy size-only images (no type_id) for fallback display. */
export function legacySizeImages(images: DesignImage[], sizeId: string) {
  return images
    .filter((img) => img.size_id === sizeId && !img.type_id)
    .sort(bySortOrder);
}

export function imagesForSizeAndType(
  images: DesignImage[],
  sizeId: string,
  typeId: string,
) {
  const combo = imagesBySizeAndType(images, sizeId, typeId);
  if (combo.length > 0) return combo;
  return legacySizeImages(images, sizeId);
}

export function imagesBySizeId(images: DesignImage[]) {
  const map = new Map<string, DesignImage[]>();
  for (const img of images) {
    if (!img.size_id) continue;
    const list = map.get(img.size_id) ?? [];
    list.push(img);
    map.set(img.size_id, list);
  }
  for (const list of map.values()) {
    list.sort(bySortOrder);
  }
  return map;
}

export function carouselSlides(
  images: DesignImage[],
  alt: string,
  preferThumb = false,
) {
  return images
    .map((img) => ({
      src: imageSrc(img, preferThumb),
      alt: alt || "",
    }))
    .filter((slide) => slide.src);
}
