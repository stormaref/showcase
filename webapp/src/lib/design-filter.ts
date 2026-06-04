import type { Design, TileSize } from "@/lib/api";

export const SIZE_PARAM = "size";

export function parseSizeParam(
  searchParams: URLSearchParams,
  validIds?: Set<string>,
): Set<string> {
  const raw = searchParams.get(SIZE_PARAM);
  if (!raw) return new Set();

  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  if (!validIds) return new Set(ids);

  return new Set(ids.filter((id) => validIds.has(id)));
}

export function buildSizeQuery(selectedIds: Iterable<string>): string {
  const ids = [...selectedIds];
  if (ids.length === 0) return "";
  return `${SIZE_PARAM}=${ids.join(",")}`;
}

export function collectSizesFromDesigns(items: Design[]): TileSize[] {
  const map = new Map<string, TileSize>();
  for (const item of items) {
    for (const size of item.sizes) {
      map.set(size.id, size);
    }
  }
  return [...map.values()].sort(
    (a, b) => a.width_mm - b.width_mm || a.height_mm - b.height_mm,
  );
}

export function filterDesignsBySize(
  items: Design[],
  selectedIds: Set<string>,
): Design[] {
  if (selectedIds.size === 0) return items;
  return items.filter((item) =>
    item.sizes.some((size) => selectedIds.has(size.id)),
  );
}
