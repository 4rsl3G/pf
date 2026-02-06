"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Copy, ArrowLeft } from "lucide-react";

type AccessItem = { label: string; value: string };

function formatIDR(n: any) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(x)
    .replace(",00", "");
}

function pickFirst<T>(v: any): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] as T) || null;
  return v as T;
}

function extractItemsFromPremify(raw: any): AccessItem[] {
  const out: AccessItem[] = [];

  const accountDetails = raw?.account_details;
  if (!Array.isArray(accountDetails)) return out;

  for (const ad of accountDetails) {
    const details = Array.isArray(ad?.details) ? ad.details : [];
    for (const d of details) {
      const creds = Array.isArray(d?.credentials) ? d.credentials : [];
      for (const c of creds) {
        const label = String(c?.label || "").trim();
        const value = String(c?.value || "").trim();
        if (label && value) out.push({ label, value });
      }
    }
  }

  // dedupe (label+value)
  const seen = new Set<string>();
  return out.filter((x) => {
    const k = `${x.label}::${x.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function normalizeReceipt(anyResp: any) {
  // kemungkinan bentuk:
  // A) { success:true, data: {...} }
  // B) { success:true, data: [ {...} ] }
  // C) { success:true, message:"", data:[...] } (premify raw)
  const data = anyResp?.data ?? anyResp;
  const one = pickFirst<any>(data);

  if (!one) return null;

  // 1) format "normalized"
  const normalizedItems: AccessItem[] = Array.isArray(one?.access?.items)
    ? one.access.items.filter((x: any) => x?.label && x?.value)
    : [];

  // 2) format premify raw
  const premifyItems = extractItemsFromPremify(one);

  // product info: prefer normalized field -> fallback premify products[0]
  const p0 = Array.isArray(one?.products) ? one.products[0] : null;

  const productName = one?.productName ?? p0?.product_name ?? p0?.product ?? null;
  const variantName = one?.variantName ?? p0?.variant_name ?? null;

  const payAmount = one?.payAmount ?? one?.total_amount ?? null;
  const orderId = one?.premifyOrderId ?? one?.order_id ?? null;
  const invoiceId = one?.invoiceId ?? one?.invoice_id ?? null;

  return {
    invoiceId,
    productName,
    variantName,
    payAmount,
    premifyOrderId: orderId,
    items: normalizedItems.length ? normalizedItems : premifyItems,
    raw: one,
  };
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

  const [data, setData] = useState<ReturnType<typeof normalizeReceipt> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(opts?: { silent?: boolean }) {
    if (!invoiceId) return;
    const silent = !!opts?.silent;

    try {
      if (!silent) setRefreshing(true);

      const r = await apiFetch<any>(`/invoice/${encodeURIComponent(invoiceId)}/receipt`);
      const norm = normalizeReceipt(r);

      setData(norm);
      if (!norm) toast.error("Receipt belum tersedia");
    } catch (e: any) {
      setData(null);
      toast.error(e?.error || e?.message || "Receipt belum tersedia");
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

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-subtle">Receipt</div>
              <CardTitle className="text-lg sm:text-xl font-semibold truncate">{invoiceId}</CardTitle>
              <div className="text-xs text-subtle mt-1">Receipt belum tersedia. Klik refresh beberapa saat lagi.</div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button className="btn-soft rounded-2xl" onClick={() => router.back()} title="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button className="btn-brand rounded-2xl" onClick={() => load()} disabled={refreshing}>
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

  const items = (data.items || []).filter((x) => x.label && x.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4 pb-24">
      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-subtle">Receipt</div>

            <CardTitle className="mt-1 text-xl sm:text-2xl font-semibold leading-tight">
              <span className="block font-mono tracking-tight break-all sm:break-normal sm:whitespace-nowrap sm:truncate">
                {invoiceId}
              </span>
            </CardTitle>

            <div className="mt-2 text-xs text-subtle">
              Status: <b className="text-[rgb(var(--brand))]">Berhasil</b>
              {data.premifyOrderId ? (
                <>
                  <span className="opacity-40"> • </span>
                  <span className="break-all sm:break-normal">Order: {data.premifyOrderId}</span>
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

          <div className="flex gap-2 sm:justify-end">
            <Button className="btn-soft rounded-2xl" onClick={() => router.back()} title="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Button className="btn-soft rounded-2xl" onClick={() => load()} disabled={refreshing} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            <Link href="/" className="flex-1 sm:flex-none">
              <Button className="btn-brand rounded-2xl w-full sm:w-auto">Kembali ke Store</Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <section className="space-y-2">
            <div className="text-sm font-semibold">Produk</div>
            <Row label="Nama Produk" value={data.productName || "-"} />
            <Row label="Variant" value={data.variantName || "-"} />
          </section>

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

            {items.length === 0 ? (
              <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4 text-sm text-subtle">
                Akses belum tersedia.
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
