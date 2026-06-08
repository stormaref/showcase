"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DesignFinishFilter } from "@/components/design-finish-filter";
import { DesignGrid } from "@/components/design-grid";
import { DesignSizeFilter } from "@/components/design-size-filter";
import { DesignTypeFilter } from "@/components/design-type-filter";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Design } from "@/lib/api";
import {
  buildFilterQuery,
  collectFinishesFromDesigns,
  collectSizesFromDesigns,
  collectTypesFromDesigns,
  filterDesigns,
  parseFinishParam,
  parseSizeParam,
  parseTypeParam,
} from "@/lib/design-filter";

type DesignCatalogProps = {
  items: Design[];
};

export function DesignCatalog({ items }: DesignCatalogProps) {
  const t = useTranslations("designs");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const availableSizes = useMemo(() => collectSizesFromDesigns(items), [items]);
  const availableTypes = useMemo(() => collectTypesFromDesigns(items), [items]);
  const availableFinishes = useMemo(() => collectFinishesFromDesigns(items), [items]);
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

  const filteredItems = useMemo(
    () => filterDesigns(items, selectedSizeIds, selectedTypeIds, selectedFinishIds),
    [items, selectedSizeIds, selectedTypeIds, selectedFinishIds],
  );

  function updateFilters(sizes: Set<string>, types: Set<string>, finishes: Set<string>) {
    const query = buildFilterQuery(sizes, types, finishes);
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  }

  function toggleSize(id: string) {
    const next = new Set(selectedSizeIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateFilters(next, selectedTypeIds, selectedFinishIds);
  }

  function toggleType(id: string) {
    const next = new Set(selectedTypeIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateFilters(selectedSizeIds, next, selectedFinishIds);
  }

  function toggleFinish(id: string) {
    const next = new Set(selectedFinishIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateFilters(selectedSizeIds, selectedTypeIds, next);
  }

  function clearSizeFilters() {
    updateFilters(new Set(), selectedTypeIds, selectedFinishIds);
  }

  function clearTypeFilters() {
    updateFilters(selectedSizeIds, new Set(), selectedFinishIds);
  }

  function clearFinishFilters() {
    updateFilters(selectedSizeIds, selectedTypeIds, new Set());
  }

  const filterLabels = {
    clearFilters: t("clearFilters"),
  };

  return (
    <div className="mt-12 flex flex-col gap-8 lg:flex-row">
      <div className="flex flex-col gap-6 lg:w-56 lg:shrink-0">
        <DesignSizeFilter
          sizes={availableSizes}
          selectedIds={selectedSizeIds}
          onToggle={toggleSize}
          onClear={clearSizeFilters}
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
          labels={{
            filterByFinish: t("filterByFinish"),
            ...filterLabels,
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        {filteredItems.length === 0 ? (
          <p className="text-gray-400">{t("noMatches")}</p>
        ) : (
          <DesignGrid items={filteredItems} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />
        )}
      </div>
    </div>
  );
}
