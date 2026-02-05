export default function PublicFooter() {
  return (
    <footer className="border-t border-soft">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-subtle flex flex-col gap-2">
        <div className="font-medium text-[rgb(var(--text))]">Pansa Store</div>
        <div>Produk premium diproses otomatis setelah pembayaran terverifikasi.</div>
        <div className="text-xs">© {new Date().getFullYear()} Pansa Store</div>
      </div>
    </footer>
  );
}