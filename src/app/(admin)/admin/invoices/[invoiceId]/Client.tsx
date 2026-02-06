"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Props = {
  invoiceId?: string; // optional kalau nanti mau dipassing dari server page
};

export default function Client(props: Props) {
  const params = useParams<{ invoiceId?: string }>();

  const invoiceIdRaw = useMemo(() => {
    const v = (props.invoiceId ?? params?.invoiceId ?? "") as string;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }, [props.invoiceId, params?.invoiceId]);

  const invoiceKey = useMemo(() => encodeURIComponent(invoiceIdRaw), [invoiceIdRaw]);

  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const disableActions = busy || loading;

  const load = useCallback(async () => {
    if (!invoiceIdRaw) return;
    const r = await apiFetch<any>(`/admin/invoices/${invoiceKey}`, { auth: true });
    setInv(r?.data ?? null);
  }, [invoiceIdRaw, invoiceKey]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setInv(null);
        if (!invoiceIdRaw) return;
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
      const r = await apiFetch<any>(`/admin/invoices/${invoiceKey}/retry-fulfill`, {
        method: "POST",
        auth: true,
      });
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
      <div className="max-w-6xl mx-auto px-4 space-y-6 min-w-0 overflow-x-hidden">
        <Header title="Invoice ID kosong" subtitle="URL tidak valid / params belum kebaca" />
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Buka dari halaman list</CardTitle>
            <CardDescription className="text-subtle">
              Pastikan route benar: <span className="font-mono">/admin/invoices/[invoiceId]</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/invoices">
              <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft">
                Back to Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6 min-w-0 overflow-x-hidden">
      <Header
        title={invoiceIdRaw}
        subtitle={inv ? `${inv.productName} — ${inv.variantName}` : "Invoice Detail"}
        right={
          <Link href="/admin/invoices">
            <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft">
              Back
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr] min-w-0">
          <div className="card-glass rounded-2xl p-6 skeleton h-[360px]" />
          <div className="card-glass rounded-2xl p-6 skeleton h-[360px]" />
        </div>
      ) : !inv ? (
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Invoice tidak ditemukan</CardTitle>
            <CardDescription className="text-subtle">
              Key: <span className="font-mono break-all">{invoiceIdRaw}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr] min-w-0">
          {/* INFO */}
          <Card className="card-glass border-soft rounded-2xl overflow-hidden min-w-0">
            <CardHeader className="space-y-1 min-w-0">
              <CardTitle className="text-base">Invoice Info</CardTitle>
              <CardDescription className="text-subtle">Status & detail pembayaran / order</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 min-w-0">
              {/* ACTION BAR: horizontal scroll on mobile */}
              <div className="w-full min-w-0">
                <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 py-1 w-max">
                    <Button
                      className="btn-brand rounded-2xl whitespace-nowrap shrink-0"
                      onClick={retryFulfill}
                      disabled={disableActions}
                    >
                      Retry Fulfill
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft whitespace-nowrap shrink-0"
                      onClick={refetchReceipt}
                      disabled={disableActions}
                    >
                      Refetch Receipt
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft whitespace-nowrap shrink-0"
                      onClick={expire}
                      disabled={disableActions}
                    >
                      Expire
                    </Button>
                  </div>
                </div>
              </div>

              {/* KV GRID */}
              <div className="grid gap-3 sm:grid-cols-2 min-w-0">
                <KV k="Status" v={<StatusPill status={inv.status} />} />
                <KV k="Pay Amount" v={`Rp ${Number(inv.payAmount || 0).toLocaleString("id-ID")}`} />

                <KV k="Unique Code" v={String(inv.uniqueCode)} />
                <KV k="Markup" v={`Rp ${Number(inv.markup || 0).toLocaleString("id-ID")}`} />

                <KV k="Premify Order" v={inv.premifyOrderId || "-"} mono />
                <KV k="Matched Tx" v={inv.matchedTxId || "-"} mono />

                <KV k="Created" v={fmtDate(inv.createdAt)} />
                <KV k="Expires" v={fmtDate(inv.expiresAt)} />
                <KV k="PaidAt" v={inv.paidAt ? fmtDate(inv.paidAt) : "-"} />
              </div>

              {/* RECEIPT */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">Receipt JSON</div>
                  </div>
                  <div className="text-xs text-subtle shrink-0">{inv.premifyReceiptJson ? "available" : "empty"}</div>
                </div>

                {inv.premifyReceiptJson ? (
                  <pre className="mt-2 text-xs bg-[rgba(255,255,255,.06)] border border-soft rounded-2xl p-4 max-h-[320px] overflow-x-auto whitespace-pre-wrap break-words">
                    {safePretty(inv.premifyReceiptJson)}
                  </pre>
                ) : (
                  <div className="mt-2 text-sm text-subtle">
                    Belum ada receipt. Klik <span className="font-medium">Refetch Receipt</span>.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR */}
          <Card className="card-glass border-soft rounded-2xl lg:sticky lg:top-6 h-fit min-w-0">
            <CardHeader className="space-y-1 min-w-0">
              <CardTitle className="text-base">QR (Pending only)</CardTitle>
              <CardDescription className="text-subtle">QR akan 404 setelah paid/expired</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 min-w-0">
              {qrisPng ? (
                <div className="rounded-2xl overflow-hidden border border-soft bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrisPng} alt="qris" className="w-full h-auto" />
                </div>
              ) : (
                <div className="text-sm text-subtle">Tidak ada token QR (bukan pending / sudah hilang).</div>
              )}
              <div className="text-xs text-subtle">Jika QR tidak muncul, kemungkinan invoice sudah paid/expired.</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between min-w-0">
      <div className="min-w-0">
        <div className="text-sm text-subtle">Invoice Detail</div>
        <div className="text-xl sm:text-2xl font-semibold break-words sm:truncate">{title}</div>
        {subtitle ? <div className="text-sm text-subtle mt-1 break-words sm:truncate">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3 min-w-0">
      <div className="text-xs text-subtle">{k}</div>
      <div className={`mt-1 font-medium ${mono ? "font-mono text-[12px] break-all" : "break-words"}`}>{v}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    PENDING: "bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.28)]",
    PAID: "bg-[rgba(16,185,129,.14)] border-[rgba(16,185,129,.25)]",
    FULFILLED: "bg-[rgba(16,185,129,.22)] border-[rgba(16,185,129,.35)]",
    EXPIRED: "bg-[rgba(239,68,68,.14)] border-[rgba(239,68,68,.25)]",
    FAILED: "bg-[rgba(239,68,68,.14)] border-[rgba(239,68,68,.25)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-2xl border px-3 py-1 text-xs ${
        map[status] || "border-soft bg-[rgba(255,255,255,.06)]"
      }`}
    >
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

function safePretty(x: any) {
  try {
    if (typeof x === "string") return JSON.stringify(JSON.parse(x), null, 2);
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}
