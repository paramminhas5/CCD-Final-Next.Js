/**
 * Type augmentation for Express v5.
 *
 * Express v5 types define req.params as Record<string, string | string[]>
 * but in practice (with standard route patterns like "/:slug") params are
 * always plain strings. This declaration restores Express v4–style typing
 * to avoid breaking all Drizzle eq() calls across the codebase.
 */
import "express";

declare module "express" {
  interface Request {
    params: Record<string, string>;
  }
}
