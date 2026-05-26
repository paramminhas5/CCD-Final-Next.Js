import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

const RESEARCH: Record<
  string,
  { titles: string[]; keywords: string[] }
> = {
  GUIDES: {
    titles: [
      "The Best Underground Parties in Bangalore (2026 Guide)",
      "Where to Find Real Electronic Music Events in Bangalore",
      "A Working Guide to Techno & House Nights in Bangalore",
      "Best Warehouse Parties in India 2026",
    ],
    keywords: [
      "bangalore underground events",
      "techno bangalore",
      "house music bangalore",
      "warehouse parties india",
    ],
  },
  CULTURE: {
    titles: [
      "Why Bangalore's Dance Floors Hit Different",
      "RSVP Culture: How Bangalore Started Doing Parties Right",
      "Drop Culture in India — The New Streetwear Rules",
    ],
    keywords: [
      "bangalore club culture",
      "electronic music india",
      "rsvp culture bangalore",
      "drop culture india",
    ],
  },
  ARTISTS: {
    titles: [
      "Rising DJs in Bangalore You Should Book Now",
      "Behind the Decks: The Bangalore Crew Reshaping the Scene",
      "Top 10 Independent Electronic Artists in India 2026",
    ],
    keywords: [
      "bangalore djs",
      "indian electronic artists",
      "underground djs india",
      "bangalore producers",
    ],
  },
  JOURNAL: {
    titles: [
      "Inside Episode 02: Notes From The Floor",
      "What We Learned Throwing Episode 01",
      "The Weekend Diary — A CCD Episode in 1500 Words",
    ],
    keywords: [
      "cats can dance episode",
      "ccd events",
      "bangalore party diary",
      "underground party recap",
    ],
  },
  DROPS: {
    titles: [
      "Cat Bandana Drop Notes — Limited Run From Bangalore",
      "Inside the Cats Can Dance Streetwear Capsule",
      "Why We Don't Restock Anything",
    ],
    keywords: [
      "cat streetwear india",
      "cat bandana",
      "pet streetwear",
      "limited drop bangalore",
    ],
  },
  PETS: {
    titles: [
      "Best Cat Bandanas in India 2026",
      "Pet Streetwear India — A Buyer's Guide",
      "Cat Treats Made in Bangalore: What Actually Goes In",
    ],
    keywords: [
      "cat bandana india",
      "pet bucket hat",
      "cat treats bangalore",
      "pet streetwear india",
    ],
  },
};

