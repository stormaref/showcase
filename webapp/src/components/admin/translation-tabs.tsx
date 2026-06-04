"use client";

type Tab = "en" | "fa";

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
  hasFa?: boolean;
};

export function TranslationTabs({ active, onChange, hasFa }: Props) {
  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-md px-3 py-1.5 font-medium transition ${
          active === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => onChange("fa")}
        className={`rounded-md px-3 py-1.5 font-medium transition ${
          active === "fa" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Persian {hasFa ? "" : "(optional)"}
      </button>
    </div>
  );
}
