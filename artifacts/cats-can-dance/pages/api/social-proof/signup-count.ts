/**
 * GET /api/social-proof/signup-count
 * Returns total early access signup count.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { SB, SK } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const r = await fetch(
      `${SB}/rest/v1/early_access_signups?select=id&limit=0`,
      { headers: { Authorization: `Bearer ${SK}`, apikey: SK, Prefer: "count=exact" } },
    );
    const raw = r.headers.get("content-range");
    const count = raw ? parseInt(raw.split("/")[1], 10) : 0;
    return res.json({ count: isNaN(count) ? 0 : count });
  } catch {
    return res.json({ count: 0 });
  }
}
