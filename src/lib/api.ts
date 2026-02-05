export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export type ApiError = { error?: string; message?: string };

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  if (init?.auth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw json || { error: `HTTP_${res.status}` };
  }

  return json as T;
}