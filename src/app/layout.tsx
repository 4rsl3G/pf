import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_BRAND_NAME || "Pansa Store",
  description: "Beli App Premium cepat, aman, realtime via QRIS.",
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