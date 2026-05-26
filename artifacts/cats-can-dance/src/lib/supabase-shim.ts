/**
 * Supabase compatibility shim.
 * Provides a supabase-shaped object that routes calls to our /api server.
 * This lets the existing source files work without modification during migration.
 *
 * Auth: migrated to Clerk. The authShim below is a no-op stub kept only for
 * backwards compatibility — active code should use @clerk/react hooks directly.
 */
import { api } from "./api-client";

type QueryBuilder = {
  select: (...args: any[]) => QueryBuilder;
  eq: (col: string, val: any) => QueryBuilder;
  neq: (col: string, val: any) => QueryBuilder;
  is: (col: string, val: any) => QueryBuilder;
  or: (expr: string) => QueryBuilder;
  order: (col: string, opts?: any) => QueryBuilder;
  limit: (n: number) => QueryBuilder;
  maybeSingle: () => Promise<{ data: any; error: any }>;
  single: () => Promise<{ data: any; error: any }>;
  update: (patch: any) => QueryBuilder;
  insert: (row: any) => QueryBuilder;
  delete: () => QueryBuilder;
  then: (resolve: (val: { data: any; error: any }) => void) => Promise<void>;
  _table: string;
  _method: "select" | "insert" | "update" | "delete";
  _filter: Record<string, any>;
  _or?: string;
  _patch?: any;
  _limit?: number;
  _orderCol?: string;
  _orderAsc?: boolean;
  _execute: () => Promise<{ data: any; error: any }>;
};

/** Map Supabase table names (underscores) → our API route slugs (hyphens) */
const TABLE_ROUTE: Record<string, string> = {
  site_settings: "site-settings",
  curated_events: "curated-events",
  artist_dates: "artist-dates",
  artist_submissions: "artist-submissions",
  booking_requests: "booking-requests",
  booking_otp_codes: "booking-otp-codes",
  contact_messages: "contact",
  early_access_signups: "early-access",
  event_rsvps: "event-rsvp",
  site_videos: "videos",
  // promoter_applications does not have a DB table — routes to contact_messages via proxy
  promoter_applications: "promoter-applications",
};

function tableRoute(table: string): string {
  return TABLE_ROUTE[table] ?? table;
}

function buildQuery(table: string): QueryBuilder {
  const q: QueryBuilder = {
    _table: table,
    _method: "select",
    _filter: {},
    select(_cols?: string) { return q; },
    eq(col, val) { q._filter[col] = val; return q; },
    neq(col, val) { q._filter[`neq_${col}`] = val; return q; },
    is(col, val) { q._filter[`is_${col}`] = val; return q; },
    or(expr) { q._or = expr; return q; },
    order(col, opts) { q._orderCol = col; q._orderAsc = opts?.ascending ?? true; return q; },
    limit(n) { q._limit = n; return q; },
    update(patch) { q._method = "update"; q._patch = patch; return q; },
    insert(row) { q._method = "insert"; q._patch = row; return q; },
    delete() { q._method = "delete"; return q; },
    maybeSingle() { return q._execute().then(({ data }) => ({ data: Array.isArray(data) ? data[0] ?? null : data, error: null })).catch(e => ({ data: null, error: e })); },
    single() { return q._execute().then(({ data }) => ({ data: Array.isArray(data) ? data[0] : data, error: null })).catch(e => ({ data: null, error: e })); },
    then(resolve) {
      return q._execute().then(resolve);
    },
    // @ts-ignore
    _execute() {
      const filterParams = new URLSearchParams();
      Object.entries(q._filter).forEach(([k, v]) => filterParams.set(k, String(v)));
      if (q._or) filterParams.set("or", q._or);
      if (q._limit) filterParams.set("limit", String(q._limit));
      if (q._orderCol) filterParams.set("order", `${q._orderCol}:${q._orderAsc ? "asc" : "desc"}`);
      const qs = filterParams.toString() ? `?${filterParams}` : "";

      const route = tableRoute(table);
      if (q._method === "select") {
        return api.get<any>(`/${route}${qs}`).then(data => ({ data, error: null })).catch(e => ({ data: null, error: e }));
      }
      if (q._method === "insert") {
        return api.post<any>(`/${route}`, q._patch).then(data => ({ data, error: null })).catch(e => ({ data: null, error: e }));
      }
      if (q._method === "update") {
        const id = q._filter.id;
        return api.patch<any>(id ? `/${route}/${id}` : `/${route}`, q._patch).then(data => ({ data, error: null })).catch(e => ({ data: null, error: e }));
      }
      if (q._method === "delete") {
        const id = q._filter.id;
        return api.delete<any>(`/${route}/${id}`).then(data => ({ data, error: null })).catch(e => ({ data: null, error: e }));
      }
      return Promise.resolve({ data: null, error: new Error("Unknown method") });
    },
  };
  return q;
}

