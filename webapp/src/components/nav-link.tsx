"use client";

import { Link, usePathname } from "@/i18n/navigation";

type NavHref = "/" | "/products" | "/brands" | "/blog" | "/about";

/** Shared look for the header's top-level items, so links and the Products button match. */
export const navItemClass = "transition hover:text-ink";
export const navItemActiveClass =
  "text-ink underline decoration-clay decoration-1 underline-offset-8";

/** A section is current on its own page and on everything beneath it ("/blog/…"). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ href, children }: { href: NavHref; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${navItemClass} ${active ? navItemActiveClass : ""}`}
    >
      {children}
    </Link>
  );
}
