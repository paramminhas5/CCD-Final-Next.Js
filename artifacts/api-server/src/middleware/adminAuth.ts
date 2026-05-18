import { Request, Response, NextFunction } from "express";

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
