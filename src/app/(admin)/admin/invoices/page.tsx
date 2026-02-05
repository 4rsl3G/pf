"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { openAdminSSE } from "@/lib/sse-admin";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InvoiceRow = {
  invoiceId: string;
  status: string;
  payAmount: number;
  productName: string;
  variantName: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string | null;
  premifyOrderId?: string | null;
};

export default function AdminInvoices() {
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (q.trim()) qs.set("q", q.trim());
    qs.set("page", "1");
    qs.set("limit", "30");

    const r = await apiFetch<any>(`/admin/invoices?${qs.toString()}`, { auth: true });
    setItems(r?.data || []);
  }, [status, q]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        toast.error(e?.error || e?.message || "Gagal load invoices");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  // auto reload saat filter berubah (biar gak harus klik Apply)
  useEffect(() => {
    const t = setTimeout(() => load().catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [status, q, load]);

  // realtime refresh throttle (kalau SSE kamu sudah OK)
  useEffect(() => {
    let t: any = null;
    const close = openAdminSSE(() => {
      clearTimeout(t);
      t = setTimeout(() => load().catch(() => {}), 450);
    });
    return () => {
      clearTimeout(t);
      close();
    };
  }, [load]);

  const filteredCount = useMemo(() => items.length, [items]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-subtle">Orders</div>
        <div className="text-2xl font-semibold">Invoices</div>
      </div>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
          <CardDescription className="text-subtle">Cari invoiceId / premifyOrderId / nama</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-4">
          <div className="grid gap-2">
            <label className="text-xs text-subtle">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-2xl bg-[rgba(255,255,255,.06)] border border-soft px-3"
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FULFILLED">FULFILLED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div className="grid gap-2 lg:col-span-2">
            <label className="text-xs text-subtle">Search</label>
            <Input
              className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="INV-... / CapCut / ORD-..."
            />
          </div>

          <div className="flex items-end">
            <Button className="btn-brand rounded-2xl w-full" onClick={() => load().catch(() => {})}>
              Apply
            </Button>
          </div>

          <div className="lg:col-span-4 text-xs text-subtle">Showing: {filteredCount} items</div>
        </CardContent>
      </Card>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">List</CardTitle>
          <CardDescription className="text-subtle">Klik untuk detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <div className="text-sm text-subtle">Loading...</div> : null}

          {items.map((x) => (
            <Link
              key={x.invoiceId}
              href={`/admin/invoices/${encodeURIComponent(x.invoiceId)}`}
              className="block rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3 hover:bg-[rgba(255,255,255,.06)] transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{x.invoiceId}</div>
                  <div className="text-xs text-subtle truncate">{x.productName} — {x.variantName}</div>
                  <div className="text-xs text-subtle mt-1 truncate">
                    Created: {fmtDate(x.createdAt)} • Exp: {fmtDate(x.expiresAt)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">Rp {Number(x.payAmount || 0).toLocaleString("id-ID")}</div>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <StatusBadge status={x.status} />
                    {x.premifyOrderId ? <span className="text-xs text-subtle">#{x.premifyOrderId}</span> : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!loading && items.length === 0 ? <div className="text-sm text-subtle">Tidak ada invoice.</div> : null}
        </CardContent>
      </Card>
    </div>
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

function fmtDate(v: any) {
  if (!v) return "-";
  const s = String(v);
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("id-ID");
}
