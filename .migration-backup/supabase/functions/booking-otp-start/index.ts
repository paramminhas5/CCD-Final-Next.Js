/**
 * booking-otp-start
 * Creates a booking request and sends a 6-digit OTP to the requester's email.
 * Uses Resend for email delivery (set RESEND_API_KEY in Supabase secrets).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendEmail(to: string, artistName: string, code: string, resendKey: string): Promise<boolean> {
  const html = `
<div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#fffef0;border:4px solid #1a1a1a">
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;margin:0 0 8px">Cats Can Dance</p>
  <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;margin:0 0 24px;color:#1a1a1a">Booking Verification</h1>
  <p style="font-size:14px;color:#333;margin:0 0 8px">You requested booking contact for <strong>${artistName}</strong>.</p>
  <p style="font-size:14px;color:#333;margin:0 0 24px">Your verification code:</p>
  <div style="background:#1a1a1a;color:#fff;font-size:40px;font-weight:900;letter-spacing:12px;text-align:center;padding:20px;margin:0 0 24px">${code}</div>
  <p style="font-size:12px;color:#666;margin:0">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
</div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Cats Can Dance <bookings@catscan.dance>",
      to: [to],
      subject: `Your booking code for ${artistName}: ${code}`,
      html,
    }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { artist_id, requester_email, requester_phone, purpose } = body;
  if (!artist_id || !requester_email) return json({ error: "artist_id and requester_email required" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up artist
  const { data: artist, error: aErr } = await supabase
    .from("artists").select("id, name, status").eq("id", artist_id).maybeSingle();
  if (aErr || !artist || artist.status !== "approved") return json({ error: "Artist not found" }, 404);

  // Rate-limit: max 3 requests per email per artist per hour
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("booking_requests")
    .select("*", { count: "exact", head: true })
    .eq("requester_email", requester_email)
    .eq("artist_id", artist_id)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= 3) return json({ error: "Too many requests — please wait before trying again" }, 429);

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const code_hash = await sha256(code + requester_email);
  const expires_at = new Date(Date.now() + 10 * 60_000).toISOString();

  // Store OTP
  const { error: otpErr } = await supabase.from("booking_otp_codes").insert({
    email: requester_email,
    code_hash,
    expires_at,
  });
  if (otpErr) return json({ error: "Could not create OTP" }, 500);

  // Store booking request
  const { data: booking, error: bErr } = await supabase
    .from("booking_requests")
    .insert({
      artist_id: artist.id,
      artist_name: artist.name,
      requester_email,
      requester_phone: requester_phone ?? null,
      purpose: purpose ?? null,
    })
    .select("id")
    .single();
  if (bErr) return json({ error: "Could not create booking request" }, 500);

  // Send email
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  let emailSent = false;
  if (resendKey) {
    emailSent = await sendEmail(requester_email, artist.name, code, resendKey);
  } else {
    // Dev fallback: log the code
    console.log(`[DEV] OTP for ${requester_email}: ${code}`);
    emailSent = true; // pretend it worked so frontend can proceed
  }

  if (!emailSent) return json({ error: "Failed to send verification email — please try again" }, 500);

  return json({ ok: true, booking_id: booking.id });
});
