import { API_BASE } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

type Handler = (data: any) => void;

type CloseFn = () => void;

export function openAdminSSE(
  onInvoiceUpdate: Handler,
  onWebhook?: Handler
): CloseFn {
  let es: EventSource | null = null;
  let stopped = false;
  let retryTimer: any = null;

  const base = API_BASE.replace(/\/v1$/, "");

  function connect() {
    if (stopped) return;

    const token = getAdminToken();
    if (!token) {
      // belum login / token hilang
      return;
    }

    const url = `${base}/v1/sse/admin?token=${encodeURIComponent(token)}`;

    es = new EventSource(url);

    es.addEventListener("invoice:update", (ev) => {
      try {
        onInvoiceUpdate(JSON.parse((ev as MessageEvent).data));
      } catch {}
    });

    es.addEventListener("premify:webhook", (ev) => {
      try {
        onWebhook?.(JSON.parse((ev as MessageEvent).data));
      } catch {}
    });

    es.onopen = () => {
      // reset retry ketika sukses connect
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    es.onerror = () => {
      // ⚠️ jangan langsung matikan permanen
      es?.close();
      es = null;

      if (stopped) return;

      // retry dengan delay (simple backoff)
      retryTimer = setTimeout(() => {
        connect();
      }, 3000);
    };
  }

  connect();

  // close handler (dipanggil dari useEffect cleanup)
  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (es) es.close();
    es = null;
  };
}
