import type {
  Design,
  DesignBrandRef,
  DesignType,
  SurfaceFinish,
  TileSize,
} from "@/lib/api";

export const SIZE_PARAM = "size";
export const TYPE_PARAM = "type";
export const FINISH_PARAM = "finish";
export const BRAND_PARAM = "brand";
export const SORT_PARAM = "sort";

/** Catalog orderings. */
export const SORT_OPTIONS = [
  "newest",
  "oldest",
  "az",
  "za",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEFAULT_SORT: SortOption = "newest";

export function parseSortParam(searchParams: URLSearchParams): SortOption {
  const raw = searchParams.get(SORT_PARAM) ?? "";
  return (SORT_OPTIONS as readonly string[]).includes(raw)
    ? (raw as SortOption)
    : DEFAULT_SORT;
}

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

export function parseFinishParam(
  searchParams: URLSearchParams,
  validIds?: Set<string>,
): Set<string> {
  const raw = searchParams.get(FINISH_PARAM);
  if (!raw) return new Set();

  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  if (!validIds) return new Set(ids);

  return new Set(ids.filter((id) => validIds.has(id)));
}

export function parseBrandParam(
  searchParams: URLSearchParams,
  validIds?: Set<string>,
): Set<string> {
  const raw = searchParams.get(BRAND_PARAM);
  if (!raw) return new Set();

  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  if (!validIds) return new Set(ids);

  return new Set(ids.filter((id) => validIds.has(id)));
}

export function buildFilterQuery(
  selectedSizes: Iterable<string>,
  selectedTypes: Iterable<string>,
  selectedFinishes: Iterable<string> = [],
  selectedBrands: Iterable<string> = [],
  sort: SortOption = DEFAULT_SORT,
): string {
  const parts: string[] = [];
  const sizeIds = [...selectedSizes];
  const typeIds = [...selectedTypes];
  const finishIds = [...selectedFinishes];
  const brandIds = [...selectedBrands];
  if (sizeIds.length > 0) {
    parts.push(`${SIZE_PARAM}=${sizeIds.join(",")}`);
  }
  if (typeIds.length > 0) {
    parts.push(`${TYPE_PARAM}=${typeIds.join(",")}`);
  }
  if (finishIds.length > 0) {
    parts.push(`${FINISH_PARAM}=${finishIds.join(",")}`);
  }
  if (brandIds.length > 0) {
    parts.push(`${BRAND_PARAM}=${brandIds.join(",")}`);
  }
  if (sort !== DEFAULT_SORT) {
    parts.push(`${SORT_PARAM}=${sort}`);
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

export function collectFinishesFromDesigns(items: Design[]): SurfaceFinish[] {
  const map = new Map<string, SurfaceFinish>();
  for (const item of items) {
    for (const finish of item.finishes ?? []) {
      map.set(finish.id, finish);
    }
  }
  return [...map.values()].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
  );
}

export function collectBrandsFromDesigns(items: Design[]): DesignBrandRef[] {
  const map = new Map<string, DesignBrandRef>();
  for (const item of items) {
    if (item.brand) {
      map.set(item.brand.id, item.brand);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
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

export function filterDesignsByFinish(
  items: Design[],
  selectedIds: Set<string>,
): Design[] {
  if (selectedIds.size === 0) return items;
  return items.filter((item) =>
    (item.finishes ?? []).some((finish) => selectedIds.has(finish.id)),
  );
}

export function filterDesignsByBrand(
  items: Design[],
  selectedIds: Set<string>,
): Design[] {
  if (selectedIds.size === 0) return items;
  return items.filter((item) => item.brand && selectedIds.has(item.brand.id));
}

export function filterDesigns(
  items: Design[],
  selectedSizes: Set<string>,
  selectedTypes: Set<string>,
  selectedFinishes: Set<string> = new Set(),
  selectedBrands: Set<string> = new Set(),
): Design[] {
  let result = filterDesignsBySize(items, selectedSizes);
  result = filterDesignsByType(result, selectedTypes);
  result = filterDesignsByFinish(result, selectedFinishes);
  result = filterDesignsByBrand(result, selectedBrands);
  return result;
}

/** Milliseconds a design was added; 0 when the API omits created_at. */
function addedAt(item: Design): number {
  if (!item.created_at) return 0;
  const ms = Date.parse(item.created_at);
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Order a already-filtered list. Returns a new array. Titles collate in the
 * active locale so Persian sorts by the Persian alphabet.
 */
export function sortDesigns(
  items: Design[],
  sort: SortOption,
  locale?: string,
): Design[] {
  const sorted = [...items];
  if (sort === "newest" || sort === "oldest") {
    const direction = sort === "newest" ? -1 : 1;
    sorted.sort((a, b) => direction * (addedAt(a) - addedAt(b)));
    return sorted;
  }

  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const direction = sort === "az" ? 1 : -1;
  sorted.sort((a, b) => direction * collator.compare(a.title, b.title));
  return sorted;
}
