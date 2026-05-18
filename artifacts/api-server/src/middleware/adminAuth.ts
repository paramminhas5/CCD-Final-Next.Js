import { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../routes/auth";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return res.status(503).json({ error: "Admin access not configured" });
  }
  const provided = req.headers["x-admin-password"] as string | undefined;
  if (!provided || provided !== password) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * Allows either:
 *   (a) a valid admin password (x-admin-password header), or
 *   (b) a valid session token (x-session-token header) for any authenticated artist.
 *
 * Use artistIdParam to name which req.params key holds the target artist id
 * if you need per-artist scoping in the future.
 */
export function requireAdminOrArtist(_artistIdParam = "artistId") {
  return (req: Request, res: Response, next: NextFunction) => {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword) {
      const provided = req.headers["x-admin-password"] as string | undefined;
      if (provided && provided === adminPassword) return next();
    }

    const token = req.headers["x-session-token"] as string | undefined;
    const userId = verifySessionToken(token);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    (req as any).sessionUserId = userId;
    next();
  };
}
