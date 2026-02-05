"use client";

import { motion } from "framer-motion";
import { ShoppingBag, ShieldCheck } from "lucide-react";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-soft bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-2xl bg-[rgba(16,185,129,.12)] border border-[rgba(16,185,129,.22)] grid place-items-center">
            <ShoppingBag className="h-5 w-5 text-[rgb(var(--brand))]" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">Pansa Store</div>
            <div className="text-xs text-subtle">Digital Premium Marketplace</div>
          </div>
        </motion.div>

        <div className="hidden md:flex items-center gap-2 text-xs text-subtle">
          <ShieldCheck className="h-4 w-4 text-[rgb(var(--brand))]" />
          Transaksi aman & terverifikasi
        </div>
      </div>
    </header>
  );
}
