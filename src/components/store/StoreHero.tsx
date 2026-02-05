import { Sparkles } from "lucide-react";

export default function StoreHero() {
  return (
    <div className="card-glass p-6 md:p-8 border-soft shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-soft bg-[rgba(16,185,129,.10)] px-3 py-1 text-xs font-medium text-[rgb(var(--brand))]">
            <Sparkles className="h-4 w-4" />
            App Premium
          </div>

          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
            Pilih layanan premium{" "}
            <span className="text-[rgb(var(--brand))]">favorit</span> kamu.
          </h1>

          <p className="mt-2 text-subtle max-w-2xl">
            Katalog lengkap, varian beragam, dan proses pembelian dibuat simpel.
          </p>
        </div>

        {/* quick stats */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
          <div className="rounded-2xl border border-soft bg-[rgba(2,6,23,.02)] p-3">
            <div className="text-xs text-dim">Produk</div>
            <div className="mt-1 font-semibold">Banyak</div>
          </div>
          <div className="rounded-2xl border border-soft bg-[rgba(2,6,23,.02)] p-3">
            <div className="text-xs text-dim">Harga</div>
            <div className="mt-1 font-semibold">Jelas</div>
          </div>
          <div className="rounded-2xl border border-soft bg-[rgba(2,6,23,.02)] p-3">
            <div className="text-xs text-dim">Invoice</div>
            <div className="mt-1 font-semibold">Realtime</div>
          </div>
        </div>
      </div>
    </div>
  );
}
