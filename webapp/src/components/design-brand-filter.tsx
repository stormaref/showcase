import {
  DesignFilterGroup,
  type FilterGroupVariant,
} from "@/components/design-filter-group";
import type { DesignBrandRef } from "@/lib/api";

type DesignBrandFilterProps = {
  brands: DesignBrandRef[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  variant?: FilterGroupVariant;
  labels: {
    filterByBrand: string;
    clearFilters: string;
  };
};

export function DesignBrandFilter({
  brands,
  selectedIds,
  onToggle,
  onClear,
  variant,
  labels,
}: DesignBrandFilterProps) {
  return (
    <DesignFilterGroup
      legend={labels.filterByBrand}
      options={brands.map((brand) => ({ id: brand.id, label: brand.name }))}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      clearLabel={labels.clearFilters}
      variant={variant}
    />
  );
}
