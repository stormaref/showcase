import type { DesignBrandRef } from "@/lib/api";

type DesignBrandFilterProps = {
  brands: DesignBrandRef[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  labels: {
    filterByBrand: string;
    clearFilters: string;
  };
};

export function DesignBrandFilter({
  brands,
  selectedIds,
  onToggle,
  onClear,
  labels,
}: DesignBrandFilterProps) {
  if (brands.length === 0) return null;

  return (
    <fieldset className="rounded-xl border border-gray-200 bg-white p-4">
      <legend className="px-1 text-sm font-medium text-gray-900">
        {labels.filterByBrand}
      </legend>
      <ul className="mt-3 space-y-2">
        {brands.map((brand) => (
          <li key={brand.id}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedIds.has(brand.id)}
                onChange={() => onToggle(brand.id)}
                className="rounded border-gray-300 accent-clay"
              />
              {brand.name}
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
