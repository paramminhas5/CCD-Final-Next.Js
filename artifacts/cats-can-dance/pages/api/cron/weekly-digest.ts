/**
 * CCD Weekly Digest
 * Vercel Cron: every Monday 6:30am IST (1:00 UTC Monday)
 *
 * Flow:
 * 1. Fetch all user taste profiles (cities + genres + followed artists)
 * 2. Fetch upcoming events for the next 7 days
 * 3. Match events to user preferences
 * 4. Send personalised digest email via Resend
 *
 * Requires: RESEND_API_KEY env var
 * Optional: CRON_SECRET for auth (set in Vercel)
 *
 * Invoke manually: POST /api/cron/weekly-digest
 * (requires x-admin-password header)
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB         = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK         = process.env.SUPABASE_SERVICE_KEY ?? "";
const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const ADMIN_PW   = process.env.ADMIN_PASSWORD ?? "84838281";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "hello@catscandance.com";
const BASE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";

// ── Supabase helpers ──────────────────────────────────────────────────────────
const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`, apikey: SK,
});

async function sbGet(table: string, qs = ""): Promise<any[]> {
  if (!SK) return [];
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, { headers: sbHeaders() });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

// ── Email rendering ───────────────────────────────────────────────────────────
function renderEventRow(ev: any): string {
  const date = ev.event_date
    ? new Date(ev.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "Date TBA";
  const location = [ev.venue, ev.city].filter(Boolean).join(", ") || "Venue TBA";
  const genres = Array.isArray(ev.genre) ? ev.genre.slice(0, 2).join(" · ") : "";

  return `
    <tr>
      <td style="padding:12px 0;border-bottom:2px solid #1a1a1a;">
        <a href="${ev.url}" style="text-decoration:none;color:inherit;">
          <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:15px;color:#1a1a1a;text-transform:uppercase;">${ev.title}</div>
          <div style="font-size:13px;color:#555;margin-top:2px;">${date} · ${location}</div>
          ${genres ? `<div style="margin-top:4px;"><span style="background:#f5e642;padding:2px 6px;font-size:11px;font-weight:bold;text-transform:uppercase;">${genres}</span></div>` : ""}
        </a>
      </td>
    </tr>`;
}

function buildEmailHtml(params: {
  userEmail: string;
  cities: string[];
  followed: string[];
  events: any[];
  weekStr: string;
}): string {
  const { userEmail, cities, events, weekStr } = params;
  const cityStr = cities.length ? cities.join(", ") : "India";
  const eventRows = events.slice(0, 8).map(renderEventRow).join("");
  const hasEvents = events.length > 0;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>CCD Weekly Digest</title></head>
<body style="background:#f5f0e8;margin:0;padding:20px;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;">
    <tr>
      <td style="background:#1a1a1a;padding:24px 28px;border:4px solid #1a1a1a;">
        <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:24px;color:#f5f0e8;text-transform:uppercase;letter-spacing:2px;">
          CATS<span style="color:#e040fb;">.</span>CAN<span style="color:#e040fb;">.</span>DANCE
        </div>
        <div style="font-size:12px;color:#aaa;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">
          Weekly Digest · ${weekStr}
        </div>
      </td>
    </tr>

    <tr>
      <td style="background:#f5e642;padding:16px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
        <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;text-transform:uppercase;">
          📍 This week in ${cityStr}
        </div>
      </td>
    </tr>

    <tr>
      <td style="background:#f5f0e8;padding:24px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
        ${hasEvents ? `
          <table width="100%" cellpadding="0" cellspacing="0">
            ${eventRows}
          </table>
          <div style="margin-top:20px;">
            <a href="${BASE_URL}/events"
               style="display:inline-block;background:#1a1a1a;color:#f5f0e8;font-family:'Courier New',monospace;font-weight:bold;font-size:13px;padding:12px 20px;text-decoration:none;text-transform:uppercase;border:4px solid #1a1a1a;">
              SEE ALL EVENTS →
            </a>
          </div>
        ` : `
          <div style="text-align:center;padding:20px 0;">
            <div style="font-family:'Courier New',monospace;font-size:16px;font-weight:bold;text-transform:uppercase;color:#1a1a1a;">No events this week</div>
            <div style="color:#888;margin-top:8px;font-size:13px;">Check back — the scene never sleeps.</div>
            <div style="margin-top:16px;">
              <a href="${BASE_URL}/discover" style="color:#e040fb;text-decoration:none;font-weight:bold;font-size:13px;text-transform:uppercase;">DISCOVER SCENES →</a>
            </div>
          </div>
        `}
      </td>
    </tr>

    <tr>
      <td style="background:#1a1a1a;padding:20px 28px;border:4px solid #1a1a1a;">
        <div style="color:#aaa;font-size:11px;text-align:center;">
          You're receiving this because you signed up for CCD Weekly.<br>
          <a href="${BASE_URL}/profile" style="color:#f5e642;">Update preferences</a>
          · <a href="${BASE_URL}/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color:#666;">Unsubscribe</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth check
  const authHeader = req.headers.authorization ?? "";
  const isVercelCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const isAdmin = req.headers["x-admin-password"] === ADMIN_PW;
  if (!isVercelCron && !isAdmin && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!RESEND_KEY) {
    return res.json({
      ok: false,
      sent: 0,
      message: "Weekly digest requires RESEND_API_KEY env var. Set it to start sending emails.",
    });
  }

  const startTime = Date.now();
  const log: string[] = [];
  const push = (msg: string) => { console.log(msg); log.push(msg); };

  push(`[digest] Starting weekly digest — ${new Date().toISOString()}`);

  try {
    // 1. Load user taste profiles
    const profiles = await sbGet("user_taste_profiles");
    push(`[digest] ${profiles.length} user profiles loaded`);

    if (!profiles.length) {
      return res.json({ ok: true, sent: 0, message: "No user profiles found.", log });
    }

    // 2. Load upcoming events (next 7 days)
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const events = await sbGet("curated_events",
      `?event_date=gte.${today}&event_date=lte.${nextWeek}&order=event_date.asc&limit=100`
    );
    push(`[digest] ${events.length} upcoming events loaded for ${today}–${nextWeek}`);

    // 3. Load early_access_signups for email addresses
    const signups = await sbGet("early_access_signups", `?order=created_at.desc&limit=5000`);
    const emailSet = new Set(signups.map((s: any) => s.email?.toLowerCase()).filter(Boolean));
    push(`[digest] ${emailSet.size} subscriber emails loaded`);

    // Week string for email header
    const weekStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });

    let sent = 0;
    const errors: string[] = [];

    // 4. For each profile with an email, send personalised digest
    for (const profile of profiles) {
      const userId = profile.user_id ?? "";
      const cities: string[] = profile.cities ?? [];
      const genres: string[] = profile.genres ?? [];
      const followed: string[] = profile.liked_artist_slugs ?? [];

      // Find email for this user (from signups list or Clerk user ID pattern)
      // Profiles with email directly in them, or match by user_id in signups
      const userEmail = profile.email
        ?? signups.find((s: any) => s.user_id === userId)?.email
        ?? null;

      if (!userEmail) continue;
      if (!emailSet.has(userEmail.toLowerCase())) continue;

      // Filter events to this user's cities + genres
      let personalised = events.filter((ev: any) => {
        const evCity = (ev.city ?? "").toLowerCase();
        const evGenres: string[] = ev.genre ?? [];
        const cityMatch = !cities.length || cities.some(c => evCity.includes(c.toLowerCase()));
        const genreMatch = !genres.length || evGenres.some(g =>
          genres.some(ug => g.toLowerCase().includes(ug.toLowerCase()))
        );
        return cityMatch || genreMatch;
      });

      // Boost events from followed artists' gigs
      if (followed.length) {
        personalised = [...new Set([
          ...personalised.filter((ev: any) => {
            const title = (ev.title ?? "").toLowerCase();
            return followed.some(slug => title.includes(slug.replace(/-/g, " ")));
          }),
          ...personalised,
        ])];
      }

      try {
        const html = buildEmailHtml({
          userEmail,
          cities,
          followed,
          events: personalised.slice(0, 8),
          weekStr,
        });

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Cats Can Dance <${FROM_EMAIL}>`,
            to: [userEmail],
            subject: `🎧 This week in ${cities.length ? cities.slice(0, 2).join("/") : "India"} — CCD Weekly`,
            html,
          }),
        });

        if (!emailRes.ok) {
          const err = await emailRes.json();
          errors.push(`${userEmail}: ${err.message ?? emailRes.status}`);
          continue;
        }
        sent++;
        // Rate limit: Resend free tier is ~2 req/s
        await new Promise(r => setTimeout(r, 500));
      } catch (emailErr: any) {
        errors.push(`${userEmail}: ${emailErr.message}`);
      }
    }

    const elapsed = Date.now() - startTime;
    push(`[digest] Sent ${sent} emails in ${elapsed}ms`);
    if (errors.length) push(`[digest] ${errors.length} errors: ${errors.slice(0, 3).join("; ")}`);

    return res.json({
      ok: true,
      sent,
      profiles: profiles.length,
      events: events.length,
      errors: errors.length ? errors.slice(0, 10) : undefined,
      log,
      elapsed,
    });
  } catch (err: any) {
    console.error("[digest] Error:", err);
    return res.status(500).json({ ok: false, error: err?.message, log });
  }
}
