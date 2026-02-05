"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";

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
  category?: string | null;
  description?: string | null;
  image?: string | null;
  variants?: Variant[];
};

type Props = {
  product: Product;

  /** Mode B support */
  label?: string; // default "Beli"
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
};

function formatIDR(n: number) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(x)
    .replace(",00", "");
}

export default function CheckoutDialog({
  product,
  label = "Beli",
  triggerVariant = "default",
  className,
  disabled,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [emailInvite, setEmailInvite] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);

  const chosen = useMemo(
    () => product.variants?.find((x) => x.id === variantId),
    [product, variantId]
  );

  const needEmail = useMemo(() => {
    const t = String(chosen?.type || "").toLowerCase();
    return t.includes("invite");
  }, [chosen]);

  const outOfStock = useMemo(() => {
    const s = Number(chosen?.stock ?? 0);
    // kalau tidak ada stock field, anggap available
    if (chosen?.stock === undefined || chosen?.stock === null) return false;
    return s <= 0;
  }, [chosen]);

  async function onCheckout() {
    try {
      if (!variantId) return;
      if (needEmail && !emailInvite.trim()) {
        toast.error("Email wajib diisi untuk varian ini.");
        return;
      }
      if (outOfStock) {
        toast.error("Stok varian ini sudah habis.");
        return;
      }

      setLoading(true);

      const idem = cryptoRandom(18);
      const r = await apiFetch<any>("/checkout", {
        method: "POST",
        headers: { "X-Idempotency-Key": idem },
        body: JSON.stringify({
          variantId,
          quantity: 1,
          voucherCode: voucherCode?.trim() ? voucherCode.trim() : undefined,
          emailInvite: needEmail ? emailInvite.trim() : undefined,
        }),
      });

      const invoiceId = r?.data?.invoiceId;
      if (!invoiceId) throw new Error("NO_INVOICE_ID");

      toast.success("Invoice dibuat.");
      setOpen(false);
      router.push(`/checkout/${invoiceId}`);
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Checkout gagal");
    } finally {
      setLoading(false);
    }
  }

  const triggerClasses =
    triggerVariant === "secondary"
      ? "rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.09)]"
      : triggerVariant === "outline"
      ? "rounded-2xl border border-soft bg-transparent hover:bg-[rgba(255,255,255,.06)]"
      : triggerVariant === "ghost"
      ? "rounded-2xl bg-transparent hover:bg-[rgba(255,255,255,.06)]"
      : "btn-brand rounded-2xl";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant === "default" ? "default" : "secondary"}
          className={[triggerClasses, className].filter(Boolean).join(" ")}
          disabled={disabled}
        >
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="card-glass border-soft text-[rgb(var(--text))] max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[rgba(255,255,255,.06)]">
          <DialogTitle className="text-lg">
            Checkout — <span className="font-extrabold">{product.name}</span>
          </DialogTitle>

          <div className="mt-2 flex flex-wrap gap-2">
            {product.category ? (
              <Badge className="badge-soft px-3 h-9 inline-flex items-center">
                {product.category}
              </Badge>
            ) : null}
            <Badge className="badge-success px-3 h-9 inline-flex items-center">
              Pembayaran QRIS
            </Badge>
            <Badge className="badge-soft px-3 h-9 inline-flex items-center">
              Link aman
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Variants */}
          <div className="grid gap-2">
            <Label className="text-sm">Pilih Varian</Label>

            <div className="grid gap-2">
              {product.variants?.map((v) => {
                const active = variantId === v.id;
                const vSold = v.stock !== undefined && Number(v.stock) <= 0;

                return (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={[
                      "w-full text-left rounded-2xl border p-4 transition",
                      active
                        ? "border-[rgba(16,185,129,.45)] bg-[rgba(16,185,129,.10)]"
                        : "border-soft bg-[rgba(255,255,255,.04)] hover:bg-[rgba(255,255,255,.06)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">{v.name}</div>
                          {vSold ? (
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
                        <div className="font-extrabold text-[rgb(var(--brand))]">
                          {formatIDR(v.price)}
                        </div>
                        <div className="text-xs text-subtle mt-1">
                          {v.stock !== undefined ? `Stok ${v.stock}` : "Stok tersedia"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extra input */}
          {needEmail ? (
            <div className="grid gap-2">
              <Label className="text-sm">Email</Label>
              <Input
                value={emailInvite}
                onChange={(e) => setEmailInvite(e.target.value)}
                placeholder="email@contoh.com"
                className="bg-[rgba(255,255,255,.06)] border-soft rounded-2xl h-11"
              />
              <div className="text-xs text-dim">
                Gunakan email yang aktif untuk proses aktivasi.
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label className="text-sm">Voucher (opsional)</Label>
            <Input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="PROMONYTA"
              className="bg-[rgba(255,255,255,.06)] border-soft rounded-2xl h-11"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[rgba(255,255,255,.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-dim">Total</div>
              <div className="text-xl font-extrabold">
                {chosen?.price ? formatIDR(chosen.price) : "—"}
              </div>
            </div>

            <Button
              disabled={
                disabled ||
                loading ||
                !variantId ||
                outOfStock ||
                (needEmail && !emailInvite.trim())
              }
              onClick={onCheckout}
              className="btn-brand rounded-2xl px-6 h-11"
            >
              {loading ? "Memproses..." : "Buat Invoice"}
            </Button>
          </div>

          {outOfStock ? (
            <div className="mt-3 text-xs text-dim">
              Varian terpilih sedang habis. Silakan pilih varian lain.
            </div>
          ) : null}
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
