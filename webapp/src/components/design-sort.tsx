import { SORT_OPTIONS, type SortOption } from "@/lib/design-filter";

type DesignSortProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  labels: {
    sortBy: string;
    options: Record<SortOption, string>;
  };
};

export function DesignSort({ value, onChange, labels }: DesignSortProps) {
  return (
    <fieldset className="border border-gray-200 bg-white p-5">
      <legend className="px-1 text-[13px] font-medium uppercase tracking-[0.18em] text-ink">
        {labels.sortBy}
      </legend>
      <ul className="mt-3 space-y-2">
        {SORT_OPTIONS.map((option) => (
          <li key={option}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="design-sort"
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="border-gray-300 accent-clay"
              />
              {labels.options[option]}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
