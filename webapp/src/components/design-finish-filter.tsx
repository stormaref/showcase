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
    <fieldset className="rounded-2xl border border-gray-200 bg-shell p-5">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
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
                className="rounded border-gray-300 accent-clay"
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
          className="mt-4 cursor-pointer text-sm text-gray-500 transition hover:text-clay"
        >
          {labels.clearFilters}
        </button>
      )}
    </fieldset>
  );
}
