"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setAdminToken } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      const r = await apiFetch<any>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAdminToken(r.access_token);
      toast.success("Login sukses");
      router.replace("/admin/dashboard");
    } catch (e: any) {
      toast.error(e?.error || e?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md card-glass rounded-2xl p-6 border-soft shadow-soft">
        <div className="text-sm text-subtle">Admin Login</div>
        <div className="text-2xl font-semibold mt-1">Pansa Store</div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Password</Label>
            <Input type="password" className="rounded-2xl bg-[rgba(255,255,255,.06)] border-soft" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button className="btn-brand rounded-2xl w-full" disabled={loading || !email || !password} onClick={onLogin}>
            {loading ? "Masuk..." : "Login"}
          </Button>
        </div>
      </div>
    </div>
  );
}