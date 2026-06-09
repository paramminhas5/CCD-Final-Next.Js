/**
 * POST /api/event-interact
 *
 * Records a user interaction (save, dismiss, click, rsvp, share) on a
 * curated event. Used by the events discovery feed for signal collection.
 *
 * Body: { event_id, action, user_id? }
 *
 * NOTE: Originally designed as /api/events/:id/interact but moved to a flat
 * path to avoid Next.js dynamic param conflicts with /api/events/[slug].ts.
 * Frontend components call /api/event-interact.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { ins } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { event_id, action = "click", user_id } = req.body ?? {};
  if (!event_id) return res.status(400).json({ error: "event_id required" });

  const now = new Date().toISOString();

  // Write to user_event_interactions if we have a user_id
  if (user_id) {
    await ins("user_event_interactions", {
      user_id,
      event_id,
      action,
      created_at: now,
    }).catch(() => { /* non-fatal */ });
  }

  // Anonymous signal for recommendation engine
  const sessionId = (req.headers["x-session-id"] as string) || `anon-${Date.now()}`;
  await ins("event_signals", {
    session_id: sessionId,
    event_id,
    signal_type: action,
    created_at: now,
  }).catch(() => { /* non-fatal */ });

  return res.json({ ok: true });
}
