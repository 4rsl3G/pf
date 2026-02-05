"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Receipt,
  BadgePercent,
  Image as ImageIcon,
  Menu,
  X,
} from "lucide-react";

const items = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/markup", icon: BadgePercent, label: "Markup" },
  { href: "/admin/assets", icon: ImageIcon, label: "Assets" },
];

function NavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const path = usePathname();

  return (
    <nav className="space-y-2">
      {items.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        const Icon = it.icon;

        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => onNavigate?.()}
            className={[
              "flex items-center gap-3 rounded-2xl px-4 py-3 border transition",
              "select-none",
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
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = React.useState(false);

  // ESC close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll while drawer open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* ===== Mobile top bar (lg hidden) ===== */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-soft bg-[rgba(7,12,10,.82)] backdrop-blur-xl">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 w-10 rounded-2xl border border-soft bg-[rgba(255,255,255,.05)] hover:bg-[rgba(255,255,255,.07)] transition grid place-items-center"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="text-sm font-semibold">Pansa Admin</div>

          <div className="h-10 w-10" />
        </div>
      </div>

      {/* ===== Desktop sidebar (hidden on mobile) ===== */}
      <aside className="hidden lg:block w-[280px] border-r border-soft bg-[rgba(7,12,10,.70)] backdrop-blur">
        <div className="px-5 py-5">
          <div className="card-glass rounded-2xl p-4 border-soft shadow-soft">
            <div className="text-sm font-semibold">Pansa Admin</div>
            <div className="text-xs text-subtle mt-1">Management • Realtime • Secure</div>
          </div>

          <div className="mt-5">
            <NavLinks />
          </div>
        </div>
      </aside>

      {/* ===== Mobile drawer ===== */}
      {open ? (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* overlay */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close overlay"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div
            className={[
              "absolute left-0 top-0 h-full w-[86%] max-w-[320px]",
              "border-r border-soft bg-[rgba(7,12,10,.90)] backdrop-blur-xl",
              "shadow-[0_30px_100px_rgba(0,0,0,.45)]",
              "animate-in slide-in-from-left duration-200",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="card-glass rounded-2xl p-4 border-soft shadow-soft flex-1">
                  <div className="text-sm font-semibold">Pansa Admin</div>
                  <div className="text-xs text-subtle mt-1">Management • Realtime • Secure</div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 w-11 rounded-2xl border border-soft bg-[rgba(255,255,255,.05)] hover:bg-[rgba(255,255,255,.07)] transition grid place-items-center"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
