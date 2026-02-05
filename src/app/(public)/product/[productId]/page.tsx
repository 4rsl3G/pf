"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CheckoutDialog from "@/components/store/CheckoutDialog";

type Variant = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  type?: string;
  warranty?: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description?: string;
  image?: string | null;
  variants: Variant[];
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(Number(n || 0))
    .replace(",00", "");
}

function apiOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  return base.replace(/\/v1$/, "");
}

function resolveImg(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const origin = apiOrigin();
  return origin ? `${origin}${src}` : src;
}

export default function ProductDetailPage() {
  const params = useParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params?.productId) ? params?.productId[0] : params?.productId;

  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    (async () => {
      try {
        setLoading(true);
        const r = await apiFetch<{ data: Product[] }>("/products");
        const p = r.data.find((x) => x.id === productId) || null;
        setProduct(p);
        setVariantId(p?.variants?.[0]?.id || "");
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const chosen = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === variantId) || product.variants[0] || null;
  }, [product, variantId]);

  const totalStock = useMemo(() => {
    if (!product) return 0;
    return product.variants.reduce((a, v) => a + (Number(v.stock || 0) || 0), 0);
  }, [product]);

  const minPrice = useMemo(() => {
    if (!product) return 0;
    const arr = product.variants.map((v) => Number(v.price || 0)).filter((x) => Number.isFinite(x) && x > 0);
    return arr.length ? Math.min(...arr) : 0;
  }, [product]);

  if (!productId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Invalid URL</div>
          <div className="text-xl font-semibold mt-1">Product ID tidak ditemukan</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="mt-4 grid gap-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product || !chosen) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Tidak ditemukan</div>
          <div className="text-xl font-semibold mt-1">Produk tidak tersedia</div>
          <div className="mt-4">
            <Button className="btn-brand rounded-2xl" onClick={() => router.push("/")}>
              Kembali
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const img = resolveImg(product.image);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-28">
      {/* HERO CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass rounded-2xl border-soft overflow-hidden"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* icon/image */}
            <div className="h-16 w-16 rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] overflow-hidden shrink-0 grid place-items-center">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-xs text-subtle">APP</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{product.name}</h1>
                <Badge className="rounded-xl bg-[rgba(255,255,255,.06)] border-soft text-[11px]">
                  {product.category}
                </Badge>
                <span
                  className={`inline-flex items-center rounded-xl border px-2 py-1 text-[11px] ${
                    totalStock > 0
                      ? "border-[rgba(16,185,129,.25)] bg-[rgba(16,185,129,.10)] text-[rgba(167,243,208,.95)]"
                      : "border-[rgba(239,68,68,.25)] bg-[rgba(239,68,68,.10)] text-[rgba(254,202,202,.95)]"
                  }`}
                >
                  {totalStock > 0 ? `Stok ${totalStock}` : "Habis"}
                </span>
              </div>

              {product.description ? (
                <div className="mt-3 prose-tight text-subtle max-w-2xl">
                  {product.description}
                </div>
              ) : null}
            </div>
          </div>

          {/* VARIANTS */}
          <div className="mt-5">
            <div className="text-xs text-subtle mb-2">Pilih varian</div>

            <div className="grid gap-2">
              {product.variants.map((v) => {
                const active = v.id === variantId;
                const disabled = Number(v.stock || 0) <= 0;

                return (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={disabled}
                    className={[
                      "w-full text-left rounded-2xl border p-4 transition",
                      active
                        ? "border-[rgba(16,185,129,.45)] bg-[rgba(16,185,129,.10)]"
                        : "border-soft bg-[rgba(255,255,255,.04)] hover:bg-[rgba(255,255,255,.06)]",
                      disabled ? "opacity-60 cursor-not-allowed" : ""
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{v.name}</div>
                        <div className="mt-1 text-xs text-subtle">
                          {(v.duration || "—")} • {(v.type || "—")}
                          {v.warranty ? ` • Garansi ${v.warranty}` : ""}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-semibold">{formatIDR(v.price)}</div>
                        <div className="text-xs text-subtle">Stok {v.stock ?? "-"}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* footer hint */}
        <div className="px-5 sm:px-6 py-3 border-t border-[rgba(255,255,255,.06)] text-xs text-subtle">
          Mulai dari <span className="font-semibold text-[rgba(16,185,129,.95)]">{formatIDR(minPrice)}</span> • Pembayaran via QRIS (verifikasi otomatis)
        </div>
      </motion.div>

      {/* STICKY BUY BAR */}
      <div className="fixed left-0 right-0 bottom-0 z-50">
        <div className="bg-[rgba(7,12,10,.72)] backdrop-blur-xl border-t border-soft">
          <div className="mx-auto max-w-5xl px-4 py-3 safe-bottom">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-subtle">Total</div>
                <div className="font-semibold truncate">
                  {chosen ? formatIDR(chosen.price) : "—"}
                </div>
              </div>

              <CheckoutDialog
                product={product}
                defaultVariantId={variantId}
                disabled={Number(chosen.stock || 0) <= 0}
                label={Number(chosen.stock || 0) <= 0 ? "Habis" : "Lanjut Checkout"}
                className="btn-brand rounded-2xl h-11 px-5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
