import { API_BASE } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

type Handler = (data: any) => void;

export function openAdminSSE(onInvoiceUpdate: Handler, onWebhook?: Handler) {
  const token = getAdminToken();
  if (!token) return () => {};

  const base = API_BASE.replace(/\/v1$/, "");
  const url = `${base}/v1/sse/admin?token=${encodeURIComponent(token)}`;

  const es = new EventSource(url);

  es.addEventListener("invoice:update", (ev) => {
    try { onInvoiceUpdate(JSON.parse((ev as MessageEvent).data)); } catch {}
  });

  es.addEventListener("premify:webhook", (ev) => {
    try { onWebhook?.(JSON.parse((ev as MessageEvent).data)); } catch {}
  });

  es.onerror = () => {
    es.close();
  };

  return () => es.close();
}