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
    <div className="flex gap-2">
      {items.map((it) => {
        const active = it === value;
        return (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={[
              "px-4 h-10 text-sm font-semibold",
              "pill",
              active ? "pill-active" : "",
            ].join(" ")}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
