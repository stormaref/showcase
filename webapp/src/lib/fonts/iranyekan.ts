import localFont from "next/font/local";

export const iranYekan = localFont({
  src: [
    { path: "../../assets/fonts/iranyekan/IRANYekan-Light.woff2", weight: "300" },
    { path: "../../assets/fonts/iranyekan/IRANYekan-Regular.woff2", weight: "400" },
    { path: "../../assets/fonts/iranyekan/IRANYekan-Bold.woff2", weight: "700" },
  ],
  variable: "--font-iranyekan",
  display: "swap",
});
