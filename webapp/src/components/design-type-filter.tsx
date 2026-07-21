import type { DesignType } from "@/lib/api";

type DesignTypeFilterProps = {
  types: DesignType[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
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
  labels,
}: DesignTypeFilterProps) {
  if (types.length === 0) return null;

  return (
    <fieldset className="border border-gray-200 bg-white p-5">
        <legend className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">
          {labels.filterByType}
        </legend>
        <ul className="mt-3 space-y-2">
          {types.map((type) => (
            <li key={type.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedIds.has(type.id)}
                  onChange={() => onToggle(type.id)}
                  className="rounded border-gray-300 accent-clay"
                />
                {type.name}
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
