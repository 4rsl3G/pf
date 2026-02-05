"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GobizConnectCard from "./partials/GobizConnectCard";

type SettingsMap = Record<string, string | null>;

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [s, setS] = useState<SettingsMap>({});

  async function load() {
    const r = await apiFetch<{ success: true; data: SettingsMap }>("/admin/settings", { auth: true });
    setS(r.data || {});
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        toast.error(e?.error || e?.message || "Gagal load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function setOne(key: string, value: string) {
    await apiFetch("/admin/settings/set", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ key, value }),
    });
  }

  async function saveAll() {
    try {
      setSaving(true);
      await Promise.all([
        setOne("premify.baseurl", s["premify.baseurl"] || ""),
        setOne("premify.apikey", s["premify.apikey"] || ""),
        setOne("qris.static", s["qris.static"] || ""),
        setOne("invoice.ttl_min", s["invoice.ttl_min"] || "20"),
        setOne("gobiz.default_account_id", s["gobiz.default_account_id"] || ""),
      ]);

      toast.success("Settings tersimpan");
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Gagal simpan");
    } finally {
      setSaving(false);
    }
  }

  async function testBalance() {
    try {
      const r = await apiFetch<any>("/admin/premify/balance", { auth: true });
      toast.success(`Balance: ${Number(r?.data?.balance || 0).toLocaleString("id-ID")} ${r?.data?.currency || "IDR"}`);
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Test balance gagal");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-subtle">Config</div>
        <div className="text-2xl font-semibold">Settings</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Premify</CardTitle>
            <CardDescription className="text-subtle">BaseURL & API Key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>BaseURL</Label>
              <Input
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                value={s["premify.baseurl"] || ""}
                onChange={(e) => setS((p) => ({ ...p, ["premify.baseurl"]: e.target.value }))}
                placeholder="https://premify.store/api/v1"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                value={s["premify.apikey"] || ""}
                onChange={(e) => setS((p) => ({ ...p, ["premify.apikey"]: e.target.value }))}
                placeholder="YOUR_API_KEY"
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button className="btn-brand rounded-2xl" disabled={saving || loading} onClick={saveAll}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="secondary"
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                onClick={testBalance}
                disabled={loading}
              >
                Test Balance
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glass border-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Invoice & QRIS</CardTitle>
            <CardDescription className="text-subtle">Static QRIS → Dynamic EMV + TTL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Invoice TTL (menit)</Label>
              <Input
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                value={s["invoice.ttl_min"] || "20"}
                onChange={(e) => setS((p) => ({ ...p, ["invoice.ttl_min"]: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label>Static QRIS Payload (EMV)</Label>
              <Textarea
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft min-h-[140px]"
                value={s["qris.static"] || ""}
                onChange={(e) => setS((p) => ({ ...p, ["qris.static"]: e.target.value }))}
                placeholder="000201010211....6304XXXX"
                disabled={loading}
              />
              <div className="text-xs text-subtle">Pastikan CRC di payload static valid. Sistem akan generate CRC baru saat dinamis.</div>
            </div>

            <div className="grid gap-2">
              <Label>Default GoBiz Account ID</Label>
              <Input
                className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
                value={s["gobiz.default_account_id"] || ""}
                onChange={(e) => setS((p) => ({ ...p, ["gobiz.default_account_id"]: e.target.value }))}
                placeholder="misal: 1"
                disabled={loading}
              />
              <div className="text-xs text-subtle">Dipakai saat checkout untuk validasi mutasi.</div>
            </div>

            <Button className="btn-brand rounded-2xl" disabled={saving || loading} onClick={saveAll}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <GobizConnectCard
        defaultAccountId={s["gobiz.default_account_id"] || ""}
        onDefaultChange={(id) => setS((p) => ({ ...p, ["gobiz.default_account_id"]: id }))}
        onSaved={async () => {
          await saveAll();
          await load();
        }}
      />
    </div>
  );
}