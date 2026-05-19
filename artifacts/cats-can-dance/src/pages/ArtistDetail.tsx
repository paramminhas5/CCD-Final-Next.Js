import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useUser, useClerk } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Artist = {
  id: string; slug: string; name: string; members: string | null;
  from_city: string | null; based_city: string | null;
  genres: string[]; festivals: string[];
  bio: string | null; why: string | null;
  instagram: string | null; soundcloud: string | null;
  bandcamp: string | null; spotify: string | null; website: string | null;
  booking_email: string | null; manager_email: string | null;
  labels: string | null; photo_url: string | null;
  fee_min_inr: number | null; fee_max_inr: number | null; fee_currency: string;
  gallery: { url: string; caption?: string }[];
  videos: { youtube_id?: string; title?: string }[];
  open_to_bookings: boolean; available_cities: string[];
  claimed_by: string | null; featured: boolean;
  enrichment_log?: Record<string, unknown>;
  created_at?: string;
};
type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
};
type OtherArtist = Pick<Artist, "id" | "slug" | "name" | "based_city" | "genres" | "photo_url" | "festivals">;

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const ensUrl = (s: string | null) => s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null;
const igUrl  = (s: string | null) => s ? ensUrl(s.startsWith("http") ? s : `https://instagram.com/${s.replace(/^@/, "")}`) : null;
const cityOf = (a: Artist) => a.based_city || a.from_city || "";
const nameBg = (n: string) => { const c=["#E91E8C","#0066FF","#0D0D0D","#FF6B00"]; let h=0; for(let i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))&0xffffffff; return c[Math.abs(h)%c.length]; };
const fmtFee = (a: Artist) => {
  if (!a.fee_min_inr && !a.fee_max_inr) return null;
  const f = (n: number) => n >= 100000 ? `${(n/100000).toFixed(1).replace(/\.0$/,"")}L` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n);
  const sym = (a.fee_currency || "INR") === "USD" ? "$" : "₹";
  if (a.fee_min_inr && a.fee_max_inr && a.fee_min_inr !== a.fee_max_inr) return `${sym}${f(a.fee_min_inr)} – ${sym}${f(a.fee_max_inr)}`;
  return `${sym}${f(a.fee_min_inr ?? a.fee_max_inr!)}`;
};

function getYearsActive(a: Artist, dates: ArtistDate[]): number | null {
  const allDates: string[] = [];
  if (a.created_at) allDates.push(a.created_at);
  dates.forEach(d => allDates.push(d.event_date));
  if (allDates.length === 0) return null;
  const earliest = Math.min(...allDates.map(d => new Date(d).getFullYear()));
  return new Date().getFullYear() - earliest + 1;
}

function getConnections(a: Artist, others: OtherArtist[]): OtherArtist[] {
  if (!a.festivals.length) return [];
  return others
    .filter(o => o.slug !== a.slug && o.festivals.some(f => a.festivals.includes(f)))
    .sort((x, y) => {
      const xShared = y.festivals.filter(f => a.festivals.includes(f)).length;
      const yShared = x.festivals.filter(f => a.festivals.includes(f)).length;
      return xShared - yShared;
    })
    .slice(0, 8);
}

function getSharedStages(a: Artist, other: OtherArtist): string[] {
  return a.festivals.filter(f => other.festivals.includes(f));
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */
function SCEmbed({ url, name }: { url: string; name: string }) {
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23E91E8C&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`;
  return <iframe className="w-full border-4 border-ink" height="200" scrolling="no" frameBorder="no" allow="autoplay" src={src} title={`${name} on SoundCloud`} />;
}

function YTEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="border-4 border-ink bg-ink overflow-hidden">
      <div className="aspect-video"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}`} title={title ?? "Video"} allowFullScreen /></div>
      {title && <p className="font-display text-xs text-cream p-2 truncate">{title}</p>}
    </div>
  );
}

