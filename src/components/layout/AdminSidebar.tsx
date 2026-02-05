"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Receipt, BadgePercent, Image, X } from "lucide-react";

const items = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/markup", icon: BadgePercent, label: "Markup" },
  { href: "/admin/assets", icon: Image, label: "Assets" },
];

type Props = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();

  return (
    <nav className="mt-5 space-y-2">
      {items.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            className={[
              "flex items-center gap-3 rounded-2xl px-4 py-3 border transition",
              active
                ? "bg-[rgba(16,185,129,.10)] border-[rgba(16,185,129,.25)]"
                : "bg-white border-soft hover:bg-black/[0.02]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: Props) {
  // DESKTOP SIDEBAR
  return (
    <>
      <aside className="hidden lg:block border-r border-soft bg-white">
        <div className="px-5 py-5">
          <div className="rounded-2xl p-4 border border-soft shadow-soft bg-white">
            <div className="text-sm font-semibold">Pansa Admin</div>
            <div className="text-xs text-subtle mt-1">Management • Realtime • Secure</div>
          </div>

          <NavList />
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <div className={mobileOpen ? "lg:hidden" : "hidden lg:hidden"}>
        {/* overlay */}
        <button
          aria-label="Close sidebar overlay"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        />

        {/* drawer */}
        <aside className="fixed left-0 top-0 bottom-0 z-50 w-[86%] max-w-[320px] bg-white border-r border-soft shadow-pop">
          <div className="px-4 py-4 flex items-center justify-between border-b border-soft">
            <div>
              <div className="text-sm font-semibold">Pansa Admin</div>
              <div className="text-xs text-subtle">Menu</div>
            </div>

            <button
              onClick={onMobileClose}
              className="h-10 w-10 rounded-2xl border border-soft bg-white hover:bg-black/[0.03] grid place-items-center"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-4">
            <NavList onNavigate={onMobileClose} />
          </div>
        </aside>
      </div>
    </>
  );
}
