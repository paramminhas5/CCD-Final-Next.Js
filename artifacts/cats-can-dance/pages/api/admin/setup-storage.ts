/**
 * POST /api/admin/setup-storage
 *
 * Creates the event-posters Supabase Storage bucket if it doesn't exist.
 * Idempotent — 409 = already exists (success).
 *
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { SB, SK, isAdminReq } from "@/lib/api-helpers";

const BUCKET = "event-posters";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!SK) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY is not set." });

  try {
    const r = await fetch(`${SB}/storage/v1/bucket`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SK}`, apikey: SK, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: 10485760,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      }),
    });
    if (r.ok) return res.json({ ok: true, created: true, bucket: BUCKET });
    if (r.status === 409) return res.json({ ok: true, created: false, message: `Bucket '${BUCKET}' already exists — you're good to go!` });
    const txt = await r.text().catch(() => "");
    return res.status(r.status).json({ error: txt.slice(0, 200) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
