const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** ASCII digits → Persian digits. Display only; never use on hrefs. */
export function toFaDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Persian digits on /fa, unchanged elsewhere. Display only. */
export function localizeDigits(value: string, locale: string): string {
  return locale === "fa" ? toFaDigits(value) : value;
}

/**
 * Normalise a tile size label for display: "30x60", "30 X 60" and "30*60"
 * all become "30×60". Render the result inside <bdi dir="ltr"> so RTL pages
 * don't flip it to "60×30".
 */
export function formatSizeLabel(label: string, locale?: string): string {
  const normalized = label.replace(/\s*[xX*×]\s*/g, "×").trim();
  return locale ? localizeDigits(normalized, locale) : normalized;
}

/** Long-form date in the locale's calendar ("21 September 2026", "۳۰ شهریور ۱۴۰۵"). */
export function formatDate(value: string | Date, locale: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "long",
  }).format(date);
}
