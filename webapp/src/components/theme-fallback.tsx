"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

// ThemeScript only runs when the server sends it. Pages React renders on the
// client — the in-locale 404 arrives as Next's error shell — never execute
// it, so apply the same resolution here when <html> has no theme yet.
export function ThemeFallback() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.theme) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {}
      root.dataset.theme =
        stored === "light" || stored === "dark" ? stored : media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return null;
}
