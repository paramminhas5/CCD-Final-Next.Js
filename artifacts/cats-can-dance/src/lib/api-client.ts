/**
 * Simple fetch wrapper for /api proxy.
 * - GET responses cached 30s to prevent polling storms.
 * - Cache is invalidated after any POST/PATCH/DELETE on the same path.
 */

const BASE = "/api";
const _cache = new Map<string, { data: unknown; expiresAt: number }>();
const _inflight = new Map<string, Promise<unknown>>();
const TTL = 30_000;

function hdrs(extra?: Record<string, string>): Record<string, string> {
  return { "Content-Type": "application/json", ...extra };
}

async function req<T>(path: string, init?: RequestInit, extraHdrs?: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: hdrs({ ...(init?.headers as Record<string, string> | undefined), ...extraHdrs }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Invalidate cache for a path and all related paths (e.g. /functions/v1/admin-content invalidates /functions/v1/admin-content*)
function invalidateRelated(path: string) {
  const base = path.split("?")[0];
  for (const key of _cache.keys()) {
    if (key.startsWith(base) || base.startsWith(key.split("?")[0])) {
      _cache.delete(key);
    }
  }
}

export const api = {
  get: <T>(path: string, extraHdrs?: Record<string, string>): Promise<T> => {
    if (!extraHdrs) {
      const cached = _cache.get(path);
      if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data as T);
      const existing = _inflight.get(path);
      if (existing) return existing as Promise<T>;
    }
    const promise = req<T>(path, undefined, extraHdrs).then((data) => {
      if (!extraHdrs) {
        _cache.set(path, { data, expiresAt: Date.now() + TTL });
        _inflight.delete(path);
      }
      return data;
    }).catch((err) => {
      _inflight.delete(path);
      throw err;
    });
    if (!extraHdrs) _inflight.set(path, promise);
    return promise;
  },

  post: <T>(path: string, body: unknown, extraHdrs?: Record<string, string>) => {
    invalidateRelated(path);
    return req<T>(path, { method: "POST", body: JSON.stringify(body) }, extraHdrs);
  },

  patch: <T>(path: string, body: unknown, extraHdrs?: Record<string, string>) => {
    invalidateRelated(path);
    return req<T>(path, { method: "PATCH", body: JSON.stringify(body) }, extraHdrs);
  },

  delete: <T>(path: string, extraHdrs?: Record<string, string>) => {
    invalidateRelated(path);
    return req<T>(path, { method: "DELETE" }, extraHdrs);
  },

  invalidateCache: (path?: string) => {
    if (path) invalidateRelated(path);
    else _cache.clear();
  },
  clearCache: () => _cache.clear(),
};
