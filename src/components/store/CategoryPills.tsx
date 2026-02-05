"use client";

export default function CategoryPills({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {items.map((it) => {
        const active = it === value;
        return (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={[
              "shrink-0 rounded-2xl px-4 py-2 text-xs border transition",
              active
                ? "bg-[rgba(16,185,129,.16)] border-[rgba(16,185,129,.30)] text-[rgba(16,185,129,.95)]"
                : "bg-[rgba(255,255,255,.04)] border-soft text-subtle hover:bg-[rgba(255,255,255,.07)]",
            ].join(" ")}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}