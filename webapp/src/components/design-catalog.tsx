"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DesignGrid } from "@/components/design-grid";
import { DesignSizeFilter } from "@/components/design-size-filter";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Design } from "@/lib/api";
import {
  buildSizeQuery,
  collectSizesFromDesigns,
  filterDesignsBySize,
  parseSizeParam,
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
  const validIds = useMemo(
    () => new Set(availableSizes.map((s) => s.id)),
    [availableSizes],
  );

  const selectedIds = useMemo(
    () => parseSizeParam(searchParams, validIds),
    [searchParams, validIds],
  );

  const filteredItems = useMemo(
    () => filterDesignsBySize(items, selectedIds),
    [items, selectedIds],
  );

  function updateSelection(next: Set<string>) {
    const query = buildSizeQuery(next);
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  }

  function toggleSize(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelection(next);
  }

  function clearFilters() {
    updateSelection(new Set());
  }

  return (
    <div className="mt-12 flex flex-col gap-8 lg:flex-row">
      <DesignSizeFilter
        sizes={availableSizes}
        selectedIds={selectedIds}
        onToggle={toggleSize}
        onClear={clearFilters}
        labels={{
          filterBySize: t("filterBySize"),
          clearFilters: t("clearFilters"),
        }}
      />
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
