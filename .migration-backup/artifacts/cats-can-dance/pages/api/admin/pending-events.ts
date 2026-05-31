/**
 * Pending promoter event submissions — admin moderation queue
 *
 * GET  /api/admin/pending-events          — list all pending events
 * POST /api/admin/pending-events          — approve or reject a pending event
 *      Body: { id: string, action: "approve" | "reject" }
 *
 * Auth: x-admin-password header
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB       = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK       = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "84838281";

const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
});

async function sbGet(table: string, qs = ""): Promise<any[]> {
  if (!SK) return [];
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, { headers: sbHeaders() });
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch { return []; }
}

async function sbPatch(table: string, id: string, patch: object): Promise<boolean> {
  if (!SK) return false;
  try {
    const r = await fetch(`${SB}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: sbHeaders(),
      body: JSON.stringify(patch),
    });
    return r.ok;
  } catch { return false; }
}

async function sbDelete(table: string, id: string): Promise<boolean> {
  if (!SK) return false;
  try {
    const r = await fetch(`${SB}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: sbHeaders(),
    });
    return r.ok;
  } catch { return false; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Admin auth
  if (req.headers["x-admin-password"] !== ADMIN_PW) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    // Return all pending events, newest first
    const events = await sbGet(
      "curated_events",
      `?submission_status=eq.pending&order=created_at.desc&limit=100`
    );
    return res.json({ events });
  }

  if (req.method === "POST") {
    const { id, action } = req.body ?? {};

    if (!id || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "id and action (approve|reject) required" });
    }

    if (action === "approve") {
      const ok = await sbPatch("curated_events", id, {
        submission_status: "published",
        updated_at: new Date().toISOString(),
      });
      return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to approve" });
    }

    if (action === "reject") {
      const ok = await sbDelete("curated_events", id);
      return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to reject" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
