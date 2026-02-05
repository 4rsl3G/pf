"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Variant = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  type?: string;
  warranty?: string;
  stock?: number;
};

type Product = {
  id: string;
  name: string;
  variants?: Variant[];
};

type Props = {
  product: Product;

  // ✅ NEW: dipakai dari ProductDetailPage
  defaultVariantId?: string;

  // optional UI
  disabled?: boolean;
  label?: string;
  className?: string;

  // optional: style trigger
  triggerVariant?: "default" | "secondary" | "ghost";
};

export default function CheckoutDialog({
  product,
  defaultVariantId,
  disabled = false,
  label = "Beli",
  className,
  triggerVariant = "default",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const firstId = product.variants?.[0]?.id || "";
  const [variantId, setVariantId] = useState(defaultVariantId || firstId);

  const [emailInvite, setEmailInvite] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ sync ketika parent berubah (klik varian di detail page)
  useEffect(() => {
    const next = defaultVariantId || firstId;
    if (!next) return;
    setVariantId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultVariantId, product?.id]);

  // ✅ reset input tiap buka (lebih clean)
  useEffect(() => {
    if (!open) return;
    setEmailInvite("");
    setVoucherCode("");
  }, [open]);

  const chosen = useMemo(
    () => product.variants?.find((x) => x.id === variantId),
    [product, variantId]
  );

  const needEmail = useMemo(
    () => String(chosen?.type || "").toLowerCase().includes("invite"),
    [chosen]
  );

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
          emailInvite: needEmail ? (emailInvite || undefined) : undefined,
        }),
      });

      const invoiceId = r?.data?.invoiceId;
      if (!invoiceId) throw new Error("NO_INVOICE_ID");

      toast.success("Invoice dibuat");
      setOpen(false);
      router.push(`/checkout/${invoiceId}`);
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Checkout gagal");
    } finally {
      setLoading(false);
    }
  }

  const TriggerBtn =
    triggerVariant === "secondary" ? (
      <Button
        variant="secondary"
        className={className || "rounded-2xl"}
        disabled={disabled}
      >
        {label}
      </Button>
    ) : triggerVariant === "ghost" ? (
      <Button
        variant="ghost"
        className={className || "rounded-2xl"}
        disabled={disabled}
      >
        {label}
      </Button>
    ) : (
      <Button className={className || "btn-brand rounded-2xl"} disabled={disabled}>
        {label}
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{TriggerBtn}</DialogTrigger>

      <DialogContent className="card-glass border-soft text-[rgb(var(--text))]">
        <DialogHeader>
          <DialogTitle>Checkout — {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* VARIANTS */}
          <div className="grid gap-2">
            <Label>Varian</Label>

            <div className="grid gap-2">
              {product.variants?.map((v) => {
                const active = variantId === v.id;
                const sold = Number(v.stock || 0) <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    className={[
                      "w-full text-left rounded-2xl border p-3 transition",
                      active
                        ? "border-[rgba(16,185,129,.45)] bg-[rgba(16,185,129,.10)]"
                        : "border-soft bg-[rgba(255,255,255,.04)] hover:bg-[rgba(255,255,255,.06)]",
                      sold ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">{v.name}</div>
                          {sold ? (
                            <span className="badge-danger px-3 h-7 inline-flex items-center text-[11px] font-bold">
                              Habis
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs text-subtle mt-1">
                          {v.duration ? <span>{v.duration}</span> : null}
                          {v.duration && v.type ? <span> • </span> : null}
                          {v.type ? <span>{v.type}</span> : null}
                          {v.warranty ? <span> • Garansi {v.warranty}</span> : null}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-semibold">
                          Rp {Number(v.price || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="text-xs text-subtle">
                          Stok {v.stock ?? "-"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EMAIL (if invite) */}
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

          {/* VOUCHER */}
          <div className="grid gap-2">
            <Label>Voucher (opsional)</Label>
            <Input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="PROMONYTA"
              className="bg-[rgba(255,255,255,.06)] border-soft rounded-2xl"
            />
          </div>

          {/* CTA */}
          <Button
            disabled={
              disabled ||
              loading ||
              !variantId ||
              Number(chosen?.stock || 0) <= 0 ||
              (needEmail && !emailInvite)
            }
            onClick={onCheckout}
            className="btn-brand rounded-2xl w-full h-11"
          >
            {loading ? "Memproses..." : "Buat Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cryptoRandom(len = 16) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
