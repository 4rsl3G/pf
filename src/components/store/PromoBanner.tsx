import Link from "next/link";
import { TicketPercent } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="rounded-2xl border border-soft bg-[rgba(16,185,129,.10)] p-4 shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[rgba(16,185,129,.18)] border border-[rgba(16,185,129,.25)] grid place-items-center">
            <TicketPercent className="h-5 w-5 text-[rgba(16,185,129,.95)]" />
          </div>
          <div>
            <div className="font-medium">Pakai voucher saat checkout</div>
            <div className="text-xs text-subtle mt-1">
              Jika tersedia, kamu bisa masukkan kode voucher untuk potongan harga.
            </div>
          </div>
        </div>

        <Link
          href="#produk"
          className="inline-flex justify-center rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] px-4 py-2 text-sm hover:bg-[rgba(255,255,255,.09)] transition"
        >
          Lihat Produk
        </Link>
      </div>
    </div>
  );
}