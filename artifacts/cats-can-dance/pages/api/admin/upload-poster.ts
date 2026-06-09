/**
 * POST /api/admin/upload-poster
 *
 * Issues a Supabase Storage signed upload URL for an event poster.
 * Browser PUTs the file directly to storage — no Vercel body limit hit.
 *
 * Body: { slug, ext, mimeType }
 * Returns: { signedUrl, publicUrl, path }
 *
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { SB, SK, isAdminReq } from "@/lib/api-helpers";

const BUCKET = "event-posters";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!SK) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY is not set." });

  // Auto-create bucket (idempotent — 409 = already exists)
  await fetch(`${SB}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SK}`, apikey: SK, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 10485760, allowed_mime_types: ALLOWED_MIME }),
  }).catch(() => {});

  const slug     = (req.body.slug ?? `poster-${Date.now()}`).toString().replace(/[^a-z0-9-_]/gi, "-").slice(0, 60);
  const ext      = (req.body.ext ?? "jpg").toString().replace(/[^a-z0-9]/gi, "").slice(0, 5);
  const mimeType = ALLOWED_MIME.includes(req.body.mimeType) ? req.body.mimeType : "image/jpeg";
  const storagePath = `${slug}-${Date.now()}.${ext}`;

  const signRes = await fetch(
    `${SB}/storage/v1/object/upload/sign/${BUCKET}/${storagePath}`,
    { method: "POST", headers: { Authorization: `Bearer ${SK}`, apikey: SK, "Content-Type": "application/json" }, body: JSON.stringify({ upsert: "true" }) },
  );

  if (!signRes.ok) {
    const err = await signRes.text().catch(() => "");
    return res.status(signRes.status).json({ error: `Could not get upload URL (${signRes.status}): ${err.slice(0, 300)}` });
  }

  const signJson = await signRes.json() as { signedURL?: string; url?: string };
  const rawUrl = signJson.signedURL ?? signJson.url ?? "";
  if (!rawUrl) return res.status(500).json({ error: "Supabase did not return a signed URL." });

  const signedUrl = rawUrl.startsWith("http") ? rawUrl : `${SB}${rawUrl}`;
  const publicUrl = `${SB}/storage/v1/object/public/${BUCKET}/${storagePath}`;

  return res.json({ signedUrl, path: storagePath, publicUrl, mimeType });
}
