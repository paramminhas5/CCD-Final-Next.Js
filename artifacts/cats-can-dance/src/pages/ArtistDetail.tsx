/**
 * ArtistDetail v3 — The Full Picture
 *
 * Tabs: Overview · Journey · Network · Venues · EPK
 *
 * New in v3:
 * - Connection graph: SVG radial web (B2B · label · crew · collab)
 * - Appearance timeline: every gig, venue, city, year
 * - Venue affinity: bar chart of most-played rooms
 * - Scene rank: tier system (International → National → City → Local)
 * - Reads from event_appearances + artist_connections tables
 */
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
  created_at?: string;
};
type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
};
type Appearance = {
  id: string; artist_slug: string; event_name: string; venue: string | null;
  city: string | null; event_date: string | null; year: number | null;
  role: string; source: string;
};
type Connection = {
  id: string;
  artist_a_id: string; artist_a_slug: string;
  artist_b_id: string; artist_b_slug: string;
  connection_type: string; strength: number;
  shared_events: string[]; shared_venues: string[];
  notes: string | null;
};
type OtherArtist = { id: string; slug: string; name: string; based_city: string | null; genres: string[]; photo_url: string | null; festivals: string[] };

/* ── Scene rank ────────────────────────────────────────────────────────────── */
const INTERNATIONAL_FESTS = ["sunburn","dgtl","boiler room","lollapalooza","vh1 supersonic","echoes of earth","resonance"];
const NATIONAL_FESTS       = ["magnetic fields","nh7","nh7 weekender","antiheroes","enchanted valley","bacardi nh7","one stage","high on clouds"];
const BIG_CLUBS            = ["kitty su","district","counterculture","bonobo","blue frog","bhavani island","echoes"];

function getSceneRank(a: Artist, appearances: Appearance[]): { tier: string; label: string; color: string; reason: string } {
  const allStages = [...a.festivals, ...appearances.map(ap => ap.event_name)].map(s => s.toLowerCase());
  const cities = [...new Set(appearances.map(ap => ap.city).filter(Boolean))];

  if (INTERNATIONAL_FESTS.some(f => allStages.some(s => s.includes(f)))) {
    return { tier: "1", label: "International", color: "bg-acid-yellow text-ink", reason: `Played ${INTERNATIONAL_FESTS.find(f => allStages.some(s => s.includes(f)))}` };
  }
  if (NATIONAL_FESTS.some(f => allStages.some(s => s.includes(f)))) {
    return { tier: "2", label: "National", color: "bg-magenta text-cream", reason: `National festival circuit` };
  }
  if (cities.length >= 3 || BIG_CLUBS.some(c => allStages.some(s => s.includes(c)))) {
    return { tier: "3", label: "City Circuit", color: "bg-electric-blue text-cream", reason: `Active across ${cities.length}+ cities` };
  }
  if (a.festivals.length > 0 || appearances.length > 0) {
    return { tier: "4", label: "Scene Regular", color: "bg-ink text-cream", reason: "Established local presence" };
  }
  return { tier: "5", label: "Emerging", color: "bg-ink/40 text-cream", reason: "Building their name" };
}

