import type { Metadata } from "next";
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
    <html lang="en" dir="ltr" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>
      </body>
    </html>
  );
}
