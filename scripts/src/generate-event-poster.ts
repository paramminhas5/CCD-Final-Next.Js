/**
 * Generate an event poster via fal.ai and (optionally) upload it to Supabase
 * Storage so the new poster URL can be set on the events row.
 *
 *   pnpm --filter @workspace/scripts run generate-poster -- ccdxsocial-zoomies
 *
 * Environment variables:
 *
 *   FAL_KEY                  — required. Get one at https://fal.ai/dashboard/keys
 *   FAL_MODEL                — optional. Default: fal-ai/flux/dev
 *   SUPABASE_URL             — optional. If set with SUPABASE_SERVICE_ROLE_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY  the generated poster is uploaded to the
 *                              `event-posters` bucket and the events row's
 *                              `poster_url` is updated to the storage path.
 *
 * Without Supabase env vars the script just downloads the image to
 *   public/episodes/{slug}.png
 * for you to upload manually via the admin or Supabase dashboard.
 *
 * The script is idempotent in destructive sense: it overwrites the local file
 * and (if uploading) the storage object at <slug>.png.
 *
 * The prompt is brand-aware. Each event gets a per-slug prompt built from
 * EVENT_CONTENT (title, date, vibe pillars, lineup) so the resulting poster
 * looks like it belongs in CCD's universe — neobrutalist, chunky, vivid
 * palette of magenta / acid-yellow / electric-blue / cream / ink.
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// ───────────────── CLI args ─────────────────

const slug = process.argv[2];
if (!slug) {
  console.error("usage: generate-poster <event-slug>");
  process.exit(2);
}

const FAL_KEY   = process.env.FAL_KEY;
const FAL_MODEL = process.env.FAL_MODEL || "fal-ai/flux/dev";
if (!FAL_KEY) {
  console.error("FAL_KEY is required. Get a key at https://fal.ai/dashboard/keys.");
  process.exit(2);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ───────────────── prompt registry ─────────────────

type PromptSpec = {
  title: string;
  date: string;
  vibe: string;
  lineup: string;
};

const PROMPTS: Record<string, PromptSpec> = {
  "ccdxsocial-zoomies": {
    title:  "ZOOMIES",
    date:   "Sun, Jun 29 2026",
    vibe:   "outdoor agility course meets late-night underground party — dogs running through a course in golden afternoon light, then warping into a magenta-soaked dance floor at night, motion blur, joyful chaos, cats and dogs in sunglasses, neon signage reading 'ZOOMIES'",
    lineup: "Startdawg b2b Merman + Special Guest TBA",
  },
  "ccdxsocial-debut": {
    title:  "THE DEBUT",
    date:   "Sat, Jun 21 2026",
    vibe:   "first chapter of a pet-friendly dance series — golden hour outdoor pet market with vendors and dogs, transitioning into a magenta-lit dance floor at night, bold neon signage reading 'THE DEBUT'",
    lineup: "Startdawg · Merman · TBA",
  },
  "ccdxsocial-groom-room": {
    title:  "THE GROOM ROOM",
    date:   "Sat, Jun 28 2026",
    vibe:   "fashion-meets-grooming chapter — stylish dogs and humans on a runway under hot magenta lights, vintage barber chairs, big neon signage reading 'THE GROOM ROOM'",
    lineup: "Startdawg · Merman · TBA",
  },
  "ccdxsocial-grand-finale": {
    title:  "GRAND FORMAT",
    date:   "Date TBA · 2026",
    vibe:   "season finale — full outdoor stage at dusk, 2000+ crowd, pet runway in foreground, fireworks and lasers in the sky, hero typography reading 'GRAND FORMAT'",
    lineup: "Full lineup TBA",
  },
};

// Generic CCD prompt fragment — locks the visual identity.
const STYLE = [
  "neobrutalist event poster",
  "thick chunky black borders",
  "drop-shadow blocks like printed risograph",
  "vivid palette of magenta, acid-yellow, electric-blue, cream, deep ink-black",
  "Bowlby One style display typography in ALL CAPS",
  "halftone dots and concentric arcs as visual texture",
  "3:4 portrait orientation, print-ready 1200x1600",
  "no realistic photography, illustrated and graphic",
  "no people's faces clearly visible (avoid likeness issues)",
  "absolutely no extra text or watermarks beyond the title and tagline",
].join(", ");

function buildPrompt(spec: PromptSpec): string {
  return [
    `Cats Can Dance × Social — event poster for "${spec.title}".`,
    `Subject: ${spec.vibe}.`,
    `Headline text: "${spec.title}".`,
    `Subheadline text: "${spec.date} · BENGALURU".`,
    `Lineup credit text: "${spec.lineup}".`,
    `Style: ${STYLE}.`,
  ].join(" ");
}

// ───────────────── fal.ai call ─────────────────

type FalResult = {
  images?: { url: string }[];
  request_id?: string;
  status?: string;
};

async function callFal(prompt: string): Promise<string> {
  const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "portrait_4_3", // close to 3:4 portrait; flux interprets generously
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai HTTP ${res.status} — ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as FalResult;
  const url = json.images?.[0]?.url;
  if (!url) throw new Error(`fal.ai returned no image: ${JSON.stringify(json).slice(0, 500)}`);
  return url;
}

// ───────────────── Supabase upload (optional) ─────────────────

async function uploadToSupabase(buf: Uint8Array, filename: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const path = `posters/${filename}`;

  const upRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/event-posters/${path}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey":        SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type":  "image/png",
        "x-upsert":      "true",
      },
      body: buf,
    },
  );
  if (!upRes.ok) {
    const t = await upRes.text().catch(() => "");
    throw new Error(`supabase upload ${upRes.status}: ${t.slice(0, 300)}`);
  }

  // Update the events row's poster_url to point at the uploaded object.
  const updRes = await fetch(
    `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey":        SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
      },
      body: JSON.stringify({ poster_url: path }),
    },
  );
  if (!updRes.ok) {
    const t = await updRes.text().catch(() => "");
    throw new Error(`supabase update ${updRes.status}: ${t.slice(0, 300)}`);
  }

  return path;
}

// ───────────────── main ─────────────────

async function main() {
  const spec = PROMPTS[slug];
  if (!spec) {
    console.error(
      `No prompt registered for slug "${slug}". ` +
      `Add an entry to PROMPTS in scripts/src/generate-event-poster.ts.`
    );
    process.exit(2);
  }

  const prompt = buildPrompt(spec);
  console.log(`▶ Generating poster for ${slug}\n  model: ${FAL_MODEL}\n  prompt: ${prompt}\n`);

  const url = await callFal(prompt);
  console.log(`◀ fal.ai returned ${url}`);

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`download ${imgRes.status}`);
  const buf = new Uint8Array(await imgRes.arrayBuffer());

  // Always write a local copy so it's reviewable in the PR / on disk.
  const outDir = resolve(process.cwd(), "../artifacts/cats-can-dance/public/episodes");
  const filename = `${slug}.png`;
  const outPath = resolve(outDir, filename);
  await writeFile(outPath, buf);
  console.log(`◀ wrote ${outPath} (${buf.byteLength} bytes)`);

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const path = await uploadToSupabase(buf, filename);
    console.log(`◀ uploaded to event-posters/${path} and updated events.poster_url`);
  } else {
    console.log("ℹ skipping Supabase upload (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable)");
    console.log("  → upload manually via /admin or Supabase dashboard, then set events.poster_url");
  }
}

main().catch((err) => {
  console.error("✗ generate-poster failed:", err);
  process.exit(1);
});
