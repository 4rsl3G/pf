"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  image?: string | null; // from backend: product.image
  variants: Variant[];
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function minPrice(p: Product) {
  const arr = (p.variants || []).map((v) => Number(v.price || 0)).filter((x) => Number.isFinite(x) && x > 0);
  return arr.length ? Math.min(...arr) : 0;
}

function totalStock(p: Product) {
  return (p.variants || []).reduce((a, v) => a + (Number(v.stock || 0) || 0), 0);
}

function apiOrigin(API_BASE: string) {
  // API_BASE biasanya: https://api.xxx/v1
  return API_BASE.replace(/\/v1$/, "");
}

function resolveProductImage(img: string | null | undefined) {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  // img = "/uploads/..."
  const base = process.env.NEXT_PUBLIC_API_BASE || ""; // fallback kalau lib/api tidak expose
  const origin = base ? apiOrigin(base) : ""; // kalau kosong, biarkan relative
  return origin ? `${origin}${img}` : img;
}

export default function ProductGrid() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await apiFetch<{ data: Product[] }>("/products");
        setItems(r.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    // optional: sort by category/name
    const sorted = [...items].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return sorted;
  }, [items]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="card-glass rounded-2xl p-5 border-soft">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24 mt-2" />
              </div>
            </div>
            <Skeleton className="h-12 w-full mt-4 rounded-xl" />
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="card-glass rounded-2xl p-6 border-soft text-sm text-subtle">
        Produk belum tersedia.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((p, idx) => {
        const price = minPrice(p);
        const stock = totalStock(p);
        const img = resolveProductImage(p.image);

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.25) }}
            className="group card-glass rounded-2xl border-soft shadow-soft overflow-hidden"
          >
            {/* TOP */}
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="h-14 w-14 rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] overflow-hidden shrink-0 grid place-items-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="w-full h-full object-cover block" />
                  ) : (
                    <div className="text-xs text-subtle">APP</div>
                  )}
                </div>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-tight truncate">{p.name}</h3>
                    <Badge className="hidden sm:inline-flex rounded-xl bg-[rgba(255,255,255,.06)] border-soft text-[11px]">
                      {p.category}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-subtle line-clamp-2">
                    {p.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-xl border border-soft bg-[rgba(255,255,255,.05)] px-2 py-1 text-[11px] text-subtle">
                      {p.variants?.length || 0} varian
                    </span>
                    <span className={`inline-flex items-center rounded-xl border px-2 py-1 text-[11px] ${
                      stock > 0
                        ? "border-[rgba(16,185,129,.25)] bg-[rgba(16,185,129,.10)] text-[rgba(167,243,208,.95)]"
                        : "border-[rgba(239,68,68,.25)] bg-[rgba(239,68,68,.10)] text-[rgba(254,202,202,.95)]"
                    }`}>
                      {stock > 0 ? `Stok ${stock}` : "Habis"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM */}
            <div className="px-5 pb-5">
              <div className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4">
                <div className="text-xs text-subtle">Mulai dari</div>
                <div className="mt-1 text-2xl font-semibold">
                  {price ? formatIDR(price).replace(",00", "") : "—"}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-subtle">
                    <span className="hidden sm:inline">Lihat detail & pilih varian</span>
                    <span className="sm:hidden">Detail</span>
                  </div>

                  <Link href={`/product/${p.id}`} className="shrink-0">
                    <Button
                      className="btn-brand rounded-2xl px-5"
                      disabled={stock <= 0}
                    >
                      Beli
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* hover highlight */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
              <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_0%,rgba(16,185,129,.14),transparent_40%)]" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}