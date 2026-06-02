import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — runs on every matched request BEFORE the page/API handler.
 *
 * Static PWA/manifest files must never be blocked by auth (Vercel deployment
 * protection or any future auth layer).  We return them immediately so the
 * browser can install the web-app manifest and icons without a 401.
 */

// Paths that must always be public — no auth check, no redirect
const PUBLIC_STATIC = new Set([
  "/site.webmanifest",
  "/robots.txt",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass static PWA assets straight through — no auth, no middleware overhead
  if (PUBLIC_STATIC.has(pathname)) {
    const response = NextResponse.next();
    // Ensure the correct MIME type for the manifest
    if (pathname === "/site.webmanifest") {
      response.headers.set("Content-Type", "application/manifest+json");
    }
    response.headers.set("Cache-Control", "public, max-age=3600");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next.js internals and static file extensions
  matcher: [
    "/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.mp3$|.*\\.pdf$|.*\\.css$|.*\\.js$).*)",
    "/site.webmanifest",
  ],
};
