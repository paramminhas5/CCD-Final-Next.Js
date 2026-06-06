/**
 * /api/storage/[...path]
 *
 * Handles the two operations the storageShim in supabase-shim.ts uses:
 *
 *   GET  /api/storage/:bucket/:filePath
 *     → 302 redirect to the real Supabase public URL.
 *       Used whenever a component calls supabase.storage.from(bucket).getPublicUrl(path)
 *       and then renders the returned URL in an <img src>.
 *
 *   POST /api/storage/:bucket/:filePath   (multipart/form-data, field name "file")
 *     → Legacy shim upload path. Streams the file directly to Supabase Storage
 *       using the service-role key.  This is the fallback used by old code that
 *       calls storageShim.upload(path, file).
 *       NOTE: New code should use the signed-URL flow via admin-upload-poster
 *       instead (bypasses the 4.5 MB Vercel body limit entirely).
 *
 * Env vars required:
 *   SUPABASE_SERVICE_KEY  — service-role key (server-only, never expose to browser)
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";

// Disable Next.js body parser so we can handle raw multipart streams for POST.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS — allow the browser to call this from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-password");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Parse path segments: [...path] = ["bucket", "file", "name.jpg"]
  const segments: string[] = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path as string];

  if (segments.length < 2) {
    return res.status(400).json({ error: "Path must be /api/storage/:bucket/:filePath" });
  }

  const bucket   = segments[0];
  const filePath = segments.slice(1).join("/");

  // ── GET — redirect to public Supabase URL ──────────────────────────────────
  if (req.method === "GET") {
    const publicUrl = `${SB}/storage/v1/object/public/${bucket}/${filePath}`;
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.redirect(302, publicUrl);
  }

  // ── POST — legacy FormData upload ─────────────────────────────────────────
  if (req.method === "POST") {
    if (!SK) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_KEY is not configured. Add it in Vercel → Settings → Environment Variables.",
      });
    }

    // Read the raw request body into a Buffer (no size validation here — Vercel
    // enforces its own 4.5 MB limit; warn callers to use the signed-URL flow
    // for larger files).
    const chunks: Buffer[] = [];
    try {
      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", resolve);
        req.on("error", reject);
      });
    } catch (err: any) {
      console.error("[storage-proxy] read error:", err);
      return res.status(500).json({ error: "Failed to read request body" });
    }

    const rawBody = Buffer.concat(chunks);
    const contentType = req.headers["content-type"] ?? "application/octet-stream";

    // If the client sent multipart/form-data, we need to extract the file part.
    // We do a minimal boundary parse rather than pulling in a dependency.
    let fileBuffer: Buffer = rawBody;
    let fileMime  = "application/octet-stream";

    if (contentType.includes("multipart/form-data")) {
      const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
      if (!boundaryMatch) {
        return res.status(400).json({ error: "multipart boundary not found in Content-Type" });
      }
      const boundary = boundaryMatch[1];
      const parsed = parseMultipart(rawBody, boundary);
      const filePart = parsed.find((p) => p.name === "file") ?? parsed[0];
      if (!filePart) {
        return res.status(400).json({ error: "No 'file' field found in multipart body" });
      }
      fileBuffer = filePart.data;
      fileMime   = filePart.contentType ?? "application/octet-stream";
    }

    // Upload to Supabase Storage using the service-role key
    const uploadUrl = `${SB}/storage/v1/object/${bucket}/${filePath}`;
    try {
      const sbRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SK}`,
          apikey: SK,
          "Content-Type": fileMime,
          "x-upsert": "true",
        },
        body: fileBuffer,
      });

      if (!sbRes.ok) {
        const errText = await sbRes.text().catch(() => "unknown error");
        console.error("[storage-proxy] Supabase upload error:", sbRes.status, errText);
        return res.status(sbRes.status).json({ error: `Supabase upload failed: ${errText.slice(0, 300)}` });
      }

      const publicUrl = `${SB}/storage/v1/object/public/${bucket}/${filePath}`;
      return res.status(200).json({ ok: true, path: filePath, publicUrl });
    } catch (err: any) {
      console.error("[storage-proxy] fetch error:", err);
      return res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Minimal multipart/form-data parser ────────────────────────────────────────
// Avoids pulling in multer/formidable for a single field.
interface MultipartPart {
  name: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const sep   = Buffer.from(`--${boundary}`);
  const crlf  = Buffer.from("\r\n");
  const dcrlf = Buffer.from("\r\n\r\n");

  let pos = 0;

  while (pos < body.length) {
    // Find next boundary
    const boundaryStart = indexOf(body, sep, pos);
    if (boundaryStart === -1) break;

    pos = boundaryStart + sep.length;

    // Check for end boundary (--)
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break;

    // Skip CRLF after boundary
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2;

    // Find end of headers (double CRLF)
    const headersEnd = indexOf(body, dcrlf, pos);
    if (headersEnd === -1) break;

    const headerBlock = body.slice(pos, headersEnd).toString("utf8");
    pos = headersEnd + 4; // skip \r\n\r\n

    // Parse Content-Disposition and Content-Type
    const dispMatch    = headerBlock.match(/content-disposition:[^\r\n]*name="([^"]+)"/i);
    const fileMatch    = headerBlock.match(/content-disposition:[^\r\n]*filename="([^"]+)"/i);
    const ctMatch      = headerBlock.match(/content-type:\s*([^\r\n]+)/i);

    const name        = dispMatch?.[1] ?? "unknown";
    const filename    = fileMatch?.[1];
    const contentType = ctMatch?.[1]?.trim();

    // Find next boundary to locate end of this part's data
    const nextBoundary = indexOf(body, sep, pos);
    const dataEnd      = nextBoundary === -1 ? body.length : nextBoundary - 2; // strip trailing \r\n

    const data = body.slice(pos, dataEnd);
    parts.push({ name, filename, contentType, data });
    pos = nextBoundary === -1 ? body.length : nextBoundary;
  }

  return parts;
}

function indexOf(buf: Buffer, search: Buffer, start = 0): number {
  for (let i = start; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}
