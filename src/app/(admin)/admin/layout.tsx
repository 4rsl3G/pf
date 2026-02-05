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

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token && pathname !== "/admin/login") router.replace("/admin/login");
    setReady(true);
  }, [pathname, router]);

  // auto close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!ready) return null;

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-dvh grid lg:grid-cols-[280px_1fr]">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="min-w-0">
        <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
