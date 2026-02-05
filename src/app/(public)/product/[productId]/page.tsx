"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Variant = {
  id: string;
  name: string;
  price: number;
  duration: string;
  type: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  image?: string | null;
  variants: Variant[];
};

export default function ProductDetailPage() {
  const params = useParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params?.productId) ? params?.productId[0] : params?.productId;

  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    (async () => {
      try {
        setLoading(true);
        const r = await apiFetch<{ data: Product[] }>("/products");
        const p = r.data.find((x) => x.id === productId) || null;
        setProduct(p);
        setVariant(p?.variants?.[0] || null);
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (!productId) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Invalid URL</div>
          <div className="text-xl font-semibold mt-1">Product ID tidak ditemukan</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!product || !variant) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="card-glass rounded-2xl p-6 border-soft">
          <div className="text-sm text-subtle">Tidak ditemukan</div>
          <div className="text-xl font-semibold mt-1">Produk tidak tersedia</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 grid gap-6 lg:grid-cols-[1fr_.9fr]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        <Badge className="mt-2">{product.category}</Badge>
        <p className="mt-4 text-subtle">{product.description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass rounded-2xl p-6 border-soft"
      >
        <div className="text-sm text-subtle">Pilih Variant</div>

        <div className="mt-3 grid gap-2">
          {product.variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v)}
              className={`rounded-xl border p-3 text-left transition ${
                variant?.id === v.id
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-soft hover:bg-white/5"
              }`}
            >
              <div className="font-medium">{v.name}</div>
              <div className="text-xs text-subtle">
                {v.duration} • {v.type} • Stock {v.stock}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-sm text-subtle">Harga</div>
          <div className="text-3xl font-semibold mt-1">
            Rp {variant.price.toLocaleString("id-ID")}
          </div>
        </div>

        <Button
          className="btn-brand w-full mt-6 rounded-2xl"
          disabled={variant.stock <= 0}
          onClick={async () => {
            try {
              const r = await apiFetch<any>("/checkout", {
                method: "POST",
                body: JSON.stringify({ variantId: variant.id }),
              });
              router.push(`/checkout/${r.data.invoiceId}`);
            } catch (e: any) {
              toast.error(e?.message || "Gagal checkout");
            }
          }}
        >
          Beli Sekarang
        </Button>
      </motion.div>
    </div>
  );
}