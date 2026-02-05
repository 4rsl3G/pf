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

export default function AdminSidebar({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const path = usePathname();
  const isOpen = !!open;

  const SidebarInner = (
    <div className="h-full px-5 py-5">
      <div className="card-glass rounded-2xl p-4 border-soft shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Pansa Admin</div>
            <div className="text-xs text-subtle mt-1 truncate">
              Management • Realtime • Secure
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="lg:hidden h-10 w-10 rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.09)] transition grid place-items-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
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
                  : "bg-[rgba(255,255,255,.04)] border-soft hover:bg-[rgba(255,255,255,.06)]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block border-r border-soft bg-[rgba(7,12,10,.70)] backdrop-blur">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      <div
        className={[
          "lg:hidden fixed inset-0 z-50",
          isOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        {/* overlay */}
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className={[
            "absolute inset-0 transition",
            isOpen ? "bg-black/40" : "bg-transparent",
          ].join(" ")}
          aria-label="Close overlay"
        />

        {/* panel */}
        <aside
          className={[
            "absolute left-0 top-0 h-full w-[84%] max-w-[320px]",
            "border-r border-soft bg-[rgba(7,12,10,.92)] backdrop-blur-xl",
            "transition-transform duration-200",
            isOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {SidebarInner}
        </aside>
      </div>
    </>
  );
}
