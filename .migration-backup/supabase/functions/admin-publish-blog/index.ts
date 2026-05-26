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
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("site_settings")
      .select("blog_posts")
      .eq("id", "main")
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    return json({ posts: (data as any)?.blog_posts ?? [] });
  }

  if (req.method === "POST") {
    const action = url.searchParams.get("action") ?? "publish";

    const { data: existing } = await supabase
      .from("site_settings")
      .select("blog_posts")
      .eq("id", "main")
      .maybeSingle();
    const current = Array.isArray((existing as any)?.blog_posts)
      ? ((existing as any).blog_posts as any[])
      : [];

    if (action === "delete") {
      const slug = url.searchParams.get("slug");
      if (!slug) return json({ error: "Missing slug" }, 400);
      const next = current.filter((p) => String(p.slug) !== slug);
      const { error } = await supabase
        .from("site_settings")
        .upsert({ id: "main", blog_posts: next });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, posts: next });
    }

    // publish
    const post = await req.json().catch(() => null);
    if (!post || !post.slug || !post.title) {
      return json({ error: "Invalid post payload" }, 400);
    }
    // Replace existing if same slug; otherwise prepend
    const filtered = current.filter((p) => p.slug !== post.slug);
    const next = [post, ...filtered];
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: "main", blog_posts: next });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, posts: next });
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
