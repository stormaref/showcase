"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

// The theme is owned by <html data-theme> (see lib/theme.tsx); this button
// only reads it and writes the stored choice.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

// `label` names the dark-mode switch; the button is pressed when dark is on.
export function ThemeToggle({ label, className = "" }: { label: string; className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  const dark = theme === "dark";

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still holds for this page view.
    }
  }

  // The icon is picked in CSS so it is right on first paint, before hydration.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center text-gray-600 transition hover:text-ink ${className}`}
    >
      <Moon className="size-4 dark:hidden" strokeWidth={1.5} aria-hidden />
      <Sun className="hidden size-4 dark:block" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
