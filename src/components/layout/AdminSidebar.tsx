"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Receipt, BadgePercent, Image } from "lucide-react";

const items = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/markup", icon: BadgePercent, label: "Markup" },
  { href: "/admin/assets", icon: Image, label: "Assets" },
];

export default function AdminSidebar() {
  const path = usePathname();

  return (
    <aside className="hidden lg:block border-r border-soft bg-[rgba(7,12,10,.70)] backdrop-blur">
      <div className="px-5 py-5">
        <div className="card-glass rounded-2xl p-4 border-soft shadow-soft">
          <div className="text-sm font-semibold">Pansa Admin</div>
          <div className="text-xs text-subtle mt-1">Management • Realtime • Secure</div>
        </div>

        <nav className="mt-5 space-y-2">
          {items.map((it) => {
            const active = path === it.href || path.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 border transition",
                  active
                    ? "bg-[rgba(16,185,129,.12)] border-[rgba(16,185,129,.24)]"
                    : "bg-[rgba(255,255,255,.04)] border-soft hover:bg-[rgba(255,255,255,.06)]"
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{it.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}