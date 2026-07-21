import localFont from "next/font/local";

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
});
