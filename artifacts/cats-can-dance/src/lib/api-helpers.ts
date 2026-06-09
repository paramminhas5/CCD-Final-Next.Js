/**
 * api-helpers.ts
 *
 * Shared helpers for all pages/api/* route files.
 * Provides typed Supabase PostgREST wrappers without importing the
 * full db layer (which may pull in server-only modules).
 *
 * Usage:
 *   import { sb, get, ins, patch, del, upsert, pq, eqf, ord, isAdminReq } from "@/lib/api-helpers";
 */
import type { NextApiRequest } from "next";

export const SB       = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SK       = process.env.SUPABASE_SERVICE_KEY ?? "";
export const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";

export const H = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

export async function sb(
  table: string,
  qs = "",
  method = "GET",
  body?: unknown,
  preferOverride?: string,
) {
  const r = await fetch(`${SB}/rest/v1/${table}${qs}`, {
    method,
    headers: preferOverride ? { ...H(), Prefer: preferOverride } : H(),
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const t = await r.text();
  const data = t ? tryJson(t) : null;
  return { ok: r.ok, status: r.status, data };
}

const tryJson = (t: string) => { try { return JSON.parse(t); } catch { return t; } };

export const get     = async (t: string, q = "") => { const r = await sb(t, q); return r.ok ? r.data : []; };
export const ins     = (t: string, b: unknown) => sb(t, "", "POST", b);
export const upsert  = (t: string, b: unknown) => sb(t, "", "POST", b, "return=representation,resolution=merge-duplicates");
export const patch   = (t: string, q: string, b: unknown) => sb(t, q, "PATCH", b);
export const del     = (t: string, q: string) => sb(t, q, "DELETE", undefined, "return=minimal");

export const pq = (filters: Record<string, string> = {}) => {
  const parts = Object.entries(filters).map(([k, v]) => `${encodeURIComponent(k)}=${v}`);
  return parts.length ? `?${parts.join("&")}` : "";
};
export const eqf  = (col: string, val: unknown) => ({ [col]: `eq.${val}` });
export const ord  = (col: string, asc = true) => ({ order: `${col}.${asc ? "asc" : "desc"}` });

export const isAdminReq = (req: NextApiRequest) =>
  !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;

export const clerkId = (req: NextApiRequest): string | undefined =>
  (req.headers["x-clerk-user-id"] as string) || undefined;
