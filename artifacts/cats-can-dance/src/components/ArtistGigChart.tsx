"use client";
/**
 * ArtistGigChart — gig activity bar chart + social stats growth charts.
 * Uses Recharts (already in deps). No new dependencies needed.
 *
 * Phase 4D: added SocialStatsChart showing time-series follower growth
 * for Instagram, SoundCloud, and Spotify from artist_social_stats history.
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";

interface Appearance {
  year?: number;
  city?: string;
  role?: string;
}

interface SocialSnapshot {
  captured_at: string;
  instagram_followers?: number | null;
  soundcloud_followers?: number | null;
  spotify_monthly_listeners?: number | null;
  soundcloud_plays?: number | null;
}

interface Props {
  appearances: Appearance[];
  socialHistory?: SocialSnapshot[];
}

const CCD_COLOURS = ["#f5e642", "#e040fb", "#00bfff", "#ff6600", "#aaff00"];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const TOOLTIP_STYLE = {
  background: "#f5f0e8",
  border: "4px solid #1a1a1a",
  borderRadius: 0,
  fontFamily: "inherit",
  fontSize: 11,
};

// ── Social Stats Growth Chart ──────────────────────────────────────────────
function SocialStatsChart({ history }: { history: SocialSnapshot[] }) {
  if (!history || history.length < 2) return null;

  // Build data points — label as short date
  const data = history.map(s => ({
    date: new Date(s.captured_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    ig: s.instagram_followers ?? null,
    sc: s.soundcloud_followers ?? null,
    spotify: s.spotify_monthly_listeners ?? null,
  }));

  const hasIG = data.some(d => d.ig != null);
  const hasSC = data.some(d => d.sc != null);
  const hasSpotify = data.some(d => d.spotify != null);

  if (!hasIG && !hasSC && !hasSpotify) return null;

  // Compute growth deltas for the summary row
  const first = history[0];
  const last = history[history.length - 1];
  const deltas: { label: string; delta: number; colour: string }[] = [];
  if (hasIG && first.instagram_followers && last.instagram_followers) {
    deltas.push({ label: "IG Followers", delta: last.instagram_followers - first.instagram_followers, colour: "#e040fb" });
  }
  if (hasSC && first.soundcloud_followers && last.soundcloud_followers) {
    deltas.push({ label: "SC Followers", delta: last.soundcloud_followers - first.soundcloud_followers, colour: "#ff6600" });
  }
  if (hasSpotify && first.spotify_monthly_listeners && last.spotify_monthly_listeners) {
    deltas.push({ label: "Spotify Monthly", delta: last.spotify_monthly_listeners - first.spotify_monthly_listeners, colour: "#00bfff" });
  }

  return (
    <div className="border-4 border-ink bg-cream p-4 space-y-4">
      <p className="font-display text-xs uppercase text-ink/50 tracking-widest">Audience Growth</p>

      {/* Delta summary chips */}
      {deltas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {deltas.map(d => (
            <div key={d.label} className="border-2 border-ink px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.colour }} />
              <span className="font-display text-xs text-ink/60 uppercase">{d.label}</span>
              <span className={`font-display text-sm ${d.delta >= 0 ? "text-ink" : "text-magenta"}`}>
                {d.delta >= 0 ? "+" : ""}{fmt(d.delta)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Line chart */}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a15" />
          <XAxis dataKey="date" tick={{ fontFamily: "inherit", fontSize: 9, fill: "#1a1a1a" }} axisLine={{ stroke: "#1a1a1a" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontFamily: "inherit", fontSize: 9, fill: "#1a1a1a" }} axisLine={{ stroke: "#1a1a1a" }} tickLine={false} tickFormatter={fmt} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, name: string) => [fmt(Number(v)), name]} />
          <Legend wrapperStyle={{ fontFamily: "inherit", fontSize: 10, textTransform: "uppercase" }} />
          {hasIG && <Line type="monotone" dataKey="ig" name="Instagram" stroke="#e040fb" strokeWidth={2} dot={false} connectNulls />}
          {hasSC && <Line type="monotone" dataKey="sc" name="SoundCloud" stroke="#ff6600" strokeWidth={2} dot={false} connectNulls />}
          {hasSpotify && <Line type="monotone" dataKey="spotify" name="Spotify Monthly" stroke="#00bfff" strokeWidth={2} dot={false} connectNulls />}
        </LineChart>
      </ResponsiveContainer>

      <p className="font-display text-[10px] text-ink/30 uppercase">
        {history.length} snapshot{history.length !== 1 ? "s" : ""} · captured over time from public profiles
      </p>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ArtistGigChart({ appearances, socialHistory }: Props) {
  // ── Gig bar chart ──
  const byYear = (appearances ?? []).reduce((acc, a) => {
    const y = a.year || 0;
    if (!y) return acc;
    acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const data = Object.entries(byYear)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);

  const byCity = (appearances ?? []).reduce((acc, a) => {
    const c = a.city || "Unknown";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Gig bar chart */}
      {data.length > 0 && (
        <div className="border-4 border-ink bg-cream p-4">
          <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-4">Gigs Per Year</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a20" />
              <XAxis dataKey="year" tick={{ fontFamily: "inherit", fontSize: 10, fill: "#1a1a1a" }} axisLine={{ stroke: "#1a1a1a" }} tickLine={false} />
              <YAxis tick={{ fontFamily: "inherit", fontSize: 10, fill: "#1a1a1a" }} axisLine={{ stroke: "#1a1a1a" }} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} gig${v !== 1 ? "s" : ""}`, ""]} />
              <Bar dataKey="count" radius={0} stroke="#1a1a1a" strokeWidth={2}>
                {data.map((_, i) => <Cell key={i} fill={CCD_COLOURS[i % CCD_COLOURS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top cities */}
      {topCities.length > 0 && (
        <div className="border-4 border-ink bg-cream p-4">
          <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-3">Top Cities</p>
          <div className="space-y-2">
            {topCities.map(([city, count], i) => {
              const max = topCities[0][1];
              return (
                <div key={city} className="flex items-center gap-3">
                  <span className="font-display text-xs w-24 truncate text-ink uppercase">{city}</span>
                  <div className="flex-1 bg-ink/10 border border-ink h-5 relative overflow-hidden">
                    <div className="h-full transition-all duration-700" style={{ width: `${(count / max) * 100}%`, background: CCD_COLOURS[i % CCD_COLOURS.length] }} />
                  </div>
                  <span className="font-display text-xs text-ink/60 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social stats growth chart */}
      {socialHistory && socialHistory.length > 0 && (
        <SocialStatsChart history={socialHistory} />
      )}
    </div>
  );
}
