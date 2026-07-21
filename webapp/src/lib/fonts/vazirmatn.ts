import localFont from "next/font/local";

export const vazirmatn = localFont({
  src: [
    {
      path: "../../assets/fonts/vazirmatn/Vazirmatn-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});
