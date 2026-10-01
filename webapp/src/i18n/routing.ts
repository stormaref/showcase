import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fa"],
  // Persian is the main audience. Detection stays on, so the locale cookie and
  // Accept-Language still win; this is where everyone else lands.
  defaultLocale: "fa",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
