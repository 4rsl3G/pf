"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Copy, ArrowLeft } from "lucide-react";

type ReceiptApi = {
  invoiceId: string;
  status: "FULFILLED" | string;
  productName?: string | null;
  variantName?: string | null;
  payAmount?: number | null;
  premifyOrderId?: string | null;
  raw?: any;
  access?: {
    items?: { label: string; value: string }[];
    note?: string | null;
  };
};

function formatIDR(n: any) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(x)
    .replace(",00", "");
}

export default function ReceiptPage() {
  const params = useParams<{ invoiceId?: string }>();
  const router = useRouter();

  const invoiceId = useMemo(() => {
    try {
      return decodeURIComponent(params?.invoiceId || "");
    } catch {
      return params?.invoiceId || "";
    }
  }, [params?.invoiceId]);

  const [data, setData] = useState<ReceiptApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(opts?: { silent?: boolean }) {
    if (!invoiceId) return;

    const silent = !!opts?.silent;
    try {
      if (!silent) setRefreshing(true);
      const r = await apiFetch<{ success: true; data: ReceiptApi }>(
        `/invoice/${encodeURIComponent(invoiceId)}/receipt`
      );
      setData(r.data);
    } catch (e: any) {
      const msg = e?.error || e?.message || "Receipt belum tersedia";
      toast.error(msg);
      setData(null);
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    load({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  if (!invoiceId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Card className="card-glass border-soft rounded-2xl p-6">
          <div className="text-sm text-subtle">Invalid URL</div>
          <div className="text-xl font-semibold mt-1">Invoice ID kosong</div>
          <div className="mt-4 flex gap-2">
            <Button className="btn-soft rounded-2xl" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 skeleton h-[220px]" />
      </div>
    );
  }

  // kalau receipt belum tersedia atau error
  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <div className="text-xs text-subtle">Receipt</div>
              <CardTitle className="text-xl">{invoiceId}</CardTitle>
              <div className="text-xs text-subtle mt-1">
                Receipt belum tersedia atau gagal dimuat.
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="btn-soft rounded-2xl" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                className="btn-brand rounded-2xl"
                onClick={() => load()}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="btn-soft rounded-2xl w-full">Kembali ke Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = (data.access?.items || []).filter((x) => x?.label && x?.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4 pb-24">
      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-subtle">Receipt</div>
            <CardTitle className="text-2xl break-words">{invoiceId}</CardTitle>

            <div className="mt-1 text-xs text-subtle">
              Status: <b className="text-[rgb(var(--brand))]">Berhasil</b>
              {data.premifyOrderId ? (
                <>
                  <span className="opacity-40"> • </span>
                  <span>Order: {data.premifyOrderId}</span>
                </>
              ) : null}
              {typeof data.payAmount === "number" ? (
                <>
                  <span className="opacity-40"> • </span>
                  <span>Nominal: {formatIDR(data.payAmount)}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button className="btn-soft rounded-2xl" onClick={() => router.back()} title="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              className="btn-soft rounded-2xl"
              onClick={() => load()}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* PRODUK */}
          <section className="space-y-2">
            <div className="text-sm font-semibold">Produk</div>
            <Row label="Nama Produk" value={data.productName || "-"} />
            <Row label="Variant" value={data.variantName || "-"} />
          </section>

          {/* AKSES */}
          <section className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Akses Akun</div>
              {items.length ? (
                <Button
                  className="btn-soft rounded-2xl h-9"
                  onClick={() => {
                    const text = items.map((x) => `${x.label}: ${x.value}`).join("\n");
                    navigator.clipboard.writeText(text);
                    toast.success("Semua akses disalin");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy all
                </Button>
              ) : null}
            </div>

            {data.access?.note ? (
              <div className="text-xs text-subtle">{data.access.note}</div>
            ) : null}

            {items.length === 0 ? (
              <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4 text-sm text-subtle">
                Akses belum tersedia. Klik <b>Refresh</b> beberapa saat lagi.
              </div>
            ) : (
              <div className="grid gap-2">
                {items.map((c, i) => (
                  <div
                    key={`${c.label}-${i}`}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-subtle">{c.label}</div>
                      <div className="font-medium break-words">{c.value}</div>
                    </div>

                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-black/[0.03] border border-soft hover:bg-black/[0.05] shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(c.value);
                        toast.success("Disalin");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
      <div className="text-xs text-subtle">{label}</div>
      <div className="font-medium text-right break-words">{value || "-"}</div>
    </div>
  );
}
