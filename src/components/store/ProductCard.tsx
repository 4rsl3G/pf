"use client";

import { motion } from "framer-motion";
import CheckoutDialog from "./CheckoutDialog";

type Variant = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  type?: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  image?: string | null; // url full atau path /uploads/...
  variants?: Variant[];
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

function getMinPrice(p: Product) {
  const prices = (p.variants || [])
    .map((v) => Number(v.price || 0))
    .filter((x) => Number.isFinite(x) && x > 0);
  return prices.length ? Math.min(...prices) : 0;
}

function getTotalStock(p: Product) {
  return (p.variants || []).reduce((a, v) => a + (Number(v.stock || 0) || 0), 0);
}

export default function ProductCard({ product }: { product: Product }) {
  const minPrice = getMinPrice(product);
  const totalStock = getTotalStock(product);
  const img = resolveImg(product.image);

  const soldOut = totalStock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      className="card-glass border-soft shadow-soft card-hover overflow-hidden"
    >
      {/* IMAGE */}
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-[rgba(2,6,23,.04)]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-sm text-dim">
              No Image
            </div>
          )}
        </div>

        {/* overlay (subtle) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.18),transparent_55%)]" />

        {/* badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          {product.category ? (
            <span className="px-3 h-9 inline-flex items-center rounded-full bg-white/92 border border-soft text-xs font-semibold">
              {product.category}
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={[
              "px-3 h-9 inline-flex items-center rounded-full border text-xs font-extrabold",
              soldOut
                ? "bg-white/92 border-red-200 text-red-600"
                : "bg-[rgba(16,185,129,.12)] border-[rgba(16,185,129,.30)] text-[rgb(var(--brand))]",
            ].join(" ")}
          >
            {soldOut ? "Habis" : `Stok ${totalStock}`}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5">
        <div className="min-w-0">
          <div className="font-extrabold text-lg leading-tight line-clamp-1">
            {product.name}
          </div>

          <div className="mt-1 text-sm text-subtle line-clamp-2">
            {product.description || "—"}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="pill px-3 h-9 inline-flex items-center text-xs font-semibold">
              {(product.variants?.length || 0)} varian
            </span>
            <span className="pill px-3 h-9 inline-flex items-center text-xs font-semibold">
              Instant / Realtime
            </span>
          </div>
        </div>

        {/* PRICE + CTA */}
        <div className="mt-4 rounded-2xl border border-soft bg-[rgba(2,6,23,.02)] p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-dim">Mulai dari</div>
            <div className="mt-1 text-2xl font-extrabold text-[rgb(var(--brand))]">
              {minPrice ? formatIDR(minPrice) : "—"}
            </div>
          </div>

          <div className="shrink-0">
            <CheckoutDialog product={product} disabled={soldOut} />
          </div>
        </div>

        <div className="mt-3 text-xs text-dim">
          Pembayaran terverifikasi mutasi • detail varian di checkout
        </div>
      </div>
    </motion.div>
  );
}