/* ── Venue affinity ────────────────────────────────────────────────────────── */
function getVenueAffinity(appearances: Appearance[]): { venue: string; city: string | null; count: number }[] {
  const counts: Record<string, { city: string | null; count: number }> = {};
  for (const ap of appearances) {
    if (!ap.venue) continue;
    if (!counts[ap.venue]) counts[ap.venue] = { city: ap.city, count: 0 };
    counts[ap.venue].count++;
  }
  return Object.entries(counts)
    .map(([venue, { city, count }]) => ({ venue, city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const ensUrl = (s: string | null) => s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null;
const igUrl  = (s: string | null) => s ? ensUrl(s.startsWith("http") ? s : `https://instagram.com/${s.replace(/^@/, "")}`) : null;
const cityOf = (a: Artist) => a.based_city || a.from_city || "";
const nameBg = (n: string) => { const c=["#E91E8C","#0066FF","#0D0D0D","#FF6B00"]; let h=0; for(let i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))&0xffffffff; return c[Math.abs(h)%c.length]; };
const fmtFee = (a: Artist) => {
  if (!a.fee_min_inr && !a.fee_max_inr) return null;
  const f=(n:number)=>n>=100000?`${(n/100000).toFixed(1).replace(/\.0$/,"")}L`:n>=1000?`${(n/1000).toFixed(0)}k`:String(n);
  const sym=(a.fee_currency||"INR")==="USD"?"$":"₹";
  if(a.fee_min_inr&&a.fee_max_inr&&a.fee_min_inr!==a.fee_max_inr) return `${sym}${f(a.fee_min_inr)} – ${sym}${f(a.fee_max_inr)}`;
  return `${sym}${f(a.fee_min_inr??a.fee_max_inr!)}`;
};

const CONNECTION_COLORS: Record<string, string> = {
  b2b:    "#E91E8C",
  label:  "#0066FF",
  crew:   "#FF6B00",
  booker: "#22c55e",
  collab: "#a855f7",
};
const CONNECTION_LABELS: Record<string, string> = {
  b2b: "B2B", label: "Same Label", crew: "Crew", booker: "Booked By", collab: "Collab",
};

/* ── Connection Graph (SVG radial) ─────────────────────────────────────────── */
function ConnectionGraph({ artist, connections, allArtists }: {
  artist: Artist; connections: Connection[]; allArtists: OtherArtist[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (connections.length === 0) {
    return (
      <div className="border-4 border-dashed border-ink/20 p-12 text-center">
        <p className="font-display text-2xl text-ink/30 mb-2">No connections mapped yet</p>
        <p className="text-ink/40 text-sm">B2B pairs, label mates, and crew links will appear here once admin adds them.</p>
      </div>
    );
  }

  // Build node list: center + connected artists
  const connectedSlugs = connections.map(c => c.artist_a_slug === artist.slug ? c.artist_b_slug : c.artist_a_slug);
  const nodes = connectedSlugs
    .map(slug => allArtists.find(a => a.slug === slug))
    .filter(Boolean) as OtherArtist[];

  const W = 600; const H = 480;
  const CX = W / 2; const CY = H / 2;
  const RADIUS = 180;

  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Connection Graph</h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(CONNECTION_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-none" style={{ background: CONNECTION_COLORS[type] ?? "#666" }} />
            <span className="font-display text-[10px] uppercase text-ink/50">{label}</span>
          </div>
        ))}
      </div>

      <div className="border-4 border-ink bg-cream overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
          {/* Edges */}
          {connections.map((conn, i) => {
            const otherSlug = conn.artist_a_slug === artist.slug ? conn.artist_b_slug : conn.artist_a_slug;
            const nodeIdx   = nodes.findIndex(n => n.slug === otherSlug);
            if (nodeIdx < 0) return null;
            const angle = (2 * Math.PI * nodeIdx) / nodes.length - Math.PI / 2;
            const nx = CX + RADIUS * Math.cos(angle);
            const ny = CY + RADIUS * Math.sin(angle);
            const isHover = hovered === otherSlug;
            const col = CONNECTION_COLORS[conn.connection_type] ?? "#666";
            return (
              <g key={conn.id}>
                <line x1={CX} y1={CY} x2={nx} y2={ny}
                  stroke={col} strokeWidth={isHover ? conn.strength * 2 + 2 : conn.strength + 1}
                  strokeOpacity={isHover ? 1 : 0.5} strokeDasharray={conn.connection_type === "booker" ? "6 3" : undefined} />
                {/* Shared events count */}
                {conn.shared_events.length > 1 && (
                  <text x={(CX+nx)/2} y={(CY+ny)/2 - 6}
                    textAnchor="middle" fontSize="9" fill={col} opacity={0.8} className="font-display">
                    {conn.shared_events.length}×
                  </text>
                )}
              </g>
            );
          })}

          {/* Center node (the artist) */}
          <circle cx={CX} cy={CY} r={36} fill="#0D0D0D" stroke="#0D0D0D" strokeWidth={4} />
          {artist.photo_url ? (
            <image href={artist.photo_url} x={CX-32} y={CY-32} width={64} height={64}
              style={{ clipPath: "circle(50%)", objectFit: "cover" }} />
          ) : (
            <text x={CX} y={CY+5} textAnchor="middle" fontSize="18" fill="#F5E6D0" fontWeight="bold">
              {artist.name[0]}
            </text>
          )}
          <text x={CX} y={CY+54} textAnchor="middle" fontSize="9" fill="#0D0D0D" fontWeight="bold" className="font-display uppercase">
            {artist.name.slice(0, 14)}
          </text>

          {/* Connected nodes */}
          {nodes.map((node, i) => {
            const conn = connections.find(c =>
              (c.artist_a_slug === artist.slug && c.artist_b_slug === node.slug) ||
              (c.artist_b_slug === artist.slug && c.artist_a_slug === node.slug)
            );
            const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
            const nx = CX + RADIUS * Math.cos(angle);
            const ny = CY + RADIUS * Math.sin(angle);
            const isHover = hovered === node.slug;
            const col = conn ? CONNECTION_COLORS[conn.connection_type] ?? "#666" : "#666";
            const label = CONNECTION_LABELS[conn?.connection_type ?? ""] ?? "";

            return (
              <a key={node.slug} href={`/artists/${node.slug}`}
                onMouseEnter={() => setHovered(node.slug)} onMouseLeave={() => setHovered(null)}>
                <circle cx={nx} cy={ny} r={isHover ? 28 : 24} fill={col} stroke="#0D0D0D" strokeWidth={3}
                  style={{ transition: "r 0.15s" }} />
                {node.photo_url ? (
                  <image href={node.photo_url} x={nx-20} y={ny-20} width={40} height={40}
                    style={{ clipPath: "circle(50%)", opacity: 0.9 }} />
                ) : (
                  <text x={nx} y={ny+5} textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
                    {node.name[0]}
                  </text>
                )}
                <text x={nx} y={ny + (isHover ? 42 : 38)} textAnchor="middle" fontSize="8" fill="#0D0D0D" fontWeight="bold">
                  {node.name.slice(0, 12)}
                </text>
                {label && (
                  <text x={nx} y={ny + (isHover ? 52 : 48)} textAnchor="middle" fontSize="7" fill={col}>
                    {label}
                  </text>
                )}
                {isHover && conn?.shared_events.length ? (
                  <text x={nx} y={ny + 62} textAnchor="middle" fontSize="7" fill="#666">
                    {conn.shared_events.slice(0, 2).join(", ")}
                  </text>
                ) : null}
              </a>
            );
          })}
        </svg>
      </div>

      {/* Connection list */}
      <div className="mt-4 space-y-2">
        {connections.map(conn => {
          const otherSlug = conn.artist_a_slug === artist.slug ? conn.artist_b_slug : conn.artist_a_slug;
          const other = allArtists.find(a => a.slug === otherSlug);
          const col = CONNECTION_COLORS[conn.connection_type] ?? "#666";
          return (
            <div key={conn.id} className="flex items-center gap-3 border-2 border-ink/10 p-3 hover:border-ink/30 transition-colors">
              <div className="w-2 h-8 shrink-0" style={{ background: col }} />
              <div className="flex-1">
                <a href={`/artists/${otherSlug}`} className="font-display text-sm text-ink uppercase hover:text-magenta">{other?.name ?? otherSlug}</a>
                <p className="text-xs text-ink/40 mt-0.5">
                  {CONNECTION_LABELS[conn.connection_type] ?? conn.connection_type}
                  {conn.shared_events.length > 0 && ` · ${conn.shared_events.length} shared events`}
                  {conn.notes && ` · ${conn.notes}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex gap-0.5">
                  {[...Array(Math.min(conn.strength, 5))].map((_,i) => <div key={i} className="w-2 h-2" style={{ background: col }} />)}
                </div>
                <p className="text-[9px] text-ink/30 mt-1">strength {conn.strength}/10</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Venue Affinity ──────────────────────────────────────────────────────────── */
function VenueAffinity({ appearances, artist }: { appearances: Appearance[]; artist: Artist }) {
  const venueData = getVenueAffinity([
    ...appearances,
    ...artist.festivals.map(f => ({ id:"", artist_slug:artist.slug, event_name:f, venue:f, city:null, event_date:null, year:null, role:"performer", source:"manual" }))
  ]);
  const max = venueData[0]?.count ?? 1;

  if (venueData.length === 0) {
    return <p className="text-ink/40 text-sm">No venue data yet.</p>;
  }
  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Venue Affinity</h2>
      <p className="text-xs text-ink/40 mb-4">Rooms they play most often</p>
      <div className="space-y-3">
        {venueData.map(({ venue, city, count }) => (
          <div key={venue} className="flex items-center gap-3">
            <div className="w-32 shrink-0">
              <p className="font-display text-xs text-ink uppercase truncate">{venue}</p>
              {city && <p className="text-[10px] text-ink/40">{city}</p>}
            </div>
            <div className="flex-1 bg-ink/5 h-6 relative overflow-hidden border-2 border-ink/10">
              <div className="h-full bg-magenta transition-all duration-500" style={{ width: `${(count/max)*100}%` }} />
            </div>
            <span className="font-display text-sm text-ink w-6 text-right shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Appearance Timeline ─────────────────────────────────────────────────────── */
function AppearanceTimeline({ appearances, dates }: { appearances: Appearance[]; dates: ArtistDate[] }) {
  const allEvents = [
    ...appearances.map(ap => ({
      id: ap.id, date: ap.event_date ?? "", year: ap.year ?? (ap.event_date?.slice(0,4) ? parseInt(ap.event_date.slice(0,4)) : null),
      name: ap.event_name, venue: ap.venue, city: ap.city, role: ap.role, status: "done" as const, ticketUrl: null,
    })),
    ...dates.map(d => ({
      id: d.id, date: d.event_date, year: parseInt(d.event_date.slice(0,4)),
      name: null, venue: d.venue, city: d.city, role: "performer", status: d.status, ticketUrl: d.ticket_url,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (allEvents.length === 0) {
    return (
      <div className="border-4 border-dashed border-ink/20 p-12 text-center">
        <p className="font-display text-2xl text-ink/30">No appearances on record yet</p>
      </div>
    );
  }

  const byYear: Record<number, typeof allEvents> = {};
  for (const ev of allEvents) {
    const yr = ev.year ?? 0;
    (byYear[yr] = byYear[yr] ?? []).push(ev);
  }
  const years = Object.keys(byYear).map(Number).sort((a,b) => b-a);

  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-6">
        Full Appearance History ({allEvents.length} shows)
      </h2>
      <div className="relative">
        <div className="absolute left-[72px] top-0 bottom-0 w-0.5 bg-ink/10" />
        <div className="space-y-8">
          {years.map(yr => (
            <div key={yr} className="flex gap-4">
              <div className="w-[68px] shrink-0 text-right pt-1">
                <span className="font-display text-sm font-bold text-ink/60 uppercase">{yr || "?"}</span>
                <p className="font-display text-[10px] text-ink/30">{byYear[yr].length} shows</p>
              </div>
              <div className="relative pl-6 flex-1 space-y-2">
                <div className="absolute left-0 top-2 w-4 h-4 bg-magenta border-2 border-ink -translate-x-[8px]" />
                {byYear[yr].map(ev => {
                  const dt = ev.date ? new Date(ev.date + "T00:00:00") : null;
                  const isPast = dt ? dt < new Date() : true;
                  return (
                    <div key={ev.id} className={`flex items-start gap-3 p-3 border-2 ${isPast ? "border-ink/10" : "border-magenta/40 bg-magenta/5"}`}>
                      {dt && (
                        <div className="text-center min-w-[36px] shrink-0">
                          <p className="font-display text-base text-ink leading-none">{dt.getDate()}</p>
                          <p className="font-display text-[9px] text-ink/40 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {ev.name && <p className="font-display text-sm text-ink uppercase truncate">{ev.name}</p>}
                        <p className="text-xs text-ink/60">{ev.city}{ev.venue ? ` · ${ev.venue}` : ""}</p>
                        <div className="flex gap-2 mt-1">
                          {ev.role !== "performer" && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-magenta/40 text-magenta">{ev.role}</span>
                          )}
                          {ev.status !== "done" && (
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border ${ev.status==="confirmed"?"bg-acid-yellow text-ink border-acid-yellow":"border-ink/20 text-ink/40"}`}>{ev.status}</span>
                          )}
                        </div>
                      </div>
                      {ev.ticketUrl && (
                        <a href={ev.ticketUrl.startsWith("http")?ev.ticketUrl:`https://${ev.ticketUrl}`} target="_blank" rel="noreferrer"
                          className="font-display text-[9px] uppercase bg-magenta text-cream px-2 py-1 border border-ink shrink-0 hover:bg-ink">
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

/* ── Stage Credits with tier highlighting ────────────────────────────────────── */
function StageCredits({ festivals }: { festivals: string[] }) {
  if (!festivals.length) return null;
  const big = (f: string) => INTERNATIONAL_FESTS.some(x => f.toLowerCase().includes(x)) || NATIONAL_FESTS.some(x => f.toLowerCase().includes(x));
  const sorted = [...festivals].sort((a,b) => (big(b)?1:0)-(big(a)?1:0));
  return (
    <div>
      <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Stage Credits ({festivals.length})</h2>
      <div className="flex flex-wrap gap-2">
        {sorted.map(f => (
          <span key={f} className={`font-display text-xs px-3 py-1.5 border-4 border-ink chunk-shadow ${big(f) ? "bg-acid-yellow text-ink" : "bg-cream text-ink"}`}>
            {big(f) && "★ "}{f}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Scene Rank Badge ────────────────────────────────────────────────────────── */
function SceneRankBadge({ rank }: { rank: ReturnType<typeof getSceneRank> }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 border-4 border-ink ${rank.color}`}>
      <span className="font-display text-lg leading-none">T{rank.tier}</span>
      <div>
        <p className="font-display text-xs uppercase leading-none">{rank.label}</p>
        <p className="text-[9px] opacity-60 mt-0.5">{rank.reason}</p>
      </div>
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
      await fetch("/api/event-rsvp", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ event_slug:`booking-${artist.slug}`, name:email.split("@")[0], email, plus_ones:0 }) });
      setSent(true); toast.success("Enquiry sent!");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="border-4 border-ink bg-cream">
      {fee && (
        <div className="bg-magenta text-cream border-b-4 border-ink p-4">
          <p className="font-display text-xs uppercase opacity-70 mb-1">Estimated Fee</p>
          {isRevealed ? <p className="font-display text-3xl">{fee}</p> : <p className="font-display text-3xl blur-sm select-none">₹XXk–YYL</p>}
          <p className="text-xs opacity-60 mt-1">Indicative — confirm per booking</p>
        </div>
      )}
      <div className="p-5 space-y-4">
        <h3 className="font-display text-lg uppercase text-ink">Book {artist.name}</h3>
        {!artist.open_to_bookings && <p className="text-xs bg-ink/5 border-2 border-ink/20 p-3 text-ink/60">Not actively taking bookings — enquiries still welcome.</p>}
        {!isRevealed && (
          <>
            <p className="text-sm text-ink/70">Sign in or enter your email to reveal booking contact and fee.</p>
            <button onClick={() => openSignIn()} className="w-full bg-ink text-cream font-display text-sm uppercase px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">Sign In to Reveal</button>
            <div className="relative flex items-center gap-2 text-ink/30 text-xs font-display uppercase"><div className="flex-1 h-px bg-ink/20" /><span>or</span><div className="flex-1 h-px bg-ink/20" /></div>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Your Email</span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none" />
            </label>
            <button onClick={() => { if(email.includes("@")) setVerified(true); else toast.error("Enter a valid email"); }} className="w-full bg-acid-yellow text-ink font-display text-sm uppercase px-4 py-3 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">Continue as Guest →</button>
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
            {!artist.booking_email && !artist.manager_email && <p className="text-sm text-ink/60 bg-ink/5 border-2 border-ink/20 p-3">No direct contact — CCD will forward your enquiry.</p>}
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Booking Enquiry</span>
              <textarea value={enquiry} onChange={e=>setEnquiry(e.target.value)} rows={3} placeholder="Date, city, event type, budget…" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none resize-none" />
            </label>
            {!user && (
              <label className="block">
                <span className="font-display text-xs uppercase text-ink block mb-1">Your Email</span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none" />
              </label>
            )}
            <button onClick={sendEnquiry} disabled={busy} className="w-full bg-magenta text-cream font-display text-sm uppercase px-4 py-3 border-4 border-ink disabled:opacity-60 hover:bg-ink transition-colors">{busy ? "Sending…" : "Send Booking Enquiry"}</button>
          </>
        )}
        {sent && <div className="text-center py-4"><p className="font-display text-2xl text-ink mb-1">✓ Sent</p><p className="text-ink/60 text-sm">We'll be in touch.</p></div>}
      </div>
    </div>
  );
}

/* ── EPK Sidebar Panel ──────────────────────────────────────────────────────── */
function EPKPanel({ artist, dates }: { artist: Artist; dates: ArtistDate[] }) {
  const [open, setOpen] = useState(false);
  const city = cityOf(artist); const ig = igUrl(artist.instagram); const sc = ensUrl(artist.soundcloud);
  return (
    <div className="border-4 border-ink bg-cream mt-4">
      <button onClick={() => setOpen(v=>!v)} className="w-full flex items-center justify-between p-4 font-display text-sm uppercase text-ink hover:bg-acid-yellow transition-colors">
        <span>📄 Press Kit / EPK</span><span>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div className="border-t-4 border-ink p-5 space-y-3">
          {[
            { label:"Artist", val: artist.name },
            { label:"Based In", val: city || "India" },
            { label:"Genre(s)", val: artist.genres.join(", ") },
            { label:"Label(s)", val: artist.labels ?? null },
            { label:"Notable Stages", val: artist.festivals.slice(0,6).join(" · ") || null },
          ].filter(f => f.val).map(f => (
            <div key={f.label} className="bg-ink/5 border-2 border-ink/10 p-2">
              <p className="font-display text-[9px] uppercase text-ink/40 mb-0.5">{f.label}</p>
              <p className="font-display text-sm text-ink">{f.val}</p>
            </div>
          ))}
          {artist.bio && (
            <div className="bg-ink/5 border-2 border-ink/10 p-2">
              <p className="font-display text-[9px] uppercase text-ink/40 mb-1">Bio</p>
              <p className="text-xs text-ink/80 line-clamp-4">{artist.bio}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex-1 font-display text-xs uppercase bg-ink text-cream px-3 py-2 border-2 border-ink hover:bg-magenta transition-colors">🖨 Print</button>
            <button onClick={() => {
              const text = `${artist.name} — ${artist.genres.join(", ")} — ${city}\n\n${artist.bio??""}\n\nStages: ${artist.festivals.slice(0,5).join(", ")}\nIG: ${ig??""}\nSC: ${sc??""}\nBooking: ${artist.booking_email??"via CCD"}`;
              navigator.clipboard.writeText(text).then(()=>toast.success("Copied!")).catch(()=>toast.error("Failed"));
            }} className="flex-1 font-display text-xs uppercase bg-cream text-ink px-3 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">📋 Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
const ArtistDetail = () => {
  const router = useRouter();
  const slug = router.query.slug as string | undefined;
  const [a, setA] = useState<Artist | null>(null);
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allArtists, setAllArtists] = useState<OtherArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview"|"journey"|"network"|"venues"|"epk">("overview");

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setNotFound(false);
    (async () => {
      const res = await fetch(`/api/artists/${encodeURIComponent(slug)}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const raw = await res.json();
      const norm: Artist = {
        ...raw,
        gallery: Array.isArray(raw.gallery)?raw.gallery:[],
        videos: Array.isArray(raw.videos)?raw.videos:[],
        genres: Array.isArray(raw.genres)?raw.genres:[],
        festivals: Array.isArray(raw.festivals)?raw.festivals:[],
        available_cities: Array.isArray(raw.available_cities)?raw.available_cities:[],
        open_to_bookings: raw.open_to_bookings!==false,
        fee_currency: raw.fee_currency||"INR",
        featured: raw.featured??false,
      };
      setA(norm);

      // Parallel data fetching
      const [dr, ar, appr, conns] = await Promise.all([
        fetch(`/api/artist-dates?artist_id=${raw.id}`).then(r=>r.ok?r.json():[]),
        fetch(`/api/artists`).then(r=>r.ok?r.json():[]),
        fetch(`/api/event-appearances?artist_slug=${slug}`).then(r=>r.ok?r.json():[]).catch(()=>[]),
        fetch(`/api/artist-connections?slug=${slug}`).then(r=>r.ok?r.json():[]).catch(()=>[]),
      ]);
      setDates(Array.isArray(dr)?dr:[]);
      setAllArtists(Array.isArray(ar)?ar:[]);
      setAppearances(Array.isArray(appr)?appr:[]);
      setConnections(Array.isArray(conns)?conns:[]);
      setLoading(false);
    })();
  }, [slug]);

  const rank = useMemo(() => a ? getSceneRank(a, appearances) : null, [a, appearances]);
  const venueData = useMemo(() => getVenueAffinity(appearances), [appearances]);
  const related = useMemo(() => allArtists.filter(x=>x.slug!==slug).sort(()=>Math.random()-0.5).slice(0,4), [allArtists, slug]);
  const connectedSlugs = useMemo(() => new Set(connections.map(c => c.artist_a_slug===slug?c.artist_b_slug:c.artist_a_slug)), [connections, slug]);

  if (loading) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="flex items-center justify-center min-h-[80vh] pt-20"><div className="space-y-4 text-center">
        <div className="w-24 h-24 bg-ink/5 border-4 border-ink/10 mx-auto animate-pulse" />
        <div className="h-6 w-48 bg-ink/10 mx-auto animate-pulse" />
      </div></div>
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
  const sc = ensUrl(a.soundcloud); const ig = igUrl(a.instagram);
  const ytVideos = a.videos.filter(v=>v.youtube_id);
  const upcoming = dates.filter(d=>new Date(d.event_date+"T00:00:00")>=new Date()).sort((x,y)=>x.event_date.localeCompare(y.event_date));
  const coverImg = a.photo_url||(ytVideos[0]?`https://img.youtube.com/vi/${ytVideos[0].youtube_id}/maxresdefault.jpg`:null)||(a.gallery[0]?.url??null);

  const statsItems = [
    a.festivals.length>0 && { n:a.festivals.length, label:"Stage credits" },
    dates.filter(d=>new Date(d.event_date)<new Date()).length>0 && { n:dates.filter(d=>new Date(d.event_date)<new Date()).length, label:"Shows played" },
    appearances.length>0 && { n:appearances.length, label:"Recorded shows" },
    [...new Set(dates.map(d=>d.city).filter(Boolean))].length>1 && { n:[...new Set(dates.map(d=>d.city).filter(Boolean))].length, label:"Cities" },
    connections.length>0 && { n:connections.length, label:"Connections" },
    ytVideos.length>0 && { n:ytVideos.length, label:"Videos" },
  ].filter(Boolean) as { n:number; label:string }[];

  const TABS = [
    { key:"overview", label:"Overview"                                                     },
    { key:"journey",  label:`Journey${dates.length+appearances.length>0?` (${dates.length+appearances.length})`:""}`  },
    { key:"network",  label:`Network${connections.length>0?` (${connections.length})`:""}`},
    { key:"venues",   label:`Venues${venueData.length>0?` (${venueData.length})`:""}`     },
    { key:"epk",      label:"EPK"                                                          },
  ] as const;

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`${a.name} — ${a.genres[0]??"Electronic"} · ${city||"India"} | Cats Can Dance`}
        description={a.bio?.slice(0,155)??`${a.name} — Book via Cats Can Dance.`}
        path={`/artists/${a.slug}`}
        jsonLd={{"@context":"https://schema.org","@type":"MusicGroup",name:a.name,genre:a.genres.join(", "),description:a.bio?.slice(0,155),image:coverImg??undefined}}
      />
      <Nav />

      <div className="pt-[60px] md:pt-[72px]">
        {/* Hero */}
        <div className="relative w-full h-[45vh] md:h-[60vh] overflow-hidden border-b-4 border-ink">
          {coverImg ? <img src={coverImg} alt={a.name} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{background:nameBg(a.name)}} />}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/90" />
          {a.featured && <div className="absolute top-0 right-0 bg-acid-yellow text-ink font-display text-xs px-4 py-2 border-b-4 border-l-4 border-ink uppercase">⭐ CCD Featured</div>}
          <div className="absolute bottom-0 inset-x-0 p-6 md:p-10">
            <a href="/artists" className="font-display text-xs uppercase text-cream/40 hover:text-cream mb-3 inline-block">← All artists</a>
            <div className="flex flex-wrap items-end gap-3 mb-3">
              {a.genres.map(g=><span key={g} className="font-display text-[10px] uppercase bg-acid-yellow text-ink px-2 py-1 border-2 border-ink">{g}</span>)}
              {city && <span className="font-display text-[10px] uppercase bg-cream/10 border border-cream/30 text-cream px-2 py-1">📍 {city}</span>}
              {rank && <SceneRankBadge rank={rank} />}
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl text-cream uppercase leading-none" style={{textShadow:"4px 4px 0 rgba(0,0,0,0.4)"}}>{a.name}</h1>
            {a.members && <p className="text-cream/50 text-sm mt-2">{a.members}</p>}
          </div>
        </div>

        {/* Meta strip */}
        <div className="bg-ink text-cream border-b-4 border-cream/10">
          <div className="container py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap text-cream/40 font-display text-xs">
              {a.labels && <span className="border border-cream/20 px-2 py-1">{a.labels}</span>}
              {connections.length>0 && <span>{connections.length} connections</span>}
              {a.festivals.length>0 && <span>· {a.festivals.length} stage credits</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {ig && <a href={ig} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 border-2 border-cream/30 text-cream hover:border-cream">Instagram ↗</a>}
              {sc && <a href={sc} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 bg-[#ff5500] text-cream border-2 border-[#ff5500] hover:opacity-80">SoundCloud ↗</a>}
              {ensUrl(a.spotify) && <a href={ensUrl(a.spotify)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 bg-[#1db954] text-cream border-2 border-[#1db954]">Spotify ↗</a>}
              {ensUrl(a.bandcamp) && <a href={ensUrl(a.bandcamp)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 bg-[#1da0c3] text-cream border-2 border-[#1da0c3]">Bandcamp ↗</a>}
              {ensUrl(a.website) && <a href={ensUrl(a.website)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 border-2 border-cream/30 text-cream">Website ↗</a>}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {statsItems.length > 0 && (
          <div className="container mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-ink border-4 border-ink mb-8">
              {statsItems.slice(0,6).map(({n,label})=>(
                <div key={label} className="bg-cream p-4 text-center">
                  <p className="font-display text-3xl text-ink">{n}</p>
                  <p className="font-display text-[10px] uppercase text-ink/50 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab nav */}
        <div className="border-b-4 border-ink bg-cream sticky top-[60px] md:top-[72px] z-20">
          <div className="container">
            <div className="flex overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`font-display text-xs uppercase px-5 py-4 border-r-4 border-ink whitespace-nowrap transition-colors ${activeTab===tab.key ? "bg-ink text-cream" : "text-ink/50 hover:text-ink hover:bg-acid-yellow/30"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="container py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {activeTab === "overview" && (
              <>
                {a.why && <div className="bg-acid-yellow border-4 border-ink p-6"><p className="font-display text-xs uppercase text-ink/60 mb-2">Why book them</p><p className="font-display text-2xl text-ink leading-tight">{a.why}</p></div>}
                {a.bio && <div><h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Bio</h2><p className="text-ink/90 leading-relaxed whitespace-pre-line">{a.bio}</p></div>}
                {sc && <div><h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Listen</h2><iframe className="w-full border-4 border-ink" height="200" scrolling="no" frameBorder="no" allow="autoplay" src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(sc)}&color=%23E91E8C&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`} title={`${a.name} on SoundCloud`} /></div>}
                {ytVideos.length>0 && <div><h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Videos ({ytVideos.length})</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{ytVideos.map(v=><div key={v.youtube_id} className="border-4 border-ink bg-ink overflow-hidden"><div className="aspect-video"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${v.youtube_id}`} title={v.title??"Video"} allowFullScreen /></div>{v.title&&<p className="font-display text-xs text-cream p-2 truncate">{v.title}</p>}</div>)}</div></div>}
                {upcoming.length>0 && (
                  <div>
                    <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Upcoming Shows ({upcoming.length})</h2>
                    <div className="space-y-3">
                      {upcoming.map(d=>{
                        const dt=new Date(d.event_date+"T00:00:00");
                        return (
                          <div key={d.id} className="flex items-center gap-4 border-4 border-ink p-4 bg-cream hover:bg-acid-yellow/10 transition-colors">
                            <div className="text-center min-w-[52px]"><p className="font-display text-2xl text-ink leading-none">{dt.getDate()}</p><p className="font-display text-xs text-ink/50 uppercase">{dt.toLocaleString("en",{month:"short"})}</p><p className="font-display text-xs text-ink/30">{dt.getFullYear()}</p></div>
                            <div className="flex-1"><p className="font-display text-lg text-ink uppercase">{d.city}</p>{d.venue&&<p className="text-sm text-ink/60">{d.venue}</p>}<span className={`text-xs font-display uppercase px-2 py-0.5 border-2 border-ink mt-1 inline-block ${d.status==="confirmed"?"bg-acid-yellow text-ink":d.status==="tentative"?"bg-cream text-ink/50":"bg-ink text-cream"}`}>{d.status}</span></div>
                            {d.ticket_url&&<a href={d.ticket_url.startsWith("http")?d.ticket_url:`https://${d.ticket_url}`} target="_blank" rel="noreferrer" className="font-display text-xs uppercase bg-magenta text-cream px-3 py-2 border-2 border-ink shrink-0">Tickets →</a>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <StageCredits festivals={a.festivals} />
                {a.gallery.length>0 && (
                  <div><h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {a.gallery.map((g,i)=><figure key={i} className="border-4 border-ink overflow-hidden cursor-zoom-in" onClick={()=>setLightbox(g.url)}><img src={g.url} alt={g.caption??a.name} className="w-full h-40 object-cover hover:scale-105 transition-transform" />{g.caption&&<figcaption className="p-2 font-display text-xs text-ink/60">{g.caption}</figcaption>}</figure>)}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "journey" && <AppearanceTimeline appearances={appearances} dates={[...upcoming, ...dates.filter(d=>new Date(d.event_date)<new Date()).sort((x,y)=>y.event_date.localeCompare(x.event_date))]} />}
            {activeTab === "network" && <ConnectionGraph artist={a} connections={connections} allArtists={allArtists} />}
            {activeTab === "venues" && <VenueAffinity appearances={appearances} artist={a} />}

            {activeTab === "epk" && (
              <div className="space-y-4">
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2">Press Kit</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[{label:"Artist",val:a.name},{label:"Based In",val:city||"India"},{label:"Genre(s)",val:a.genres.join(", ")},{label:"Label(s)",val:a.labels??null}].filter(f=>f.val).map(f=>(
                    <div key={f.label} className="bg-ink/5 border-4 border-ink/10 p-4"><p className="font-display text-[10px] uppercase text-ink/40 mb-1">{f.label}</p><p className="font-display text-xl text-ink">{f.val}</p></div>
                  ))}
                </div>
                {a.bio && <div className="bg-ink/5 border-4 border-ink/10 p-4"><p className="font-display text-[10px] uppercase text-ink/40 mb-2">Bio</p><p className="text-ink/80 text-sm leading-relaxed">{a.bio}</p></div>}
                {a.festivals.length>0 && <div className="bg-ink/5 border-4 border-ink/10 p-4"><p className="font-display text-[10px] uppercase text-ink/40 mb-2">Stage Credits</p><p className="text-ink/80 text-sm">{a.festivals.join(", ")}</p></div>}
                <div className="bg-ink/5 border-4 border-ink/10 p-4"><p className="font-display text-[10px] uppercase text-ink/40 mb-2">Links</p><div className="space-y-1 text-sm text-ink/70">{ig&&<p>Instagram: <a href={ig} className="underline">{ig}</a></p>}{sc&&<p>SoundCloud: <a href={sc} className="underline">{sc}</a></p>}{ensUrl(a.spotify)&&<p>Spotify: <a href={ensUrl(a.spotify)!} className="underline">{ensUrl(a.spotify)}</a></p>}</div></div>
                {a.gallery.length>0 && <div><p className="font-display text-[10px] uppercase text-ink/40 mb-2">Press Photos</p><div className="grid grid-cols-3 gap-2">{a.gallery.slice(0,6).map((g,i)=><a key={i} href={g.url} target="_blank" rel="noreferrer" className="block border-4 border-ink overflow-hidden hover:opacity-80"><img src={g.url} alt={g.caption??a.name} className="w-full h-24 object-cover" /></a>)}</div></div>}
                <div className="flex gap-3">
                  <button onClick={()=>window.print()} className="flex-1 font-display text-sm uppercase bg-ink text-cream px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">🖨 Print / PDF</button>
                  <button onClick={()=>{ const text=`${a.name}\n${a.genres.join(", ")} — ${city}\n\n${a.bio??""}\n\nStages: ${a.festivals.join(", ")}\n\nIG: ${ig??""}\nSC: ${sc??""}\nBooking: ${a.booking_email??"via CCD"}\nProfile: ${typeof window!=="undefined"?window.location.href:""}`; navigator.clipboard.writeText(text).then(()=>toast.success("Copied!")).catch(()=>toast.error("Failed")); }} className="flex-1 font-display text-sm uppercase bg-cream text-ink px-4 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors">📋 Copy EPK</button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-[140px]">
              <ContactGate artist={a} />
              <EPKPanel artist={a} dates={dates} />
              {!a.claimed_by && (
                <div className="border-4 border-ink bg-ink text-cream p-4 mt-4">
                  <p className="font-display text-sm uppercase mb-2">Are you {a.name}?</p>
                  <a href={`/sign-in?redirect_url=/artist/dashboard?claim=${a.id}`} className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-2 border-2 border-cream inline-block hover:bg-cream transition-colors">Claim this profile →</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length>0 && (
          <section className="border-t-4 border-ink bg-ink text-cream py-12">
            <div className="container">
              <h2 className="font-display text-2xl uppercase text-cream mb-6">More From The Scene</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(r=>(
                  <a key={r.id} href={`/artists/${r.slug}`} className="block border-4 border-cream/20 hover:border-cream transition-colors overflow-hidden group">
                    {r.photo_url ? <img src={r.photo_url} alt={r.name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-32 flex items-center justify-center font-display text-4xl text-cream/20" style={{background:nameBg(r.name)}}>{r.name[0]}</div>}
                    <div className="p-3"><p className="font-display text-cream uppercase text-sm">{r.name}</p><p className="text-cream/40 text-xs mt-0.5">{r.based_city||""}</p></div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {lightbox && <div className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={()=>setLightbox(null)}><img src={lightbox} alt="Gallery" className="max-w-full max-h-full object-contain border-4 border-cream" /></div>}
      <Footer />
    </div>
  );
};

export default ArtistDetail;
