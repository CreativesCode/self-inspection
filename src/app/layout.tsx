import { Providers } from "@/contexts/Providers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RootLayoutContent } from "./RootLayoutContent";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: {
    template: "%s | Safe 360",
    default: "Safe 360",
  },
  description: "Self Inspection System",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <RootLayoutContent
          geistSans={geistSans.variable}
          geistMono={geistMono.variable}
        >
          {children}
        </RootLayoutContent>
      </Providers>
    </html>
  );
}
