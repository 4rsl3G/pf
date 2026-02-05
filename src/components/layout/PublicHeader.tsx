"use client";

import { motion } from "framer-motion";
import { ShoppingBag, ShieldCheck } from "lucide-react";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-soft bg-[rgba(7,12,10,.82)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 h-full flex items-center justify-between">
        {/* LEFT: Brand */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="h-10 w-10 rounded-2xl bg-[rgb(var(--brand))] border border-[rgba(16,185,129,.28)] shadow-soft grid place-items-center shrink-0">
            <ShoppingBag className="h-5 w-5 text-[rgba(236,253,245,.95)]" />
          </div>

          <div className="leading-tight min-w-0">
            <div className="font-semibold tracking-tight truncate">Pansa Store</div>
            <div className="text-xs text-subtle truncate">Digital Premium Marketplace</div>
          </div>
        </motion.div>

        {/* RIGHT: Trust badge */}
        <div className="hidden md:flex items-center gap-2 text-xs text-subtle">
          <ShieldCheck className="h-4 w-4 text-[rgba(16,185,129,.95)]" />
          Transaksi aman & terverifikasi
        </div>
      </div>
    </header>
  );
}
