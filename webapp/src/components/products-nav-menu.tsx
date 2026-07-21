"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { DesignType } from "@/lib/api";

type ProductsNavMenuProps = {
  label: string;
  allLabel: string;
  types: DesignType[];
};

export function ProductsNavMenu({ label, allLabel, types }: ProductsNavMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (types.length === 0) {
    return (
      <Link href="/products" className="transition hover:text-clay">
        {label}
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="flex cursor-pointer items-center gap-1 transition hover:text-clay"
      >
        {label}
        <ChevronDown
          className={`size-4 transition duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          className="absolute start-0 top-full z-50 mt-2 min-w-[11rem] rounded-xl border border-gray-200 bg-shell py-1.5 shadow-lg shadow-gray-900/10"
        >
          <li role="none">
            <Link
              role="menuitem"
              href="/products"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-sm font-medium normal-case tracking-normal text-gray-900 transition hover:bg-clay-soft/60 hover:text-clay-dark"
            >
              {allLabel}
            </Link>
          </li>
          <li role="none" className="my-1 border-t border-gray-100" />
          {types.map((tp) => (
            <li key={tp.id} role="none">
              <Link
                role="menuitem"
                href={`/products?type=${tp.id}`}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-2 text-sm normal-case tracking-normal text-gray-600 transition hover:bg-clay-soft/60 hover:text-clay-dark"
              >
                {tp.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
