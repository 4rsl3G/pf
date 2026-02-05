import { Sparkles } from "lucide-react";

export default function StoreHero() {
  return (
    <div className="card-glass rounded-2xl p-6 border-soft shadow-soft">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-3 py-1 text-xs text-subtle">
        <Sparkles className="h-4 w-4 text-[rgba(16,185,129,.95)]" />
        App Premium
      </div>

      <h1 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
        Pilih layanan premium{" "}
        <span className="text-[rgba(16,185,129,.95)]">favorit</span> kamu.
      </h1>

      <p className="mt-3 text-subtle max-w-2xl">
        Katalog lengkap, varian beragam, dan proses pembelian dibuat simpel.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-glass rounded-2xl p-4 border-soft">
          <div className="text-xs text-subtle">Produk</div>
          <div className="mt-1 font-medium">Banyak pilihan</div>
          <div className="mt-1 text-xs text-subtle">Streaming, AI, tools, dan lainnya.</div>
        </div>
        <div className="card-glass rounded-2xl p-4 border-soft">
          <div className="text-xs text-subtle">Harga</div>
          <div className="mt-1 font-medium">Final & jelas</div>
          <div className="mt-1 text-xs text-subtle">Ikuti varian yang dipilih.</div>
        </div>
        <div className="card-glass rounded-2xl p-4 border-soft">
          <div className="text-xs text-subtle">Invoice</div>
          <div className="mt-1 font-medium">Mudah dicek</div>
          <div className="mt-1 text-xs text-subtle">Status dan detail pesanan tersedia.</div>
        </div>
      </div>
    </div>
  );
}