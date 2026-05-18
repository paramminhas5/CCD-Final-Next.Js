import { Router } from "express";

const router = Router();

// GET /api/instagram-feed
// Returns empty array for now — integrate with Instagram Graph API when token is available
router.get("/instagram-feed", async (_req, res) => {
  res.json([]);
});

// GET /api/youtube-videos
// Returns empty array for now — integrate with YouTube Data API when key is available
router.get("/youtube-videos", async (_req, res) => {
  res.json([]);
});

// POST /api/cat-generate
// Returns a placeholder — integrate with AI image API when key is available
router.post("/cat-generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });
  res.json({
    image_url: "https://placekitten.com/512/512",
    prompt_used: prompt,
  });
});

export default router;
