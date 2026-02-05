"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Rule = { variantId: string; type: "FIXED" | "PERCENT"; value: number; isActive: boolean };

export default function AdminMarkup() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const [variantId, setVariantId] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [value, setValue] = useState("0");

  async function load() {
    const r = await apiFetch<{ success: true; data: Rule[] }>("/admin/markup", { auth: true });
    setRules(r.data || []);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        toast.error(e?.error || e?.message || "Gagal load markup");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function upsert() {
    try {
      await apiFetch("/admin/markup/set", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ variantId, type, value: Number(value || 0), isActive: true }),
      });
      toast.success("Saved");
      setVariantId("");
      setValue("0");
      await load();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Gagal save");
    }
  }

  async function remove(vId: string) {
    try {
      await apiFetch(`/admin/markup/${encodeURIComponent(vId)}`, { method: "DELETE", auth: true });
      toast.success("Deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Gagal delete");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-subtle">Pricing</div>
        <div className="text-2xl font-semibold">Markup Rules</div>
        <div className="text-xs text-subtle mt-1">Override harga sebelum tampil di store</div>
      </div>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Add / Update Markup</CardTitle>
          <CardDescription className="text-subtle">Berdasarkan variantId Premify</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          <div className="grid gap-2 lg:col-span-2">
            <Label>Variant ID</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={variantId} onChange={(e) => setVariantId(e.target.value)} placeholder="1e43001c-f5e2-..." />
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <select
              className="h-10 rounded-2xl bg-[rgba(255,255,255,.06)] border border-soft px-3"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="FIXED">FIXED (+Rp)</option>
              <option value="PERCENT">PERCENT (+%)</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Value</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>

          <div className="lg:col-span-4">
            <Button className="btn-brand rounded-2xl" onClick={upsert} disabled={!variantId}>
              Save Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glass border-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Rules</CardTitle>
          <CardDescription className="text-subtle">Daftar markup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <div className="text-sm text-subtle">Loading...</div> : null}
          {rules.map((r) => (
            <div key={r.variantId} className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.variantId}</div>
                <div className="text-xs text-subtle">{r.type} • {r.value}</div>
              </div>
              <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" onClick={() => remove(r.variantId)}>
                Delete
              </Button>
            </div>
          ))}
          {!loading && rules.length === 0 ? <div className="text-sm text-subtle">Belum ada rule.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}