/* ── Stats Bar ─────────────────────────────────────────────────────────────── */
function StatsBar({ artist, dates, connections }: { artist: Artist; dates: ArtistDate[]; connections: OtherArtist[] }) {
  const yearsActive = getYearsActive(artist, dates);
  const allCities = [...new Set(dates.map(d => d.city).filter(Boolean))];
  const pastShows = dates.filter(d => new Date(d.event_date) < new Date()).length;
  const items = [
    artist.festivals.length > 0 && { n: artist.festivals.length, label: "Stage credits" },
    pastShows > 0 && { n: pastShows, label: "Shows played" },
    allCities.length > 0 && { n: allCities.length, label: "Cities" },
    connections.length > 0 && { n: connections.length, label: "Known connections" },
    yearsActive && { n: yearsActive, label: "Years active" },
    artist.videos.length > 0 && { n: artist.videos.length, label: "Videos" },
  ].filter(Boolean) as { n: number; label: string }[];

  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-ink border-4 border-ink mb-8">
      {items.slice(0, 6).map(({ n, label }) => (
        <div key={label} className="bg-cream p-4 text-center">
          <p className="font-display text-3xl text-ink">{n}</p>
          <p className="font-display text-[10px] uppercase text-ink/50 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Career Timeline ────────────────────────────────────────────────────────── */
function CareerTimeline({ dates }: { dates: ArtistDate[] }) {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const byYear: Record<string, ArtistDate[]> = {};
  sorted.forEach(d => {
    const yr = d.event_date.slice(0, 4);
    (byYear[yr] = byYear[yr] ?? []).push(d);
  });
  const years = Object.keys(byYear).sort();

  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-6">Journey</h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[72px] top-0 bottom-0 w-0.5 bg-ink/10" />
        <div className="space-y-6">
          {years.map(yr => (
            <div key={yr} className="flex gap-4">
              <div className="w-[68px] shrink-0 text-right">
                <span className="font-display text-xs text-ink/40 uppercase">{yr}</span>
              </div>
              <div className="relative pl-6 flex-1 space-y-2">
                {/* Year dot */}
                <div className="absolute left-0 top-1 w-3 h-3 bg-magenta border-2 border-ink -translate-x-[6px]" />
                {byYear[yr].map(d => {
                  const dt = new Date(d.event_date + "T00:00:00");
                  const isPast = dt < new Date();
                  return (
                    <div key={d.id} className={`flex items-start gap-3 p-3 border-2 ${isPast ? "border-ink/10 bg-ink/3" : "border-magenta/40 bg-magenta/5"}`}>
                      <div className="text-center min-w-[36px]">
                        <p className="font-display text-lg text-ink leading-none">{dt.getDate()}</p>
                        <p className="font-display text-[9px] text-ink/40 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-sm text-ink uppercase">{d.city}</p>
                        {d.venue && <p className="text-xs text-ink/50">{d.venue}</p>}
                      </div>
                      <span className={`text-[9px] font-display uppercase px-2 py-0.5 border shrink-0 ${
                        d.status === "confirmed" ? "bg-acid-yellow text-ink border-acid-yellow" :
                        d.status === "tentative" ? "bg-cream text-ink/50 border-ink/20" : "bg-ink text-cream border-ink"
                      }`}>{d.status}</span>
                      {d.ticket_url && (
                        <a href={d.ticket_url.startsWith("http") ? d.ticket_url : `https://${d.ticket_url}`}
                          target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          className="font-display text-[9px] uppercase bg-magenta text-cream px-2 py-1 border border-ink shrink-0 hover:bg-ink transition-colors">
                          Tix
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Network / Connections ──────────────────────────────────────────────────── */
function NetworkSection({ artist, connections }: { artist: Artist; connections: OtherArtist[] }) {
  if (connections.length === 0) return null;
  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">
        The Network — Shared Stages
      </h2>
      <p className="text-xs text-ink/40 mb-4">
        Artists who have appeared on the same lineup as {artist.name}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {connections.map(c => {
          const shared = getSharedStages(artist, c);
          const img = c.photo_url;
          return (
            <a key={c.id} href={`/artists/${c.slug}`}
              className="block border-4 border-ink bg-cream hover:bg-acid-yellow transition-colors group overflow-hidden">
              <div className="relative">
                {img
                  ? <img src={img} alt={c.name} className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-24 flex items-center justify-center font-display text-3xl text-cream" style={{ background: nameBg(c.name) }}>
                      {c.name[0]}
                    </div>
                }
                {shared.length > 1 && (
                  <div className="absolute bottom-0 right-0 bg-magenta text-cream font-display text-[9px] px-1.5 py-0.5 border-t-2 border-l-2 border-ink">
                    {shared.length}× together
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="font-display text-xs text-ink uppercase truncate">{c.name}</p>
                <p className="text-[9px] text-ink/40 truncate">{shared[0]}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ── Festival / Stage Credits ───────────────────────────────────────────────── */
function StageCredits({ festivals }: { festivals: string[] }) {
  if (festivals.length === 0) return null;
  // Try to identify tier / prestige
  const bigFests = ["sunburn", "vh1 supersonic", "magnetic fields", "enchanted valley", "one stage", "lollapalooza", "bacardi nh7", "nh7", "antiheroes", "unbox"];
  const isBig = (f: string) => bigFests.some(b => f.toLowerCase().includes(b));
  const sorted = [...festivals].sort((a, b) => (isBig(b) ? 1 : 0) - (isBig(a) ? 1 : 0));

  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">
        Stage Credits ({festivals.length})
      </h2>
      <div className="flex flex-wrap gap-2">
        {sorted.map(f => (
          <span key={f} className={`font-display text-xs px-3 py-1.5 border-4 border-ink chunk-shadow ${
            isBig(f) ? "bg-acid-yellow text-ink" : "bg-cream text-ink"
          }`}>
            {isBig(f) && "★ "}{f}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── EPK Panel ──────────────────────────────────────────────────────────────── */
function EPKPanel({ artist, dates }: { artist: Artist; dates: ArtistDate[] }) {
  const [open, setOpen] = useState(false);
  const upcoming = dates.filter(d => new Date(d.event_date + "T00:00:00") >= new Date()).slice(0, 5);
  const fee = fmtFee(artist);
  const city = cityOf(artist);
  const sc = ensUrl(artist.soundcloud);
  const ig = igUrl(artist.instagram);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="border-4 border-ink bg-cream mt-4">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 font-display text-sm uppercase text-ink hover:bg-acid-yellow transition-colors">
        <span>📄 Press Kit / EPK</span>
        <span className="text-ink/40">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t-4 border-ink p-5 space-y-4">
          <p className="text-xs text-ink/50">
            Use this information for press, booking, and promotional purposes.
          </p>

          {/* EPK fields */}
          <div className="space-y-3">
            <div className="bg-ink/5 border-2 border-ink/10 p-3">
              <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Artist Name</p>
              <p className="font-display text-sm text-ink">{artist.name}</p>
            </div>
            {artist.members && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Members</p>
                <p className="text-sm text-ink">{artist.members}</p>
              </div>
            )}
            {city && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Based In</p>
                <p className="text-sm text-ink">{city}</p>
              </div>
            )}
            {artist.genres.length > 0 && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Genre(s)</p>
                <p className="text-sm text-ink">{artist.genres.join(", ")}</p>
              </div>
            )}
            {artist.labels && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Label(s)</p>
                <p className="text-sm text-ink">{artist.labels}</p>
              </div>
            )}
            {artist.bio && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Bio (Short)</p>
                <p className="text-sm text-ink/80 line-clamp-4">{artist.bio}</p>
              </div>
            )}
            {artist.festivals.length > 0 && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Notable Stages</p>
                <p className="text-sm text-ink">{artist.festivals.slice(0, 8).join(" · ")}</p>
              </div>
            )}
            <div className="bg-ink/5 border-2 border-ink/10 p-3">
              <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Links</p>
              <div className="space-y-1">
                {ig && <p className="text-xs text-ink/70">Instagram: {ig}</p>}
                {sc && <p className="text-xs text-ink/70">SoundCloud: {sc}</p>}
                {ensUrl(artist.spotify) && <p className="text-xs text-ink/70">Spotify: {ensUrl(artist.spotify)}</p>}
                {ensUrl(artist.website) && <p className="text-xs text-ink/70">Website: {ensUrl(artist.website)}</p>}
                <p className="text-xs text-ink/70">Profile: {typeof window !== "undefined" ? window.location.href : ""}</p>
              </div>
            </div>
            {upcoming.length > 0 && (
              <div className="bg-ink/5 border-2 border-ink/10 p-3">
                <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Upcoming Shows</p>
                {upcoming.map(d => (
                  <p key={d.id} className="text-xs text-ink/70">{d.event_date} — {d.city}{d.venue ? `, ${d.venue}` : ""}</p>
                ))}
              </div>
            )}
            {fee && (
              <div className="bg-acid-yellow border-2 border-ink p-3">
                <p className="font-display text-[9px] uppercase text-ink/60 mb-1">Fee Range (Indicative)</p>
                <p className="font-display text-xl text-ink">{fee}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex-1 font-display text-xs uppercase bg-ink text-cream px-4 py-2.5 border-2 border-ink hover:bg-magenta transition-colors">
              🖨 Print / PDF
            </button>
            <button onClick={() => {
              const text = `${artist.name} — ${artist.genres.join(", ")} — Based in ${city}\n\n${artist.bio ?? ""}\n\nStages: ${artist.festivals.slice(0,5).join(", ")}\n\nBook: ${artist.booking_email ?? "via CCD"}\nIG: ${ig ?? ""}\nSC: ${sc ?? ""}`;
              navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!")).catch(() => toast.error("Copy failed"));
            }}
              className="flex-1 font-display text-xs uppercase bg-cream text-ink px-4 py-2.5 border-2 border-ink hover:bg-acid-yellow transition-colors">
              📋 Copy Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Contact Gate ───────────────────────────────────────────────────────────── */
function ContactGate({ artist }: { artist: Artist }) {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [enquiry, setEnquiry] = useState("");
  const [sent, setSent] = useState(false);
  const fee = fmtFee(artist);
  const isRevealed = user || verified;

  const sendEnquiry = async () => {
    if (!email.trim()) { toast.error("Email required"); return; }
    setBusy(true);
    try {
      await fetch("/api/event-rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_slug: `booking-${artist.slug}`, name: email.split("@")[0], email, plus_ones: 0 }),
      });
      setSent(true); toast.success("Enquiry sent!");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="border-4 border-ink bg-cream">
      {fee && (
        <div className="bg-magenta text-cream border-b-4 border-ink p-4">
          <p className="font-display text-xs uppercase opacity-70 mb-1">Estimated Fee</p>
          {isRevealed
            ? <p className="font-display text-3xl">{fee}</p>
            : <p className="font-display text-3xl blur-sm select-none">₹XXk–YYL</p>}
          <p className="text-xs opacity-60 mt-1">Indicative — confirm per booking</p>
        </div>
      )}
      <div className="p-5 space-y-4">
        <h3 className="font-display text-lg uppercase text-ink">Book {artist.name}</h3>
        {!artist.open_to_bookings && (
          <p className="text-xs bg-ink/5 border-2 border-ink/20 p-3 text-ink/60">Not actively taking bookings — enquiries still welcome.</p>
        )}
        {!isRevealed && (
          <>
            <p className="text-sm text-ink/70">Sign in or enter your email to reveal the booking contact and fee.</p>
            <button onClick={() => openSignIn()}
              className="w-full bg-ink text-cream font-display text-sm uppercase px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">
              Sign In to Reveal
            </button>
            <div className="relative flex items-center gap-2 text-ink/30 text-xs font-display uppercase">
              <div className="flex-1 h-px bg-ink/20" /><span>or</span><div className="flex-1 h-px bg-ink/20" />
            </div>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Your Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none" />
            </label>
            <button onClick={() => { if (email.includes("@")) setVerified(true); else toast.error("Enter a valid email"); }}
              className="w-full bg-acid-yellow text-ink font-display text-sm uppercase px-4 py-3 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">
              Continue as Guest →
            </button>
          </>
        )}
        {isRevealed && !sent && (
          <>
            {artist.booking_email && (
              <div className="bg-acid-yellow border-4 border-ink p-3">
                <p className="font-display text-xs uppercase text-ink/60 mb-1">Direct Booking</p>
                <a href={`mailto:${artist.booking_email}`} className="font-display text-ink hover:text-magenta break-all">✉ {artist.booking_email}</a>
              </div>
            )}
            {artist.manager_email && artist.manager_email !== artist.booking_email && (
              <p className="text-sm text-ink/60 font-display">Manager: <a href={`mailto:${artist.manager_email}`} className="underline">{artist.manager_email}</a></p>
            )}
            {!artist.booking_email && !artist.manager_email && (
              <p className="text-sm text-ink/60 bg-ink/5 border-2 border-ink/20 p-3">No direct contact on file — CCD will forward your enquiry.</p>
            )}
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Booking Enquiry</span>
              <textarea value={enquiry} onChange={e => setEnquiry(e.target.value)} rows={3}
                placeholder="Date, city, event type, budget…"
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none resize-none" />
            </label>
            {!user && (
              <label className="block">
                <span className="font-display text-xs uppercase text-ink block mb-1">Your Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none" />
              </label>
            )}
            <button onClick={sendEnquiry} disabled={busy}
              className="w-full bg-magenta text-cream font-display text-sm uppercase px-4 py-3 border-4 border-ink disabled:opacity-60 hover:bg-ink transition-colors">
              {busy ? "Sending…" : "Send Booking Enquiry"}
            </button>
          </>
        )}
        {sent && (
          <div className="text-center py-4">
            <p className="font-display text-2xl text-ink mb-1">✓ Sent</p>
            <p className="text-ink/60 text-sm">We'll be in touch.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── "Fun Facts" pull quote bar ─────────────────────────────────────────────── */
function FactsBar({ artist, dates, connections }: { artist: Artist; dates: ArtistDate[]; connections: OtherArtist[] }) {
  const facts: string[] = [];
  const city = cityOf(artist);
  if (city) facts.push(`Based in ${city}`);
  if (artist.from_city && artist.from_city !== artist.based_city) facts.push(`Originally from ${artist.from_city}`);
  if (artist.labels) facts.push(`On ${artist.labels}`);
  const allCities = [...new Set(dates.map(d => d.city).filter(Boolean))];
  if (allCities.length > 1) facts.push(`Played across ${allCities.length} cities`);
  if (connections.length > 0) facts.push(`Connected to ${connections.length} artists in the CCD network`);
  if (artist.festivals.length >= 5) facts.push(`${artist.festivals.length} festival & club credits`);
  if (artist.open_to_bookings) facts.push("Open to bookings");
  if (artist.available_cities.length > 0) facts.push(`Available in ${artist.available_cities.slice(0,3).join(", ")}`);

  if (facts.length === 0) return null;
  return (
    <div className="bg-ink border-4 border-ink my-8 overflow-hidden">
      <div className="flex overflow-x-auto gap-px">
        {facts.map((f, i) => (
          <div key={i} className="bg-ink px-6 py-3 text-center shrink-0">
            <p className="font-display text-xs text-cream/50 uppercase whitespace-nowrap">
              <span className="text-acid-yellow mr-2">✦</span>{f}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
const ArtistDetail = () => {
  const router = useRouter();
  const slug = router.query.slug as string | undefined;
  const [a, setA] = useState<Artist | null>(null);
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [allArtists, setAllArtists] = useState<OtherArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "journey" | "network" | "epk">("overview");

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setNotFound(false); setA(null);
    (async () => {
      const res = await fetch(`/api/artists/${encodeURIComponent(slug)}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const raw = await res.json();
      const norm: Artist = {
        ...raw,
        gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
        videos: Array.isArray(raw.videos) ? raw.videos : [],
        genres: Array.isArray(raw.genres) ? raw.genres : [],
        festivals: Array.isArray(raw.festivals) ? raw.festivals : [],
        available_cities: Array.isArray(raw.available_cities) ? raw.available_cities : [],
        open_to_bookings: raw.open_to_bookings !== false,
        fee_currency: raw.fee_currency || "INR",
        featured: raw.featured ?? false,
      };
      setA(norm);
      const [dr, ar] = await Promise.all([
        fetch(`/api/artist-dates?artist_id=${raw.id}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/artists`).then(r => r.ok ? r.json() : []),
      ]);
      setDates(Array.isArray(dr) ? dr : []);
      setAllArtists(Array.isArray(ar) ? ar : []);
      setLoading(false);
    })();
  }, [slug]);

  const connections = useMemo(() => a ? getConnections(a, allArtists) : [], [a, allArtists]);
  const related = useMemo(() => allArtists.filter(x => x.slug !== slug).sort(() => Math.random()-0.5).slice(0, 4), [allArtists, slug]);

  if (loading) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="flex items-center justify-center min-h-[80vh] pt-20">
        <div className="space-y-4 text-center">
          <div className="w-24 h-24 bg-ink/5 border-4 border-ink/10 mx-auto animate-pulse" />
          <div className="h-6 w-48 bg-ink/10 mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (notFound || !a) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink uppercase mb-4">Artist not found.</p>
        <a href="/artists" className="font-display underline text-magenta">← All artists</a>
      </div>
    </div>
  );

  const city = cityOf(a);
  const sc   = ensUrl(a.soundcloud);
  const ig   = igUrl(a.instagram);
  const ytVideos = a.videos.filter(v => v.youtube_id);
  const upcoming = dates.filter(d => new Date(d.event_date+"T00:00:00") >= new Date()).sort((x,y) => x.event_date.localeCompare(y.event_date));
  const past = dates.filter(d => new Date(d.event_date+"T00:00:00") < new Date()).sort((x,y) => y.event_date.localeCompare(x.event_date));
  const coverImg = a.photo_url || (ytVideos[0] ? `https://img.youtube.com/vi/${ytVideos[0].youtube_id}/maxresdefault.jpg` : null) || (a.gallery[0]?.url ?? null);

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "journey",  label: `Journey ${dates.length > 0 ? `(${dates.length})` : ""}` },
    { key: "network",  label: `Network ${connections.length > 0 ? `(${connections.length})` : ""}` },
    { key: "epk",      label: "EPK / Press" },
  ] as const;

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`${a.name} — ${a.genres[0] ?? "Electronic"} · ${city || "India"} | Cats Can Dance`}
        description={a.bio?.slice(0,155) ?? `${a.name} — Book via Cats Can Dance.`}
        path={`/artists/${a.slug}`}
        jsonLd={{"@context":"https://schema.org","@type":"MusicGroup",name:a.name,genre:a.genres.join(", "),description:a.bio?.slice(0,155),image:coverImg??undefined}}
      />
      <Nav />

      <div className="pt-[60px] md:pt-[72px]">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative w-full h-[45vh] md:h-[60vh] overflow-hidden border-b-4 border-ink">
          {coverImg
            ? <img src={coverImg} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: nameBg(a.name) }} />}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/90" />

          {/* Featured badge */}
          {a.featured && (
            <div className="absolute top-0 right-0 bg-acid-yellow text-ink font-display text-xs px-4 py-2 border-b-4 border-l-4 border-ink uppercase">
              ⭐ CCD Featured
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 p-6 md:p-10">
            <a href="/artists" className="font-display text-xs uppercase text-cream/40 hover:text-cream mb-3 inline-block">← All artists</a>
            {a.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {a.genres.map(g => (
                  <span key={g} className="font-display text-[10px] uppercase bg-acid-yellow text-ink px-2 py-1 border-2 border-ink">{g}</span>
                ))}
                {city && <span className="font-display text-[10px] uppercase bg-cream/10 border border-cream/30 text-cream px-2 py-1">📍 {city}</span>}
              </div>
            )}
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl text-cream uppercase leading-none"
              style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.4)" }}>{a.name}</h1>
            {a.members && <p className="text-cream/50 text-sm mt-2">{a.members}</p>}
          </div>
        </div>

        {/* ── Meta strip ──────────────────────────────────────────────────── */}
        <div className="bg-ink text-cream border-b-4 border-cream/10">
          <div className="container py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {a.labels && <span className="font-display text-xs text-cream/40 border border-cream/20 px-2 py-1">{a.labels}</span>}
              {a.festivals.length > 0 && (
                <span className="font-display text-xs text-cream/40">
                  {a.festivals.length} stage credits
                </span>
              )}
              {connections.length > 0 && (
                <span className="font-display text-xs text-cream/40">
                  · {connections.length} known connections
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {ig && <a href={ig} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 border-2 border-cream/30 text-cream hover:border-cream transition-colors">Instagram ↗</a>}
              {sc && <a href={sc} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 bg-[#ff5500] text-cream border-2 border-[#ff5500] hover:opacity-80">SoundCloud ↗</a>}
              {ensUrl(a.spotify) && <a href={ensUrl(a.spotify)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 bg-[#1db954] text-cream border-2 border-[#1db954]">Spotify ↗</a>}
              {ensUrl(a.bandcamp) && <a href={ensUrl(a.bandcamp)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 bg-[#1da0c3] text-cream border-2 border-[#1da0c3]">Bandcamp ↗</a>}
              {ensUrl(a.website) && <a href={ensUrl(a.website)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 border-2 border-cream/30 text-cream hover:border-cream">Website ↗</a>}
            </div>
          </div>
        </div>

        {/* ── Facts bar ───────────────────────────────────────────────────── */}
        <FactsBar artist={a} dates={dates} connections={connections} />

        {/* ── Stats bar ───────────────────────────────────────────────────── */}
        <div className="container">
          <StatsBar artist={a} dates={dates} connections={connections} />
        </div>

        {/* ── Tab nav ─────────────────────────────────────────────────────── */}
        <div className="border-b-4 border-ink bg-cream sticky top-[60px] md:top-[72px] z-20">
          <div className="container">
            <div className="flex gap-0 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`font-display text-xs uppercase px-5 py-4 border-r-4 border-ink whitespace-nowrap transition-colors ${
                    activeTab === tab.key ? "bg-ink text-cream" : "text-ink/50 hover:text-ink hover:bg-acid-yellow/30"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div className="container py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: main content */}
          <div className="lg:col-span-2 space-y-10">
            {activeTab === "overview" && (
              <>
                {a.why && (
                  <div className="bg-acid-yellow border-4 border-ink p-6">
                    <p className="font-display text-xs uppercase text-ink/60 mb-2">Why book them</p>
                    <p className="font-display text-2xl text-ink leading-tight">{a.why}</p>
                  </div>
                )}
                {a.bio && (
                  <div>
                    <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Bio</h2>
                    <p className="text-ink/90 leading-relaxed whitespace-pre-line text-base">{a.bio}</p>
                  </div>
                )}
                {sc && (
                  <div>
                    <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Listen</h2>
                    <SCEmbed url={sc} name={a.name} />
                  </div>
                )}
                {ytVideos.length > 0 && (
                  <div>
                    <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Videos ({ytVideos.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ytVideos.map(v => <YTEmbed key={v.youtube_id} id={v.youtube_id!} title={v.title} />)}
                    </div>
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Upcoming Shows ({upcoming.length})</h2>
                    <div className="space-y-3">
                      {upcoming.map(d => {
                        const dt = new Date(d.event_date+"T00:00:00");
                        return (
                          <div key={d.id} className="flex items-center gap-4 border-4 border-ink p-4 bg-cream hover:bg-acid-yellow/10 transition-colors">
                            <div className="text-center min-w-[52px]">
                              <p className="font-display text-2xl text-ink leading-none">{dt.getDate()}</p>
                              <p className="font-display text-xs text-ink/50 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                              <p className="font-display text-xs text-ink/30">{dt.getFullYear()}</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-display text-lg text-ink uppercase">{d.city}</p>
                              {d.venue && <p className="text-sm text-ink/60">{d.venue}</p>}
                              <span className={`text-xs font-display uppercase px-2 py-0.5 border-2 border-ink mt-1 inline-block ${
                                d.status==="confirmed"?"bg-acid-yellow text-ink":d.status==="tentative"?"bg-cream text-ink/50":"bg-ink text-cream"}`}>{d.status}</span>
                            </div>
                            {d.ticket_url && <a href={d.ticket_url.startsWith("http")?d.ticket_url:`https://${d.ticket_url}`} target="_blank" rel="noreferrer" className="font-display text-xs uppercase bg-magenta text-cream px-3 py-2 border-2 border-ink shrink-0 hover:bg-ink transition-colors">Tickets →</a>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <StageCredits festivals={a.festivals} />
                {a.gallery.length > 0 && (
                  <div>
                    <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {a.gallery.map((g, i) => (
                        <figure key={i} className="border-4 border-ink overflow-hidden cursor-zoom-in" onClick={() => setLightbox(g.url)}>
                          <img src={g.url} alt={g.caption ?? a.name} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                          {g.caption && <figcaption className="p-2 font-display text-xs text-ink/60">{g.caption}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "journey" && (
              <CareerTimeline dates={[...upcoming, ...past]} />
            )}

            {activeTab === "network" && (
              <NetworkSection artist={a} connections={connections} />
            )}

            {activeTab === "epk" && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Press Kit</h2>
                <p className="text-ink/60 text-sm mb-6">
                  Everything a booker, journalist, or venue needs — in one place.
                </p>
                {/* Full EPK display inline */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-ink/5 border-4 border-ink/10 p-4">
                      <p className="font-display text-[10px] uppercase text-ink/40 mb-1">Artist Name</p>
                      <p className="font-display text-xl text-ink">{a.name}</p>
                    </div>
                    <div className="bg-ink/5 border-4 border-ink/10 p-4">
                      <p className="font-display text-[10px] uppercase text-ink/40 mb-1">Based In</p>
                      <p className="font-display text-xl text-ink">{city || "India"}</p>
                    </div>
                    {a.genres.length > 0 && (
                      <div className="bg-ink/5 border-4 border-ink/10 p-4">
                        <p className="font-display text-[10px] uppercase text-ink/40 mb-1">Genre(s)</p>
                        <p className="font-display text-base text-ink">{a.genres.join(", ")}</p>
                      </div>
                    )}
                    {a.labels && (
                      <div className="bg-ink/5 border-4 border-ink/10 p-4">
                        <p className="font-display text-[10px] uppercase text-ink/40 mb-1">Label(s)</p>
                        <p className="font-display text-base text-ink">{a.labels}</p>
                      </div>
                    )}
                  </div>
                  {a.bio && (
                    <div className="bg-ink/5 border-4 border-ink/10 p-4">
                      <p className="font-display text-[10px] uppercase text-ink/40 mb-2">Bio</p>
                      <p className="text-ink/80 leading-relaxed text-sm">{a.bio}</p>
                    </div>
                  )}
                  {a.festivals.length > 0 && (
                    <div className="bg-ink/5 border-4 border-ink/10 p-4">
                      <p className="font-display text-[10px] uppercase text-ink/40 mb-2">Stage Credits</p>
                      <p className="text-ink/80 text-sm">{a.festivals.join(", ")}</p>
                    </div>
                  )}
                  {/* Links */}
                  <div className="bg-ink/5 border-4 border-ink/10 p-4">
                    <p className="font-display text-[10px] uppercase text-ink/40 mb-2">Links</p>
                    <div className="space-y-1 text-sm text-ink/70">
                      {ig && <p>Instagram: <a href={ig} className="underline">{ig}</a></p>}
                      {sc && <p>SoundCloud: <a href={sc} className="underline">{sc}</a></p>}
                      {ensUrl(a.spotify) && <p>Spotify: <a href={ensUrl(a.spotify)!} className="underline">{ensUrl(a.spotify)}</a></p>}
                      {ensUrl(a.website) && <p>Website: <a href={ensUrl(a.website)!} className="underline">{ensUrl(a.website)}</a></p>}
                    </div>
                  </div>
                  {/* Press photos */}
                  {a.gallery.length > 0 && (
                    <div>
                      <p className="font-display text-[10px] uppercase text-ink/40 mb-2">Press Photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {a.gallery.slice(0,6).map((g,i) => (
                          <a key={i} href={g.url} target="_blank" rel="noreferrer" className="block border-4 border-ink overflow-hidden hover:opacity-80">
                            <img src={g.url} alt={g.caption ?? a.name} className="w-full h-24 object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Print / Copy buttons */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => window.print()}
                      className="flex-1 font-display text-sm uppercase bg-ink text-cream px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">
                      🖨 Print / Save PDF
                    </button>
                    <button onClick={() => {
                      const text = `${a.name}\n${a.genres.join(", ")} — ${city}\n\n${a.bio ?? ""}\n\nStages: ${a.festivals.join(", ")}\n\nIG: ${ig ?? ""}\nSC: ${sc ?? ""}\nBooking: ${a.booking_email ?? "via CCD"}\nProfile: ${typeof window !== "undefined" ? window.location.href : ""}`;
                      navigator.clipboard.writeText(text).then(() => toast.success("Copied!")).catch(() => toast.error("Copy failed"));
                    }}
                      className="flex-1 font-display text-sm uppercase bg-cream text-ink px-4 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors">
                      📋 Copy EPK Text
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: sticky sidebar */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-[140px]">
              <ContactGate artist={a} />
              <EPKPanel artist={a} dates={dates} />

              {!a.claimed_by && (
                <div className="border-4 border-ink bg-ink text-cream p-4 mt-4">
                  <p className="font-display text-sm uppercase mb-2">Are you {a.name}?</p>
                  <a href={`/sign-in?redirect_url=/artist/dashboard?claim=${a.id}`}
                    className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-2 border-2 border-cream inline-block hover:bg-cream transition-colors">
                    Claim this profile →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related artists ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="border-t-4 border-ink bg-ink text-cream py-12">
            <div className="container">
              <h2 className="font-display text-2xl uppercase text-cream mb-6">
                {connections.length > 0 ? "More From The Scene" : "More Artists"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(r => (
                  <a key={r.id} href={`/artists/${r.slug}`}
                    className="block border-4 border-cream/20 hover:border-cream transition-colors overflow-hidden group">
                    {r.photo_url
                      ? <img src={r.photo_url} alt={r.name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-32 flex items-center justify-center font-display text-4xl text-cream/20" style={{ background: nameBg(r.name) }}>{r.name[0]}</div>}
                    <div className="p-3">
                      <p className="font-display text-cream uppercase text-sm">{r.name}</p>
                      <p className="text-cream/40 text-xs mt-0.5">{r.based_city || ""}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Gallery" className="max-w-full max-h-full object-contain border-4 border-cream" />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ArtistDetail;
