/**
 * POST /api/generate-poster
 *
 * Generates an event poster using fal.ai (fal-ai/flux/dev — higher quality).
 * FAL_KEY must be set in Vercel environment variables.
 *
 * Request body:
 *   { title, date, venue, city, lineup?, series_label?, eyebrow? }
 *
 * Response:
 *   { ok: true, image_url: string, prompt_used: string }
 *   { ok: false, error: string }
 */

import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

function buildPrompt(params: {
  title: string;
  date: string;
  venue: string;
  city: string;
  lineup?: string;
  series_label?: string;
  eyebrow?: string;
}): string {
  const { title, date, venue, city, lineup, series_label, eyebrow } = params;

  const lineupLine = lineup
    ? `Artists on the poster: "${lineup
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" B2B ")}". `
    : "";
  const seriesLine = series_label ? `Series name: "${series_label}". ` : "";
  const eyebrowLine = eyebrow ? `Sub-heading text: "${eyebrow}". ` : "";

  // Core prompt — specificity is key for flux/dev
  return [
    // Art direction
    `Underground rave event flyer, portrait orientation 3:4, A5 print poster.`,
    `Art direction: neobrutalist flat graphic design. Thick 4px black outlines on every element.`,
    `Zero gradients. Zero photography. Zero realism. Flat vector illustration only.`,
    `Color palette — ONLY these five colors: solid black #0a0a0a, acid yellow #F5E642, hot magenta #E02070, electric blue #1A56E8, off-white cream #F5F0E8.`,

    // Central mascot
    `Central illustration: a white cartoon cat mascot. The cat wears large oversized round black sunglasses and chunky over-ear DJ headphones. Streetwear hoodie or oversized tee. Standing confidently with one paw raised. Flat vector, expressive, slightly mischievous. This cat is the brand character for "Cats Can Dance". The cat occupies the center 40% of the poster vertically.`,

    // Layout zones (top to bottom)
    `Top zone (acid yellow background): event title text in huge bold condensed display font, all caps, black text with 6px magenta drop shadow: "${title.toUpperCase()}".`,
    date ? `Below title: date text in magenta, bold: "${date}".` : "",
    venue ? `Below date: venue text in electric blue, smaller but still bold: "${venue.toUpperCase()}, ${city.toUpperCase()}".` : "",
    lineupLine,
    seriesLine,
    eyebrowLine,

    // Bottom branding bar
    `Bottom bar: solid black rectangle. Text inside: "CATS CAN DANCE" in acid yellow, chunky font, centered. Below that in smaller cream text: "catscandance.com".`,

    // Frame
    `Outer border: 8px solid black frame around the entire poster with 4px acid yellow inner rule.`,

    // Typography style
    `Typography: Bebas Neue or Bowlby One style. All text UPPERCASE. Chunky, condensed, brutalist. Drop shadows on all headings.`,

    // Final quality note
    `The result must look like a premium 1990s UK rave flyer redrawn in 2025 with modern flat design principles. No AI look. Sharp edges. Bold. Unmistakable.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const FAL_KEY = process.env.FAL_KEY ?? "";

  if (!FAL_KEY) {
    return res.status(500).json({
      ok: false,
      error: "FAL_KEY env var not set. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  const { title, date, venue, city, lineup, series_label, eyebrow } = req.body ?? {};

  if (!title || !date || !venue) {
    return res.status(400).json({ ok: false, error: "title, date, and venue are required" });
  }

  const prompt = buildPrompt({
    title,
    date,
    venue,
    city: city ?? "Bengaluru",
    lineup,
    series_label,
    eyebrow,
  });

  try {
    // fal-ai/flux/dev — higher quality, better text rendering, 28 steps
    const falRes = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "portrait_4_3",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
      }),
      signal: AbortSignal.timeout(90_000),
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

    const imageUrl: string | undefined =
      data?.images?.[0]?.url ?? data?.image?.url ?? data?.output?.images?.[0]?.url;

    if (!imageUrl) {
      console.error("[generate-poster] unexpected fal response:", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({
        ok: false,
        error: "fal.ai returned no image. Check FAL_KEY and try again.",
      });
    }

    return res.status(200).json({ ok: true, image_url: imageUrl, prompt_used: prompt });
  } catch (err: any) {
    console.error("[generate-poster] exception:", err?.message);
    return res.status(500).json({ ok: false, error: err?.message ?? "Generation failed" });
  }
}
