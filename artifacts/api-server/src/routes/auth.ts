import { Router } from "express";

const router = Router();

/**
 * Auth routes — minimal stubs until Clerk is fully wired.
 * These satisfy the frontend supabase-shim auth calls without crashing.
 */

// GET /api/auth/session
// Returns null session — no user is logged in (Clerk not yet integrated)
router.get("/auth/session", (_req, res) => {
  res.json({ session: null });
});

// POST /api/auth/magic-link
// Stub — in production this will trigger a Clerk magic-link email
router.post("/auth/magic-link", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  // TODO: trigger Clerk OTP/magic-link when Clerk is integrated
  res.json({ ok: true, message: "If this email is registered, you will receive a sign-in link." });
});

// POST /api/auth/signout
// Stub — clears any server-side session when Clerk session management is added
router.post("/auth/signout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
