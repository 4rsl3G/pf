"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { openAdminSSE } from "@/lib/sse-admin";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, ArrowUpRight } from "lucide-react";

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

  // throttle refresh dari SSE
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

  // realtime via SSE (throttled)
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
      if (now - lastReloadRef.current < 1500) return; // throttle 1.5s
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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs text-subtle">
            <Activity className="h-4 w-4 text-[rgba(16,185,129,.95)]" />
            <span>Realtime via SSE</span>
            <span className="opacity-60">•</span>
            <span className="opacity-80">Server: {serverTimeText}</span>
          </div>

          <div className="mt-2 text-2xl font-semibold">Dashboard</div>
          <div className="text-sm text-subtle mt-1">
            Update otomatis saat invoice berubah (PAID / FULFILLED / EXPIRED).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
            onClick={() => refreshNow()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2">{refreshing ? "Refreshing" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Premify Balance</CardTitle>
            <CardDescription className="text-subtle">Cek koneksi API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "…" : balanceText}</div>
            <div className="text-xs text-subtle mt-2">Sumber: /admin/premify/balance</div>
          </CardContent>
        </Card>

        <StatCard
          title="Pending"
          value={loading ? "…" : (data?.counts?.pending ?? 0)}
          hint="Menunggu bayar"
        />

        <StatCard
          title="Fulfilled"
          value={loading ? "…" : (data?.counts?.fulfilled ?? 0)}
          hint="Order selesai"
        />

        <StatCard
          title="Profit (7D)"
          value={loading ? "…" : moneyIDR(data?.totals?.last7d?.profit || 0)}
          hint={`Omzet: ${moneyIDR(data?.totals?.last7d?.omzet || 0)}`}
        />
      </div>

      {/* RECENT */}
      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
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
            <div className="grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-4"
                >
                  <div className="h-4 w-40 bg-black/10 rounded-xl mb-2" />
                  <div className="h-3 w-64 bg-black/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : !data?.recent?.length ? (
            <div className="text-sm text-subtle">Belum ada invoice.</div>
          ) : (
            <div className="grid gap-3">
              {data.recent.map((x) => (
                <div
                  key={x.invoiceId}
                  className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-4"
                >
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
                        Nominal: <span className="font-semibold">{moneyIDR(x.payAmount || 0)}</span>
                      </div>

                      {x.premifyOrderId ? (
                        <div className="mt-2">
                          <Badge variant="secondary" className="bg-[rgba(255,255,255,.06)] border-soft rounded-2xl">
                            Premify: {x.premifyOrderId}
                          </Badge>
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {/* Kalau kamu punya halaman detail invoice admin, pakai link ini.
                          Kalau belum ada route, aman: bisa dihapus. */}
                      <Link href={`/admin/invoices?invoiceId=${encodeURIComponent(x.invoiceId)}`}>
                        <Button className="btn-soft rounded-2xl">
                          <span className="hidden sm:inline">View</span>
                          <ArrowUpRight className="h-4 w-4 sm:ml-2" />
                        </Button>
                      </Link>
                    </div>
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

function StatCard({ title, value, hint }: { title: string; value: any; hint?: string }) {
  return (
    <Card className="card-glass border-soft rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-subtle">{hint || "Realtime"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value ?? "-"}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    PENDING: "bg-[rgba(245,158,11,.12)] border-[rgba(245,158,11,.24)] text-[rgba(11,23,18,.90)]",
    PAID: "bg-[rgba(16,185,129,.12)] border-[rgba(16,185,129,.22)] text-[rgba(11,23,18,.90)]",
    FULFILLED: "bg-[rgba(16,185,129,.20)] border-[rgba(16,185,129,.30)] text-[rgba(11,23,18,.92)]",
    EXPIRED: "bg-[rgba(239,68,68,.12)] border-[rgba(239,68,68,.22)] text-[rgba(11,23,18,.90)]",
    FAILED: "bg-[rgba(239,68,68,.12)] border-[rgba(239,68,68,.22)] text-[rgba(11,23,18,.90)]",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-2xl border px-3 py-1 text-xs whitespace-nowrap",
        map[status] || "border-soft bg-[rgba(255,255,255,.06)]",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
