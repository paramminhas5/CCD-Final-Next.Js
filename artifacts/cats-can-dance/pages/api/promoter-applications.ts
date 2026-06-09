/**
 * POST /api/promoter-applications
 *
 * Public — saves a promoter application to contact_messages
 * (no dedicated table; admin sees it in the Messages view).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { ins } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, instagram, website, city, genres, bio, sample_event } = req.body ?? {};
  if (!name || !email) return res.status(400).json({ error: "name and email required" });

  const message = [
    "[Promoter Application]",
    `City: ${city || "—"}`,
    `Genres: ${Array.isArray(genres) ? genres.join(", ") : (genres || "—")}`,
    `Instagram: ${instagram || "—"}`,
    `Website: ${website || "—"}`,
    `Sample Event: ${sample_event || "—"}`,
    "",
    `Bio: ${bio || "—"}`,
  ].join("\n");

  const { ok } = await ins("contact_messages", {
    name,
    email,
    message,
    created_at: new Date().toISOString(),
  });

  return ok
    ? res.json({ ok: true })
    : res.status(500).json({ error: "Failed to save application" });
}