function pickFresh(arr: string[], used: Set<string>): string {
  const fresh = arr.find((x) => !used.has(x.toLowerCase()));
  return fresh ?? arr[Math.floor(Math.random() * arr.length)];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const POST_SCHEMA = {
  type: "object",
  properties: {
    slug: { type: "string" },
    title: { type: "string" },
    excerpt: { type: "string" },
    category: { type: "string", enum: ["GUIDES", "CULTURE", "ARTISTS", "JOURNAL", "DROPS", "PETS"] },
    coverTitle: { type: "string", description: "4-7 word version of the title for the cover tile" },
    coverColor: {
      type: "string",
      enum: ["cream", "acid-yellow", "lime", "magenta", "electric-blue", "orange"],
    },
    tag: { type: "string" },
    tldr: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    quickPicks: {
      type: "object",
      properties: {
        title: { type: "string" },
        items: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      },
      required: ["title", "items"],
      additionalProperties: false,
    },
    pullQuote: { type: "string" },
    whatWedSkip: { type: "string" },
    body: { type: "array", items: { type: "string" }, minItems: 6, maxItems: 14 },
    seoTitle: { type: "string" },
    metaDescription: { type: "string" },
    dateISO: { type: "string" },
  },
  required: [
    "slug",
    "title",
    "excerpt",
    "category",
    "coverTitle",
    "coverColor",
    "tag",
    "tldr",
    "quickPicks",
    "pullQuote",
    "whatWedSkip",
    "body",
    "seoTitle",
    "metaDescription",
    "dateISO",
  ],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const password = req.headers.get("x-admin-password") ?? "";
  const expected = Deno.env.get("ADMIN_PASSWORD") ?? "";
  if (!expected || !timingSafeEqual(password, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const category = String(body?.category || "").toUpperCase();
  if (!RESEARCH[category]) return json({ error: "Invalid category" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Pull existing slugs/titles to avoid collisions
  const { data: settings } = await supabase
    .from("site_settings")
    .select("blog_posts")
    .eq("id", "main")
    .maybeSingle();
  const existing = Array.isArray((settings as any)?.blog_posts)
    ? ((settings as any).blog_posts as any[])
    : [];
  const usedTitles = new Set(existing.map((p) => String(p.title || "").toLowerCase()));
  const usedSlugs = new Set(existing.map((p) => String(p.slug || "").toLowerCase()));

  const research = RESEARCH[category];
  const finalTitle = String(body?.title || pickFresh(research.titles, usedTitles));
  const finalKeyword = String(body?.keyword || pickFresh(research.keywords, new Set()));
  const angle = String(body?.angle || "").trim();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

  const today = new Date();
  const dateISO = today.toISOString().slice(0, 10);

  const systemPrompt = `You write blog posts for Cats Can Dance (CCD) — a Bangalore brand that runs underground dance music Episodes and a streetwear/pet streetwear label.

VOICE: First-person plural ("we"). Confident, blunt, Bangalore-specific. No corporate fluff. Byline is "— The Pack".

REQUIREMENTS:
- 700-1000 words across 7-12 body paragraphs (each paragraph in the body[] array).
- Target keyword "${finalKeyword}" must appear in the title, the FIRST paragraph, and once mid-body.
- Mention Bangalore, Indiranagar, CBD, Whitefield or specific Indian cities where it makes sense.
- Mandatory: TL;DR (3-5 punchy bullets), pullQuote (1 sharp sentence), whatWedSkip (one paragraph of honest "skip this" advice), quickPicks (a sidebar block with 3-5 items).
- coverTitle: 4-7 words, ALL CAPS-friendly version of the title for the cover tile.
- coverColor: pick from cream, acid-yellow, lime, magenta, electric-blue, orange — match the post mood.
- slug: lowercase, hyphenated, max 80 chars, must be unique vs these existing slugs: ${Array.from(usedSlugs).join(", ") || "(none)"}.
- tag: short ALL-CAPS label like "GUIDE", "CULTURE", "DROP" etc.
- seoTitle: < 60 chars, includes the keyword.
- metaDescription: < 160 chars, includes the keyword.
- dateISO: ${dateISO}
${angle ? `\nUSER'S ANGLE / HOOK (weave this in): ${angle}` : ""}`;

  const userPrompt = `Write a CCD blog post.

CATEGORY: ${category}
TITLE: ${finalTitle}
TARGET KEYWORD: ${finalKeyword}

Return the full structured post via the save_post tool.`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_post",
            description: "Save the structured blog post.",
            parameters: POST_SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_post" } },
    }),
  });

  if (aiRes.status === 429) return json({ error: "Rate limited, try again shortly." }, 429);
  if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Settings > Workspace > Usage." }, 402);
  if (!aiRes.ok) {
    const t = await aiRes.text();
    console.error("AI error:", aiRes.status, t);
    return json({ error: "AI generation failed" }, 500);
  }

  const data = await aiRes.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  const argStr = toolCall?.function?.arguments;
  if (!argStr) {
    console.error("No tool call in response", JSON.stringify(data));
    return json({ error: "AI did not return structured post" }, 500);
  }
  let post: any;
  try {
    post = JSON.parse(argStr);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return json({ error: "AI response could not be parsed" }, 500);
  }

  // Backfill / sanitize
  post.author = "The Pack";
  post.date = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  if (!post.slug) post.slug = slugify(post.title);
  // Ensure unique slug
  let s = post.slug;
  let i = 2;
  while (usedSlugs.has(s.toLowerCase())) {
    s = `${post.slug}-${i++}`;
  }
  post.slug = s;

  return json({ post });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
