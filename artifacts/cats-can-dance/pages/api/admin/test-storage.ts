/**
 * GET /api/admin/test-storage
 *
 * Diagnostic endpoint — returns live status of the event-posters
 * Supabase Storage bucket. Admin-gated via x-admin-password header.
 *
 * FIX: Removed hardcoded Supabase URL — now reads from env var only.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB       = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SK       = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
const BUCKET   = "event-posters";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const isAdmin = !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  const result: Record<string, any> = {
    service_key_set: !!SK,
    supabase_url_set: !!SB,
    bucket: BUCKET,
    bucket_exists: false,
    bucket_public: false,
    signed_url_works: false,
    error: null,
  };

  if (!SK || !SB) {
    result.error = !SB
      ? "NEXT_PUBLIC_SUPABASE_URL is not set."
      : "SUPABASE_SERVICE_KEY is not set.";
    return res.json(result);
  }

  // ── Check bucket ─────────────────────────────────────────────────────────
  try {
    const r = await fetch(`${SB}/storage/v1/bucket/${BUCKET}`, {
      headers: { Authorization: `Bearer ${SK}`, apikey: SK },
    });
    if (r.ok) {
      const data = await r.json();
      result.bucket_exists = true;
      result.bucket_public = data?.public === true;
      result.bucket_file_size_limit = data?.file_size_limit ?? null;
      result.bucket_allowed_mime_types = data?.allowed_mime_types ?? null;
    } else if (r.status === 404) {
      result.error = `Bucket '${BUCKET}' does not exist. Click CREATE BUCKET.`;
    } else {
      const txt = await r.text().catch(() => "");
      result.error = `Bucket check failed (${r.status}): ${txt.slice(0, 200)}`;
    }
  } catch (e: any) {
    result.error = `Bucket check error: ${e.message}`;
    return res.json(result);
  }

  if (!result.bucket_exists) return res.json(result);

  // ── Test signed URL generation ────────────────────────────────────────────
  try {
    const testPath = `test-probe-${Date.now()}.jpg`;
    const r = await fetch(`${SB}/storage/v1/object/upload/sign/${BUCKET}/${testPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SK}`,
        apikey: SK,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upsert: "true" }),
    });
    if (r.ok) {
      result.signed_url_works = true;
    } else {
      const txt = await r.text().catch(() => "");
      result.error = `Signed URL generation failed (${r.status}): ${txt.slice(0, 200)}`;
    }
  } catch (e: any) {
    result.error = `Signed URL error: ${e.message}`;
  }

  return res.json(result);
}
