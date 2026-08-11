import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-serif",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DocuMind AI",
  description: "Ask questions about your documents, grounded in their actual content.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
