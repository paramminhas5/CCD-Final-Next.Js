---
name: Cats Can Dance Next.js setup
description: Key quirks for running this Next.js 14 project on Replit's pnpm workspace.
---

The project uses Next.js 14 (pages router), not Vite.

**Why:** User explicitly requested Next.js. Original backup was Next.js/Vercel project.

**How to apply:**
- `postcss.config.js` must use `module.exports = {}` (CommonJS), NOT `export default {}` — Next.js 14 webpack loader fails with ESM syntax even if package.json has no `"type": "module"`.
- `next.config.mjs` needs `allowedDevOrigins: ["*"]` for Replit's iframe proxy to load `_next/*` resources.
- Countdown timers and other time-based `useState` must initialize to `null` and populate in `useEffect` to avoid SSR hydration mismatches.
- Dev command: `next dev -p $PORT` (reads PORT env var set by Replit).
- Source layout: `pages/` = Next.js router thin re-exports → `src/pages/` = actual React components.
