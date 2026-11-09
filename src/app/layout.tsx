import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { profile } from "@/content/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${profile.name} · ${profile.role}`,
  description: profile.summary,
};

export const viewport: Viewport = { themeColor: "#07080b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable} antialiased`}>{children}</body>
    </html>
  );
}
