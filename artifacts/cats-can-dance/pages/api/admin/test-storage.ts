/**
 * GET /api/admin/test-storage
 *
 * Diagnostic endpoint — returns the live status of the event-posters Supabase
 * Storage bucket so the admin UI can show a clear green/red health indicator.
 *
 * Checks:
 *   1. SUPABASE_SERVICE_KEY is present
 *   2. The bucket exists in Supabase Storage
 *   3. The bucket is set to public
 *
 * No secrets are returned — only boolean flags and bucket metadata.
 * Admin-gated via x-admin-password header.
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SK      = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
const BUCKET  = "event-posters";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const isAdmin = !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  const result: Record<string, any> = {
    service_key_set: !!SK,
    bucket: BUCKET,
    bucket_exists: false,
    bucket_public: false,
    signed_url_works: false,
    error: null,
  };

  if (!SK) {
    result.error = "SUPABASE_SERVICE_KEY is not set in Vercel environment variables.";
    return res.json(result);
  }

  // ── 1. Check if bucket exists ────────────────────────────────────────────
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
      result.error = `Bucket '${BUCKET}' does not exist. Click CREATE BUCKET to create it.`;
    } else {
      const txt = await r.text().catch(() => "");
      result.error = `Bucket check failed (${r.status}): ${txt.slice(0, 200)}`;
    }
  } catch (e: any) {
    result.error = `Bucket check error: ${e.message}`;
    return res.json(result);
  }

  if (!result.bucket_exists) return res.json(result);

  // ── 2. Test signed URL generation (no file, just the sign step) ──────────
  try {
    const testPath = `test-probe-${Date.now()}.jpg`;
    const r = await fetch(
      `${SB}/storage/v1/object/upload/sign/${BUCKET}/${testPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SK}`,
          apikey: SK,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upsert: "true" }),
      }
    );
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
