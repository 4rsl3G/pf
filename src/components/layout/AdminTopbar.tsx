"use client";

import { clearAdminToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";

type Props = {
  onOpenSidebar?: () => void;
};

export default function AdminTopbar({ onOpenSidebar }: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-soft bg-white">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* hamburger only mobile */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden h-11 w-11 rounded-2xl border border-soft bg-white hover:bg-black/[0.03] grid place-items-center"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="text-sm text-subtle">Admin Panel</div>
            <div className="font-semibold truncate">Realtime Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-11 w-11 rounded-2xl border border-soft bg-white hover:bg-black/[0.03] grid place-items-center"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="h-11 rounded-2xl px-4 btn-brand flex items-center gap-2"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
