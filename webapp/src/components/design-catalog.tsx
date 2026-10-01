"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import {
  DesignActiveFilters,
  type ActiveFilterChip,
} from "@/components/design-active-filters";
import { DesignBrandFilter } from "@/components/design-brand-filter";
import type { FilterGroupVariant } from "@/components/design-filter-group";
import { DesignFilterSheet } from "@/components/design-filter-sheet";
import { DesignFinishFilter } from "@/components/design-finish-filter";
import { DesignGrid } from "@/components/design-grid";
import { DesignSizeFilter } from "@/components/design-size-filter";
import { DesignSort, DesignSortSelect } from "@/components/design-sort";
import { DesignTypeFilter } from "@/components/design-type-filter";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Design } from "@/lib/api";
import {
  CATALOG_LAST_QUERY_KEY,
  buildFilterQuery,
  collectBrandsFromDesigns,
  collectFinishesFromDesigns,
  collectSizesFromDesigns,
  collectTypesFromDesigns,
  filterDesigns,
  parseBrandParam,
  parseFinishParam,
  parseSizeParam,
  parseSortParam,
  parseTypeParam,
  sortDesigns,
  type SortOption,
} from "@/lib/design-filter";
import { formatSizeLabel } from "@/lib/format";

type DesignCatalogProps = {
  items: Design[];
};

