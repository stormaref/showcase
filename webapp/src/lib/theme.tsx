// Light/dark theme. The resolved theme lives on <html data-theme>, which the
// palette in globals.css and the `dark:` variant key off. An explicit choice
// is stored in localStorage; without one the OS setting decides, live.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

// Runs in <head> before first paint so a dark page never flashes light.
const script = `(function(){try{var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function a(){var t=localStorage.getItem("${THEME_STORAGE_KEY}");d.dataset.theme=t==="light"||t==="dark"?t:m.matches?"dark":"light"}a();m.addEventListener("change",a)}catch(e){}})()`;

// Render inside <head> of every root layout. The <html> it targets needs
// suppressHydrationWarning, since data-theme is set before React hydrates.
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

// Shown by the browser chrome (mobile address bar) — follows the OS setting.
export const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
  { media: "(prefers-color-scheme: dark)", color: "#15120f" },
];
