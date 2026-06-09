/**
 * POST /api/shortlist/fan-out
 *
 * Sends a booking inquiry to every un-contacted artist on the
 * promoter's shortlist in one request. Marks each entry as contacted.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, upsert, pq, eqf, clerkId } from "@/lib/api-helpers";

async function resolvePromoter(clerkUserId?: string) {
  if (!clerkUserId) return { promoter: null, error: "Unauthorized" };
  const rows = await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[];
  if (!rows?.length) return { promoter: null, error: "No promoter profile found." };
  return { promoter: rows[0] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = clerkId(req);
  const { promoter, error } = await resolvePromoter(uid);
  if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

  const entries = await get("booking_shortlist",
    pq({ ...eqf("promoter_clerk_id", uid!), ...eqf("contacted", "false") }),
  ) as any[];

  if (!entries?.length) {
    return res.json({ ok: true, sent: 0, message: "No un-contacted artists on shortlist" });
  }

  const firstEntry = entries[0];
  const brief = {
    event_type:      req.body.brief_event_type  ?? firstEntry.brief_event_type,
    event_date:      req.body.brief_date         ?? firstEntry.brief_date,
    event_date_end:  req.body.brief_date_end     ?? firstEntry.brief_date_end,
    cities:          req.body.brief_cities        ?? firstEntry.brief_cities ?? [],
    budget_inr:      req.body.brief_budget_inr   ?? firstEntry.brief_budget_inr,
    notes:           req.body.brief_notes         ?? firstEntry.brief_notes,
    requester_name:  req.body.requester_name      ?? promoter.contact_name ?? promoter.company_name,
    requester_email: req.body.requester_email     ?? promoter.email,
    requester_phone: req.body.requester_phone     ?? null,
  };

  const artistIds = entries.map((e: any) => e.artist_id);
  const artistRows = await get("artists",
    `?id=in.(${artistIds.join(",")})&select=id,slug,name,booking_email`,
  ) as any[];
  const artistMap: Record<string, any> = {};
  for (const a of artistRows ?? []) artistMap[a.id] = a;

  const now = new Date().toISOString();
  const created: string[] = [];
  const failed: string[] = [];

  for (const entry of entries) {
    const artist = artistMap[entry.artist_id];
    if (!artist) { failed.push(entry.artist_id); continue; }

    try {
      const { ok, data } = await ins("booking_requests", {
        artist_id: artist.id,
        artist_id_resolved: artist.id,
        artist_name: artist.name,
        requester_name: brief.requester_name,
        requester_email: brief.requester_email,
        requester_phone: brief.requester_phone,
        event_type: brief.event_type ?? null,
        event_date: brief.event_date ?? null,
        event_date_end: brief.event_date_end ?? null,
        venue_city: Array.isArray(brief.cities) ? brief.cities[0] ?? null : null,
        budget_inr: brief.budget_inr ?? null,
        notes: brief.notes ?? null,
        source: "shortlist_fanout",
        status: "new",
        promoter_clerk_id: uid,
        promoter_name: promoter.company_name,
        forward_requested: true,
        created_at: now,
        updated_at: now,
      });

      if (ok) {
        created.push(artist.slug);
        const bookingId = Array.isArray(data) ? data[0]?.id : data?.id;
        // Mark shortlist entry as contacted
        await patch(
          "booking_shortlist",
          pq({ ...eqf("promoter_clerk_id", uid!), ...eqf("artist_id", artist.id) }),
          { contacted: true, contacted_at: now, booking_request_id: bookingId ?? null, updated_at: now },
        );
      } else {
        failed.push(artist.slug);
      }
    } catch { failed.push(artist.slug); }
  }

  return res.json({ ok: true, sent: created.length, created, failed });
}
