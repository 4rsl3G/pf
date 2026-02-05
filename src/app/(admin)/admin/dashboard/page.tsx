"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { openAdminSSE } from "@/lib/sse-admin";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type Summary = {
  premifyBalance: any;
  counts: Record<string, number>;
  totals: { last7d: { omzet: number; profit: number } };
  recent: any[];
  serverTime: string;
};

function moneyIDR(n: any) {
  const x = Number(n || 0);
  return `Rp ${x.toLocaleString("id-ID")}`;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lastReloadRef = useRef<number>(0);

  async function load() {
    const r = await apiFetch<{ success: true; data: Summary }>("/admin/dashboard/summary", { auth: true });
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

  useEffect(() => {
    const close = openAdminSSE(async (ev) => {
      const status = String(ev?.status || "");
      const shouldRefresh =
        status === "FULFILLED" || status === "PAID" || status.includes("EXPIRED") || status.includes("FAILED");

      if (!shouldRefresh) return;

      const now = Date.now();
      if (now - lastReloadRef.current < 1200) return;
      lastReloadRef.current = now;

      await refreshNow({ silent: true });
    });
    return () => close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balanceText = useMemo(() => {
    const b = data?.premifyBalance;
    if (!b) return "-";
    if (b.error) return `Error: ${b.error}`;
    const n = Number(b.balance || 0);
    return `${n.toLocaleString("id-ID")} ${b.currency || "IDR"}`;
  }, [data?.premifyBalance]);

  const serverTimeText = useMemo(() => {
    if (!data?.serverTime) return "-";
    try {
      return new Date(data.serverTime).toLocaleString("id-ID");
    } catch {
      return String(data.serverTime);
    }
  }, [data?.serverTime]);

  const pending = data?.counts?.pending ?? 0;
  const fulfilled = data?.counts?.fulfilled ?? 0;
  const profit7d = data?.totals?.last7d?.profit ?? 0;
  const omzet7d = data?.totals?.last7d?.omzet ?? 0;

  return (
    <div className="space-y-4">
      {/* TOP STRIP */}
      <div className="rounded-2xl border border-soft bg-white shadow-soft p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-subtle">
              <Activity className="h-4 w-4 text-[rgba(16,185,129,.95)]" />
              <span>Realtime SSE</span>
              <span className="opacity-40">•</span>
              <span className="opacity-80">Server {serverTimeText}</span>
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight">Dashboard</div>
            <div className="text-sm text-subtle mt-1">
              Monitor invoice & order dengan update otomatis.
            </div>
          </div>

          <Button
            variant="secondary"
            className="rounded-2xl bg-black/[0.03] border border-soft hover:bg-black/[0.05]"
            onClick={() => refreshNow()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">{refreshing ? "Refreshing" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* STATS (COMPACT) */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MiniStat
          loading={loading}
          title="Balance"
          value={balanceText}
          hint="Premify"
        />
        <MiniStat
          loading={loading}
          title="Pending"
          value={String(pending)}
          hint="Menunggu bayar"
        />
        <MiniStat
          loading={loading}
          title="Fulfilled"
          value={String(fulfilled)}
          hint="Order selesai"
        />
        <MiniStat
          loading={loading}
          title="Profit 7D"
          value={moneyIDR(profit7d)}
          hint={`Omzet ${moneyIDR(omzet7d)}`}
        />
      </div>

      {/* RECENT */}
      <Card className="rounded-2xl border border-soft bg-white shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <CardDescription className="text-subtle">10 invoice terakhir</CardDescription>
            </div>
            <Badge className="rounded-2xl bg-[rgba(16,185,129,.10)] border border-[rgba(16,185,129,.18)] text-[rgb(var(--brand))]">
              Live
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="grid gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-soft bg-black/[0.02] px-4 py-3">
                  <div className="h-4 w-40 bg-black/10 rounded-xl mb-2" />
                  <div className="h-3 w-64 bg-black/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : !data?.recent?.length ? (
            <div className="text-sm text-subtle">Belum ada invoice.</div>
          ) : (
            <div className="grid gap-2">
              {data.recent.map((x) => (
                <div key={x.invoiceId} className="rounded-2xl border border-soft bg-black/[0.02] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="font-semibold truncate">{x.invoiceId}</div>
                        <StatusBadge status={x.status} />
                      </div>
                      <div className="text-xs text-subtle mt-1 truncate">
                        {x.productName} — {x.variantName}
                      </div>
                      <div className="text-xs text-subtle mt-1">
                        Nominal <span className="font-semibold">{moneyIDR(x.payAmount || 0)}</span>
                      </div>
                    </div>

                    <Link href={`/admin/invoices?invoiceId=${encodeURIComponent(x.invoiceId)}`} className="shrink-0">
                      <Button className="btn-soft rounded-2xl">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({
  loading,
  title,
  value,
  hint,
}: {
  loading: boolean;
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-soft bg-white shadow-soft p-4">
      <div className="text-xs text-subtle">{title}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{loading ? "…" : value}</div>
      <div className="text-xs text-subtle mt-1">{hint}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    PENDING: "bg-[rgba(245,158,11,.12)] border-[rgba(245,158,11,.22)] text-[rgba(11,23,18,.92)]",
    PAID: "bg-[rgba(16,185,129,.12)] border-[rgba(16,185,129,.22)] text-[rgba(11,23,18,.92)]",
    FULFILLED: "bg-[rgba(16,185,129,.18)] border-[rgba(16,185,129,.30)] text-[rgba(11,23,18,.92)]",
    EXPIRED: "bg-[rgba(239,68,68,.12)] border-[rgba(239,68,68,.22)] text-[rgba(11,23,18,.92)]",
    FAILED: "bg-[rgba(239,68,68,.12)] border-[rgba(239,68,68,.22)] text-[rgba(11,23,18,.92)]",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap",
        map[status] || "border-soft bg-black/[0.03]",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
