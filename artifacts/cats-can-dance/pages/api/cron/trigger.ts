/**
 * POST /api/cron/trigger
 *
 * Admin-only manual trigger for the scrape-events cron job.
 * Calls /api/cron/scrape-events internally.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminReq, ADMIN_PW } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const r = await fetch(`${base}/api/cron/scrape-events`, {
      method: "POST",
      headers: { "x-admin-password": ADMIN_PW },
    });
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Trigger failed" });
  }
}
