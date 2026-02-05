"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";
import { getAdminToken } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token && pathname !== "/admin/login") router.replace("/admin/login");
    setReady(true);
  }, [pathname, router]);

  // auto close sidebar saat pindah halaman (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!ready) return null;

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[280px_1fr]">
      <AdminSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      <div className="min-w-0 flex flex-col">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 py-6 lg:px-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
