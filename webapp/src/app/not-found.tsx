import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { iranYekan } from "@/lib/fonts/iranyekan";
import { workSans } from "@/lib/fonts/worksans";
import "./globals.css";

// Fallback 404 for URLs outside any locale (the proxy skips paths with a file
// extension, /api and /admin). The root layout renders no <html>, so this page
// brings its own. Persian first, English below; no locale to pick from.
export default async function RootNotFound() {
  const fa = await getTranslations({ locale: "fa", namespace: "notFound" });
  const en = await getTranslations({ locale: "en", namespace: "notFound" });

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`h-full antialiased ${iranYekan.variable} ${workSans.variable}`}
    >
      <body className={`flex min-h-full items-center bg-paper ${iranYekan.className}`}>
        <main className="mx-auto w-full max-w-3xl px-6 py-24 md:px-10">
          <p className="eyebrow">۴۰۴</p>
          <h1 className="mt-5 text-4xl font-extralight leading-[1.35] text-ink md:text-5xl">
            {fa("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-gray-600">
            {fa("text")}
          </p>
          <Link
            href="/fa"
            className="mt-10 inline-block bg-clay px-8 py-3.5 text-[13px] font-medium text-white transition duration-300 hover:bg-clay-dark"
          >
            {fa("home")}
          </Link>

          <div lang="en" dir="ltr" className="mt-16 border-t border-gray-200 pt-10 font-sans">
            <h2 className="text-2xl font-extralight tracking-tight text-ink">{en("title")}</h2>
            <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-gray-600">
              {en("text")}
            </p>
            <Link
              href="/en"
              className="mt-6 inline-block text-[13px] font-medium uppercase tracking-[0.18em] text-ink underline decoration-gray-300 underline-offset-8 transition hover:text-clay hover:decoration-clay"
            >
              {en("home")}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
