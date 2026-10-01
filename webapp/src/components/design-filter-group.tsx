import type { ReactNode } from "react";

export type FilterGroupVariant = "card" | "plain";

export type FilterOption = {
  id: string;
  label: ReactNode;
};

type DesignFilterGroupProps = {
  legend: string;
  options: FilterOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  clearLabel: string;
  /** "card" is the bordered desktop sidebar box; "plain" sits in the mobile sheet. */
  variant?: FilterGroupVariant;
};

/** One checkbox group of the catalog filters. */
export function DesignFilterGroup({
  legend,
  options,
  selectedIds,
  onToggle,
  onClear,
  clearLabel,
  variant = "card",
}: DesignFilterGroupProps) {
  // A group with a single option can't narrow anything down.
  if (options.length < 2) return null;

  return (
    <fieldset
      className={
        variant === "card"
          ? "border border-gray-200 bg-white px-4 pt-3 pb-2"
          : "border-b border-gray-200 py-5 last:border-b-0"
      }
    >
      <legend
        className={
          variant === "card"
            ? "px-1 text-[13px] font-medium uppercase tracking-[0.18em] text-ink"
            : "text-[13px] font-medium uppercase tracking-[0.18em] text-ink"
        }
      >
        {legend}
      </legend>
      <ul className={variant === "card" ? "mt-0.5" : "mt-2"}>
        {options.map((option) => (
          <li key={option.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 text-sm text-gray-700 hover:text-ink ${
                variant === "card" ? "min-h-9 py-1.5" : "min-h-10 py-2"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(option.id)}
                onChange={() => onToggle(option.id)}
                className="size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-clay"
              />
              {option.label}
            </label>
          </li>
        ))}
      </ul>
      {selectedIds.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 min-h-10 cursor-pointer text-sm text-gray-600 transition hover:text-clay"
        >
          {clearLabel}
        </button>
      )}
    </fieldset>
  );
}
