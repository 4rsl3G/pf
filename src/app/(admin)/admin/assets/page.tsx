"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminAssets() {
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoadingProducts(true);
        const r = await apiFetch<any>("/products"); // public endpoint already merged image
        setProducts(r.data || []);
      } catch {
        // ignore
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  async function upload(file: File) {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/assets/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw json;

      setImageUrl(json.url);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  async function setAsset() {
    try {
      if (!productId || !imageUrl) return toast.error("productId & imageUrl wajib");
      await apiFetch("/admin/assets/set", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          productId,
          variantId: variantId || null,
          imageUrl,
        }),
      });
      toast.success("Asset saved");
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Gagal save asset");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-subtle">Branding</div>
        <div className="text-2xl font-semibold">Assets</div>
        <div className="text-xs text-subtle mt-1">Set logo per product/variant (upload / url)</div>
      </div>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Upload Image</CardTitle>
          <CardDescription className="text-subtle">Auto crop square 512x512 (webp)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <Label>Upload</Label>
            <Input
              type="file"
              className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
              disabled={uploading}
            />
            <div className="text-xs text-subtle">Atau isi URL manual di bawah.</div>
          </div>

          <div className="grid gap-2">
            <Label>Image URL</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/uploads/products/xxx.webp atau https://..." />
          </div>

          <div className="grid gap-2">
            <Label>Product ID</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="c6c25743-f544-..." />
          </div>

          <div className="grid gap-2">
            <Label>Variant ID (opsional)</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={variantId} onChange={(e) => setVariantId(e.target.value)} placeholder="1e43001c-f5e2-..." />
          </div>

          <div className="lg:col-span-2 flex gap-2 flex-wrap">
            <Button className="btn-brand rounded-2xl" onClick={setAsset} disabled={!productId || !imageUrl}>
              Save Asset
            </Button>
          </div>

          {imageUrl ? (
            <div className="lg:col-span-2">
              <div className="text-xs text-subtle mb-2">Preview</div>
              <div className="h-24 w-24 rounded-2xl overflow-hidden border border-soft bg-[rgba(255,255,255,.06)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Helper</CardTitle>
          <CardDescription className="text-subtle">Copy productId/variantId dari list</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingProducts ? <div className="text-sm text-subtle">Loading products...</div> : null}
          {(products || []).slice(0, 12).map((p) => (
            <div key={p.id} className="rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{p.name}</div>
                <Button
                  variant="secondary"
                  className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                  onClick={() => {
                    navigator.clipboard.writeText(p.id);
                    toast.success("productId copied");
                  }}
                >
                  Copy productId
                </Button>
              </div>
              <div className="text-xs text-subtle mt-2">productId: {p.id}</div>
              <div className="mt-3 grid gap-2">
                {(p.variants || []).slice(0, 3).map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between gap-3">
                    <div className="text-xs text-subtle truncate">{v.name} • {v.duration} • {v.type}</div>
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                      onClick={() => {
                        navigator.clipboard.writeText(v.id);
                        toast.success("variantId copied");
                      }}
                    >
                      Copy variantId
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}