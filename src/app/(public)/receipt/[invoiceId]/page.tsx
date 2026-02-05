"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReceiptPage({ params }: { params: { invoiceId?: string } }) {
  const invoiceIdRaw = useMemo(() => {
    const v = params?.invoiceId ?? "";
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }, [params?.invoiceId]);

  const invoiceKey = useMemo(() => encodeURIComponent(invoiceIdRaw), [invoiceIdRaw]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!invoiceIdRaw) return;

    // backend: GET /v1/invoice/:invoiceId/receipt
    // apiFetch: prefix API_BASE (/v1), jadi path cukup "/invoice/..../receipt"
    const r = await apiFetch<any>(`/invoice/${invoiceKey}/receipt`);
    setData(r?.data ?? null);
  }, [invoiceIdRaw, invoiceKey]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setData(null);
        if (!invoiceIdRaw) return;
        await load();
      } catch (e: any) {
        setData(null);
        toast.error(e?.error || e?.message || "Receipt belum tersedia");
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceIdRaw, load]);

  const pretty = useMemo(() => safePretty(data), [data]);

  if (!invoiceIdRaw) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 border border-soft">
          <div className="text-xs text-subtle">Receipt</div>
          <div className="text-2xl font-semibold">Invoice ID kosong</div>
          <div className="mt-2 text-sm text-subtle">Buka halaman ini dari link receipt yang benar.</div>

          <div className="mt-6">
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <div className="card-glass rounded-2xl p-6 skeleton h-[240px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div className="card-glass rounded-2xl p-6 border border-soft shadow-soft">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs text-subtle">Receipt</div>
            <div className="text-2xl font-semibold truncate">{invoiceIdRaw}</div>
            <div className="text-sm text-subtle mt-1">
              Data dari endpoint <span className="font-mono">/invoice/:invoiceId/receipt</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
              onClick={() => load().then(() => toast.success("Refreshed")).catch((e: any) => {
                toast.error(e?.error || e?.message || "Gagal refresh");
              })}
            >
              Refresh
            </Button>
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali</Button>
            </Link>
          </div>
        </div>

        {!data ? (
          <div className="mt-6 text-sm text-subtle">
            Receipt belum tersedia (invoice belum <span className="font-medium">FULFILLED</span> atau transaksi belum muncul).
            Coba klik <span className="font-medium">Refresh</span> beberapa saat lagi.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-medium">JSON</div>
              <Button
                variant="secondary"
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pretty);
                    toast.success("Disalin");
                  } catch {
                    toast.error("Gagal copy (izin clipboard)");
                  }
                }}
              >
                Copy JSON
              </Button>
            </div>

            <pre className="text-xs bg-[rgba(255,255,255,.06)] border border-soft rounded-2xl p-4 overflow-auto max-h-[520px] whitespace-pre-wrap break-words">
              {pretty}
            </pre>

            <div className="text-xs text-subtle">
              Jika kosong terus padahal sudah bayar, cek admin: klik <span className="font-medium">Refetch Receipt</span>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function safePretty(x: any) {
  try {
    if (x == null) return "";
    if (typeof x === "string") {
      const j = JSON.parse(x);
      return JSON.stringify(j, null, 2);
    }
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}
