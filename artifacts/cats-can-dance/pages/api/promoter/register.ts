/**
 * POST /api/promoter/register
 *
 * Creates a promoter_profiles record for the signed-in Clerk user.
 * Idempotent — returns existing profile if already registered.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, eqf, clerkId } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = clerkId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const existing = await get("promoter_profiles", pq(eqf("clerk_user_id", uid))) as any[];
  if (existing?.length) return res.json(existing[0]);

  const { company_name, contact_name, email, bio, primary_city,
          cities, genre_focus, website, instagram } = req.body ?? {};

  if (!company_name || !email) {
    return res.status(400).json({ error: "company_name and email required" });
  }

  const now = new Date().toISOString();
  const { ok, data } = await ins("promoter_profiles", {
    clerk_user_id: uid,
    email: email.toLowerCase().trim(),
    company_name: company_name.trim(),
    contact_name: contact_name ?? null,
    bio: bio ?? null,
    primary_city: primary_city ?? null,
    cities: Array.isArray(cities) ? cities : (cities ? [cities] : []),
    genre_focus: Array.isArray(genre_focus) ? genre_focus : [],
    website: website ?? null,
    instagram: instagram ?? null,
    is_verified: false,
    bookings_count: 0,
    total_spend_inr: 0,
    created_at: now,
    updated_at: now,
  });

  if (!ok) return res.status(500).json({ error: "Registration failed", detail: data });
  return res.status(201).json(Array.isArray(data) ? data[0] : data);
}
