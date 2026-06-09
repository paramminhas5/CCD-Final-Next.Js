/**
 * POST /api/catbot-chat
 *
 * SSE proxy — forwards chat requests to the Supabase Edge Function
 * catbot-chat and streams the response back to the browser.
 *
 * Requires SUPABASE_ANON_KEY env var.
 * Optional: CATBOT_EDGE_URL to override the default Supabase function URL.
 */
import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SB       = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const CATBOT_URL = process.env.CATBOT_EDGE_URL ?? `${SB}/functions/v1/catbot-chat`;

  if (!ANON_KEY) {
    return res.status(503).json({ error: "Catbot not configured — SUPABASE_ANON_KEY missing" });
  }

  try {
    const upstream = await fetch(CATBOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => "stream error");
      return res.status(upstream.status).send(txt);
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = upstream.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(value);
      await pump();
    };
    await pump();
  } catch (err: any) {
    return res.status(502).json({ error: `Catbot unreachable: ${err.message}` });
  }
}
