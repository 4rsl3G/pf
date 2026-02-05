"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
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
  const x = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(x)
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

function minPrice(p: Product) {
  const arr = (p.variants || [])
    .map((v) => Number(v.price || 0))
    .filter((x) => Number.isFinite(x) && x > 0);
  return arr.length ? Math.min(...arr) : 0;
}

function totalStock(p: Product) {
  return (p.variants || []).reduce((a, v) => a + (Number(v.stock || 0) || 0), 0);
}

export default function ProductDetailPage() {
  const params = useParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params?.productId)
    ? params?.productId[0]
    : params?.productId;

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

  if (!productId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Invalid URL</div>
          <div className="text-xl font-semibold mt-1">Product ID tidak ditemukan</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <div className="card-glass rounded-2xl p-6 border-soft">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40 mt-3" />
            <Skeleton className="h-24 w-full mt-6" />
          </div>
          <div className="card-glass rounded-2xl p-6 border-soft">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-28 w-full mt-4" />
            <Skeleton className="h-28 w-full mt-3" />
            <Skeleton className="h-11 w-full mt-5" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !chosen) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Tidak ditemukan</div>
          <div className="text-xl font-semibold mt-1">Produk tidak tersedia</div>
        </div>
      </div>
    );
  }

  const img = resolveImg(product.image);
  const pMin = minPrice(product);
  const pStock = totalStock(product);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_.92fr] items-start">
        {/* LEFT */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative card-glass rounded-2xl border-soft shadow-soft overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_0%,rgba(16,185,129,.12),transparent_45%)]" />
            </div>

            <div className="p-6 relative">
              <div className="flex items-start gap-5">
                <div className="h-16 w-16 rounded-2xl overflow-hidden border border-soft bg-[rgba(255,255,255,.06)] shrink-0 grid place-items-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-xs text-subtle">APP</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                      {product.name}
                    </h1>

                    {product.category ? (
                      <Badge className="badge-soft h-8 px-3 inline-flex items-center">
                        {product.category}
                      </Badge>
                    ) : null}

                    <span
                      className={[
                        "h-8 px-3 inline-flex items-center rounded-xl border text-[11px] font-semibold",
                        pStock > 0
                          ? "border-[rgba(16,185,129,.22)] bg-[rgba(16,185,129,.10)] text-[rgba(167,243,208,.95)]"
                          : "border-[rgba(239,68,68,.22)] bg-[rgba(239,68,68,.10)] text-[rgba(254,202,202,.95)]",
                      ].join(" ")}
                    >
                      {pStock > 0 ? `Stok ${pStock}` : "Habis"}
                    </span>
                  </div>

                  {product.description ? (
                    <p className="mt-3 text-subtle leading-relaxed">{product.description}</p>
                  ) : null}

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4">
                      <div className="text-xs text-dim">Mulai dari</div>
                      <div className="mt-1 font-extrabold text-[rgb(var(--brand))]">
                        {pMin ? formatIDR(pMin) : "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4">
                      <div className="text-xs text-dim">Varian</div>
                      <div className="mt-1 font-extrabold">{product.variants?.length || 0}</div>
                    </div>
                    <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4">
                      <div className="text-xs text-dim">Kategori</div>
                      <div className="mt-1 font-extrabold">{product.category || "Digital"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 divider-soft" />
              <div className="mt-5 text-xs text-subtle">
                Pilih varian yang sesuai, lalu lanjutkan checkout.
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-20">
          <div className="card-glass rounded-2xl p-6 border-soft shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-subtle">Pilih Varian</div>
                <div className="text-xl font-extrabold mt-1">Opsi tersedia</div>
              </div>
              <Badge className="badge-soft h-9 px-3 inline-flex items-center">
                {formatIDR(chosen.price)}
              </Badge>
            </div>

            <div className="mt-4 grid gap-2">
              {product.variants.map((v) => {
                const active = variantId === v.id;
                const sold = Number(v.stock || 0) <= 0;

                return (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={[
                      "w-full text-left rounded-2xl border p-4 transition",
                      active
                        ? "border-[rgba(16,185,129,.45)] bg-[rgba(16,185,129,.10)]"
                        : "border-soft bg-[rgba(255,255,255,.04)] hover:bg-[rgba(255,255,255,.06)]",
                      sold ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">{v.name}</div>
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
                        <div className="font-extrabold text-[rgb(var(--brand))]">
                          {formatIDR(v.price)}
                        </div>
                        <div className="text-xs text-subtle mt-1">
                          Stok {v.stock ?? "-"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4">
              <div className="text-xs text-dim">Total</div>
              <div className="mt-1 text-2xl font-extrabold">{formatIDR(chosen.price)}</div>

              <div className="mt-4">
                {/* sync varian terpilih */}
<CheckoutDialog
  product={product}
  defaultVariantId={variantId}
  disabled={Number(chosen.stock || 0) <= 0}
  label={Number(chosen.stock || 0) <= 0 ? "Habis" : "Lanjutkan"}
  className="w-full btn-brand rounded-2xl h-11"
  triggerVariant="default"
/>
              </div>

              <div className="mt-3 text-xs text-subtle">
                Lanjutkan untuk membuat invoice dan pembayaran.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
