import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { verifySessionToken } from "../routes/auth";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    res.status(503).json({ error: "Admin access not configured" });
    return;
  }
  const provided = req.headers["x-admin-password"] as string | undefined;
  if (!provided || provided !== password) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Allows either:
 *   (a) a valid admin password (x-admin-password header), or
 *   (b) a Clerk-authenticated session (cookie via @clerk/express), or
 *   (c) a legacy HMAC session token (x-session-token) — deprecated.
 *
 * Sets req.sessionUserId for artist sessions (not set for admin path).
 * Route handlers must check ownership via the pattern:
 *   const sessionUserId = (req as any).sessionUserId as string | undefined;
 */
export function requireAdminOrArtist(_artistIdParam = "artistId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const provided = req.headers["x-admin-password"] as string | undefined;
      if (provided && provided === adminPassword) { next(); return; }
    }

    const auth = getAuth(req);
    if (auth?.userId) {
      (req as any).sessionUserId = auth.userId;
      next();
      return;
    }

    const token = req.headers["x-session-token"] as string | undefined;
    const userId = verifySessionToken(token);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as any).sessionUserId = userId;
    next();
  };
}
