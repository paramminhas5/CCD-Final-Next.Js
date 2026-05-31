---
name: Cats Can Dance Next.js setup
description: Key quirks for running this Next.js 14 project on Replit's pnpm workspace, including build OOM fixes and artifact.toml conflict resolution.
---

The project uses Next.js 14 (pages router), not Vite.

**Why:** User explicitly requested Next.js. Original backup was Next.js/Vercel project.

**How to apply:**
- `postcss.config.js` must use `module.exports = {}` (CommonJS), NOT `export default {}` — Next.js 14 webpack loader fails with ESM syntax.
- `next.config.mjs` needs `allowedDevOrigins: ["*"]` for Replit's iframe proxy to load `_next/*` resources.
- Countdown timers and other time-based `useState` must initialize to `null` and populate in `useEffect` to avoid SSR hydration mismatches.
- Dev command: `next dev -p $PORT` (reads PORT env var set by Replit).
- Source layout: `pages/` = Next.js router thin re-exports → `src/pages/` = actual React components.

## Production build OOM (Admin.tsx is 3,528 lines)
The webpack worker crashes compiling large pages without extra memory. Fixes applied:
1. `experimental: { workerThreads: false, cpus: 2 }` in next.config.mjs
2. Build script: `NODE_OPTIONS='--max-old-space-size=4096' next build` in package.json
3. Never run `next build` and `next dev` simultaneously — they share `.next/` and corrupt each other's vendor chunks.

**Why:** Default Node.js heap is ~512MB; the large Admin.tsx pushes workers past that limit.

## artifact.toml DUPLICATE_PREVIEW_PATH
`.migration-backup/artifacts/*/` have their own `artifact.toml` files registered with identical IDs and previewPaths. This causes `verifyAndReplaceArtifactToml` to fail with DUPLICATE_PREVIEW_PATH.

**Fix:** Rename `.migration-backup/artifacts/*/.replit-artifact/artifact.toml` → `artifact.toml.bak` before calling `verifyAndReplaceArtifactToml` on the real artifact.

## Correct production artifact.toml for Next.js
```toml
[services.production]
build = [ "pnpm", "--filter", "@workspace/cats-can-dance", "run", "build" ]
run = "pnpm --filter @workspace/cats-can-dance run start"
```
No `publicDir`, `serve = "static"`, or `rewrites` — those are Vite SPA patterns.
