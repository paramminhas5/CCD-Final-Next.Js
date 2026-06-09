/**
 * POST /api/contact
 *
 * Body: { name, email, message }
 * Saves to contact_messages table.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { ins } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, message } = req.body ?? {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email, message required" });
  }

  const { ok } = await ins("contact_messages", {
    name,
    email,
    message,
    created_at: new Date().toISOString(),
  });

  return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to save message" });
}
