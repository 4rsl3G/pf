// src/app/(public)/layout.tsx
import type { Metadata } from "next";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const siteName = process.env.NEXT_PUBLIC_BRAND_NAME || "Pansa Store";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <PublicHeader />

      <main className="flex-1 bg-[rgb(var(--bg))]">
        <div className="bg-noise min-h-full">{children}</div>
      </main>

      <PublicFooter />
    </div>
  );
}
