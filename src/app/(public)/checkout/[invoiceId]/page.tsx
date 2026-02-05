"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InvoicePublic = {
  invoiceId: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "EXPIRED" | "FAILED";
  payAmount: number;
  expiresAt: string;
  paidAt?: string | null;
  premifyOrderId?: string | null;
  publicToken?: string | null;
};

function apiOrigin() {
  // API_BASE biasanya: https://api.pansa.my.id/v1
  return API_BASE.replace(/\/v1$/, "");
}

export default function CheckoutInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId;

  const [inv, setInv] = useState<InvoicePublic | null>(null);
  const [loading, setLoading] = useState(true);

  const pollAbortRef = useRef<AbortController | null>(null);

  const qrisUrl = useMemo(() => {
    if (!inv?.publicToken) return null;
    return `${process.env.NEXT_PUBLIC_WEB_BASE || ""}/qris/payment/${inv.publicToken}`;
  }, [inv?.publicToken]);

  const qrisImgSrc = useMemo(() => {
    if (!inv?.publicToken) return null;
    // no cache
    return `${apiOrigin()}/qris/payment/${inv.publicToken}?t=${Date.now()}`;
  }, [inv?.publicToken]);

  async function load() {
    if (!invoiceId) return;
    const r = await apiFetch<{ success: true; data: InvoicePublic }>(`/invoice/${invoiceId}/public`);
    setInv(r.data);
  }

  // initial load
  useEffect(() => {
    if (!invoiceId) return;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        toast.error(e?.error || e?.message || "Invoice tidak ditemukan");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // SSE realtime
  useEffect(() => {
    if (!invoiceId) return;

    const es = new EventSource(`${apiOrigin()}/v1/sse/invoice/${encodeURIComponent(invoiceId)}`);

    es.addEventListener("invoice:update", async () => {
      try {
        await load();
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // long poll fallback (server do mutasi checks)
  useEffect(() => {
    if (!invoiceId) return;
    if (!inv) return;

    // stop long poll jika bukan PENDING
    if (inv.status !== "PENDING") {
      pollAbortRef.current?.abort();
      pollAbortRef.current = null;
      return;
    }

    // abort previous poll (kalau re-render)
    pollAbortRef.current?.abort();
    const ac = new AbortController();
    pollAbortRef.current = ac;

    (async () => {
      try {
        // endpoint long-poll kamu: /v1/checkout/:invoiceId/poll (nama bagus)
        const r = await apiFetch<any>(
          `/checkout/${encodeURIComponent(invoiceId)}/status?timeoutMs=120000`,
          { method: "GET", signal: ac.signal as any }
        );

        if (ac.signal.aborted) return;

        // refresh state after result
        await load();

        const st = r?.status;
        if (st === "FULFILLED") toast.success("Pembayaran sukses, pesanan diproses!");
        if (st === "EXPIRED") toast.error("Invoice expired.");
        if (st === "FAILED") toast.error("Pesanan gagal diproses.");
      } catch (e: any) {
        // kalau timeout / aborted, ignore — SSE masih jalan
      }
    })();

    return () => {
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv?.status, invoiceId]);

  if (!invoiceId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Invalid URL</div>
          <div className="text-xl font-semibold mt-1">Invoice ID tidak ditemukan</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 skeleton h-[260px]" />
      </div>
    );
  }

  if (!inv) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_.9fr] items-start">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-6 border-soft shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-subtle">Invoice</div>
              <div className="text-2xl font-semibold mt-1">{inv.invoiceId}</div>
              <div className="text-sm text-subtle mt-1">
                Nominal unik:{" "}
                <span className="font-semibold text-[rgba(16,185,129,.95)]">
                  Rp {inv.payAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <StatusBadge status={inv.status} />
          </div>

          <div className="mt-5 grid gap-3">
            <div className="card-glass rounded-2xl p-4 border-soft">
              <div className="text-xs text-subtle">Batas waktu</div>
              <div className="font-medium mt-1">{new Date(inv.expiresAt).toLocaleString("id-ID")}</div>
              <div className="text-xs text-subtle mt-1">QR akan hilang otomatis setelah paid/expired.</div>
            </div>

            {inv.status === "FULFILLED" ? (
              <div className="flex gap-3 flex-wrap">
                <Link href={`/receipt/${inv.invoiceId}`}>
                  <Button className="btn-brand rounded-2xl">Lihat Receipt / Akun</Button>
                </Link>
                {inv.premifyOrderId ? (
                  <Badge variant="secondary" className="bg-[rgba(255,255,255,.06)] border-soft">
                    Premify Order: {inv.premifyOrderId}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-6 border-soft shadow-soft">
          <div className="text-sm text-subtle">QRIS</div>
          <div className="text-xl font-semibold mt-1">Scan untuk bayar</div>

          {inv.status !== "PENDING" ? (
            <div className="mt-6 text-sm text-subtle">
              QR sudah tidak tersedia (status: {inv.status}). Silakan cek receipt jika sudah fulfilled.
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl overflow-hidden border border-soft bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrisImgSrc!} alt="QRIS" className="w-full h-auto" />
              </div>

              <div className="mt-4 flex gap-3 flex-wrap">
                {qrisUrl ? (
                  <Button
                    variant="secondary"
                    className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                    onClick={() => {
                      navigator.clipboard.writeText(qrisUrl);
                      toast.success("Link QR disalin");
                    }}
                  >
                    Copy Link QR
                  </Button>
                ) : null}

                <Button
                  className="btn-brand rounded-2xl"
                  onClick={async () => {
                    await load();
                    toast("Refresh status...");
                  }}
                >
                  Refresh
                </Button>
              </div>

              <div className="mt-4 text-xs text-subtle">
                Sistem akan cek mutasi otomatis. Jangan tutup halaman ini saat membayar.
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    PENDING: "bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.28)] text-[rgb(var(--text))]",
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