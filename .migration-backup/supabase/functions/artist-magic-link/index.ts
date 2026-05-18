/**
 * artist-magic-link
 * Sends a Supabase magic link email via Resend.
 * The Supabase Auth generateLink API creates the actual token;
 * we just send the email ourselves so it works without SMTP configured.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { email, redirect_to, claim_id } = body;
  if (!email) return json({ error: "email required" }, 400);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.catscandance.com";

  // Generate magic link token via Supabase Admin API
  const redirectTo = redirect_to ?? `${siteUrl}/artist/dashboard${claim_id ? `?claim=${claim_id}` : ""}`;

  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("generateLink error:", linkErr);
    return json({ error: "Could not generate magic link" }, 500);
  }

  const magicLink = linkData.properties.action_link;

  // Send via Resend
  if (!resendKey) {
    // Dev: just return the link
    console.log(`[DEV] Magic link for ${email}: ${magicLink}`);
    return json({ ok: true, dev_link: magicLink });
  }

  const html = `
<div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#fffef0;border:4px solid #1a1a1a">
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;margin:0 0 8px">Cats Can Dance</p>
  <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;margin:0 0 16px;color:#1a1a1a">Artist Portal</h1>
  <p style="font-size:14px;color:#333;margin:0 0 24px">Click the button below to access your artist dashboard. The link expires in 1 hour.</p>
  <a href="${magicLink}" style="display:block;background:#1a1a1a;color:#fff;font-family:monospace;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;text-align:center;padding:16px 24px;text-decoration:none;margin:0 0 24px">
    Open my dashboard →
  </a>
  <p style="font-size:12px;color:#666;margin:0">If you didn't request this, ignore this email. This link can only be used once.</p>
</div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Cats Can Dance <artists@catscan.dance>",
      to: [email],
      subject: "Your artist portal login link",
      html,
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    console.error("Resend error:", t);
    return json({ error: "Failed to send email" }, 500);
  }

  return json({ ok: true });
});
