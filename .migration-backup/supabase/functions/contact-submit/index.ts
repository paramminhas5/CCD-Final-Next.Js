import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const Body = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2200),
  kind: z.string().trim().max(40).optional(),
  reason: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().optional(), // honeypot
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (parsed.data.website) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Compose final message — kind/reason/phone are encoded into the message body
    // so we don't need a schema migration. Admin can filter on the [kind] tag.
    const tag = parsed.data.kind ? `[${parsed.data.kind}]` : "";
    const reasonTag = parsed.data.reason ? `[${parsed.data.reason}]` : "";
    const header = [tag, reasonTag].filter(Boolean).join(" ");
    const phoneLine = parsed.data.phone ? `Phone: ${parsed.data.phone}\n` : "";
    const messageHasHeader = parsed.data.message.startsWith("[");
    const finalMessage = messageHasHeader
      ? parsed.data.message
      : [header, phoneLine, parsed.data.message].filter(Boolean).join("\n").trim();

    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: finalMessage,
      user_agent: req.headers.get("user-agent") ?? null,
    });
    if (error) {
      console.error("contact-submit insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to save" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("contact-submit error:", e);
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
