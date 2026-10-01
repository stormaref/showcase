"use client";

import { useTranslations } from "next-intl";

// Mirrors the product page: breadcrumb, square swatch beside title, specs and
// enquiry card, then a row of size photos. A client component so the label
// comes from the layout's intl provider, which always has the route locale.
export default function ProductLoading() {
  const t = useTranslations("designDetail");
  const block = "bg-gray-100 motion-safe:animate-pulse";

  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto max-w-7xl px-6 pb-16 pt-6 md:px-10 md:pb-24 md:pt-10"
    >
      <span className="sr-only">{t("loading")}</span>
      <div className={`h-5 w-48 ${block}`} />

      <div className="mt-6 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-12">
        <div className={`aspect-square w-full ${block}`} />

        <div className="mt-8 lg:mt-0">
          <div className={`h-10 w-3/4 md:h-14 ${block}`} />
          <div className={`mt-4 h-5 w-full ${block}`} />
          <div className={`mt-2 h-5 w-2/3 ${block}`} />

          <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
                <div className={`h-4 w-20 ${block}`} />
                <div className="flex gap-2">
                  <div className={`h-7 w-16 ${block}`} />
                  <div className={`h-7 w-16 ${block}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-gray-200 p-6">
            <div className={`h-5 w-1/2 ${block}`} />
            <div className={`mt-3 h-4 w-3/4 ${block}`} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className={`h-12 flex-1 ${block}`} />
              <div className={`h-12 flex-1 ${block}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 md:mt-28">
        <div className={`h-8 w-56 ${block}`} />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((tile) => (
            <div key={tile} className={`aspect-[4/3] ${block}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
