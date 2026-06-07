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
    <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-900">
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
                  className="rounded border-gray-300"
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
            className="mt-4 text-sm text-gray-500 hover:text-gray-900"
          >
            {labels.clearFilters}
          </button>
        )}
      </fieldset>
  );
}
