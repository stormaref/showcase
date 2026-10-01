import localFont from "next/font/local";

// Persian is the main audience and the default locale, so only IRANYekan is
// preloaded. next/font preloads per layout file, not per locale, so Work Sans
// is discovered from the stylesheet on /en instead.
export const workSans = localFont({
  src: [
    {
      path: "../../assets/fonts/worksans/WorkSans-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-worksans",
  display: "swap",
  preload: false,
});
