// src/app/(public)/page.tsx
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Pansa Store — Digital Premium Marketplace",
  description: "Beli App Premium cepat, aman, realtime via QRIS. Akun/Invite dikirim otomatis setelah pembayaran.",
  alternates: { canonical: "https://pansa.my.id/" },
  openGraph: {
    type: "website",
    url: "https://pansa.my.id/",
    siteName: "Pansa Store",
    title: "Pansa Store — Digital Premium Marketplace",
    description: "Beli App Premium cepat, aman, realtime via QRIS. Akun/Invite dikirim otomatis setelah pembayaran.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Pansa Store" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pansa Store — Digital Premium Marketplace",
    description: "Beli App Premium cepat, aman, realtime via QRIS. Akun/Invite dikirim otomatis setelah pembayaran.",
    images: ["/og.png"],
  },
};

export default function Page() {
  return <HomeClient />;
}
