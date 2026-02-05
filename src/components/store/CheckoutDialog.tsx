"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CheckoutDialog({ product }: any) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [emailInvite, setEmailInvite] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);

  const chosen = useMemo(() => product.variants?.find((x: any) => x.id === variantId), [product, variantId]);

  const needEmail = useMemo(() => String(chosen?.type || "").toLowerCase().includes("invite"), [chosen]);

  async function onCheckout() {
    try {
      setLoading(true);

      const idem = cryptoRandom(18);
      const r = await apiFetch<any>("/checkout", {
        method: "POST",
        headers: { "X-Idempotency-Key": idem },
        body: JSON.stringify({
          variantId,
          quantity: 1,
          voucherCode: voucherCode || undefined,
          emailInvite: needEmail ? (emailInvite || undefined) : undefined
        })
      });

      const invoiceId = r?.data?.invoiceId;
      if (!invoiceId) throw new Error("NO_INVOICE_ID");

      toast.success("Invoice dibuat. Silakan scan QRIS.");
      setOpen(false);
      router.push(`/checkout/${invoiceId}`);
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Checkout gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-brand rounded-2xl">Beli</Button>
      </DialogTrigger>

      <DialogContent className="card-glass border-soft text-[rgb(var(--text))]">
        <DialogHeader>
          <DialogTitle>Checkout — {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Varian</Label>
            <div className="grid gap-2">
              {product.variants?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  className={[
                    "w-full text-left rounded-2xl border p-3 transition",
                    variantId === v.id
                      ? "border-[rgba(16,185,129,.45)] bg-[rgba(16,185,129,.10)]"
                      : "border-soft bg-[rgba(255,255,255,.04)] hover:bg-[rgba(255,255,255,.06)]"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{v.name}</div>
                      <div className="text-xs text-subtle">
                        {v.duration} • {v.type} • Garansi {v.warranty}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Rp {Number(v.price).toLocaleString("id-ID")}</div>
                      <div className="text-xs text-subtle">Stock {v.stock ?? "-"}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[rgba(16,185,129,.12)] border border-[rgba(16,185,129,.18)]">
              Realtime verifikasi mutasi
            </Badge>
            <Badge variant="secondary" className="bg-[rgba(255,255,255,.06)] border-soft">
              QR URL tanpa ekstensi
            </Badge>
          </div>

          {needEmail ? (
            <div className="grid gap-2">
              <Label>Email Invite (wajib)</Label>
              <Input
                value={emailInvite}
                onChange={(e) => setEmailInvite(e.target.value)}
                placeholder="email@contoh.com"
                className="bg-[rgba(255,255,255,.06)] border-soft rounded-2xl"
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label>Voucher (opsional)</Label>
            <Input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="PROMONYTA"
              className="bg-[rgba(255,255,255,.06)] border-soft rounded-2xl"
            />
          </div>

          <Button
            disabled={loading || !variantId || (needEmail && !emailInvite)}
            onClick={onCheckout}
            className="btn-brand rounded-2xl w-full"
          >
            {loading ? "Membuat invoice..." : "Buat Invoice & QRIS"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cryptoRandom(len = 16) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}