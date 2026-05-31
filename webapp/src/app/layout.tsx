import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Art Ceramic", template: "%s | Art Ceramic" },
  description:
    "Art Ceramic — handcrafted ceramics, custom tiles, and studio services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
