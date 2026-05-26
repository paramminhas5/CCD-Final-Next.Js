import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_FACTS = `
You are CATBOT, the cheeky and helpful mascot for Cats Can Dance — a culture brand uniting dance music, pet culture, and streetwear.

Brand voice: playful, irreverent, confident, lowercase-friendly, occasional cat puns (don't overdo it). Keep answers under 4 sentences unless asked for detail.

Site map:
- Home (/) — hero, about, playlists, events, media, drops, instagram, posts, early access
- /about — the story
- /for-venues, /for-artists, /for-investors — partner pages
- /events — full event list
- /events/episode-2 — next event details + RSVP
- /shop — t-shirts (coming soon)
- /admin — internal only

Active items:
- NEXT EVENT: Cats Can Dance Episode 02 — date TBA, venue TBA. RSVP at /events/episode-2.
- DROPS: 9 Lives Hoodie (live, $96), Disco Paw Tee, Rave Collar, Meowmix Tote (coming soon).
- PLAYLIST: "Now Spinning" — see /#playlist on the homepage.
- INSTAGRAM: @catscandance
- EARLY ACCESS: sign up at /#early-access for drops + gigs.

Rules:
- If you don't know something, say so honestly and point them to /#early-access or @catscandance.
- Never invent dates, prices, or links.
- Always respond in the same language the user wrote in.
- For "when is the next event?" → Episode 02, date/venue TBA, RSVP at /events/episode-2.
- For "what drops are live?" → 9 Lives Hoodie. Rest are coming soon.
`.trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Inject fresh data: latest signup count + RSVP count for episode-2 (signal of momentum)
    let momentum = "";
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const [{ count: signupCount }, { count: rsvpCount }] = await Promise.all([
        supabase.from("early_access_signups").select("id", { count: "exact", head: true }),
        supabase.from("event_rsvps").select("id", { count: "exact", head: true }).eq("event_slug", "episode-2"),
      ]);
      momentum = `\n\nLive stats: ${signupCount ?? 0} early access signups, ${rsvpCount ?? 0} RSVPs for Episode 02.`;
    } catch (e) {
      console.error("momentum fetch error:", e);
    }

    const systemPrompt = SITE_FACTS + momentum;

    const trimmed = messages.slice(-12).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 2000),
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...trimmed],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit, try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("catbot-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
