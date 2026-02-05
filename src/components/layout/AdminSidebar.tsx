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

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();

  return (
    <div className="px-4 py-4">
      <div className="rounded-2xl border border-soft bg-white shadow-soft p-4">
        <div className="text-sm font-semibold">Pansa Admin</div>
        <div className="text-xs text-subtle mt-1">Management • Realtime • Secure</div>
      </div>

      <nav className="mt-4 space-y-2">
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
                  ? "bg-[rgba(16,185,129,.10)] border-[rgba(16,185,129,.22)]"
                  : "bg-white border-soft hover:bg-black/[0.03]"
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  // Desktop
  return (
    <>
      <aside className="hidden lg:block border-r border-soft bg-white">
        <Nav />
      </aside>

      {/* Mobile drawer */}
      <div className={mobileOpen ? "lg:hidden" : "hidden"}>
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <aside className="fixed left-0 top-0 bottom-0 z-50 w-[82vw] max-w-[320px] bg-white border-r border-soft shadow-pop">
          <div className="px-4 py-3 border-b border-soft flex items-center justify-between">
            <div className="font-semibold">Menu</div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-2xl border border-soft bg-white hover:bg-black/[0.03] transition grid place-items-center"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Nav onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
