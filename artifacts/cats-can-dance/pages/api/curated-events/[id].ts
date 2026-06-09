/**
 * DELETE /api/curated-events/:id
 *
 * Admin can delete any event.
 * Promoter can delete their own (submitted_by === user_id).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, del, pq, eqf, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const id = req.query.id as string;

  if (isAdminReq(req)) {
    await del("curated_events", pq(eqf("id", id)));
    return res.json({ ok: true });
  }

  const userId = (req.body?.user_id ?? req.query.user_id) as string | undefined;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await get("curated_events", pq(eqf("id", id))) as any[];
  if (!rows?.length) return res.status(404).json({ error: "Not found" });

  if (rows[0]?.submitted_by !== userId) {
    return res.status(403).json({ error: "Not your event" });
  }

  await del("curated_events", pq(eqf("id", id)));
  return res.json({ ok: true });
}
