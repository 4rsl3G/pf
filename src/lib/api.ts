export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export type ApiError = { error?: string; message?: string; status?: number; raw?: string };

export async function apiFetch<T>(
  path: string,
  init: (RequestInit & { auth?: boolean; raw?: boolean }) = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});

  // Accept JSON by default
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // Attach token when needed
  if (init.auth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Only set JSON content-type when body is present and body is not FormData
  const hasBody = init.body !== undefined && init.body !== null;
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  // If caller wants raw (rare), return text
  if (init.raw) {
    const raw = await res.text();
    if (!res.ok) throw { error: `HTTP_${res.status}`, status: res.status, raw };
    return raw as unknown as T;
  }

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  // Read body safely
  const text = await res.text();

  let data: any = null;
  if (text) {
    if (isJson) {
      try {
        data = JSON.parse(text);
      } catch {
        // JSON header but invalid JSON
        data = { error: "INVALID_JSON", raw: text.slice(0, 300) };
      }
    } else {
      // Non-JSON response (HTML, plain text, etc.)
      data = { error: "NON_JSON_RESPONSE", raw: text.slice(0, 300) };
    }
  }

  if (!res.ok) {
    // prefer backend error shape if present
    const err: ApiError = (data && typeof data === "object" ? data : {}) as any;
    err.status = res.status;
    if (!err.error) err.error = `HTTP_${res.status}`;
    if (!err.message && err.raw) err.message = err.raw;
    throw err;
  }

  return data as T;
}
