/**
 * Simple fetch wrapper for the api-server at /api.
 * - Clerk session cookies are sent automatically (same-origin via credentials: include).
 * - Caches GET responses for 30 s to prevent per-component polling storms.
 */

const BASE = "/api";

const _getCache = new Map<string, { data: unknown; expiresAt: number }>();
const _inflight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 30_000;

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "Content-Type": "application/json", ...extra };
}

async function request<T>(path: string, init?: RequestInit, extraHeaders?: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: buildHeaders({ ...(init?.headers as Record<string, string> | undefined), ...extraHeaders }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, extraHeaders?: Record<string, string>): Promise<T> => {
    if (!extraHeaders) {
      const cached = _getCache.get(path);
      if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data as T);
      const existing = _inflight.get(path);
      if (existing) return existing as Promise<T>;
    }
    const promise = request<T>(path, undefined, extraHeaders).then((data) => {
      if (!extraHeaders) {
        _getCache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        _inflight.delete(path);
      }
      return data;
    }).catch((err) => {
      _inflight.delete(path);
      throw err;
    });
    if (!extraHeaders) _inflight.set(path, promise);
    return promise;
  },
  post: <T>(path: string, body: unknown, extraHeaders?: Record<string, string>) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, extraHeaders),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  invalidateCache: (path: string) => _getCache.delete(path),
  clearCache: () => _getCache.clear(),
};
