import type { ReactNode } from "react";
import { X } from "lucide-react";

export type ActiveFilterChip = {
  key: string;
  label: ReactNode;
  /** Accessible name of the chip's remove button, e.g. "Remove filter: Matte". */
  removeLabel: string;
  onRemove: () => void;
};

type DesignActiveFiltersProps = {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
  labels: {
    resultCount: string;
    activeFilters: string;
    clearAll: string;
  };
};

/** Result count plus one removable chip per active filter. */
export function DesignActiveFilters({
  chips,
  onClearAll,
  labels,
}: DesignActiveFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 lg:mb-8">
      <p className="text-sm text-gray-600" role="status">
        {labels.resultCount}
      </p>
      {chips.length > 0 && (
        <>
          <ul aria-label={labels.activeFilters} className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={chip.removeLabel}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 border border-gray-300 bg-white ps-3 pe-2 text-sm text-gray-700 transition hover:border-clay hover:text-clay"
                >
                  {chip.label}
                  <X className="size-3.5 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-9 cursor-pointer text-sm text-gray-600 underline underline-offset-4 transition hover:text-clay"
          >
            {labels.clearAll}
          </button>
        </>
      )}
    </div>
  );
}
