import type { TileSize } from "@/lib/api";

type DesignSizeFilterProps = {
  sizes: TileSize[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
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
  labels,
}: DesignSizeFilterProps) {
  if (sizes.length === 0) return null;

  return (
    <fieldset className="rounded-2xl border border-gray-200 bg-shell p-5">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          {labels.filterBySize}
        </legend>
        <ul className="mt-3 space-y-2">
          {sizes.map((size) => (
            <li key={size.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedIds.has(size.id)}
                  onChange={() => onToggle(size.id)}
                  className="rounded border-gray-300 accent-clay"
                />
                {size.label}
              </label>
            </li>
          ))}
        </ul>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 cursor-pointer text-sm text-gray-500 transition hover:text-clay"
          >
            {labels.clearFilters}
          </button>
        )}
      </fieldset>
  );
}
