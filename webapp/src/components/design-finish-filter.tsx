import {
  DesignFilterGroup,
  type FilterGroupVariant,
} from "@/components/design-filter-group";
import type { SurfaceFinish } from "@/lib/api";

type DesignFinishFilterProps = {
  finishes: SurfaceFinish[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  variant?: FilterGroupVariant;
  labels: {
    filterByFinish: string;
    clearFilters: string;
  };
};

export function DesignFinishFilter({
  finishes,
  selectedIds,
  onToggle,
  onClear,
  variant,
  labels,
}: DesignFinishFilterProps) {
  return (
    <DesignFilterGroup
      legend={labels.filterByFinish}
      options={finishes.map((finish) => ({ id: finish.id, label: finish.name }))}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      clearLabel={labels.clearFilters}
      variant={variant}
    />
  );
}
