import {
  DesignFilterGroup,
  type FilterGroupVariant,
} from "@/components/design-filter-group";
import type { DesignType } from "@/lib/api";

type DesignTypeFilterProps = {
  types: DesignType[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  variant?: FilterGroupVariant;
  labels: {
    filterByType: string;
    clearFilters: string;
  };
};

export function DesignTypeFilter({
  types,
  selectedIds,
  onToggle,
  onClear,
  variant,
  labels,
}: DesignTypeFilterProps) {
  return (
    <DesignFilterGroup
      legend={labels.filterByType}
      options={types.map((type) => ({ id: type.id, label: type.name }))}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      clearLabel={labels.clearFilters}
      variant={variant}
    />
  );
}
