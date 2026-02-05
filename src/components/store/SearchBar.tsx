"use client";

import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari produk… (contoh: CapCut, Netflix, Canva)"
        className="w-full rounded-2xl border border-soft bg-[rgba(255,255,255,.05)] pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(16,185,129,.25)]"
      />
      {value ? (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 hover:bg-[rgba(255,255,255,.06)] transition"
          aria-label="clear"
        >
          <X className="h-4 w-4 text-subtle" />
        </button>
      ) : null}
    </div>
  );
}