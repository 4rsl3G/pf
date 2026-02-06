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

function siteBaseUrl() {
  const web = (process.env.NEXT_PUBLIC_WEB_BASE || "https://pansa.my.id").replace(/\/$/, "");
  return web;
}

function formatIDRNumber(n: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

function bestPrices(variants: Variant[]) {
  const prices = variants
    .map((v) => Number(v.price || 0))
    .filter((x) => Number.isFinite(x) && x > 0);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  return { min, max };
}

async function fetchProducts(): Promise<Product[]> {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  const url = `${base}/products`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const json = await res.json();
  return (json?.data || []) as Product[];
}

export async function generateMetadata(
  { params }: { params: { productId: string } }
): Promise<Metadata> {
  const site = process.env.NEXT_PUBLIC_BRAND_NAME || "Pansa Store";
  const pid = decodeURIComponent(params.productId || "");
  const products = await fetchProducts();
  const p = products.find((x) => x.id === pid);

  const canonicalPath = `/product/${encodeURIComponent(pid)}`;

  if (!p) {
    return {
      title: `Produk tidak ditemukan — ${site}`,
      description: "Produk tidak tersedia.",
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: `Produk tidak ditemukan — ${site}`,
        description: "Produk tidak tersedia.",
        url: canonicalPath,
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
  const desc = (p.description || `Beli ${p.name} cepat & aman. Pembayaran QRIS realtime.`).slice(0, 155);
  const img = resolveImg(p.image) || "/og.png";

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: canonicalPath,
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

function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function Page({ params }: { params: { productId: string } }) {
  const site = process.env.NEXT_PUBLIC_BRAND_NAME || "Pansa Store";
  const baseUrl = siteBaseUrl();

  const pid = decodeURIComponent(params.productId || "");
  const products = await fetchProducts();
  const p = products.find((x) => x.id === pid) || null;

  const url = `${baseUrl}/product/${encodeURIComponent(pid)}`;

  const img = resolveImg(p?.image) || `${baseUrl}/og.png`;

  // JSON-LD (Product + Offer/AggregateOffer)
  const jsonLd = (() => {
    if (!p) {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Produk tidak ditemukan — ${site}`,
        url,
      };
    }

    const variants = Array.isArray(p.variants) ? p.variants : [];
    const totalStock = variants.reduce((a, v) => a + (Number(v.stock || 0) || 0), 0);
    const { min, max } = bestPrices(variants);

    const hasManyPrices = min > 0 && max > 0 && min !== max;

    const offers =
      variants.length > 0
        ? variants
            .filter((v) => Number(v.price || 0) > 0)
            .slice(0, 25)
            .map((v) => ({
              "@type": "Offer",
              name: v.name,
              priceCurrency: "IDR",
              price: Number(v.price || 0),
              availability:
                Number(v.stock || 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url,
              itemCondition: "https://schema.org/NewCondition",
            }))
        : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: (p.description || "").slice(0, 500) || undefined,
      category: p.category || undefined,
      image: [img],
      url,
      brand: { "@type": "Brand", name: site },
      sku: p.id,
      offers: hasManyPrices
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "IDR",
            lowPrice: min || undefined,
            highPrice: max || undefined,
            offerCount: variants.length,
            availability:
              totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url,
            offers,
          }
        : offers && offers.length
          ? offers[0]
          : {
              "@type": "Offer",
              priceCurrency: "IDR",
              price: min || undefined,
              availability:
                totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url,
            },
    };
  })();

  // Optional: BreadcrumbList (bagus buat SEO)
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: site,
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: p?.name || "Produk",
        item: url,
      },
    ],
  };

  // NOTE: UI tetap pakai Client component kamu
  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
      <ProductDetailClient />
    </>
  );
}
