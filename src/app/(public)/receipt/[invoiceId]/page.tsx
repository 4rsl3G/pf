"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ReceiptPage() {
  const params = useParams<{ invoiceId?: string }>();

  const invoiceId = useMemo(() => {
    try {
      return decodeURIComponent(params?.invoiceId || "");
    } catch {
      return params?.invoiceId || "";
    }
  }, [params?.invoiceId]);

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;

    (async () => {
      try {
        setLoading(true);
        const r = await apiFetch<any>(`/invoice/${encodeURIComponent(invoiceId)}/receipt`);
        // kalau backend masih array → ambil index 0
        setReceipt(Array.isArray(r.data) ? r.data[0] : r.data);
      } catch (e: any) {
        toast.error("Receipt belum tersedia");
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  if (!invoiceId) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="card-glass border-soft rounded-2xl p-6">
          <div className="text-xl font-semibold">Invoice ID kosong</div>
          <Link href="/">
            <Button className="btn-brand mt-4 rounded-2xl">Kembali ke Store</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="card-glass rounded-2xl p-6 skeleton h-[200px]" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="card-glass border-soft rounded-2xl p-6">
          <div className="text-sm text-subtle">
            Receipt belum tersedia. Silakan refresh beberapa saat lagi.
          </div>
        </Card>
      </div>
    );
  }

  const product = receipt.products?.[0];
  const account = receipt.account_details?.[0]?.details?.[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="text-xs text-subtle">Receipt</div>
            <CardTitle className="text-2xl">{invoiceId}</CardTitle>
            <div className="mt-1 text-xs text-subtle">
              Status: <b className="text-green-600">Berhasil</b>
            </div>
          </div>

          <Link href="/">
            <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* PRODUK */}
          <div className="space-y-2">
            <div className="text-sm font-semibold">Produk</div>

            <Row label="Nama Produk" value={product?.product_name} />
            <Row label="Variant" value={product?.variant_name} />
            <Row label="Tipe" value={product?.type} />
            <Row label="Durasi" value={product?.duration} />
          </div>

          {/* AKSES AKUN */}
          <div className="space-y-2 pt-4">
            <div className="text-sm font-semibold">Akses Akun</div>

            {account?.credentials?.map((c: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3"
              >
                <div>
                  <div className="text-xs text-subtle">{c.label}</div>
                  <div className="font-medium">{c.value}</div>
                </div>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
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
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
      <div className="text-xs text-subtle">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}
