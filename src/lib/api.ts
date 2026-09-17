// ---------------------------------------------------------------------------
// Thin client for the Talent Tube API server (server/). Used when
// VITE_API_URL is set. Stores the login JWT in localStorage.
// ---------------------------------------------------------------------------

export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const isApiConfigured = API_URL.length > 0;

const TOKEN_KEY = "tt_api_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> ?? {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body = init.body;
  if (init.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(init.json); }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, body });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Server-Sent Events subscription. Calls `onEvent(type)` for every event. */
export function subscribeEvents(onEvent: (type: string) => void): () => void {
  let es: EventSource | null = null;
  let retry = 1000;
  let closed = false;
  const open = () => {
    if (closed) return;
    es = new EventSource(`${API_URL}/api/stream`);
    ["talents", "categories"].forEach((t) => es!.addEventListener(t, () => onEvent(t)));
    es.onopen = () => { retry = 1000; };
    es.onerror = () => { es?.close(); if (!closed) setTimeout(open, (retry = Math.min(retry * 2, 15000))); };
  };
  open();
  return () => { closed = true; es?.close(); };
}
