"use client";

import { clearAdminToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Menu } from "lucide-react";

export default function AdminTopbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-soft bg-[rgba(7,12,10,.82)] backdrop-blur-xl">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden h-10 w-10 rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.09)] transition grid place-items-center"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="leading-tight">
            <div className="text-xs text-subtle">Admin Panel</div>
            <div className="font-semibold truncate">Realtime Dashboard</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            className="btn-brand rounded-2xl"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
