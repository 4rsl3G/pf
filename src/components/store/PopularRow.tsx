"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/types/store";
import { Skeleton } from "@/components/ui/skeleton";

export default function PopularRow({
  loading,
  products,
}: {
  loading: boolean;
  products: Product[];
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-subtle">Populer</div>
          <div className="text-xl font-semibold mt-1">Top Picks</div>
        </div>
        <a href="#produk" className="text-xs text-[rgba(16,185,129,.90)] hover:underline">
          Lihat semua
        </a>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[260px]">
                <Skeleton className="h-[120px] w-full rounded-2xl" />
              </div>
            ))
          : (products || []).map((p) => {
              const price = Number(p.minPrice ?? 0);

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 w-[260px]"
                >
                  <Link
                    href={`/product/${p.id}`}
                    className="block card-glass rounded-2xl border-soft p-4 shadow-soft hover:translate-y-[-2px] hover:shadow-[0_14px_50px_rgba(16,185,129,.10)] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl border border-soft bg-[rgba(255,255,255,.05)] overflow-hidden grid place-items-center">
                        <div className="text-xs text-subtle">APP</div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-subtle truncate">{p.category}</div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-subtle">Mulai dari</div>
                    <div className="mt-1 text-lg font-semibold">
                      Rp {price.toLocaleString("id-ID")}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
