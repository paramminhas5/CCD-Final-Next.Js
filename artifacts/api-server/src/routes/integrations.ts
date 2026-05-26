import { Router } from "express";

const router = Router();

// ─── Instagram Feed ───────────────────────────────────────────────────────────
// GET /api/instagram-feed
// Requires: INSTAGRAM_ACCESS_TOKEN env var (long-lived token from Meta Graph API)
router.get("/instagram-feed", async (_req, res) => {
  const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!TOKEN) {
    // Return empty gracefully — not an error, just not configured yet
    return res.json([]);
  }

  try {
    const fields = "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp";
    const r = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${TOKEN}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!r.ok) {
      console.error("[instagram-feed] Graph API error:", r.status);
      return res.json([]);
    }

    const data = await r.json();
    const posts = (data?.data ?? [])
      .filter((p: any) => ["IMAGE", "CAROUSEL_ALBUM"].includes(p.media_type))
      .map((p: any) => ({
        id: p.id,
        url: p.permalink,
        image_url: p.media_url ?? p.thumbnail_url,
        caption: p.caption?.slice(0, 300) ?? null,
        timestamp: p.timestamp ?? null,
      }));

    res.json(posts);
  } catch (e: any) {
    console.error("[instagram-feed] fetch error:", e.message);
    res.json([]);
  }
});

// ─── YouTube Videos ───────────────────────────────────────────────────────────
// GET /api/youtube-videos?channelId=UCxxx
// Requires: YOUTUBE_API_KEY env var
router.get("/youtube-videos", async (req, res) => {
  const API_KEY   = process.env.YOUTUBE_API_KEY;
  const channelId = (req.query.channelId as string) || process.env.YOUTUBE_CHANNEL_ID || "";

  if (!API_KEY) {
    return res.json([]);
  }

  try {
    // Get uploads playlist ID from channel
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!channelRes.ok) {
      console.error("[youtube-videos] channel lookup error:", channelRes.status);
      return res.json([]);
    }

    const channelData = await channelRes.json();
    const uploadsId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsId) return res.json([]);

    // Get recent videos from uploads playlist
    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=12&key=${API_KEY}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!plRes.ok) {
      console.error("[youtube-videos] playlist error:", plRes.status);
      return res.json([]);
    }

    const plData = await plRes.json();
    const videos = (plData?.items ?? []).map((item: any) => {
      const s = item.snippet;
      const videoId = s?.resourceId?.videoId;
      return {
        id: videoId,
        title: s?.title ?? "",
        thumbnail: s?.thumbnails?.high?.url ?? s?.thumbnails?.default?.url ?? "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published_at: s?.publishedAt ?? null,
      };
    }).filter((v: any) => v.id);

    res.json(videos);
  } catch (e: any) {
    console.error("[youtube-videos] error:", e.message);
    res.json([]);
  }
});

// ─── AI Cat Generator ─────────────────────────────────────────────────────────
// POST /api/cat-generate
// Body: { prompt: string, style?: string }
// Requires: OPENAI_API_KEY env var
router.post("/cat-generate", async (req, res) => {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const { prompt, style } = req.body ?? {};

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  if (!OPENAI_KEY) {
    // Fallback to placeholder when not configured
    return res.json({
      image_url: "https://placekitten.com/512/512",
      prompt_used: prompt,
    });
  }

  try {
    const fullPrompt = `${style ? `${style} style. ` : ""}A cat DJ or dancer inspired by underground electronic music culture. ${prompt}. Bold, graphic, street-art aesthetic. Cats Can Dance brand.`;

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err?.error?.message ?? `OpenAI ${r.status}`);
    }

    const data = await r.json();
    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) throw new Error("No image URL in response");

    res.json({ image_url: imageUrl, prompt_used: fullPrompt });
  } catch (e: any) {
    console.error("[cat-generate] error:", e.message);
    // Graceful fallback
    res.json({ image_url: "https://placekitten.com/512/512", prompt_used: prompt, error: e.message });
  }
});

export default router;
