export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE && process.env.NEXT_PUBLIC_API_BASE.trim()) ||
  ""; // fallback

export type ApiError = {
  error?: string;
  message?: string;
  status?: number;
  raw?: string;
};

type ApiInit = RequestInit & {
  auth?: boolean;
  raw?: boolean;
  json?: any; // <-- convenience: pass object here
};

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("admin_token");
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  if (!API_BASE) {
    throw {
      error: "MISSING_API_BASE",
      message: "NEXT_PUBLIC_API_BASE tidak di-set. Cek .env dan restart dev server.",
      status: 0,
    } satisfies ApiError;
  }

  const headers = new Headers(init.headers || {});

  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // Auth header
  if (init.auth) {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Body handling:
  // - if init.json is provided -> stringify + set content-type
  // - else if init.body is plain object -> stringify
  let body: any = init.body;

  const hasJson = init.json !== undefined;
  if (hasJson) {
    body = JSON.stringify(init.json);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  } else {
    const hasBody = body !== undefined && body !== null;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
    const isString = typeof body === "string";

    // If user passes plain object as body, auto JSON encode it
    if (hasBody && !isFormData && !isBlob && !isString && typeof body === "object") {
      body = JSON.stringify(body);
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    } else if (hasBody && !isFormData && !isBlob && !headers.has("Content-Type")) {
      // if body is string, caller decides content-type; default to json only if looks json-ish
      // (optional) keep as-is
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    body,
    headers,
    cache: "no-store",
  });

  if (init.raw) {
    const raw = await res.text();
    if (!res.ok) throw { error: `HTTP_${res.status}`, status: res.status, raw } satisfies ApiError;
    return raw as unknown as T;
  }

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const text = await res.text();

  let data: any = null;
  if (text) {
    if (isJson) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "INVALID_JSON", raw: text.slice(0, 500) };
      }
    } else {
      data = { error: "NON_JSON_RESPONSE", raw: text.slice(0, 500) };
    }
  }

  if (!res.ok) {
    const err: ApiError = (data && typeof data === "object" ? data : {}) as any;
    err.status = res.status;
    if (!err.error) err.error = `HTTP_${res.status}`;
    if (!err.message && err.raw) err.message = err.raw;
    throw err;
  }

  return data as T;
}
