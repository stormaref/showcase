"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { NavLink, isActivePath, navItemActiveClass, navItemClass } from "@/components/nav-link";
import type { DesignType } from "@/lib/api";

type ProductsNavMenuProps = {
  label: string;
  allLabel: string;
  types: DesignType[];
};

// Disclosure pattern (button + list of links), not an ARIA menu: Tab moves
// through the links, Escape or tabbing out closes it.
export function ProductsNavMenu({ label, allLabel, types }: ProductsNavMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const active = isActivePath(usePathname(), "/products");

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (types.length === 0) {
    return <NavLink href="/products">{label}</NavLink>;
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        // A null relatedTarget means a click on something unfocusable (Safari
        // doesn't focus links on click); pointerdown above handles those.
        const next = e.relatedTarget as Node | null;
        if (next && !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        className={`flex cursor-pointer items-center gap-1 ${navItemClass} ${
          active ? navItemActiveClass : ""
        }`}
      >
        {label}
        <ChevronDown
          className={`size-4 transition duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      <ul
        id={listId}
        hidden={!open}
        className="absolute start-0 top-full z-50 mt-4 min-w-[12rem] border border-gray-200 bg-white py-2 shadow-sm"
      >
        <li>
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block px-5 py-2.5 text-sm font-normal text-ink transition hover:bg-gray-50 hover:text-clay"
          >
            {allLabel}
          </Link>
        </li>
        <li aria-hidden className="my-1.5 border-t border-gray-100" />
        {types.map((tp) => (
          <li key={tp.id}>
            <Link
              href={`/products?type=${tp.id}`}
              onClick={() => setOpen(false)}
              className="block px-5 py-2.5 text-sm font-light text-gray-600 transition hover:bg-gray-50 hover:text-clay"
            >
              {tp.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
