import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Design Studio · Coastal Custom Tees",
  description:
    "Design custom apparel in real time — upload artwork, add text, pick garment colors, preview on realistic mockups, and request a free quote. DTF printing from Little River, SC.",
};

export const viewport: Viewport = {
  themeColor: "#0b2732",
  width: "device-width",
  initialScale: 1,
};

const DESIGN_FONT_FAMILIES = [
  "Bebas+Neue",
  "Pacifico",
  "Lobster",
  "Anton",
  "Oswald:wght@500;600;700",
  "Playfair+Display:ital,wght@0,700;0,900;1,700",
  "Montserrat:ital,wght@0,700;0,800;1,700",
  "Caveat:wght@600;700",
  "Righteous",
  "Bungee",
  "Archivo+Black",
  "Comfortaa:wght@700",
].join("&family=");

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Typefaces available inside the design canvas */}
        <link
          href={`https://fonts.googleapis.com/css2?family=${DESIGN_FONT_FAMILIES}&display=swap`}
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-sand-50 font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
