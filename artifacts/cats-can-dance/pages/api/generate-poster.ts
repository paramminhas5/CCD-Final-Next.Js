/**
 * POST /api/generate-poster
 *
 * Generates an event poster using fal.ai (fal-ai/flux/schnell via REST).
 * FAL_KEY must be set in Vercel environment variables.
 *
 * Request body:
 *   { title, date, venue, city, lineup?, series_label? }
 *
 * Response:
 *   { ok: true, image_url: string }  |  { ok: false, error: string }
 */

import type { NextApiRequest, NextApiResponse } from "next";

const FAL_KEY = process.env.FAL_KEY ?? "";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

function buildPrompt(params: {
  title: string;
  date: string;
  venue: string;
  city: string;
  lineup?: string;
  series_label?: string;
}): string {
  const { title, date, venue, city, lineup, series_label } = params;

  const seriesPart = series_label ? `Part of ${series_label} series. ` : "";
  const lineupPart = lineup
    ? `Featuring: ${lineup.split(",").map((s: string) => s.trim()).filter(Boolean).join(", ")}. `
    : "";

  return (
    `Create a bold, high-contrast event poster for a underground dance music night. ` +
    `Event: "${title}". Date: ${date}. Venue: ${venue}, ${city}. ${seriesPart}${lineupPart}` +
    `Style: brutalist graphic design, bold display typography, dark background (near black), ` +
    `neon accent colours — use acid yellow (#F5FF3C), hot magenta (#FF2D78), and electric blue (#1B6FFF). ` +
    `Large blocky text for the event name dominates the top half. ` +
    `Date and venue in smaller but still bold type below. ` +
    `Abstract geometric shapes or ink-splat textures in the background. ` +
    `No photographs. No realistic humans or animals. Pure graphic design. ` +
    `Portrait orientation (3:4 aspect ratio). Print-ready quality. ` +
    `Cats Can Dance brand — underground cool, not mainstream.`
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!FAL_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "FAL_KEY env var not set. Add it in Vercel → Settings → Environment Variables." });
  }

  const { title, date, venue, city, lineup, series_label } = req.body ?? {};

  if (!title || !date || !venue) {
    return res.status(400).json({ ok: false, error: "title, date, and venue are required" });
  }

  const prompt = buildPrompt({ title, date, venue, city: city ?? "Bengaluru", lineup, series_label });

  try {
    // fal.ai REST API — flux/schnell for fast generation
    const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "portrait_4_3",   // closest to 3:4 poster ratio
        num_inference_steps: 4,        // schnell is fast at 4 steps
        num_images: 1,
        enable_safety_checker: false,
      }),
    });

    if (!falRes.ok) {
      const errText = await falRes.text().catch(() => "unknown error");
      console.error("[generate-poster] fal.ai error:", falRes.status, errText);
      return res.status(502).json({
        ok: false,
        error: `fal.ai returned ${falRes.status}: ${errText.slice(0, 200)}`,
      });
    }

    const data = await falRes.json();

    // fal.ai returns images as array of { url, width, height }
    const imageUrl: string | undefined =
      data?.images?.[0]?.url ?? data?.image?.url ?? data?.output?.images?.[0]?.url;

    if (!imageUrl) {
      console.error("[generate-poster] unexpected fal response:", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({
        ok: false,
        error: "fal.ai returned no image. Check FAL_KEY and try again.",
      });
    }

    return res.status(200).json({ ok: true, image_url: imageUrl });

  } catch (err: any) {
    console.error("[generate-poster] exception:", err?.message);
    return res.status(500).json({ ok: false, error: err?.message ?? "Generation failed" });
  }
}
