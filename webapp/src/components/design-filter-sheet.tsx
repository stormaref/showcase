"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type DesignFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  canClear: boolean;
  onClearAll: () => void;
  labels: {
    title: string;
    close: string;
    clearAll: string;
    showResults: string;
  };
  children: ReactNode;
};

/**
 * Bottom sheet holding the catalog filters below `lg`. Built on a modal
 * <dialog>, which gives us the inert background, focus containment, Escape
 * to close and focus return to the trigger for free.
 */
export function DesignFilterSheet({
  open,
  onClose,
  canClear,
  onClearAll,
  labels,
  children,
}: DesignFilterSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll behind the sheet.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  // The sheet's trigger disappears at `lg`, so don't leave it open there.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 64rem)");
    const handleChange = () => {
      if (query.matches) onClose();
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Clicks on the dialog element itself land on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
      className="inset-x-0 top-auto bottom-0 m-0 h-auto max-h-[85dvh] w-full max-w-none overflow-hidden bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 py-2 ps-6 pe-3">
          <h2 id={titleId} className="text-base font-medium">
            {labels.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="inline-flex size-11 cursor-pointer items-center justify-center text-gray-600 transition hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
          {children}
        </div>
        <div className="flex items-center gap-3 border-t border-gray-200 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!canClear}
            className="min-h-11 cursor-pointer px-2 text-sm text-gray-700 underline underline-offset-4 transition hover:text-clay disabled:cursor-default disabled:text-gray-400 disabled:no-underline"
          >
            {labels.clearAll}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 cursor-pointer bg-clay px-5 text-sm font-medium text-white transition hover:bg-clay-dark"
          >
            {labels.showResults}
          </button>
        </div>
      </div>
    </dialog>
  );
}
