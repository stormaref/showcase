import { useLocale } from "next-intl";
import {
  DesignFilterGroup,
  type FilterGroupVariant,
} from "@/components/design-filter-group";
import type { TileSize } from "@/lib/api";
import { formatSizeLabel } from "@/lib/format";

type DesignSizeFilterProps = {
  sizes: TileSize[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  variant?: FilterGroupVariant;
  labels: {
    filterBySize: string;
    clearFilters: string;
  };
};

export function DesignSizeFilter({
  sizes,
  selectedIds,
  onToggle,
  onClear,
  variant,
  labels,
}: DesignSizeFilterProps) {
  const locale = useLocale();

  return (
    <DesignFilterGroup
      legend={labels.filterBySize}
      options={sizes.map((size) => ({
        id: size.id,
        label: <bdi dir="ltr">{formatSizeLabel(size.label, locale)}</bdi>,
      }))}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      clearLabel={labels.clearFilters}
      variant={variant}
    />
  );
}
