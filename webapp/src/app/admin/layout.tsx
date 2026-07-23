import type { Metadata } from "next";
import { iranYekan } from "@/lib/fonts/iranyekan";
import { workSans } from "@/lib/fonts/worksans";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`h-full antialiased ${workSans.variable} ${iranYekan.variable}`}
    >
      <body className="min-h-full font-sans">
        <div className="min-h-screen bg-paper text-ink">{children}</div>
      </body>
    </html>
  );
}
