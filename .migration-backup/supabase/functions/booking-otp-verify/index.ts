/**
 * booking-otp-verify
 * Verifies the 6-digit OTP and, if valid, returns the artist's booking email.
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

async function notifyArtist(
  artistEmail: string,
  artistName: string,
  requesterEmail: string,
  purpose: string | null,
  resendKey: string,
): Promise<void> {
  if (!resendKey || !artistEmail || artistEmail === "book@catscan.dance") return;
  const html = `
<div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#fffef0;border:4px solid #1a1a1a">
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;margin:0 0 8px">Cats Can Dance</p>
  <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 16px;color:#1a1a1a">New Booking Enquiry</h1>
  <p style="font-size:14px;color:#333;margin:0 0 8px">Someone verified their email and received your booking contact.</p>
  <p style="font-size:14px;color:#333;margin:0 0 4px"><strong>From:</strong> ${requesterEmail}</p>
  ${purpose ? `<p style="font-size:14px;color:#333;margin:0 0 16px"><strong>Purpose:</strong> ${purpose}</p>` : ""}
  <p style="font-size:12px;color:#666;margin:16px 0 0">Manage bookings at catscan.dance/artist/dashboard</p>
</div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Cats Can Dance <bookings@catscan.dance>",
      to: [artistEmail],
      reply_to: requesterEmail,
      subject: `New booking enquiry for ${artistName}`,
      html,
    }),
  }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { requester_email, code, booking_id, forward_requested } = body;
  if (!requester_email || !code || !booking_id) {
    return json({ error: "requester_email, code, and booking_id required" }, 400);
  }
  if (!/^\d{6}$/.test(code)) return json({ error: "Invalid code format" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Find the OTP record
  const code_hash = await sha256(code + requester_email);
  const now = new Date().toISOString();

  const { data: otps, error: oErr } = await supabase
    .from("booking_otp_codes")
    .select("*")
    .eq("email", requester_email)
    .eq("code_hash", code_hash)
    .is("consumed_at", null)
    .gte("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1);

  if (oErr) return json({ error: "Database error" }, 500);

  if (!otps || otps.length === 0) {
    // Check if there's an unexpired OTP at all to give a better error
    const { data: anyOtp } = await supabase
      .from("booking_otp_codes")
      .select("id, expires_at, attempts")
      .eq("email", requester_email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (anyOtp && anyOtp.length > 0) {
      if (new Date(anyOtp[0].expires_at) < new Date()) {
        return json({ error: "Code expired — please request a new one" }, 400);
      }
      if (anyOtp[0].attempts >= 5) {
        return json({ error: "Too many attempts — please request a new code" }, 400);
      }
      // Increment attempts
      await supabase
        .from("booking_otp_codes")
        .update({ attempts: (anyOtp[0].attempts ?? 0) + 1 })
        .eq("id", anyOtp[0].id);
    }
    return json({ error: "Invalid code" }, 400);
  }

  const otp = otps[0];

  // Mark OTP consumed
  await supabase
    .from("booking_otp_codes")
    .update({ consumed_at: now })
    .eq("id", otp.id);

  // Look up booking request
  const { data: booking, error: bErr } = await supabase
    .from("booking_requests")
    .select("id, artist_id, artist_name, purpose")
    .eq("id", booking_id)
    .eq("requester_email", requester_email)
    .maybeSingle();

  if (bErr || !booking) return json({ error: "Booking not found" }, 404);

  // Mark booking verified
  await supabase
    .from("booking_requests")
    .update({
      verified_at: now,
      revealed_at: now,
      forward_requested: !!forward_requested,
    })
    .eq("id", booking_id);

  // Get artist contact details
  const { data: artist } = await supabase
    .from("artists")
    .select("name, booking_email, manager_email")
    .eq("id", booking.artist_id)
    .maybeSingle();

  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

  // Notify artist of the enquiry
  if (artist?.booking_email) {
    await notifyArtist(
      artist.booking_email,
      artist.name ?? booking.artist_name,
      requester_email,
      booking.purpose,
      resendKey,
    );
  }

  return json({
    ok: true,
    artist_email: artist?.booking_email ?? null,
    manager_email: artist?.manager_email ?? null,
  });
});
