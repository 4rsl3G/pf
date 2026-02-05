"use client";

import { clearAdminToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Menu } from "lucide-react";

export default function AdminTopbar({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-soft bg-white/85 backdrop-blur-xl">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onMenu}
            className="lg:hidden h-10 w-10 rounded-2xl border border-soft bg-white hover:bg-black/[0.03] transition grid place-items-center"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="leading-tight">
            <div className="text-xs text-subtle">Admin Panel</div>
            <div className="font-semibold tracking-tight">Realtime Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="rounded-2xl bg-black/[0.03] border border-soft hover:bg-black/[0.05]"
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
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
