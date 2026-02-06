// src/app/(public)/product/[productId]/page.tsx
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

type Variant = {
  id: string;
  name: string;
  price: number;
  duration?: string;
  type?: string;
  warranty?: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description?: string;
  image?: string | null;
  variants: Variant[];
};

function apiOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  return base.replace(/\/v1$/, "");
}

function resolveImg(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const origin = apiOrigin();
  return origin ? `${origin}${src}` : src;
}

async function fetchProducts(): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  const url = `${base.replace(/\/$/, "")}/products`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const json = await res.json();
  return (json?.data || []) as Product[];
}

export async function generateMetadata(
  { params }: { params: { productId: string } }
): Promise<Metadata> {
  const site = "Pansa Store";
  const pid = decodeURIComponent(params.productId || "");
  const products = await fetchProducts();
  const p = products.find((x) => x.id === pid);

  if (!p) {
    return {
      title: `Produk tidak ditemukan — ${site}`,
      description: "Produk tidak tersedia.",
      alternates: { canonical: `/product/${encodeURIComponent(pid)}` },
      openGraph: {
        title: `Produk tidak ditemukan — ${site}`,
        description: "Produk tidak tersedia.",
        url: `/product/${encodeURIComponent(pid)}`,
        type: "website",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: site }],
      },
      twitter: {
        card: "summary_large_image",
        title: `Produk tidak ditemukan — ${site}`,
        description: "Produk tidak tersedia.",
        images: ["/og.png"],
      },
    };
  }

  const title = `${p.name} — ${site}`;
  const desc =
    (p.description || `Beli ${p.name} cepat & aman. Pembayaran QRIS realtime.`).slice(0, 155);

  const img = resolveImg(p.image) || "/og.png";

  return {
    title,
    description: desc,
    alternates: { canonical: `/product/${encodeURIComponent(pid)}` },
    openGraph: {
      type: "website",
      url: `/product/${encodeURIComponent(pid)}`,
      title,
      description: desc,
      siteName: site,
      images: [{ url: img, width: 1200, height: 630, alt: p.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [img],
    },
  };
}

export default function Page() {
  return <ProductDetailClient />;
}
