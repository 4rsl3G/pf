import Link from "next/link";
import { TicketPercent } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="card-glass border-soft p-5 shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[rgba(16,185,129,.10)] border border-[rgba(16,185,129,.22)] grid place-items-center">
            <TicketPercent className="h-5 w-5 text-[rgb(var(--brand))]" />
          </div>

          <div>
            <div className="font-semibold">Pakai voucher saat checkout</div>
            <div className="text-xs text-subtle mt-1">
              Jika tersedia, masukkan kode voucher untuk potongan harga.
            </div>
          </div>
        </div>

        <Link
          href="#produk"
          className="inline-flex justify-center rounded-2xl border border-soft bg-[rgba(16,185,129,.10)] px-5 py-2.5 text-sm font-semibold text-[rgb(var(--brand))] hover:bg-[rgba(16,185,129,.14)] transition"
        >
          Lihat Produk
        </Link>
      </div>
    </div>
  );
}
