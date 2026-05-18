## Problem
`enrich-artists` crashes on every row at step 2 (search) with:
`TypeError: results.slice is not a function or its return value is not iterable`

Firecrawl `/search` v2 returns `{ success, data: { web: [...] } }`. The function reads `search?.data` (an object) and calls `.slice()` on it → throw → row marked `failed`.

## Fix (in `supabase/functions/enrich-artists/index.ts`)

1. **Normalize search results** — `const results = Array.isArray(search?.data?.web) ? search.data.web : Array.isArray(search?.data) ? search.data : [];`
2. **Wrap each step in try/catch** so one slow/bad step doesn't fail the whole row; record the failure into `enrichment_log.steps` and keep going.
3. **Reset failed rows** before re-running: clear `enrichment_status='pending'` for any row currently `failed` or already `enriched` empty-bio so the bulk run picks them up.
4. **Bump AI input cap** to 8000 chars (current 4000 is fine but bios are coming back empty when IG markdown is auth-walled — also fall back to a name-only prompt if `collectedMd` is <200 chars so we still get *some* bio).
5. **Photo fallback** — if no ogImage was found, try Firecrawl `/scrape` with `formats:['screenshot']` on the IG URL and upload the screenshot crop. (Optional; skip if it costs too much — keep behind a flag.)

## Run
After deploying the fix, trigger `enrich-artists` with `{ all: true, force: true }` via the existing Admin "FORCE RE-ENRICH ALL" button (or curl from here). ~50 artists × ~1.5s pacing ≈ 75s + scrape latency, so expect 3–6 min.

## Out of scope
- No schema changes
- No new UI
- No new secrets
- Promoter enrichment untouched