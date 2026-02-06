"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  RefreshCw,
  Copy,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

type AccessItem = { label: string; value: string };

function formatIDR(n: any) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(x)
    .replace(",00", "");
}

function pickFirst<T>(v: any): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] as T) || null;
  return v as T;
}

function normalizeSpaces(s: any) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeItems(items: AccessItem[]) {
  const seen = new Set<string>();
  return items.filter((x) => {
    const label = normalizeSpaces(x?.label);
    const value = normalizeSpaces(x?.value);
    if (!label || !value) return false;
    const k = `${label}::${value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function splitLines(s: string) {
  return String(s || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseKeyValueLines(text: string): AccessItem[] {
  // contoh: "Email: user@gmail.com" / "NOTE: ..."
  const items: AccessItem[] = [];
  for (const line of splitLines(text)) {
    const m = line.match(/^([^:]{2,40})\s*:\s*(.+)$/);
    if (m) items.push({ label: m[1].trim(), value: m[2].trim() });
    else items.push({ label: "Info", value: line });
  }
  return items;
}

/**
 * Premify kemungkinan:
 * - details[].credentials[] -> {label,value}
 * - details[] -> {label,value}
 * - details: string (Invite) ✅
 * - details: null + message (Invite diproses) ✅
 */
function extractFromPremify(raw: any): {
  items: AccessItem[];
  message: string | null;
  isInvite: boolean;
} {
  const accountDetails = raw?.account_details;
  if (!Array.isArray(accountDetails)) return { items: [], message: null, isInvite: false };

  let msg: string | null = null;
  let isInvite = false;
  const out: AccessItem[] = [];

  for (const ad of accountDetails) {
    const adMsg =
      normalizeSpaces(ad?.message) ||
      normalizeSpaces(ad?.msg) ||
      normalizeSpaces(ad?.note) ||
      "";

    if (adMsg && !msg) msg = adMsg;

    const details = ad?.details;

    // ✅ Invite: details string
    if (typeof details === "string" && details.trim()) {
      isInvite = true;
      out.push(...parseKeyValueLines(details));
      continue;
    }

    // ✅ Invite pending: details null + message
    if (details === null || details === undefined) {
      isInvite = true;
      if (adMsg) out.push({ label: "Status", value: adMsg });
      continue;
    }

    // details array
    const arr = Array.isArray(details) ? details : [];
    for (const d of arr) {
      // A) credentials
      const creds = Array.isArray(d?.credentials) ? d.credentials : null;
      if (creds?.length) {
        for (const c of creds) {
          const label = normalizeSpaces(c?.label);
          const value = normalizeSpaces(c?.value);
          if (label && value) out.push({ label, value });
        }
        continue;
      }

      // B) direct label/value
      const label = normalizeSpaces(d?.label);
      const value = normalizeSpaces(d?.value);
      if (label && value) out.push({ label, value });

      // fallback
      const label2 = normalizeSpaces(d?.title || d?.name);
      const value2 = normalizeSpaces(d?.value || d?.val);
      if (label2 && value2) out.push({ label: label2, value: value2 });

      const dMsg = normalizeSpaces(d?.message || d?.msg || d?.note);
      if (dMsg && !msg) msg = dMsg;
    }
  }

  return { items: dedupeItems(out), message: msg || null, isInvite };
}

function normalizeReceipt(anyResp: any) {
  const data = anyResp?.data ?? anyResp;
  const one = pickFirst<any>(data);
  if (!one) return null;

  const normalizedItems: AccessItem[] = Array.isArray(one?.access?.items)
    ? dedupeItems(
        one.access.items.map((x: any) => ({
          label: normalizeSpaces(x?.label),
          value: normalizeSpaces(x?.value),
        }))
      )
    : [];

  const raw = one?.raw ?? one;
  const premify = extractFromPremify(raw);

  const p0 = Array.isArray(raw?.products) ? raw.products[0] : null;

  const productName =
    one?.productName ?? raw?.productName ?? p0?.product_name ?? p0?.product ?? null;

  const variantName =
    one?.variantName ?? raw?.variantName ?? p0?.variant_name ?? null;

  const payAmount = one?.payAmount ?? raw?.payAmount ?? raw?.total_amount ?? null;

  const orderId = one?.premifyOrderId ?? raw?.premifyOrderId ?? raw?.order_id ?? null;

  const invoiceId = one?.invoiceId ?? raw?.invoiceId ?? raw?.invoice_id ?? null;

  const items = normalizedItems.length ? normalizedItems : premify.items;

  const invitePending =
    premify.isInvite &&
    items.length === 0 &&
    (!!premify.message || raw?.account_details?.some?.((x: any) => x?.details == null));

  return {
    invoiceId,
    productName,
    variantName,
    payAmount,
    premifyOrderId: orderId,
    items,
    inviteMessage: premify.message,
    invitePending,
    raw,
  };
}

function Pill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-soft bg-[rgba(255,255,255,.06)] px-3 py-2 text-xs text-[rgba(11,23,18,.82)]">
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{text}</span>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-soft bg-[rgba(255,255,255,.04)] p-4 sm:p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="group flex items-start justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs text-subtle">{label}</div>
        <div className="mt-1 font-medium break-words text-[rgba(11,23,18,.92)]">{value}</div>
      </div>

      <Button
        variant="secondary"
        className="rounded-2xl bg-black/[0.03] border border-soft hover:bg-black/[0.05] shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Disalin");
        }}
      >
        Copy
      </Button>
    </div>
  );
}

export default function ReceiptPage() {
  const params = useParams<{ invoiceId?: string }>();
  const router = useRouter();

  const invoiceId = useMemo(() => {
    try {
      return decodeURIComponent(params?.invoiceId || "");
    } catch {
      return params?.invoiceId || "";
    }
  }, [params?.invoiceId]);

  const [data, setData] = useState<ReturnType<typeof normalizeReceipt> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const autoTimerRef = useRef<any>(null);
  const lastToastRef = useRef<number>(0);

  async function load(opts?: { silent?: boolean }) {
    if (!invoiceId) return;
    const silent = !!opts?.silent;

    try {
      if (!silent) setRefreshing(true);

      const r = await apiFetch<any>(`/invoice/${encodeURIComponent(invoiceId)}/receipt`);
      const norm = normalizeReceipt(r);

      setData(norm);

      if (!norm && !silent) toast.error("Receipt belum tersedia");
    } catch (e: any) {
      setData(null);
      if (!silent) toast.error(e?.error || e?.message || "Receipt belum tersedia");
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    load({ silent: true });

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // auto refresh untuk Invite pending
  useEffect(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (!data?.invitePending) return;

    autoTimerRef.current = setInterval(() => {
      load({ silent: true });
    }, 9000);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.invitePending, invoiceId]);

  // toast tip untuk invite pending (anti spam)
  useEffect(() => {
    if (!data?.invitePending) return;
    const now = Date.now();
    if (now - lastToastRef.current < 15000) return;
    lastToastRef.current = now;
    const msg = data?.inviteMessage || "Detail akun sedang diproses. Silakan tunggu dan refresh.";
    toast.message(msg);
  }, [data?.invitePending, data?.inviteMessage]);

  if (!invoiceId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Card className="card-glass border-soft rounded-3xl p-6">
          <div className="text-sm text-subtle">Invalid URL</div>
          <div className="text-xl font-semibold mt-1">Invoice ID kosong</div>
          <div className="mt-4 flex gap-2">
            <Button className="btn-soft rounded-2xl" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Link href="/">
              <Button className="btn-brand rounded-2xl">Kembali ke Store</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="card-glass rounded-3xl p-6 skeleton h-[260px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Card className="card-glass border-soft rounded-3xl">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-subtle">Receipt</div>
              <CardTitle className="text-lg sm:text-xl font-semibold truncate">{invoiceId}</CardTitle>
              <div className="text-xs text-subtle mt-1">
                Receipt belum tersedia. Klik refresh beberapa saat lagi.
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button className="btn-soft rounded-2xl" onClick={() => router.back()} title="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button className="btn-brand rounded-2xl" onClick={() => load()} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="btn-soft rounded-2xl w-full">Kembali ke Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = dedupeItems((data.items || []).map((x) => ({ label: x.label, value: x.value })));
  const invitePending = !!data.invitePending;
  const inviteMsg =
    data.inviteMessage || "Detail akun sedang diproses. Silakan tunggu sebentar lalu klik Refresh.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10 space-y-4 pb-24">
      {/* HERO */}
      <div className="rounded-3xl border border-soft bg-[rgba(255,255,255,.04)] p-5 sm:p-6 card-glass">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-xs text-subtle">
              <Sparkles className="h-4 w-4" />
              <span>Receipt</span>
            </div>

            <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
              <span className="block font-mono break-normal whitespace-normal sm:whitespace-nowrap sm:truncate">
                {invoiceId}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill icon={<BadgeCheck className="h-4 w-4" />} text="Berhasil" />
              {data.premifyOrderId ? (
                <Pill icon={<ShieldCheck className="h-4 w-4" />} text={`Order: ${data.premifyOrderId}`} />
              ) : null}
              {data.payAmount !== null && data.payAmount !== undefined ? (
                <Pill icon={<CheckCircle2 className="h-4 w-4" />} text={`Nominal: ${formatIDR(data.payAmount)}`} />
              ) : null}
              {invitePending ? (
                <Pill icon={<Clock className="h-4 w-4" />} text="Sedang diproses" />
              ) : null}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 sm:justify-end">
            <Button className="btn-soft rounded-2xl" onClick={() => router.back()} title="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Button className="btn-soft rounded-2xl" onClick={() => load()} disabled={refreshing} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            <Link href="/" className="flex-1 sm:flex-none">
              <Button className="btn-brand rounded-2xl w-full sm:w-auto">Kembali ke Store</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <Card className="card-glass border-soft rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* PRODUK */}
          <InfoCard title="Produk">
            <div className="grid gap-2">
              <Row label="Nama Produk" value={data.productName || "-"} />
              <Row label="Variant" value={data.variantName || "-"} />
            </div>
          </InfoCard>

          {/* AKSES */}
          <InfoCard title="Akses Akun">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-xs text-subtle">
                Salin data akses untuk login / redeem (jika tersedia).
              </div>

              {items.length ? (
                <Button
                  className="btn-soft rounded-2xl h-9"
                  onClick={() => {
                    const text = items.map((x) => `${x.label}: ${x.value}`).join("\n");
                    navigator.clipboard.writeText(text);
                    toast.success("Semua akses disalin");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy all
                </Button>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="rounded-3xl border border-soft bg-[rgba(255,255,255,.04)] p-4 sm:p-5">
                {invitePending ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl border border-[rgba(245,158,11,.28)] bg-[rgba(245,158,11,.12)] p-2">
                      <Clock className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-[rgba(11,23,18,.92)]">Sedang diproses</div>
                      <div className="mt-1 text-sm text-subtle break-words">{inviteMsg}</div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button className="btn-soft rounded-2xl" onClick={() => load()} disabled={refreshing}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                          Cek lagi
                        </Button>
                        <Link href="/">
                          <Button className="btn-brand rounded-2xl">Belanja lagi</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-subtle">Akses belum tersedia.</div>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                {items.map((c, i) => (
                  <CopyField key={`${c.label}-${i}`} label={c.label} value={c.value} />
                ))}
              </div>
            )}
          </InfoCard>

          {/* FOOTER NOTE */}
          <div className="rounded-3xl border border-soft bg-[rgba(255,255,255,.03)] p-4 text-xs text-subtle">
            Tips: Simpan halaman ini. Jika “Invite”, cek email sesuai yang tertera.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-[rgba(255,255,255,.04)] px-4 py-3">
      <div className="text-xs text-subtle">{label}</div>
      <div className="font-medium text-right break-words text-[rgba(11,23,18,.92)]">{value || "-"}</div>
    </div>
  );
}
