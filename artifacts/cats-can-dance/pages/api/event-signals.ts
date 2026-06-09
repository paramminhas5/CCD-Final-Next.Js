/**
 * /api/event-signals
 *
 * POST { session_id, event_id, signal_type, city?, genre? }
 *      — record a recommendation engine signal
 *
 * GET /api/event-signals/trending (via query param ?trending=true)
 *      — returns top-clicked event_ids in the last 7 days
 *
 * Note: /api/event-signals/trending is also in a separate file for clarity.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Trending aggregation
  if (req.method === "GET") {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const rows = await get(
      "event_signals",
      `?created_at=gte.${since}&signal_type=eq.click&select=event_id`,
    ) as { event_id: string }[];
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([event_id, clicks]) => ({ event_id, clicks }));
    return res.json(sorted);
  }

  if (req.method === "POST") {
    const { session_id, event_id, signal_type, city, genre } = req.body ?? {};
    if (!session_id || !event_id) {
      return res.status(400).json({ error: "session_id and event_id required" });
    }
    const { ok } = await ins("event_signals", {
      session_id,
      event_id,
      signal_type: signal_type ?? "click",
      city,
      genre,
      created_at: new Date().toISOString(),
    });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
