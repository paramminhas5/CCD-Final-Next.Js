/**
 * POST /api/generate-poster
 *
 * Generates a CCD-branded event poster using fal.ai (fal-ai/flux/dev).
 * FAL_KEY must be set in Vercel environment variables.
 *
 * Request body:
 *   { title, date, venue, city, lineup?, series_label?, eyebrow?, is_ccdxsocial? }
 *
 * Response:
 *   { ok: true, image_url: string, prompt_used: string }
 *   { ok: false, error: string }
 */

import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

// ── CCD Brand constants ────────────────────────────────────────────────────────
// These are locked — every poster must use exactly these.
const BRAND = {
  name:        "CATS CAN DANCE",
  shortName:   "CCD",
  handle:      "@catscandance",
  website:     "catscandance.com",
  city:        "BENGALURU",
  // Exact hex values from tailwind.config / CSS variables
  colors: {
    ink:     "#0A0A0A",   // near-black
    yellow:  "#F5E642",   // acid yellow (primary brand accent)
    magenta: "#E02070",   // hot magenta
    blue:    "#1A56E8",   // electric blue
    cream:   "#F5F0E8",   // off-white cream
  },
  // The cat mascot — must be described identically every generation for consistency
  cat: [
    "The central illustration is the official CCD brand mascot: a white cartoon cat with expressive round black eyes.",
    "The cat wears large circular black sunglasses with thick frames.",
    "The cat has chunky over-ear DJ headphones resting on its head.",
    "The cat wears a black oversized streetwear hoodie or graphic tee with the text 'CCD' printed on the chest.",
    "The cat stands in a confident, slightly spread-legged DJ stance with one paw raised in the air.",
    "The art style is flat vector illustration — clean outlines, no shading, no gradients, no texture.",
    "The cat has a mischievous, knowing expression. Slightly smug. Underground cool.",
    "The cat occupies the central 45% of the poster height.",
  ].join(" "),
};

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(params: {
  title: string;
  date: string;
  venue: string;
  city: string;
  lineup?: string;
  series_label?: string;
  eyebrow?: string;
  is_ccdxsocial?: boolean;
}): string {
  const { title, date, venue, city, lineup, series_label, eyebrow, is_ccdxsocial } = params;

  const lineupText = lineup
    ? lineup.split(",").map((s) => s.trim()).filter(Boolean).join(" B2B ")
    : null;

  const seriesText = series_label || (is_ccdxsocial ? "CCDxSOCIAL" : null);

  // ── SECTION 1: Format + Art Direction ──────────────────────────────────────
  const artDirection = [
    `Portrait format poster, 3:4 aspect ratio, designed for print (A5) and Instagram stories.`,
    `Visual style: neobrutalist underground rave flyer. Thick 3px black outlines on ALL elements.`,
    `Flat vector graphic design only. No photography. No 3D rendering. No gradients. No textures. No realism.`,
    `Strict 5-color palette — ONLY these exact colors, nothing else: black ${BRAND.colors.ink}, acid yellow ${BRAND.colors.yellow}, hot magenta ${BRAND.colors.magenta}, electric blue ${BRAND.colors.blue}, off-white cream ${BRAND.colors.cream}.`,
    `The overall poster background is acid yellow ${BRAND.colors.yellow}.`,
  ].join(" ");

  // ── SECTION 2: Layout structure (top to bottom) ───────────────────────────
  const layout = [
    `LAYOUT (strict top-to-bottom zones):`,

    // Top bar — branding
    `Zone 1 — TOP BAR (10% of height): Black rectangle spanning full width.`,
    `Inside: "CATS CAN DANCE" text in acid yellow, Bowlby One / condensed bold display font, all caps, centered horizontally. To the left of the text: a small white cat silhouette icon. Font size large, commanding.`,

    // Series label (conditional)
    seriesText
      ? `Zone 2 — SERIES BAND (5% of height): A full-width band in magenta ${BRAND.colors.magenta}. Text: "${seriesText.toUpperCase()}" in cream ${BRAND.colors.cream}, uppercase, bold, centered.`
      : `Zone 2 — EYEBROW TEXT (5%): ${eyebrow ? `"${eyebrow.toUpperCase()}"` : `"EPISODE"`} in black, small bold condensed font, left-aligned with 16px left margin.`,

    // Title zone
    `Zone 3 — EVENT TITLE (20% of height): "${title.toUpperCase()}" in massive bold condensed Bowlby One display font. All caps. Color: black ${BRAND.colors.ink}. 6px magenta drop shadow offset down-right. Font size fills the width of the zone. Centered.`,

    // Date and venue
    `Zone 4 — DATE + VENUE (8%): "${date}" in electric blue ${BRAND.colors.blue}, bold, large. On the line below: "${venue.toUpperCase()}, ${(city || BRAND.city).toUpperCase()}" in black, medium weight. Both lines centered.`,

    // Cat mascot
    `Zone 5 — CAT MASCOT (40% of height, center of poster): ${BRAND.cat}`,

    // Lineup (if provided)
    lineupText
      ? `Zone 6 — LINEUP STRIP (7%): Full-width black rectangle. Inside: "${lineupText.toUpperCase()}" in cream ${BRAND.colors.cream} or acid yellow, bold condensed font, centered. Separate artist names with a mid-dot •`
      : `Zone 6 — MUSIC STRIP (7%): Full-width black rectangle with small music note icons and the text "UNDERGROUND DANCE MUSIC" in acid yellow, centered.`,

    // Footer
    `Zone 7 — FOOTER BAR (10%): Black rectangle spanning full width. Left side: "@catscandance" in acid yellow text. Right side: "catscandance.com" in cream text. Center: "FREE ENTRY WITH RSVP" in magenta text, bold. Small white cat paw print icon between elements.`,
  ].join(" ");

  // ── SECTION 3: Brand consistency rules ────────────────────────────────────
  const brandRules = [
    `CRITICAL BRAND RULES:`,
    `1. The CCD cat mascot must look the same as described — white cat, round black sunglasses, DJ headphones, CCD hoodie, confident stance. This is non-negotiable.`,
    `2. The top bar "CATS CAN DANCE" wordmark must be clearly legible at the top of every poster.`,
    `3. The footer must always show "FREE ENTRY WITH RSVP" — this is a CCD signature.`,
    `4. Use ONLY the 5 brand colors. No pastels, no browns, no greys.`,
    `5. All text must be in UPPERCASE. No lowercase anywhere.`,
    `6. The poster must have an 8px solid black border frame around the entire edge.`,
    `7. Inside the border, a 3px acid yellow inner rule line.`,
    `8. The result should look like an official Cats Can Dance event poster — unmistakably CCD.`,
  ].join(" ");

  // ── SECTION 4: Typography ─────────────────────────────────────────────────
  const typography = [
    `TYPOGRAPHY: Use Bowlby One or Bebas Neue style throughout — chunky, condensed, brutalist display font.`,
    `ALL text must be UPPERCASE. Heavy weight. Drop shadows on primary headings (magenta shadow, 4-6px offset).`,
    `The poster should feel like a 1990s UK acid house flyer redrawn with 2025 graphic design sensibility.`,
  ].join(" ");

  return [artDirection, layout, brandRules, typography].join(" ");
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const FAL_KEY = process.env.FAL_KEY ?? "";

  if (!FAL_KEY) {
    return res.status(500).json({
      ok: false,
      error:
        "FAL_KEY env var not set. Add it in Vercel → Settings → Environment Variables → FAL_KEY.",
    });
  }

  const {
    title,
    date,
    venue,
    city,
    lineup,
    series_label,
    eyebrow,
    is_ccdxsocial,
  } = req.body ?? {};

  if (!title) {
    return res.status(400).json({ ok: false, error: "title is required" });
  }

  const prompt = buildPrompt({
    title,
    date:          date   ?? "TBA",
    venue:         venue  ?? "TBA",
    city:          city   ?? "Bengaluru",
    lineup,
    series_label,
    eyebrow,
    is_ccdxsocial: !!is_ccdxsocial,
  });

  try {
    const falRes = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size:           "portrait_4_3",
        num_inference_steps:  28,
        guidance_scale:       3.5,
        num_images:           1,
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
        error: "fal.ai returned no image URL. Check FAL_KEY and try again.",
      });
    }

    return res.status(200).json({ ok: true, image_url: imageUrl, prompt_used: prompt });
  } catch (err: any) {
    console.error("[generate-poster] exception:", err?.message);
    return res.status(500).json({ ok: false, error: err?.message ?? "Generation failed" });
  }
}
