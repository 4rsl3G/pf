import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <PublicHeader />

      {/* penting: main juga kasih background biar gak ketiban style lain */}
      <main className="flex-1 bg-[rgb(var(--bg))]">
        {/* opsional: kalau kamu pakai bg-noise */}
        <div className="bg-noise min-h-full">{children}</div>
      </main>

      <PublicFooter />
    </div>
  );
}
