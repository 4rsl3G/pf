"use client";

import { clearAdminToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";

export default function AdminTopbar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-soft bg-[rgba(7,12,10,.80)] backdrop-blur">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm text-subtle">Admin Panel</div>
          <div className="font-semibold">Realtime Dashboard</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft">
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