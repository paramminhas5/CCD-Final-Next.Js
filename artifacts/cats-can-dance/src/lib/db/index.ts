/**
 * lib/db/index.ts — barrel export for all data access functions.
 *
 * Import from here in API routes:
 *   import { getArtist, listArtists, sbGet, pq, eqf } from "@/lib/db";
 */

// Core Supabase helpers (for custom queries not covered by the domain fns)
export {
  sbGet, sbGetOne, sbInsert, sbPatch, sbDelete, sbUpsert, sbCount,
  pq, eqf, neqf, ord, inf, ilikef, gtef, ltef, csf,
  sbHeaders,
} from "./supabase";

// Types
export * from "./types";

// Artist domain
export * from "./artists";