// Auth shim — no-op stub. Active code uses @clerk/react hooks directly.
const authShim = {
  getSession: async () => ({ data: { session: null }, error: null }),
  signInWithOtp: async (_opts: any) => ({ data: {}, error: { message: "Auth is handled by Clerk — use the /sign-in page." } }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: (_cb: (event: string, session: any) => void) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
};

// Storage shim — routes to /api/storage/*
const storageShim = {
  from: (bucket: string) => ({
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `/api/storage/${bucket}/${path}` },
    }),
    upload: async (path: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/storage/${bucket}/${path}`, {
        method: "POST",
        body: fd,
      });
      return res.ok ? { data: { path }, error: null } : { data: null, error: new Error("Upload failed") };
    },
  }),
};

/** Map Supabase edge-function names → our API route slugs */
const FUNCTION_ROUTE: Record<string, string> = {
  "contact-submit": "contact",
  "early-access-signup": "early-access",
  "event-rsvp": "event-rsvp",
  "booking-otp-start": "booking-otp/start",
  "booking-otp-verify": "booking-otp/verify",
  "cat-generate": "cat-generate",
  "instagram-feed": "instagram-feed",
  "youtube-videos": "youtube-videos",
  "enrich-artists": "functions/v1/enrich-artists",
  "admin-videos": "functions/v1/admin-videos",
  "admin-content": "functions/v1/admin-content",
  "admin-rsvps": "functions/v1/admin-rsvps",
  "admin-signups": "functions/v1/admin-signups",
  "admin-upload-poster": "functions/v1/admin-upload-poster",
  "admin-curated-events": "functions/v1/admin-curated-events",
  "curate-events": "functions/v1/curate-events",
  "scheduled-curate": "functions/v1/scheduled-curate",
  "admin-publish-blog": "functions/v1/admin-publish-blog",
  "admin-generate-blog": "functions/v1/admin-generate-blog",
  "admin-promoters": "functions/v1/admin-promoters",
};

const GET_FUNCTIONS = new Set([
  "instagram-feed",
  "youtube-videos",
  "admin-videos",
  "admin-content",
  "admin-rsvps",
  "admin-signups",
  "admin-promoters",
]);

const functionsShim = {
  invoke: async (name: string, opts?: { body?: any; headers?: Record<string, string> }) => {
    try {
      const route = FUNCTION_ROUTE[name] ?? name;
      const data = GET_FUNCTIONS.has(name)
        ? await api.get<any>(`/${route}`, opts?.headers)
        : await api.post<any>(`/${route}`, opts?.body ?? {}, opts?.headers);
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  },
};

function channelShim(_name: string) {
  const ch = {
    on: (..._args: any[]) => ch,
    subscribe: (..._args: any[]) => ch,
    unsubscribe: () => ch,
  };
  return ch;
}

export const supabase = {
  from: buildQuery,
  auth: authShim,
  storage: storageShim,
  functions: functionsShim,
  channel: channelShim,
  removeChannel: (_channel?: any) => {},
};
