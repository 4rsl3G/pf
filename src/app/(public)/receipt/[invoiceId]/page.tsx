"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReceiptPage({ params }: { params: { invoiceId: string } }) {
  const invoiceId = params.invoiceId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await apiFetch<any>(`/invoice/${invoiceId}/receipt`);
        setData(r.data);
      } catch (e: any) {
        toast.error(e?.error || e?.message || "Receipt belum tersedia");
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 skeleton h-[240px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card-glass rounded-2xl p-6 border-soft shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-subtle">Receipt</div>
            <div className="text-2xl font-semibold">{invoiceId}</div>
          </div>
          <Link href="/">
            <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
          </Link>
        </div>

        {!data ? (
          <div className="mt-6 text-sm text-subtle">
            Receipt belum tersedia. Coba refresh beberapa saat lagi.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="text-sm text-subtle">Detail dari Premify /transactions</div>

            <pre className="text-xs bg-[rgba(255,255,255,.06)] border border-soft rounded-2xl p-4 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>

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
          </div>
        )}
      </div>
    </div>
  );
}