export function DesignCatalog({ items }: DesignCatalogProps) {
  const t = useTranslations("designs");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  // Remember the query so the product page's back link can return here
  // with the same filters and sort.
  const queryString = searchParams.toString();
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CATALOG_LAST_QUERY_KEY,
        queryString ? `?${queryString}` : "",
      );
    } catch {
      /* storage unavailable (private mode, blocked site data) */
    }
  }, [queryString]);

  const availableSizes = useMemo(() => collectSizesFromDesigns(items), [items]);
  const availableTypes = useMemo(() => collectTypesFromDesigns(items), [items]);
  const availableFinishes = useMemo(() => collectFinishesFromDesigns(items), [items]);
  const availableBrands = useMemo(() => collectBrandsFromDesigns(items), [items]);
  const validSizeIds = useMemo(
    () => new Set(availableSizes.map((s) => s.id)),
    [availableSizes],
  );
  const validTypeIds = useMemo(
    () => new Set(availableTypes.map((tp) => tp.id)),
    [availableTypes],
  );
  const validFinishIds = useMemo(
    () => new Set(availableFinishes.map((f) => f.id)),
    [availableFinishes],
  );
  const validBrandIds = useMemo(
    () => new Set(availableBrands.map((b) => b.id)),
    [availableBrands],
  );

  const selectedSizeIds = useMemo(
    () => parseSizeParam(searchParams, validSizeIds),
    [searchParams, validSizeIds],
  );
  const selectedTypeIds = useMemo(
    () => parseTypeParam(searchParams, validTypeIds),
    [searchParams, validTypeIds],
  );
  const selectedFinishIds = useMemo(
    () => parseFinishParam(searchParams, validFinishIds),
    [searchParams, validFinishIds],
  );
  const selectedBrandIds = useMemo(
    () => parseBrandParam(searchParams, validBrandIds),
    [searchParams, validBrandIds],
  );

  const selectedSort = useMemo(
    () => parseSortParam(searchParams),
    [searchParams],
  );

  const filteredItems = useMemo(
    () =>
      filterDesigns(
        items,
        selectedSizeIds,
        selectedTypeIds,
        selectedFinishIds,
        selectedBrandIds,
      ),
    [items, selectedSizeIds, selectedTypeIds, selectedFinishIds, selectedBrandIds],
  );

  const visibleItems = useMemo(
    () => sortDesigns(filteredItems, selectedSort, locale),
    [filteredItems, selectedSort, locale],
  );

  const activeFilterCount =
    selectedSizeIds.size +
    selectedTypeIds.size +
    selectedFinishIds.size +
    selectedBrandIds.size;

  // Groups with a single option are hidden, so only offer the filters
  // button when at least one group has a real choice.
  const hasFilterGroups = [
    availableBrands,
    availableSizes,
    availableTypes,
    availableFinishes,
  ].some((options) => options.length > 1);

  function updateFilters(
    sizes: Set<string>,
    types: Set<string>,
    finishes: Set<string>,
    brands: Set<string>,
    sort: SortOption = selectedSort,
  ) {
    const query = buildFilterQuery(sizes, types, finishes, brands, sort);
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  }

  function changeSort(sort: SortOption) {
    updateFilters(
      selectedSizeIds,
      selectedTypeIds,
      selectedFinishIds,
      selectedBrandIds,
      sort,
    );
  }

  function toggled(current: Set<string>, id: string): Set<string> {
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  }

  function toggleSize(id: string) {
    updateFilters(toggled(selectedSizeIds, id), selectedTypeIds, selectedFinishIds, selectedBrandIds);
  }

  function toggleType(id: string) {
    updateFilters(selectedSizeIds, toggled(selectedTypeIds, id), selectedFinishIds, selectedBrandIds);
  }

  function toggleFinish(id: string) {
    updateFilters(selectedSizeIds, selectedTypeIds, toggled(selectedFinishIds, id), selectedBrandIds);
  }

  function toggleBrand(id: string) {
    updateFilters(selectedSizeIds, selectedTypeIds, selectedFinishIds, toggled(selectedBrandIds, id));
  }

  function clearSizeFilters() {
    updateFilters(new Set(), selectedTypeIds, selectedFinishIds, selectedBrandIds);
  }

  function clearTypeFilters() {
    updateFilters(selectedSizeIds, new Set(), selectedFinishIds, selectedBrandIds);
  }

  function clearFinishFilters() {
    updateFilters(selectedSizeIds, selectedTypeIds, new Set(), selectedBrandIds);
  }

  function clearBrandFilters() {
    updateFilters(selectedSizeIds, selectedTypeIds, selectedFinishIds, new Set());
  }

  /** Drops every filter but keeps the chosen sort. */
  function clearAllFilters() {
    updateFilters(new Set(), new Set(), new Set(), new Set());
  }

  const chip = (
    key: string,
    label: ReactNode,
    text: string,
    onRemove: () => void,
  ): ActiveFilterChip => ({
    key,
    label,
    removeLabel: t("removeFilter", { label: text }),
    onRemove,
  });

  const chips: ActiveFilterChip[] = [
    ...availableBrands
      .filter((b) => selectedBrandIds.has(b.id))
      .map((b) => chip(`brand:${b.id}`, b.name, b.name, () => toggleBrand(b.id))),
    ...availableSizes
      .filter((s) => selectedSizeIds.has(s.id))
      .map((s) => {
        const label = formatSizeLabel(s.label, locale);
        return chip(
          `size:${s.id}`,
          <bdi dir="ltr">{label}</bdi>,
          label,
          () => toggleSize(s.id),
        );
      }),
    ...availableTypes
      .filter((tp) => selectedTypeIds.has(tp.id))
      .map((tp) => chip(`type:${tp.id}`, tp.name, tp.name, () => toggleType(tp.id))),
    ...availableFinishes
      .filter((f) => selectedFinishIds.has(f.id))
      .map((f) => chip(`finish:${f.id}`, f.name, f.name, () => toggleFinish(f.id))),
  ];

  const filterLabels = {
    clearFilters: t("clearFilters"),
  };

  const sortLabels = {
    sortBy: t("sortBy"),
    options: {
      newest: t("sortNewest"),
      oldest: t("sortOldest"),
      az: t("sortAZ"),
      za: t("sortZA"),
    },
  };

  // Rendered twice: boxed in the desktop sidebar and plain in the mobile sheet.
  const filterGroups = (variant: FilterGroupVariant) => (
    <>
      <DesignBrandFilter
        brands={availableBrands}
        selectedIds={selectedBrandIds}
        onToggle={toggleBrand}
        onClear={clearBrandFilters}
        variant={variant}
        labels={{
          filterByBrand: t("filterByBrand"),
          ...filterLabels,
        }}
      />
      <DesignSizeFilter
        sizes={availableSizes}
        selectedIds={selectedSizeIds}
        onToggle={toggleSize}
        onClear={clearSizeFilters}
        variant={variant}
        labels={{
          filterBySize: t("filterBySize"),
          ...filterLabels,
        }}
      />
      <DesignTypeFilter
        types={availableTypes}
        selectedIds={selectedTypeIds}
        onToggle={toggleType}
        onClear={clearTypeFilters}
        variant={variant}
        labels={{
          filterByType: t("filterByType"),
          ...filterLabels,
        }}
      />
      <DesignFinishFilter
        finishes={availableFinishes}
        selectedIds={selectedFinishIds}
        onToggle={toggleFinish}
        onClear={clearFinishFilters}
        variant={variant}
        labels={{
          filterByFinish: t("filterByFinish"),
          ...filterLabels,
        }}
      />
    </>
  );

  return (
    <div className="mt-6 lg:mt-8">
      {/* Mobile toolbar: filters sheet trigger + compact sort. */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-6 border-b border-gray-200 bg-paper/95 px-6 backdrop-blur md:-mx-10 md:px-10 lg:hidden">
        <div className="flex items-center justify-between gap-3 py-2">
          {hasFilterGroups ? (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 border border-gray-300 bg-shell px-4 text-sm font-medium text-ink transition hover:border-clay"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              {t("filtersButton", { count: activeFilterCount })}
            </button>
          ) : (
            <span />
          )}
          <DesignSortSelect
            value={selectedSort}
            onChange={changeSort}
            labels={sortLabels}
          />
        </div>
      </div>
      {hasFilterGroups && (
        <DesignFilterSheet
          open={filtersOpen}
          onClose={closeFilters}
          canClear={activeFilterCount > 0}
          onClearAll={clearAllFilters}
          labels={{
            title: t("filtersTitle"),
            close: t("closeFilters"),
            clearAll: t("clearAll"),
            showResults: t("showResults", { count: visibleItems.length }),
          }}
        >
          {filterGroups("plain")}
        </DesignFilterSheet>
      )}

      <div className="mt-6 flex gap-8 lg:mt-0">
        <aside
          aria-label={t("filtersTitle")}
          className="hidden lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:flex lg:max-h-[calc(100svh-var(--header-h)-3rem)] lg:w-56 lg:shrink-0 lg:flex-col lg:gap-4 lg:self-start lg:overflow-y-auto"
        >
          <DesignSort
            value={selectedSort}
            onChange={changeSort}
            labels={sortLabels}
          />
          {filterGroups("card")}
        </aside>
        <div className="min-w-0 flex-1">
          <DesignActiveFilters
            chips={chips}
            onClearAll={clearAllFilters}
            labels={{
              resultCount: t("resultCount", { count: visibleItems.length }),
              activeFilters: t("activeFilters"),
              clearAll: t("clearAll"),
            }}
          />
          {visibleItems.length === 0 ? (
            <div className="border border-dashed border-gray-300 px-6 py-16 text-center">
              <p className="text-gray-600">{t("noMatches")}</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-6 inline-flex min-h-11 cursor-pointer items-center bg-clay px-6 text-sm font-medium text-paper transition hover:bg-clay-dark"
                >
                  {t("clearAllFilters")}
                </button>
              )}
            </div>
          ) : (
            <DesignGrid
              items={visibleItems}
              className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4"
            />
          )}
        </div>
      </div>
    </div>
  );
}
