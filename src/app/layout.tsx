import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "Pansa Store";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pansa.my.id").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: brand,
    template: `%s • ${brand}`,
  },
  description: "Beli App Premium cepat, aman, realtime via QRIS.",

  applicationName: brand,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  alternates: { canonical: "/" },

  keywords: [
    "pansa store",
    "app premium",
    "akun premium",
    "subscription",
    "qris",
    "canva pro",
    "youtube premium",
    "capcut pro",
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: brand,
    title: brand,
    description: "Beli App Premium cepat, aman, realtime via QRIS.",
    images: [
      {
        url: "/og.png", // taruh file di /public/og.png
        width: 1200,
        height: 630,
        alt: `${brand} • Digital Premium Marketplace`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: brand,
    description: "Beli App Premium cepat, aman, realtime via QRIS.",
    images: ["/og.png"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" }, // taruh file di /public/logo.png
    ],
    apple: [{ url: "/logo.png" }],
  },

  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-noise">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
