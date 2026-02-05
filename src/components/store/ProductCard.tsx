"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
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
  image?: string | null; // bisa url full atau path /uploads/...
  variants?: Variant[];
};

function formatIDR(n: number) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(x)
    .replace(",00", "");
}

function apiOrigin() {
  // NEXT_PUBLIC_API_BASE biasanya: https://api.pansa.my.id/v1
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  return base.replace(/\/v1$/, "");
}

function resolveImg(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  // src = "/uploads/.."
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      className="relative card-glass rounded-2xl border-soft shadow-soft overflow-hidden group"
    >
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_20%_0%,rgba(16,185,129,.14),transparent_45%)]" />
      </div>

      <div className="p-5 relative">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="h-14 w-14 rounded-2xl overflow-hidden border border-soft bg-[rgba(255,255,255,.06)] shrink-0 grid place-items-center">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="text-[10px] text-subtle">APP</div>
            )}
          </div>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{product.name}</div>

              {product.category ? (
                <Badge
                  variant="secondary"
                  className="rounded-xl bg-[rgba(255,255,255,.06)] border-soft text-[11px]"
                >
                  {product.category}
                </Badge>
              ) : null}
            </div>

            {product.description ? (
              <div className="text-xs text-subtle mt-1 line-clamp-2">
                {product.description}
              </div>
            ) : (
              <div className="text-xs text-subtle mt-1">—</div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-xl border border-soft bg-[rgba(255,255,255,.05)] px-2 py-1 text-[11px] text-subtle">
                {product.variants?.length || 0} varian
              </span>

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
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-5 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-subtle">Mulai dari</div>
            <div className="text-2xl font-semibold mt-1">
              {minPrice ? formatIDR(minPrice) : "—"}
            </div>
          </div>

          <div className="shrink-0">
            <CheckoutDialog product={product} disabled={totalStock <= 0} />
          </div>
        </div>
      </div>

      {/* footer kecil, non-teknis */}
      <div className="px-5 py-3 text-xs text-subtle flex items-center justify-between border-t border-[rgba(255,255,255,.06)]">
        <span>Detail & pilihan varian tersedia</span>
        <span className="opacity-0 group-hover:opacity-100 transition">→</span>
      </div>
    </motion.div>
  );
}