"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GobizConnectCard({
  defaultAccountId,
  onDefaultChange,
  onSaved,
}: {
  defaultAccountId: string;
  onDefaultChange: (id: string) => void;
  onSaved: () => Promise<void>;
}) {
  const [accountName, setAccountName] = useState("Primary");
  const [accountId, setAccountId] = useState(defaultAccountId || "");
  const [phone, setPhone] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function initAccount() {
    try {
      setLoading(true);
      const r = await apiFetch<any>("/admin/gobiz/init", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ name: accountName }),
      });
      const id = String(r?.data?.id || "");
      setAccountId(id);
      onDefaultChange(id);
      toast.success(`GoBiz account siap (ID ${id})`);
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Init gagal");
    } finally {
      setLoading(false);
    }
  }

  async function requestOTP() {
    try {
      if (!accountId) return toast.error("Init dulu (accountId kosong)");
      setLoading(true);
      const r = await apiFetch<any>("/admin/gobiz/otp/request", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ accountId: Number(accountId), phone, countryCode: "62" }),
      });
      // biasanya r.data punya otp_token
      const token = r?.data?.otp_token || r?.data?.otpToken || "";
      if (token) setOtpToken(token);
      toast.success("OTP dikirim. Masukkan OTP + otp_token.");
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Request OTP gagal");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    try {
      if (!accountId) return toast.error("accountId kosong");
      setLoading(true);
      const r = await apiFetch<any>("/admin/gobiz/otp/verify", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ accountId: Number(accountId), otp, otpToken }),
      });
      toast.success(`Connected: ${r?.data?.merchantId || "-"}`);
      await onSaved();
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Verify OTP gagal");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    try {
      if (!accountId) return toast.error("accountId kosong");
      setLoading(true);
      const r = await apiFetch<any>(`/admin/gobiz/${accountId}/status`, { auth: true });
      toast.success(r?.data?.connected ? `Connected: ${r?.data?.merchantId}` : "Not connected");
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Status gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="card-glass border-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Connect GoBiz</CardTitle>
        <CardDescription className="text-subtle">OTP login untuk validasi mutasi</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label>Account Name</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button className="btn-brand rounded-2xl" onClick={initAccount} disabled={loading}>
              Init / Create
            </Button>
            <Button variant="secondary" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" onClick={checkStatus} disabled={loading}>
              Check Status
            </Button>
          </div>

          <div className="grid gap-2">
            <Label>Account ID (default)</Label>
            <Input
              className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                onDefaultChange(e.target.value);
              }}
              placeholder="misal: 1"
            />
            <div className="text-xs text-subtle">Simpan settings setelah connect.</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-2">
            <Label>Phone (tanpa +62)</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8898xxxxxx" />
          </div>

          <Button className="btn-brand rounded-2xl w-full" onClick={requestOTP} disabled={loading || !accountId || !phone}>
            Request OTP
          </Button>

          <div className="grid gap-2">
            <Label>otp_token</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={otpToken} onChange={(e) => setOtpToken(e.target.value)} placeholder="paste otp_token" />
          </div>

          <div className="grid gap-2">
            <Label>OTP</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
          </div>

          <Button className="btn-brand rounded-2xl w-full" onClick={verifyOTP} disabled={loading || !accountId || !otp || !otpToken}>
            Verify OTP & Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}