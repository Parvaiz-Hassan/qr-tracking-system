import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product QR Tracking",
  description: "Scan a product QR code to view batch details",
};

// Tells the browser this is a light-only page — belt-and-suspenders on
// top of the `color-scheme: light` in globals.css, since some mobile
// browsers (notably Android Chrome's "force dark" auto-theme) look at
// this viewport setting rather than the CSS. Added 2026-09-19 alongside
// the globals.css fix for the "text looks white while typing" report.
export const viewport: Viewport = {
  colorScheme: "light",
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
