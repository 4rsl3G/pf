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
    <div
      className={[
        "flex items-center gap-2",
        "overflow-x-auto whitespace-nowrap",
        "[-webkit-overflow-scrolling:touch]",
        "scrollbar-hide", // kita bikin utilnya di globals.css
        "py-1",
      ].join(" ")}
    >
      {items.map((it) => {
        const active = it === value;
        return (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            className={[
              "shrink-0",
              "h-10 px-4 rounded-2xl border",
              "text-sm font-medium",
              "transition",
              active
                ? "bg-[rgba(16,185,129,.14)] border-[rgba(16,185,129,.28)] text-[rgba(236,253,245,.95)]"
                : "bg-[rgba(255,255,255,.04)] border-soft text-subtle hover:bg-[rgba(255,255,255,.06)]",
            ].join(" ")}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
