import type { Metadata, Viewport } from "next";
import { Figtree, Instrument_Serif } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Stamp — Sunday money",
  description: "Mei sends eighty dollars from Shenzhen to Lagos. The stamp names Idris. A clerk cannot rewrite it.",
  manifest: `${process.env.PAGES === "1" ? "/Stamp" : ""}/manifest.json`,
  appleWebApp: { capable: true, title: "Stamp" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#143028",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
