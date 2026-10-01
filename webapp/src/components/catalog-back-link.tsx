"use client";

import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";

// The catalog stores its last query string ("?type=…&size=…") here so the
// way back from a product keeps the buyer's filters.
const LAST_QUERY_KEY = "catalog:lastQuery";

function readLastQuery(): string {
  try {
    const query = window.sessionStorage.getItem(LAST_QUERY_KEY) ?? "";
    return query.startsWith("?") && query.length > 1 ? query : "";
  } catch {
    return "";
  }
}

// sessionStorage doesn't change while this page is open; nothing to subscribe to.
function subscribe() {
  return () => {};
}

type CatalogBackLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function CatalogBackLink({ className, children }: CatalogBackLinkProps) {
  const query = useSyncExternalStore(subscribe, readLastQuery, () => "");
  return (
    <Link href={`/products${query}`} className={className}>
      {children}
    </Link>
  );
}
