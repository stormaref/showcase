import {
  SORT_OPTIONS,
  isSortOption,
  type SortOption,
} from "@/lib/design-filter";

type DesignSortProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  labels: {
    sortBy: string;
    options: Record<SortOption, string>;
  };
};

/** Radio list for the desktop sidebar. */
export function DesignSort({ value, onChange, labels }: DesignSortProps) {
  return (
    <fieldset className="border border-gray-200 bg-shell px-5 pt-4 pb-3">
      <legend className="px-1 text-[13px] font-medium uppercase tracking-[0.18em] text-ink">
        {labels.sortBy}
      </legend>
      <ul className="mt-2">
        {SORT_OPTIONS.map((option) => (
          <li key={option}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 py-2 text-sm text-gray-700 hover:text-ink">
              <input
                type="radio"
                name="design-sort"
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="size-4 shrink-0 cursor-pointer border-gray-300 accent-clay"
              />
              {labels.options[option]}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/** Compact native select for the mobile toolbar. */
export function DesignSortSelect({ value, onChange, labels }: DesignSortProps) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
      <span className="sr-only sm:not-sr-only sm:shrink-0">{labels.sortBy}</span>
      <select
        value={value}
        onChange={(e) => {
          if (isSortOption(e.target.value)) onChange(e.target.value);
        }}
        className="min-h-10 min-w-0 cursor-pointer border border-gray-300 bg-shell px-3 text-sm text-ink"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {labels.options[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
