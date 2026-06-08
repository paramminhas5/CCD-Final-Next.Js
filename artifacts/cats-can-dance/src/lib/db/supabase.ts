/**
 * supabase.ts — canonical server-side Supabase REST client
 *
 * This is THE single place that talks to Supabase.
 * All API routes import from here — never construct raw fetch headers yourself.
 *
 * Pattern: direct fetch() to Supabase PostgREST REST API using the service key.
 * We deliberately don't use @supabase/supabase-js — the raw REST API is simpler,
 * has no client-state issues, and works perfectly in Next.js serverless functions.
 *
 * Usage (server-side only — pages/api/**):
 *   import { sbGet, sbInsert, sbPatch, sbDelete, sbCount, pq, eqf, ord } from "@/lib/db/supabase";
 *
 *   const artists = await sbGet("artists", pq({ ...eqf("status","approved"), ...ord("name") }));
 *   const { ok, data } = await sbInsert("artists", { name: "Kohra", ... });
 */

// ── Config ────────────────────────────────────────────────────────────────────

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SK  = process.env.SUPABASE_SERVICE_KEY       ?? "";

if (!SB && process.env.NODE_ENV !== "test") {
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL is not set");
}

// ── Auth headers ──────────────────────────────────────────────────────────────

export const sbHeaders = (preferOverride?: string): Record<string, string> => ({
  Authorization:    `Bearer ${SK}`,
  apikey:           SK,
  "Content-Type":   "application/json",
  Prefer:           preferOverride ?? "return=representation",
});

// ── Core fetch wrapper ────────────────────────────────────────────────────────

export interface SbResult<T = any> {
  ok:     boolean;
  status: number;
  data:   T | null;
  error?: string;
}

async function sbFetch<T = any>(
  table:          string,
  qs:             string,
  method:         string,
  body?:          unknown,
  preferOverride?: string,
): Promise<SbResult<T>> {
  if (!SK) return { ok: false, status: 503, data: null, error: "SUPABASE_SERVICE_KEY not set" };

  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, {
      method,
      headers: sbHeaders(preferOverride),
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    });
    const text = await r.text();
    const data = text ? tryJson<T>(text) : null;
    return {
      ok:     r.ok,
      status: r.status,
      data,
      error:  r.ok ? undefined : ((data as any)?.message ?? text?.slice(0, 200)),
    };
  } catch (e: any) {
    return { ok: false, status: 0, data: null, error: e.message };
  }
}

function tryJson<T>(text: string): T {
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

// ── Public helpers ────────────────────────────────────────────────────────────

/** SELECT rows. Returns array (empty on error). */
export async function sbGet<T = any>(table: string, qs = ""): Promise<T[]> {
  const r = await sbFetch<T[]>(table, qs, "GET");
  return r.ok && Array.isArray(r.data) ? r.data : [];
}

/** SELECT a single row (first match). Returns null if not found. */
export async function sbGetOne<T = any>(table: string, qs = ""): Promise<T | null> {
  const rows = await sbGet<T>(table, qs);
  return rows.length > 0 ? rows[0] : null;
}

/** INSERT one row. */
export async function sbInsert<T = any>(table: string, row: object): Promise<SbResult<T>> {
  return sbFetch<T>(table, "", "POST", row);
}

/** UPSERT (merge on conflict). */
export async function sbUpsert<T = any>(table: string, row: object): Promise<SbResult<T>> {
  return sbFetch<T>(table, "", "POST", row, "return=representation,resolution=merge-duplicates");
}

/** PATCH rows matching qs. */
export async function sbPatch<T = any>(table: string, qs: string, changes: object): Promise<SbResult<T>> {
  return sbFetch<T>(table, qs, "PATCH", changes);
}

/** DELETE rows matching qs. */
export async function sbDelete(table: string, qs: string): Promise<SbResult<null>> {
  return sbFetch(table, qs, "DELETE", undefined, "return=minimal");
}

/**
 * Returns the exact row count for a table+filter via PostgREST's
 * `Prefer: count=exact` header trick. Returns null on error.
 */
export async function sbCount(table: string, qs = ""): Promise<number | null> {
  if (!SK) return null;
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs ? qs : ""}?select=id&limit=0`, {
      headers: { ...sbHeaders(), Prefer: "count=exact" },
    });
    const raw = r.headers.get("content-range"); // e.g. "0-0/1234"
    if (raw) {
      const n = parseInt(raw.split("/")[1], 10);
      if (!isNaN(n)) return n;
    }
    return null;
  } catch { return null; }
}

// ── Query builder helpers ─────────────────────────────────────────────────────
//
// These build PostgREST query strings safely.
// Combine with pq() to assemble a full ?key=val&key2=val2 string.
//
// Examples:
//   pq({ ...eqf("status","approved"), ...ord("name") })
//   → "?status=eq.approved&order=name.asc"
//
//   pq({ ...eqf("slug", slug), "select": "id,name,slug" })
//   → "?slug=eq.someSlug&select=id,name,slug"

/** Build a PostgREST query string from a filter map. */
export function pq(filters: Record<string, string> = {}): string {
  const parts = Object.entries(filters).map(([k, v]) => `${encodeURIComponent(k)}=${v}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/** equality filter:  status=eq.approved */
export const eqf  = (col: string, val: unknown) => ({ [col]: `eq.${val}` });

/** not-equal filter: status=neq.pending */
export const neqf = (col: string, val: unknown) => ({ [col]: `neq.${val}` });

/** order:  order=name.asc */
export const ord  = (col: string, asc = true)   => ({ order: `${col}.${asc ? "asc" : "desc"}` });

/** in filter: id=in.(a,b,c) */
export const inf  = (col: string, vals: unknown[]) => ({ [col]: `in.(${vals.join(",")})` });

/** ilike filter: city=ilike.*bengaluru* */
export const ilikef = (col: string, val: string) => ({ [col]: `ilike.*${val}*` });

/** contains array filter: available_cities=cs.{Mumbai} */
export const csf  = (col: string, val: string)  => ({ [col]: `cs.{${val}}` });

/** gte filter: event_date=gte.2025-01-01 */
export const gtef = (col: string, val: unknown) => ({ [col]: `gte.${val}` });

/** lte filter: event_date=lte.2025-12-31 */
export const ltef = (col: string, val: unknown) => ({ [col]: `lte.${val}` });
