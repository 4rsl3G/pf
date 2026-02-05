"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminInvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const invoiceIdRaw = useMemo(() => {
    const v = invoiceId ?? "";
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }, [invoiceId]);

  const invoiceKey = useMemo(() => encodeURIComponent(invoiceIdRaw), [invoiceIdRaw]);

  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const disableActions = busy || loading;

  const load = useCallback(async () => {
    if (!invoiceIdRaw) return;
    const r = await apiFetch<any>(`/admin/invoices/${invoiceKey}`, { auth: true });
    setInv(r.data ?? null);
  }, [invoiceIdRaw, invoiceKey]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!invoiceIdRaw) {
          setInv(null);
          return;
        }
        await load();
      } catch (e: any) {
        setInv(null);
        toast.error(e?.error || e?.message || "Gagal load invoice");
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceIdRaw, load]);

  async function retryFulfill() {
    if (!invoiceIdRaw) return toast.error("Invoice ID kosong");
    try {
      setBusy(true);
      const r = await apiFetch<any>(`/admin/invoices/${invoiceKey}/retry-fulfill`, { method: "POST", auth: true });
      toast.success(`Fulfilled: ${r?.data?.premifyOrderId || "-"}`);
      await load();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Retry gagal");
    } finally {
      setBusy(false);
    }
  }

  async function refetchReceipt() {
    if (!invoiceIdRaw) return toast.error("Invoice ID kosong");
    try {
      setBusy(true);
      await apiFetch<any>(`/admin/invoices/${invoiceKey}/refetch-receipt`, { method: "POST", auth: true });
      toast.success("Receipt refreshed");
      await load();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Refetch gagal");
    } finally {
      setBusy(false);
    }
  }

  async function expire() {
    if (!invoiceIdRaw) return toast.error("Invoice ID kosong");
    try {
      setBusy(true);
      await apiFetch<any>(`/admin/invoices/${invoiceKey}/expire`, { method: "POST", auth: true });
      toast.success("Expired");
      await load();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Expire gagal");
    } finally {
      setBusy(false);
    }
  }

  const qrisPng = inv?.publicToken
    ? `${API_BASE.replace(/\/v1$/, "")}/qris/payment/${encodeURIComponent(inv.publicToken)}?t=${Date.now()}`
    : null;

  if (!invoiceIdRaw) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-subtle">Invoice Detail</div>
            <div className="text-2xl font-semibold">Invoice ID kosong</div>
          </div>
          <Link href="/admin/invoices">
            <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft">
              Back
            </Button>
          </Link>
        </div>

        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">URL tidak valid</CardTitle>
            <CardDescription className="text-subtle">
              Buka detail invoice melalui halaman list agar parameter terisi dengan benar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm text-subtle">Invoice Detail</div>
          <div className="text-2xl font-semibold">{invoiceIdRaw}</div>
        </div>
        <Link href="/admin/invoices">
          <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft">
            Back
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="card-glass rounded-2xl p-6 skeleton h-[240px]" />
      ) : !inv ? (
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Invoice tidak ditemukan</CardTitle>
            <CardDescription className="text-subtle">
              Key: <span className="font-mono">{invoiceIdRaw}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Card className="card-glass border-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Info</CardTitle>
              <CardDescription className="text-subtle">
                {inv.productName} — {inv.variantName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row k="Status" v={inv.status} />
              <Row k="Pay Amount" v={`Rp ${Number(inv.payAmount || 0).toLocaleString("id-ID")}`} />
              <Row k="Unique Code" v={String(inv.uniqueCode)} />
              <Row k="Markup" v={`Rp ${Number(inv.markup || 0).toLocaleString("id-ID")}`} />
              <Row k="Premify Order" v={inv.premifyOrderId || "-"} />
              <Row k="Matched Tx" v={inv.matchedTxId || "-"} />
              <Row k="Created" v={fmtDate(inv.createdAt)} />
              <Row k="Expires" v={fmtDate(inv.expiresAt)} />
              <Row k="PaidAt" v={inv.paidAt ? fmtDate(inv.paidAt) : "-"} />

              <div className="flex gap-2 flex-wrap pt-2">
                <Button className="btn-brand rounded-2xl" onClick={retryFulfill} disabled={disableActions}>
                  Retry Fulfill
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                  onClick={refetchReceipt}
                  disabled={disableActions}
                >
                  Refetch Receipt
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                  onClick={expire}
                  disabled={disableActions}
                >
                  Expire
                </Button>
              </div>

              {inv.premifyReceiptJson ? (
                <div className="pt-3">
                  <div className="text-xs text-subtle mb-2">Receipt JSON</div>
                  <pre className="text-xs bg-[rgba(255,255,255,.06)] border border-soft rounded-2xl p-4 overflow-auto max-h-[260px]">
                    {safePretty(inv.premifyReceiptJson)}
                  </pre>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="card-glass border-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">QR (Pending only)</CardTitle>
              <CardDescription className="text-subtle">QR akan 404 setelah paid/expired</CardDescription>
            </CardHeader>
            <CardContent>
              {qrisPng ? (
                <div className="rounded-2xl overflow-hidden border border-soft bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrisPng} alt="qris" className="w-full h-auto" />
                </div>
              ) : (
                <div className="text-sm text-subtle">Tidak ada token QR (bukan pending / sudah hilang).</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
      <div className="text-xs text-subtle">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function fmtDate(v: any) {
  if (!v) return "-";
  const s = String(v);
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("id-ID");
}

function safePretty(x: any) {
  try {
    if (typeof x === "string") {
      const j = JSON.parse(x);
      return JSON.stringify(j, null, 2);
    }
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}
