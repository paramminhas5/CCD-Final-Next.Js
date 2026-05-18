import { Router } from "express";
import * as crypto from "crypto";

const router = Router();

const SESSION_SECRET = process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "ccd_dev_secret";

export function signToken(userId: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  return `${Buffer.from(userId).toString("base64url")}.${hmac}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  try {
    const userId = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
    const provided = token.slice(dot + 1);
    if (crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"))) {
      return userId;
    }
  } catch {}
  return null;
}

// GET /api/auth/session
router.get("/auth/session", (req, res) => {
  const userId = verifySessionToken(req.headers["x-session-token"] as string | undefined);
  if (userId) return res.json({ session: { user: { id: userId } } });
  res.json({ session: null });
});

// POST /api/auth/magic-link
router.post("/auth/magic-link", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const userId = `email:${email}`;
  const token = signToken(userId);
  res.json({ ok: true, token, userId, message: "Dev mode: use the token as x-session-token header." });
});

// POST /api/auth/signout
router.post("/auth/signout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
