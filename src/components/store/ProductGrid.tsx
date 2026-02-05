"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type Variant = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  type?: string;
  warranty?: string;
  stock?: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  description?: string;
  image?: string | null;
  variants: Variant[];
  minPrice?: number;
  totalStock?: number;
};

type Props = {
  loading?: boolean;
  products: Product[];
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(Number(n || 0))
    .replace(",00", "");
}

function minPrice(p: Product) {
  if (typeof p.minPrice === "number") return p.minPrice;
  const arr = (p.variants || [])
    .map((v) => Number(v.price || 0))
    .filter((x) => Number.isFinite(x) && x > 0);
  return arr.length ? Math.min(...arr) : 0;
}

function totalStock(p: Product) {
  if (typeof p.totalStock === "number") return p.totalStock;
  return (p.variants || []).reduce((a, v) => a + (Number(v.stock || 0) || 0), 0);
}

function apiOrigin(base: string) {
  return base.replace(/\/v1$/, "");
}

function resolveProductImage(img: string | null | undefined) {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  const origin = base ? apiOrigin(base) : "";
  return origin ? `${origin}${img}` : img;
}

export default function ProductGrid({ loading = false, products }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="card-glass border-soft overflow-hidden">
            <div className="aspect-[4/3]">
              <Skeleton className="h-full w-full rounded-none" />
            </div>
            <div className="p-5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-40 mt-2" />
              <Skeleton className="h-10 w-full mt-4 rounded-2xl" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="card-glass p-6 border-soft text-sm text-subtle">
        Produk belum tersedia.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, idx) => {
        const price = minPrice(p);
        const stock = totalStock(p);
        const img = resolveProductImage(p.image);
        const soldOut = stock <= 0;

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ delay: Math.min(idx * 0.02, 0.18) }}
            className="group card-glass border-soft shadow-soft card-hover overflow-hidden relative"
          >
            {/* Cover */}
            <div className="relative">
              <div className="aspect-[4/3] w-full bg-[rgba(2,6,23,.04)] overflow-hidden">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-sm text-dim">
                    No Image
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.22),transparent_55%)]" />

              {/* Category */}
              <div className="absolute left-3 top-3">
                <span className="h-9 px-3 inline-flex items-center rounded-full bg-white/92 border border-soft text-xs font-semibold">
                  {p.category || "Other"}
                </span>
              </div>

              {/* Stock */}
              <div className="absolute right-3 top-3">
                <span
                  className={[
                    "h-9 px-3 inline-flex items-center rounded-full border text-xs font-extrabold",
                    soldOut
                      ? "bg-white/92 border-red-200 text-red-600"
                      : "bg-[rgba(16,185,129,.12)] border-[rgba(16,185,129,.30)] text-[rgb(var(--brand))]",
                  ].join(" ")}
                >
                  {soldOut ? "Habis" : `Stok ${stock}`}
                </span>
              </div>

              {/* Variants chip */}
              <div className="absolute left-3 bottom-3">
                <span className="h-9 px-3 inline-flex items-center rounded-full bg-white/92 border border-soft text-xs font-semibold">
                  {(p.variants?.length || 0)} varian
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="font-extrabold text-lg leading-tight line-clamp-1">
                {p.name}
              </div>

              <p className="mt-1 text-sm text-subtle line-clamp-2">
                {p.description || "—"}
              </p>

              {/* Price */}
              <div className="mt-4 rounded-2xl border border-soft bg-[rgba(2,6,23,.02)] p-4">
                <div className="text-xs text-dim">Mulai dari</div>
                <div className="mt-1 text-2xl font-extrabold text-[rgb(var(--brand))]">
                  {price ? formatIDR(price) : "—"}
                </div>

                {/* Actions (Mode B) */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link href={`/product/${p.id}`}>
                    <Button
                      variant="secondary"
                      className="w-full rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.09)]"
                    >
                      Detail
                    </Button>
                  </Link>

                  <Link href={`/product/${p.id}`}>
                    <Button
                      className="w-full btn-brand rounded-2xl"
                      disabled={soldOut}
                    >
                      {soldOut ? "Habis" : "Beli"}
                    </Button>
                  </Link>
                </div>

                <div className="mt-3 text-xs text-dim">
                  Pilih varian di halaman detail
                </div>
              </div>
            </div>

            {/* Hover glow */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
              <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_0%,rgba(16,185,129,.12),transparent_42%)]" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
