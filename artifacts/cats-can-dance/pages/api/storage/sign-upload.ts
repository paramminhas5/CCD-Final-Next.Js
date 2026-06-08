/**
 * POST /api/storage/sign-upload
 *
 * Returns a signed upload URL for Supabase Storage so the browser can
 * PUT a file directly to storage (no 4.5 MB Vercel body limit issue).
 *
 * Body: { bucket: string, ext: string, mimeType: string }
 * Returns: { signedUrl: string, publicUrl: string, path: string }
 *
 * The bucket is created automatically if it doesn't exist yet.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";

const ALLOWED_BUCKETS = ["artist-photos", "gallery", "event-posters"];
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!SK) {
    return res.status(500).json({
      error: "SUPABASE_SERVICE_KEY is not set. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  const { bucket = "artist-photos", ext = "jpg", mimeType = "image/jpeg" } = req.body ?? {};

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return res.status(400).json({ error: `bucket must be one of: ${ALLOWED_BUCKETS.join(", ")}` });
  }
  if (!ALLOWED_MIME.includes(mimeType)) {
    return res.status(400).json({ error: `mimeType must be one of: ${ALLOWED_MIME.join(", ")}` });
  }

  const safeExt = String(ext).replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  // Ensure bucket exists (idempotent — 409 = already exists, both are fine)
  await fetch(`${SB}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SK}`,
      apikey: SK,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: 10485760, // 10 MB
      allowed_mime_types: ALLOWED_MIME,
    }),
  }).catch(() => { /* network error creating bucket — non-fatal */ });

  // Request signed upload URL (valid for 60 s)
  const signRes = await fetch(
    `${SB}/storage/v1/object/upload/sign/${bucket}/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SK}`,
        apikey: SK,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upsert: "true" }),
    },
  );

  if (!signRes.ok) {
    const errText = await signRes.text().catch(() => "");
    return res.status(signRes.status).json({
      error: `Could not get signed upload URL (${signRes.status}): ${errText.slice(0, 200)}`,
    });
  }

  const signJson = await signRes.json() as { signedURL?: string; url?: string };
  const rawUrl = signJson.signedURL ?? signJson.url ?? "";
  if (!rawUrl) {
    return res.status(500).json({ error: "Supabase did not return a signed URL" });
  }

  // Normalise to absolute URL
  const signedUrl = rawUrl.startsWith("http") ? rawUrl : `${SB}${rawUrl}`;
  const publicUrl = `${SB}/storage/v1/object/public/${bucket}/${storagePath}`;

  return res.json({ signedUrl, publicUrl, path: storagePath, bucket });
}
