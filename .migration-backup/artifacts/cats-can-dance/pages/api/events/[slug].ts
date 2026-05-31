/**
 * GET /api/events/[slug]
 *
 * Returns a single event row by slug.
 * Used by getStaticProps in pages/events/[slug].tsx for SSR/ISR.
 *
 * Strategy:
 *  1. Try Supabase (via SUPABASE_SERVICE_KEY) — live DB data.
 *  2. Fall back to the static catalogue — ensures build-time rendering
 *     always works even when Supabase is unreachable.
 *
 * NOTE: pages/api/events/recommended.ts is a sibling route and is NOT
 * matched by this file — Next.js routes exact filenames before [slug].
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getStaticEventRow } from "@/content/events";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";

async function fetchFromSupabase(slug: string): Promise<any | null> {
  if (!SK) return null;
  try {
    const url = `${SB}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SK}`,
        apikey: SK,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const slug = req.query.slug as string;
  if (!slug || slug === "recommended") {
    // "recommended" is handled by its own route file — should never reach here
    return res.status(404).json({ error: "Not found" });
  }

  // 1. Try live DB
  let event = await fetchFromSupabase(slug);

  // 2. Static fallback — always works at build time
  if (!event) {
    event = getStaticEventRow(slug);
  }

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  // Cache for 60s at the CDN edge — matches ISR revalidate interval
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.json(event);
}
