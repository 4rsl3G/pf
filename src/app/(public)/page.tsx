"use client";

import { useEffect, useMemo, useState } from "react";
import ProductGrid from "@/components/store/ProductGrid";
import PopularRow from "@/components/store/PopularRow";
import CategoryPills from "@/components/store/CategoryPills";
import StoreHero from "@/components/store/StoreHero";
import SearchBar from "@/components/store/SearchBar";
import PromoBanner from "@/components/store/PromoBanner";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export type Variant = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  type?: string;
  warranty?: string;
  stock?: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  description?: string;
  image?: string | null;
  variants: Variant[];
  minPrice: number;
  totalStock: number;
};

function computeDerived(p: any): Product {
  const variants: Variant[] = Array.isArray(p.variants) ? p.variants : [];
  const minPrice = variants.length ? Math.min(...variants.map(v => Number(v.price) || 0)) : 0;
  const totalStock = variants.reduce((a, v) => a + (Number(v.stock) || 0), 0);

  return {
    id: p.id,
    name: p.name,
    category: p.category || "Other",
    description: p.description || "",
    image: p.image || null,
    variants,
    minPrice,
    totalStock,
  };
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await apiFetch<{ success: true; data: any[] }>("/products");
        setProducts((r.data || []).map(computeDerived));
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) s.add(p.category || "Other");
    return ["All", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      const okCat = category === "All" ? true : p.category === category;
      const okQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [products, query, category]);

  const popular = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.totalStock - a.totalStock) || (a.minPrice - b.minPrice))
      .slice(0, 8);
  }, [products]);

  return (
    <div className="bg-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <StoreHero />

        <div className="mt-5">
          <PromoBanner />
        </div>

        {/* Sticky filter */}
        <div className="mt-6">
          <div className="sticky top-[64px] z-30">
            {/* background strip: biar tidak “tembus” & tidak goyang */}
            <div className="bg-[rgb(var(--bg))] pb-3">
              <div className="card-glass p-4">
                <div className="grid gap-3">
                  <SearchBar value={query} onChange={setQuery} />

                  {/* ONE LINE pills => height stabil */}
                  <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    <div className="min-w-max">
                      <CategoryPills items={categories} value={category} onChange={setCategory} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular */}
        <div className="mt-8">
          <PopularRow loading={loading} products={popular} />
        </div>

        {/* Grid */}
        <div className="mt-10" id="produk">
          <ProductGrid loading={loading} products={filtered} />
        </div>
      </div>
    </div>
  );
}
