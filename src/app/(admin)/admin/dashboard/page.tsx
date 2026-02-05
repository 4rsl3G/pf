"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { openAdminSSE } from "@/lib/sse-admin";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Summary = {
  premifyBalance: any;
  counts: Record<string, number>;
  totals: { last7d: { omzet: number; profit: number } };
  recent: any[];
  serverTime: string;
};

export default function AdminDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await apiFetch<{ success: true; data: Summary }>("/admin/dashboard/summary", { auth: true });
    setData(r.data);
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

  // realtime
  useEffect(() => {
    const close = openAdminSSE(async (ev) => {
      if (ev?.status === "FULFILLED" || ev?.status === "PAID" || ev?.status?.includes("EXPIRED")) {
        await load().catch(() => {});
      }
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

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-subtle">Overview</div>
        <div className="text-2xl font-semibold">Dashboard</div>
        <div className="text-xs text-subtle mt-1">Realtime via SSE • Update otomatis saat invoice berubah</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Premify Balance</CardTitle>
            <CardDescription className="text-subtle">Cek koneksi API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "..." : balanceText}</div>
            <div className="text-xs text-subtle mt-2">Sumber: /admin/premify/balance</div>
          </CardContent>
        </Card>

        <StatCard title="Pending" value={data?.counts?.pending} />
        <StatCard title="Fulfilled" value={data?.counts?.fulfilled} />
        <StatCard title="Profit 7D" value={`Rp ${(data?.totals?.last7d?.profit || 0).toLocaleString("id-ID")}`} />
      </div>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <CardDescription className="text-subtle">10 invoice terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(data?.recent || []).map((x) => (
              <div key={x.invoiceId} className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{x.invoiceId}</div>
                  <div className="text-xs text-subtle truncate">
                    {x.productName} — {x.variantName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Rp {Number(x.payAmount || 0).toLocaleString("id-ID")}</div>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <StatusBadge status={x.status} />
                    {x.premifyOrderId ? (
                      <Badge variant="secondary" className="bg-[rgba(255,255,255,.06)] border-soft">
                        {x.premifyOrderId}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!loading && (!data?.recent || data.recent.length === 0) ? (
              <div className="text-sm text-subtle">Belum ada invoice.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <Card className="card-glass border-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-subtle">Realtime</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value ?? "-"}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    PENDING: "bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.28)]",
    PAID: "bg-[rgba(16,185,129,.14)] border-[rgba(16,185,129,.25)]",
    FULFILLED: "bg-[rgba(16,185,129,.22)] border-[rgba(16,185,129,.35)]",
    EXPIRED: "bg-[rgba(239,68,68,.14)] border-[rgba(239,68,68,.25)]",
    FAILED: "bg-[rgba(239,68,68,.14)] border-[rgba(239,68,68,.25)]",
  };
  return (
    <span className={`inline-flex items-center rounded-2xl border px-3 py-1 text-xs ${map[status] || "border-soft bg-[rgba(255,255,255,.06)]"}`}>
      {status}
    </span>
  );
}