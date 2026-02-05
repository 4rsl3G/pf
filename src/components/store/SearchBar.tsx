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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari produk… (CapCut, Netflix, Canva)"
        className={[
          "w-full h-11 rounded-2xl",
          "border border-soft bg-[rgba(255,255,255,.05)]",
          "pl-10 pr-10 text-sm",
          "outline-none",
          "placeholder:text-[rgba(167,243,208,.45)]",
          "focus:border-[rgba(16,185,129,.28)] focus:ring-2 focus:ring-[rgba(16,185,129,.18)]",
          "transition",
        ].join(" ")}
        style={{ textOverflow: "ellipsis" }}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className={[
            "absolute right-2 top-1/2 -translate-y-1/2",
            "h-8 w-8 rounded-xl grid place-items-center",
            "hover:bg-[rgba(255,255,255,.06)] active:scale-[0.98]",
            "transition",
          ].join(" ")}
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-subtle" />
        </button>
      ) : null}
    </div>
  );
}
