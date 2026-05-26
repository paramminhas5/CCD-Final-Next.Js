// supabase/functions/scheduled-curate/index.ts
// Daily orchestrator: runs all sources × cities, prunes stale, dedupes, auto-features.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: cron secret (from vault), service token, or admin password
  const supabaseAuth = createClient(supabaseUrl, serviceKey);
  const cronSecretHeader = req.headers.get("x-cron-secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const adminPass = req.headers.get("x-admin-password") ?? "";
  const expectedPass = Deno.env.get("ADMIN_PASSWORD") ?? "";

  let authorized = false;
  if (authHeader.includes(serviceKey.slice(-8))) authorized = true;
  else if (expectedPass && adminPass === expectedPass) authorized = true;
  else if (cronSecretHeader) {
    const { data: ok } = await supabaseAuth.rpc("verify_cron_secret" as any, { _input: cronSecretHeader });
    if (ok === true) authorized = true;
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sources = ["sortmyscene", "insider", "skillboxes", "highape", "bookmyshow"];
  const cities = ["bangalore", "mumbai", "delhi"];
  const results: any[] = [];

  for (const source of sources) {
    for (const city of cities) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/curate-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
          body: JSON.stringify({ source, city, mode: "single", limit: 5 }),
        });
        const data = await res.json();
        results.push({ source, city, upserted: data?.upserted ?? 0, ok: res.ok });
      } catch (e: any) {
        results.push({ source, city, error: e?.message, ok: false });
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Prune past events older than 30 days (keep manual/community + featured)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { count: pruned } = await supabase
    .from("curated_events")
    .delete()
    .lt("event_date", cutoff)
    .eq("is_featured", false)
    .not("source", "in", "(manual,community)")
    .select("*", { count: "exact", head: true });

  // Dedupe: same lower(title) + event_date — keep row with image, prefer non-aggregator sources
  const { data: allRows } = await supabase
    .from("curated_events")
    .select("id, title, event_date, venue, source, image_url, created_at")
    .not("source", "in", "(manual,community)");
  const sourceRank: Record<string, number> = {
    skillboxes: 1, insider: 2, district: 3, sortmyscene: 4, highape: 5, bookmyshow: 6,
  };
  const groups = new Map<string, any[]>();
  for (const r of allRows ?? []) {
    const key = `${(r.title ?? "").toLowerCase().trim()}|${r.event_date ?? ""}|${(r.venue ?? "").toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const toDelete: string[] = [];
  for (const grp of groups.values()) {
    if (grp.length < 2) continue;
    grp.sort((a, b) => {
      const aImg = a.image_url ? 0 : 1;
      const bImg = b.image_url ? 0 : 1;
      if (aImg !== bImg) return aImg - bImg;
      return (sourceRank[a.source] ?? 99) - (sourceRank[b.source] ?? 99);
    });
    for (let i = 1; i < grp.length; i++) toDelete.push(grp[i].id);
  }
  let deduped = 0;
  if (toDelete.length > 0) {
    const { count } = await supabase
      .from("curated_events").delete().in("id", toDelete)
      .select("*", { count: "exact", head: true });
    deduped = count ?? toDelete.length;
  }

  // Auto-feature: clear auto-featured rows, then pick top 2 per city by image + soonest date
  await supabase
    .from("curated_events")
    .update({ is_featured: false })
    .not("source", "in", "(manual,community)")
    .eq("is_featured", true);

  const today = new Date().toISOString().slice(0, 10);
  let featuredCount = 0;
  for (const city of cities) {
    const { data: candidates } = await supabase
      .from("curated_events")
      .select("id, event_date, image_url")
      .eq("city", city)
      .not("image_url", "is", null)
      .not("source", "in", "(manual,community)")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(2);
    const ids = (candidates ?? []).map((c) => c.id);
    if (ids.length > 0) {
      await supabase.from("curated_events").update({ is_featured: true }).in("id", ids);
      featuredCount += ids.length;
    }
  }

  const totalUpserted = results.reduce((s, r) => s + (r.upserted ?? 0), 0);

  console.log(`Scheduled curate: ${totalUpserted} upserted, ${pruned ?? 0} pruned, ${deduped} deduped, ${featuredCount} featured`);

  return new Response(JSON.stringify({
    ok: true,
    total_upserted: totalUpserted,
    pruned: pruned ?? 0,
    deduped,
    featured: featuredCount,
    runs: results,
    timestamp: new Date().toISOString(),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
