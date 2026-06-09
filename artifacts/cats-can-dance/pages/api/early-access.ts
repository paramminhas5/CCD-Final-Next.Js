/**
 * POST /api/early-access
 *
 * Body: { email, source? }
 * Signs up an email address for early access. Idempotent — duplicate emails return ok.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, eqf } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const email = (req.body?.email ?? "").toLowerCase().trim();
  if (!email) return res.status(400).json({ error: "Email required" });

  const existing = await get("early_access_signups", pq(eqf("email", email))) as any[];
  if (existing?.length) return res.json({ ok: true, duplicate: true });

  const { ok } = await ins("early_access_signups", {
    email,
    source: req.body?.source ?? "home",
    created_at: new Date().toISOString(),
  });

  return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to sign up" });
}
