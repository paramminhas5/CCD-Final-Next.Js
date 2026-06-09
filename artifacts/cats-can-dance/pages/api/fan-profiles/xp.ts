/**
 * POST /api/fan-profiles/xp
 *
 * Awards XP and CCD points to a user for a given action.
 * Also logs to xp_events table for history.
 *
 * Body: { user_id, action, ref_id?, ref_type?, metadata? }
 * Returns: { ok, xp_earned, points_earned, tier }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch } from "@/lib/api-helpers";

const XP_RATES: Record<string, { xp: number; points: number }> = {
  first_visit:   { xp: 50,  points: 5 },
  event_click:   { xp: 5,   points: 0 },
  event_rsvp:    { xp: 20,  points: 2 },
  event_save:    { xp: 10,  points: 1 },
  event_share:   { xp: 15,  points: 2 },
  social_share:  { xp: 25,  points: 3 },
  artist_view:   { xp: 3,   points: 0 },
  artist_follow: { xp: 10,  points: 1 },
};

const XP_TIERS = [
  { min: 2000, tier: "legend" },
  { min: 500,  tier: "maker" },
  { min: 100,  tier: "regular" },
  { min: 0,    tier: "lurker" },
];

const calcTier = (xp: number) => XP_TIERS.find(t => xp >= t.min)?.tier ?? "lurker";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, action, ref_id, ref_type, metadata } = req.body ?? {};

  if (!user_id || !action) {
    return res.status(400).json({ error: "user_id and action required" });
  }

  const rate = XP_RATES[action];
  if (!rate) {
    return res.status(400).json({ error: `Unknown action: ${action}. Valid: ${Object.keys(XP_RATES).join(", ")}` });
  }

  const rows = await get("fan_profiles", `?user_id=eq.${encodeURIComponent(user_id)}&limit=1`) as any[];
  const now = new Date().toISOString();

  if (!rows.length) {
    await ins("fan_profiles", {
      user_id,
      xp: rate.xp,
      ccd_points: rate.points,
      tier: calcTier(rate.xp),
      total_interactions: 1,
      events_rsvpd: action === "event_rsvp" ? 1 : 0,
      events_saved: action === "event_save" ? 1 : 0,
      shares: action.includes("share") ? 1 : 0,
      created_at: now,
      updated_at: now,
    });
  } else {
    const fp = rows[0];
    const newXp = (fp.xp || 0) + rate.xp;
    const u: Record<string, any> = {
      xp: newXp,
      ccd_points: (fp.ccd_points || 0) + rate.points,
      tier: calcTier(newXp),
      total_interactions: (fp.total_interactions || 0) + 1,
      updated_at: now,
    };
    if (action === "event_rsvp") u.events_rsvpd = (fp.events_rsvpd || 0) + 1;
    if (action === "event_save") u.events_saved = (fp.events_saved || 0) + 1;
    if (action.includes("share")) u.shares = (fp.shares || 0) + 1;
    await patch("fan_profiles", `?user_id=eq.${encodeURIComponent(user_id)}`, u);
  }

  // Log XP event
  await ins("xp_events", {
    user_id,
    action,
    xp_earned: rate.xp,
    points_earned: rate.points,
    ref_id: ref_id ?? null,
    ref_type: ref_type ?? null,
    metadata: metadata ?? {},
    created_at: now,
  });

  const finalXp = ((rows[0]?.xp ?? 0) + rate.xp);
  return res.json({
    ok: true,
    xp_earned: rate.xp,
    points_earned: rate.points,
    tier: calcTier(finalXp),
  });
}
