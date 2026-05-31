import { Router } from "express";
import * as crypto from "crypto";

const router = Router();

const SESSION_SECRET: string | undefined =
  process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD;

const TOKEN_TTL_SECS = 30 * 24 * 60 * 60;

export function signToken(userId: string): string {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET or ADMIN_PASSWORD env var is required to sign tokens");
  }
  const iat = Math.floor(Date.now() / 1000);
  const payload = `${userId}|${iat}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token || !SESSION_SECRET) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  try {
    const payloadB64 = token.slice(0, dot);
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("hex");
    const provided = token.slice(dot + 1);
    if (
      expected.length !== provided.length ||
      !crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"))
    ) {
      return null;
    }
    const sepIdx = payload.lastIndexOf("|");
    if (sepIdx < 0) return null;
    const userId = payload.slice(0, sepIdx);
    const iat = parseInt(payload.slice(sepIdx + 1), 10);
    if (!userId || isNaN(iat)) return null;
    if (Math.floor(Date.now() / 1000) - iat > TOKEN_TTL_SECS) return null;
    return userId;
  } catch {
    return null;
  }
}

router.get("/auth/session", (req, res): void => {
  const userId = verifySessionToken(
    req.headers["x-session-token"] as string | undefined,
  );
  if (userId) { res.json({ session: { user: { id: userId } } }); return; }
  res.json({ session: null });
});

router.post("/auth/magic-link", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "email required" }); return; }
  const userId = `email:${email}`;
  try {
    const token = signToken(userId);
    res.json({ ok: true, token, userId });
  } catch (e: any) {
    res.status(503).json({ error: e.message });
  }
});

router.post("/auth/signout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
