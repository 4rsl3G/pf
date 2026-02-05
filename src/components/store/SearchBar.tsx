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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-dim pointer-events-none" />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari produk… (CapCut, Netflix, Canva)"
        className={[
          "w-full h-12 pl-11 pr-11",
          "input-market",
          "text-sm",
          "placeholder:text-[rgba(82,106,95,.55)]",
        ].join(" ")}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl grid place-items-center hover:bg-black/5 active:scale-[0.98] transition"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-dim" />
        </button>
      ) : null}
    </div>
  );
}
