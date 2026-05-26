import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const password = req.headers.get("x-admin-password") ?? "";
  const expected = Deno.env.get("ADMIN_PASSWORD") ?? "";
  if (!expected || !timingSafeEqual(password, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const eventSlug = url.searchParams.get("event_slug");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let query = supabase
    .from("event_rsvps")
    .select("id, event_slug, name, email, plus_ones, created_at")
    .order("created_at", { ascending: false });

  if (eventSlug) query = query.eq("event_slug", eventSlug);

  const { data, error } = await query;

  if (error) {
    console.error("admin-rsvps error:", error);
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (format === "csv") {
    const rows = [
      ["event_slug", "name", "email", "plus_ones", "created_at"].join(","),
      ...(data ?? []).map((r) =>
        [r.event_slug, r.name, r.email, r.plus_ones, r.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    return new Response(rows, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rsvps-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify({ rsvps: data ?? [], total: data?.length ?? 0 }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
