const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// In-memory rate limit (best-effort): 10 requests / 60s per IP
const RL = new Map<string, number[]>();
const RL_WINDOW = 60_000;
const RL_MAX = 10;

const STYLE = `Bold flat-vector illustration in the "Cats Can Dance" Bangalore underground style. Thick black 4px outlines, bright flat fills using the brand palette (electric blue #1E90FF, magenta #E91E63, acid yellow #F4FF3A, lime #B6FF3C, cream #FFF7E8). Chunky offset black drop shadow (8px). Playful character, clean shapes, no gradients, no photorealism, no text or letters in the image. Square 1:1, transparent or solid brand-color background.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const now = Date.now();
  const arr = (RL.get(ip) ?? []).filter((t) => now - t < RL_WINDOW);
  if (arr.length >= RL_MAX) {
    return new Response(JSON.stringify({ error: "Too many requests, slow down a sec." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  arr.push(now); RL.set(ip, arr);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const vibes: string[] = Array.isArray(body.vibes) ? body.vibes.slice(0, 6) : [];
  const name: string = typeof body.name === "string" ? body.name.slice(0, 40) : "";
  const color: string = typeof body.color === "string" ? body.color.slice(0, 30) : "";
  const inputImage: string | undefined = typeof body.inputImage === "string" ? body.inputImage : undefined;

  const userPrompt = [
    `Create a single dancing cat character.`,
    vibes.length ? `Vibes: ${vibes.join(", ")}.` : "",
    color ? `Background color: ${color}.` : "",
    name ? `The character's spirit/name is "${name}" — convey personality, but DO NOT render any text or letters.` : "",
    STYLE,
  ].filter(Boolean).join(" ");

  const content: any[] = [{ type: "text", text: userPrompt }];
  if (inputImage && inputImage.startsWith("data:image/")) {
    content.push({ type: "image_url", image_url: { url: inputImage } });
  }

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "AI is rate limited, try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const image = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!image) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ image }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cat-generate error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
