"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { openAdminSSE } from "@/lib/sse-admin";
import { toast } from "sonner";
import { RefreshCw, Activity, ArrowUpRight } from "lucide-react";

/* ================= HELPERS ================= */

function moneyIDR(n: any) {
  const x = Number(n || 0);
  return `Rp ${x.toLocaleString("id-ID")}`;
}

function safeDateTime(v: any) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("id-ID");
  } catch {
    return String(v);
  }
}

/* ================= TYPES ================= */

type Summary = {
  premifyBalance: any;
  counts: Record<string, number>;
  totals: { last7d: { omzet: number; profit: number } };
  recent: any[];
  serverTime: string;
};

/* ================= PAGE ================= */

export default function AdminDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lastReloadRef = useRef<number>(0);

  async function load() {
    const r = await apiFetch<{ success: true; data: Summary }>(
      "/admin/dashboard/summary",
      { auth: true }
    );
    setData(r.data);
  }

  async function refreshNow(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;
    try {
      if (!silent) setRefreshing(true);
      await load();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Gagal load dashboard");
    } finally {
      if (!silent) setRefreshing(false);
    }
  }

  /* ===== initial load ===== */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        toast.error(e?.error || e?.message || "Gagal load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ===== realtime SSE ===== */
  useEffect(() => {
    const close = openAdminSSE(async (ev) => {
      const status = String(ev?.status || "");
      const shouldRefresh =
        status === "FULFILLED" ||
        status === "PAID" ||
        status.includes("EXPIRED") ||
        status.includes("FAILED");

      if (!shouldRefresh) return;

      const now = Date.now();
      if (now - lastReloadRef.current < 1200) return;
      lastReloadRef.current = now;

      await refreshNow({ silent: true });
    });

    return () => close();
  }, []);

  /* ===== derived ===== */
  const balanceText = useMemo(() => {
    const b = data?.premifyBalance;
    if (!b) return "-";
    if (b.error) return `Error: ${b.error}`;
    return `${Number(b.balance || 0).toLocaleString("id-ID")} ${b.currency || "IDR"}`;
  }, [data?.premifyBalance]);

  const serverTimeText = useMemo(
    () => safeDateTime(data?.serverTime),
    [data?.serverTime]
  );

  const pending = data?.counts?.pending ?? 0;
  const fulfilled = data?.counts?.fulfilled ?? 0;
  const profit7d = data?.totals?.last7d?.profit ?? 0;
  const omzet7d = data?.totals?.last7d?.omzet ?? 0;

  /* ================= RENDER ================= */

  return (
    <div className="space-y-4">
      {/* ===== TOP ===== */}
      <section className="rounded-2xl border border-soft bg-white shadow-soft p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-subtle">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span>Realtime SSE</span>
              <span className="opacity-40">•</span>
              <span>Server {serverTimeText}</span>
            </div>

            <div className="mt-2 text-2xl font-semibold">Dashboard</div>
            <div className="text-sm text-subtle">
              Monitor invoice & order otomatis
            </div>
          </div>

          <button
            onClick={() => refreshNow()}
            disabled={refreshing}
            className="h-11 w-11 grid place-items-center rounded-2xl border border-soft bg-white hover:bg-black/5"
          >
            <RefreshCw
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat title="Balance" value={balanceText} hint="Premify" loading={loading} />
        <MiniStat title="Pending" value={pending} hint="Menunggu bayar" loading={loading} />
        <MiniStat title="Fulfilled" value={fulfilled} hint="Order selesai" loading={loading} />
        <MiniStat
          title="Profit 7D"
          value={moneyIDR(profit7d)}
          hint={`Omzet ${moneyIDR(omzet7d)}`}
          loading={loading}
        />
      </section>

      {/* ===== RECENT ===== */}
      <section className="rounded-2xl border border-soft bg-white shadow-soft overflow-hidden">
        <div className="px-4 py-4 border-b border-soft flex justify-between">
          <div>
            <div className="font-semibold text-lg">Recent Orders</div>
            <div className="text-sm text-subtle">10 invoice terakhir</div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700">
            Live
          </span>
        </div>

        <div className="p-4 space-y-2">
          {!data?.recent?.length && (
            <div className="text-sm text-subtle">Belum ada invoice.</div>
          )}

          {data?.recent?.map((x) => (
            <div
              key={x.invoiceId}
              className="rounded-2xl border border-soft bg-black/[0.02] px-4 py-3"
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex gap-2 items-center">
                    <div className="font-semibold truncate">{x.invoiceId}</div>
                    <StatusBadge status={x.status} />
                  </div>
                  <div className="text-xs text-subtle truncate">
                    {x.productName} — {x.variantName}
                  </div>
                  <div className="text-xs mt-1">
                    Nominal{" "}
                    <span className="font-semibold text-emerald-700">
                      {moneyIDR(x.payAmount)}
                    </span>
                  </div>
                </div>

                <Link href={`/admin/invoices?invoiceId=${x.invoiceId}`}>
                  <div className="h-11 w-11 grid place-items-center rounded-2xl border hover:bg-black/5">
                    <ArrowUpRight />
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function MiniStat({
  title,
  value,
  hint,
  loading,
}: {
  title: string;
  value: any;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-soft bg-white shadow-soft p-4">
      <div className="text-xs text-subtle">{title}</div>
      <div className="mt-2 text-2xl font-semibold">
        {loading ? "…" : value}
      </div>
      <div className="text-xs text-subtle mt-1">{hint}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FULFILLED: "bg-emerald-200 text-emerald-800 border-emerald-300",
    EXPIRED: "bg-red-100 text-red-700 border-red-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`text-[11px] px-2.5 py-1 rounded-full border ${
        map[status] || "bg-gray-100 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
