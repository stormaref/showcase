import type { Design, DesignType, TileSize } from "@/lib/api";

export const SIZE_PARAM = "size";
export const TYPE_PARAM = "type";

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

export function parseTypeParam(
  searchParams: URLSearchParams,
  validIds?: Set<string>,
): Set<string> {
  const raw = searchParams.get(TYPE_PARAM);
  if (!raw) return new Set();

  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  if (!validIds) return new Set(ids);

  return new Set(ids.filter((id) => validIds.has(id)));
}

export function buildFilterQuery(
  selectedSizes: Iterable<string>,
  selectedTypes: Iterable<string>,
): string {
  const parts: string[] = [];
  const sizeIds = [...selectedSizes];
  const typeIds = [...selectedTypes];
  if (sizeIds.length > 0) {
    parts.push(`${SIZE_PARAM}=${sizeIds.join(",")}`);
  }
  if (typeIds.length > 0) {
    parts.push(`${TYPE_PARAM}=${typeIds.join(",")}`);
  }
  return parts.join("&");
}

/** @deprecated Use buildFilterQuery */
export function buildSizeQuery(selectedIds: Iterable<string>): string {
  return buildFilterQuery(selectedIds, []);
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

export function collectTypesFromDesigns(items: Design[]): DesignType[] {
  const map = new Map<string, DesignType>();
  for (const item of items) {
    for (const type of item.types ?? []) {
      map.set(type.id, type);
    }
  }
  return [...map.values()].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
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

export function filterDesignsByType(
  items: Design[],
  selectedIds: Set<string>,
): Design[] {
  if (selectedIds.size === 0) return items;
  return items.filter((item) =>
    (item.types ?? []).some((type) => selectedIds.has(type.id)),
  );
}

export function filterDesigns(
  items: Design[],
  selectedSizes: Set<string>,
  selectedTypes: Set<string>,
): Design[] {
  let result = filterDesignsBySize(items, selectedSizes);
  result = filterDesignsByType(result, selectedTypes);
  return result;
}
