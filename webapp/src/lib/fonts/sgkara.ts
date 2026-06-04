import localFont from "next/font/local";

export const sgkara = localFont({
  src: [
    { path: "../../assets/fonts/kara/SGKara-Light.ttf", weight: "300" },
    { path: "../../assets/fonts/kara/SGKara-Regular.ttf", weight: "400" },
    { path: "../../assets/fonts/kara/SGKara-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-sgkara",
  display: "swap",
});
