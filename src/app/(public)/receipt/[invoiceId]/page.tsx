"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ReceiptPage() {
  const params = useParams<{ invoiceId?: string }>();

  const invoiceIdRaw = useMemo(() => {
    const v = (params?.invoiceId ?? "") as string;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }, [params?.invoiceId]);

  const invoiceKey = useMemo(() => encodeURIComponent(invoiceIdRaw), [invoiceIdRaw]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    // apiFetch kamu sudah pakai API_BASE (/v1), jadi path cukup /invoice/...
    const r = await apiFetch<any>(`/invoice/${invoiceKey}/receipt`);
    setData(r?.data ?? null);
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceIdRaw, invoiceKey]);

  if (!invoiceIdRaw) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Invoice ID kosong</CardTitle>
            <CardDescription className="text-subtle">
              Buka halaman ini dari link receipt yang benar: <span className="font-mono">/receipt/INV-...</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 skeleton h-[240px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="card-glass rounded-2xl border-soft shadow-soft">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs text-subtle">Receipt</div>
              <div className="text-2xl font-semibold">{invoiceIdRaw}</div>
            </div>
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
            </Link>
          </div>
          <CardDescription className="text-subtle">
            Data dari Premify <span className="font-mono">/transactions</span> (muncul setelah status <b>FULFILLED</b>)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!data ? (
            <div className="text-sm text-subtle">
              Receipt belum tersedia. Coba refresh beberapa saat lagi.
            </div>
          ) : (
            <>
              <pre className="text-xs bg-[rgba(255,255,255,.06)] border border-soft rounded-2xl p-4 overflow-auto max-h-[520px]">
                {JSON.stringify(data, null, 2)}
              </pre>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    toast.success("Disalin");
                  }}
                >
                  Copy JSON
                </Button>

                <Button
                  variant="secondary"
                  className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                  onClick={() => load().catch(() => {})}
                >
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
