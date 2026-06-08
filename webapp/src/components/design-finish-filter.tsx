import type { SurfaceFinish } from "@/lib/api";

type DesignFinishFilterProps = {
  finishes: SurfaceFinish[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
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
  labels,
}: DesignFinishFilterProps) {
  if (finishes.length === 0) return null;

  return (
    <fieldset className="rounded-xl border border-gray-200 p-4">
      <legend className="px-1 text-sm font-medium text-gray-900">
        {labels.filterByFinish}
      </legend>
      <ul className="mt-3 space-y-2">
        {finishes.map((finish) => (
          <li key={finish.id}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedIds.has(finish.id)}
                onChange={() => onToggle(finish.id)}
                className="rounded border-gray-300"
              />
              {finish.name}
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
