/**
 * ArtistDetail v4 — Social Magazine Layout
 *
 * No tabs. One continuous scroll like a proper artist page.
 * Sections: Hero → Bio strip → Stats ribbon → Music → Live →
 *           Network graph → Stage credits marquee → Videos → Gallery → EPK
 *
 * Privilege-aware:
 *   - Anyone: view full profile
 *   - Logged-in artist (their profile): edit bio/links inline, download EPK
 *   - Admin: see claimed_by, role info
 *
 * Emerging highlight: replaces tier system with a single "Emerging" badge
 */
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { useUser, useClerk } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

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
  claimed_by: string | null; featured: boolean; created_at?: string;
};
type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
};
type Appearance = {
  id: string; artist_slug: string; event_name: string; venue: string | null;
  city: string | null; event_date: string | null; year: number | null; role: string;
};
type Connection = {
  id: string; artist_a_slug: string; artist_b_slug: string;
  connection_type: string; strength: number; shared_events: string[]; notes: string | null;
};
type OtherArtist = {
  id: string; slug: string; name: string; based_city: string | null;
  genres: string[]; photo_url: string | null; festivals: string[];
};

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

const isEmerging = (a: Artist, appearances: Appearance[]) => a.festivals.length <= 1 && appearances.length <= 2;

const CONN_COLORS: Record<string, string> = {
  b2b:"#E91E8C", label:"#0066FF", crew:"#FF6B00", booker:"#22c55e", collab:"#a855f7"
};
const CONN_LABELS: Record<string, string> = {
  b2b:"B2B", label:"Same Label", crew:"Crew", booker:"Booked By", collab:"Collab"
};

/* ── Connection Graph SVG ────────────────────────────────────────────────────── */
function ConnectionGraph({ artist, connections, allArtists }: {
  artist: Artist; connections: Connection[]; allArtists: OtherArtist[];
}) {
  const [hovered, setHovered] = useState<string|null>(null);
  if (!connections.length) return null;

  const connectedSlugs = connections.map(c => c.artist_a_slug === artist.slug ? c.artist_b_slug : c.artist_a_slug);
  const nodes = connectedSlugs.map(s => allArtists.find(a => a.slug === s)).filter(Boolean) as OtherArtist[];

  const W=560; const H=420; const CX=W/2; const CY=H/2; const R=155;

  return (
    <div className="bg-ink border-4 border-ink overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-5 pt-4 pb-2">
        {Object.entries(CONN_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5" style={{background:CONN_COLORS[type]}} />
            <span className="font-display text-[9px] uppercase text-cream/40">{label}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{maxHeight:420}}>
        {connections.map((conn) => {
          const otherSlug = conn.artist_a_slug===artist.slug ? conn.artist_b_slug : conn.artist_a_slug;
          const ni = nodes.findIndex(n=>n.slug===otherSlug);
          if(ni<0) return null;
          const angle=(2*Math.PI*ni)/nodes.length - Math.PI/2;
          const nx=CX+R*Math.cos(angle); const ny=CY+R*Math.sin(angle);
          const col=CONN_COLORS[conn.connection_type]??"#666";
          const isH=hovered===otherSlug;
          return (
            <g key={conn.id}>
              <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={col}
                strokeWidth={isH?conn.strength*1.8+1:conn.strength*0.9+0.5}
                strokeOpacity={isH?1:0.45}
                strokeDasharray={conn.connection_type==="booker"?"5 3":undefined} />
              {conn.shared_events.length>1&&<text x={(CX+nx)/2} y={(CY+ny)/2-5} textAnchor="middle" fontSize="8" fill={col} opacity={0.7}>{conn.shared_events.length}×</text>}
            </g>
          );
        })}
        {/* Center */}
        <circle cx={CX} cy={CY} r={32} fill={nameBg(artist.name)} stroke="#F5E6D0" strokeWidth={3}/>
        {artist.photo_url
          ? <image href={artist.photo_url} x={CX-28} y={CY-28} width={56} height={56} clipPathUnits="userSpaceOnUse" style={{clipPath:"circle(50%)"}}/>
          : <text x={CX} y={CY+6} textAnchor="middle" fontSize="18" fill="#F5E6D0" fontWeight="bold">{artist.name[0]}</text>}
        <text x={CX} y={CY+48} textAnchor="middle" fontSize="8" fill="#F5E6D0" fontWeight="bold">{artist.name.slice(0,12).toUpperCase()}</text>

        {/* Nodes */}
        {nodes.map((node,i)=>{
          const conn=connections.find(c=>(c.artist_a_slug===artist.slug&&c.artist_b_slug===node.slug)||(c.artist_b_slug===artist.slug&&c.artist_a_slug===node.slug));
          const angle=(2*Math.PI*i)/nodes.length-Math.PI/2;
          const nx=CX+R*Math.cos(angle); const ny=CY+R*Math.sin(angle);
          const col=conn?CONN_COLORS[conn.connection_type]??"#666":"#666";
          const isH=hovered===node.slug;
          return (
            <a key={node.slug} href={`/artists/${node.slug}`}
              onMouseEnter={()=>setHovered(node.slug)} onMouseLeave={()=>setHovered(null)}>
              <circle cx={nx} cy={ny} r={isH?24:20} fill={col} stroke="#F5E6D0" strokeWidth={isH?3:2}
                style={{transition:"r 0.12s"}}/>
              {node.photo_url
                ? <image href={node.photo_url} x={nx-16} y={ny-16} width={32} height={32} style={{clipPath:"circle(50%)"}}/>
                : <text x={nx} y={ny+5} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">{node.name[0]}</text>}
              <text x={nx} y={ny+(isH?38:34)} textAnchor="middle" fontSize="7" fill="#F5E6D0">{node.name.slice(0,11)}</text>
              {isH&&conn&&<text x={nx} y={ny+46} textAnchor="middle" fontSize="6.5" fill={col}>{CONN_LABELS[conn.connection_type]}</text>}
            </a>
          );
        })}
      </svg>
      {/* List view below graph */}
      <div className="border-t-2 border-cream/10 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {connections.map(conn=>{
          const otherSlug=conn.artist_a_slug===artist.slug?conn.artist_b_slug:conn.artist_a_slug;
          const other=allArtists.find(a=>a.slug===otherSlug);
          const col=CONN_COLORS[conn.connection_type]??"#666";
          return (
            <a key={conn.id} href={`/artists/${otherSlug}`}
              className="flex items-center gap-3 p-2 hover:bg-cream/5 transition-colors">
              <div className="w-1 h-8 shrink-0" style={{background:col}}/>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs text-cream uppercase truncate">{other?.name??otherSlug}</p>
                <p className="text-[10px] text-cream/40">
                  {CONN_LABELS[conn.connection_type]}
                  {conn.shared_events.length>0&&` · ${conn.shared_events.slice(0,2).join(", ")}`}
                </p>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[...Array(Math.min(conn.strength,5))].map((_,i)=><div key={i} className="w-1.5 h-1.5" style={{background:col}}/>)}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ── Venue affinity bar ──────────────────────────────────────────────────────── */
function VenueAffinity({ appearances, festivals }: { appearances: Appearance[]; festivals: string[] }) {
  const counts: Record<string, { city: string|null; n: number }> = {};
  for (const ap of appearances) {
    if (!ap.venue) continue;
    if (!counts[ap.venue]) counts[ap.venue] = { city: ap.city, n: 0 };
    counts[ap.venue].n++;
  }
  for (const f of festivals) { if (!counts[f]) counts[f] = { city: null, n: 1 }; else counts[f].n++; }
  const sorted = Object.entries(counts).sort(([,a],[,b]) => b.n - a.n).slice(0,7);
  if (!sorted.length) return null;
  const max = sorted[0][1].n;
  return (
    <div>
      <p className="font-display text-xs uppercase text-ink/40 mb-4">Venue Affinity</p>
      <div className="space-y-2.5">
        {sorted.map(([venue, {city, n}]) => (
          <div key={venue} className="flex items-center gap-3">
            <div className="w-28 shrink-0">
              <p className="font-display text-xs text-ink uppercase truncate leading-none">{venue}</p>
              {city && <p className="text-[9px] text-ink/40 mt-0.5">{city}</p>}
            </div>
            <div className="flex-1 bg-ink/8 h-4 relative overflow-hidden border border-ink/10">
              <div className="h-full bg-magenta transition-all" style={{width:`${(n/max)*100}%`}}/>
            </div>
            <span className="font-display text-xs text-ink w-4 text-right shrink-0">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── EPK Panel ─────────────────────────────────────────────────────────────── */
function EPKCard({ artist, dates, appearances, isOwnProfile, onEdit }: {
  artist: Artist; dates: ArtistDate[]; appearances: Appearance[];
  isOwnProfile: boolean; onEdit?: () => void;
}) {
  const city = cityOf(artist);
  const ig = igUrl(artist.instagram); const sc = ensUrl(artist.soundcloud);
  const upcoming = dates.filter(d => new Date(d.event_date) >= new Date()).slice(0,4);
  const fee = fmtFee(artist);

  const copyEPK = () => {
    const text = [
      `${artist.name}`,
      `${artist.genres.join(" · ")} | ${city || "India"}`,
      "",
      artist.bio ?? "",
      "",
      artist.festivals.length ? `Stage Credits: ${artist.festivals.join(", ")}` : "",
      artist.labels ? `Label: ${artist.labels}` : "",
      "",
      ig ? `Instagram: ${ig}` : "",
      sc ? `SoundCloud: ${sc}` : "",
      ensUrl(artist.spotify) ? `Spotify: ${ensUrl(artist.spotify)}` : "",
      artist.booking_email ? `Booking: ${artist.booking_email}` : "Booking: via Cats Can Dance",
      "",
      `CCD Profile: ${typeof window !== "undefined" ? window.location.href : ""}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => toast.success("EPK text copied!")).catch(() => toast.error("Copy failed"));
  };

  return (
    <div id="epk" className="bg-ink text-cream border-4 border-ink">
      {/* Header */}
      <div className="bg-acid-yellow text-ink border-b-4 border-ink p-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase opacity-60 mb-1">Press Kit / EPK</p>
          <h3 className="font-display text-4xl uppercase leading-none">{artist.name}</h3>
          <p className="font-display text-base mt-1 opacity-70">{artist.genres.join(" · ")} · {city || "India"}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {isOwnProfile && onEdit && (
            <button onClick={onEdit}
              className="font-display text-[10px] uppercase bg-ink text-cream px-3 py-1.5 border-2 border-ink hover:bg-magenta transition-colors">
              ✏ Edit Profile
            </button>
          )}
          <p className="font-display text-[9px] uppercase opacity-40 text-right">Generated by<br/>CCD.SCHOOL</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0 divide-y-4 md:divide-y-0 md:divide-x-4 divide-cream/10">
        {/* Left */}
        <div className="p-6 space-y-5">
          {artist.bio && (
            <div>
              <p className="font-display text-[9px] uppercase text-cream/40 mb-2">Bio</p>
              <p className="text-cream/80 text-sm leading-relaxed">{artist.bio}</p>
            </div>
          )}
          {artist.why && (
            <div className="bg-cream/5 border border-cream/10 p-4">
              <p className="font-display text-[9px] uppercase text-cream/40 mb-1">Why Book</p>
              <p className="font-display text-base text-cream leading-tight">"{artist.why}"</p>
            </div>
          )}
          {artist.festivals.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase text-cream/40 mb-2">Stage Credits</p>
              <div className="flex flex-wrap gap-1.5">
                {artist.festivals.map(f => (
                  <span key={f} className="font-display text-[9px] uppercase bg-cream/10 text-cream px-2 py-1 border border-cream/20">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="p-6 space-y-5">
          {/* Key facts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:"City", val: city || "India"},
              {label:"Genres", val: artist.genres.slice(0,2).join(", ")},
              {label:"Label", val: artist.labels ?? "Independent"},
              {label:"Booking", val: artist.open_to_bookings ? "Open" : "By Enquiry"},
            ].map(({label, val}) => val && (
              <div key={label} className="bg-cream/5 border border-cream/10 p-3">
                <p className="font-display text-[9px] uppercase text-cream/40 mb-0.5">{label}</p>
                <p className="font-display text-sm text-cream leading-tight">{val}</p>
              </div>
            ))}
            {fee && (
              <div className="col-span-2 bg-magenta/20 border border-magenta/40 p-3">
                <p className="font-display text-[9px] uppercase text-cream/40 mb-0.5">Indicative Fee</p>
                <p className="font-display text-2xl text-cream">{fee}</p>
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <p className="font-display text-[9px] uppercase text-cream/40 mb-2">Links</p>
            <div className="space-y-1.5">
              {ig && <div className="flex items-center gap-2"><span className="w-14 font-display text-[9px] uppercase text-cream/30">Instagram</span><a href={ig} className="text-xs text-cream/70 hover:text-cream underline truncate">{ig.replace("https://","")}</a></div>}
              {sc && <div className="flex items-center gap-2"><span className="w-14 font-display text-[9px] uppercase text-cream/30">SoundCloud</span><a href={sc} className="text-xs text-cream/70 hover:text-cream underline truncate">{sc.replace("https://","")}</a></div>}
              {ensUrl(artist.spotify) && <div className="flex items-center gap-2"><span className="w-14 font-display text-[9px] uppercase text-cream/30">Spotify</span><a href={ensUrl(artist.spotify)!} className="text-xs text-cream/70 hover:text-cream underline">open.spotify.com</a></div>}
              {artist.booking_email && <div className="flex items-center gap-2"><span className="w-14 font-display text-[9px] uppercase text-cream/30">Booking</span><a href={`mailto:${artist.booking_email}`} className="text-xs text-cream/70 hover:text-cream underline">{artist.booking_email}</a></div>}
              <div className="flex items-center gap-2"><span className="w-14 font-display text-[9px] uppercase text-cream/30">Profile</span><span className="text-xs text-cream/40 truncate">{typeof window!=="undefined"?window.location.href:""}</span></div>
            </div>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase text-cream/40 mb-2">Upcoming Shows</p>
              {upcoming.map(d=>(
                <p key={d.id} className="text-xs text-cream/60 py-0.5">
                  {d.event_date} · {d.city}{d.venue?`, ${d.venue}`:""}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t-4 border-cream/10 p-4 flex flex-wrap gap-3 items-center">
        <button onClick={() => window.print()}
          className="font-display text-xs uppercase bg-cream text-ink px-5 py-2.5 border-2 border-cream hover:bg-acid-yellow transition-colors">
          🖨 Print / Save PDF
        </button>
        <button onClick={copyEPK}
          className="font-display text-xs uppercase bg-cream/10 text-cream px-5 py-2.5 border-2 border-cream/20 hover:bg-cream/20 transition-colors">
          📋 Copy EPK Text
        </button>
        {isOwnProfile && (
          <button onClick={copyEPK}
            className="font-display text-xs uppercase bg-acid-yellow text-ink px-5 py-2.5 border-2 border-acid-yellow hover:opacity-90 transition-opacity ml-auto">
            ✦ Artist Kit Download
          </button>
        )}
        <p className="font-display text-[9px] uppercase text-cream/20 ml-auto">Cats Can Dance · ccd.school</p>
      </div>
    </div>
  );
}

/* ── Contact/Booking Gate ────────────────────────────────────────────────────── */
function BookingGate({ artist }: { artist: Artist }) {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [enquiry, setEnquiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const fee = fmtFee(artist);
  const isRevealed = user || verified;

  const send = async () => {
    if (!email.trim()) { toast.error("Email required"); return; }
    setBusy(true);
    try {
      await fetch("/api/event-rsvp", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ event_slug:`booking-${artist.slug}`, name:email.split("@")[0], email, plus_ones:0 }) });
      setSent(true); toast.success("Enquiry sent!");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="border-4 border-ink bg-cream sticky top-[72px]">
      {fee && (
        <div className="bg-magenta text-cream border-b-4 border-ink p-4">
          <p className="font-display text-[10px] uppercase opacity-60 mb-1">Indicative Fee</p>
          {isRevealed ? <p className="font-display text-3xl">{fee}</p> : <p className="font-display text-3xl blur-sm select-none">₹XX–YYL</p>}
          <p className="text-[10px] opacity-50 mt-1">Confirm per booking</p>
        </div>
      )}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base uppercase text-ink">Book {artist.name}</h3>
          {artist.open_to_bookings
            ? <span className="font-display text-[9px] uppercase bg-acid-yellow text-ink px-2 py-0.5 border border-ink">Open</span>
            : <span className="font-display text-[9px] uppercase bg-ink/10 text-ink/40 px-2 py-0.5 border border-ink/20">Enquiry</span>}
        </div>
        {!isRevealed && (
          <>
            <p className="text-sm text-ink/60">Sign in to reveal booking contact and fee details.</p>
            <button onClick={()=>openSignIn()} className="w-full bg-ink text-cream font-display text-xs uppercase px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">Sign In to Reveal</button>
            <div className="flex items-center gap-2 text-ink/20 text-xs"><div className="flex-1 h-px bg-ink/20"/><span>or</span><div className="flex-1 h-px bg-ink/20"/></div>
            <label className="block">
              <span className="font-display text-[10px] uppercase text-ink block mb-1">Your Email</span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
            </label>
            <button onClick={()=>{if(email.includes("@"))setVerified(true);else toast.error("Valid email needed");}} className="w-full bg-acid-yellow text-ink font-display text-xs uppercase px-4 py-3 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">Continue as Guest →</button>
          </>
        )}
        {isRevealed && !sent && (
          <>
            {artist.booking_email && <div className="bg-acid-yellow border-4 border-ink p-3"><p className="font-display text-[9px] uppercase text-ink/50 mb-1">Direct Booking</p><a href={`mailto:${artist.booking_email}`} className="font-display text-sm text-ink hover:text-magenta break-all">✉ {artist.booking_email}</a></div>}
            {!artist.booking_email && <p className="text-sm text-ink/50 bg-ink/5 border-2 border-ink/10 p-3">CCD will forward your enquiry.</p>}
            <textarea value={enquiry} onChange={e=>setEnquiry(e.target.value)} rows={3} placeholder="Date, city, event type, budget…" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none resize-none"/>
            {!user && <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>}
            <button onClick={send} disabled={busy} className="w-full bg-magenta text-cream font-display text-xs uppercase px-4 py-3 border-4 border-ink disabled:opacity-50 hover:bg-ink transition-colors">{busy?"Sending…":"Send Enquiry"}</button>
          </>
        )}
        {sent && <div className="text-center py-4"><p className="font-display text-2xl text-ink">✓ Sent</p><p className="text-ink/50 text-sm">We'll be in touch.</p></div>}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
const ArtistDetail = () => {
  const router = useRouter();
  const slug = router.query.slug as string|undefined;
  const { user } = useUser();
  const roleInfo = useUserRole();

  const [a, setA] = useState<Artist|null>(null);
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allArtists, setAllArtists] = useState<OtherArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string|null>(null);
  const [scrolled, setScrolled] = useState(false);

  const isOwnProfile = !!(user && a && (a.claimed_by === user.id || (roleInfo.isArtist && roleInfo.entitySlug === a.slug)));

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
      const [dr, ar, appr, conns] = await Promise.all([
        fetch(`/api/artist-dates?artist_id=${raw.id}`).then(r=>r.ok?r.json():[]).catch(()=>[]),
        fetch(`/api/artists`).then(r=>r.ok?r.json():[]).catch(()=>[]),
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

  const upcoming = useMemo(() => dates.filter(d=>new Date(d.event_date+"T00:00:00")>=new Date()).sort((x,y)=>x.event_date.localeCompare(y.event_date)), [dates]);
  const past     = useMemo(() => dates.filter(d=>new Date(d.event_date+"T00:00:00")<new Date()).sort((x,y)=>y.event_date.localeCompare(x.event_date)), [dates]);
  const related  = useMemo(() => allArtists.filter(x=>x.slug!==slug).sort(()=>Math.random()-0.5).slice(0,5), [allArtists, slug]);
  const ytVideos = useMemo(() => (a?.videos??[]).filter(v=>v.youtube_id), [a]);

  if (loading) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="flex items-center justify-center min-h-[80vh] pt-20 gap-4 flex-col">
        <div className="w-20 h-20 bg-ink/5 border-4 border-ink/10 animate-pulse"/>
        <div className="h-5 w-40 bg-ink/10 animate-pulse"/>
      </div>
    </div>
  );

  if (notFound||!a) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink uppercase mb-4">Artist not found.</p>
        <a href="/artists" className="font-display underline text-magenta">← All artists</a>
      </div>
    </div>
  );

  const city = cityOf(a);
  const sc = ensUrl(a.soundcloud); const ig = igUrl(a.instagram);
  const coverImg = a.photo_url||(ytVideos[0]?`https://img.youtube.com/vi/${ytVideos[0].youtube_id}/maxresdefault.jpg`:null)||(a.gallery[0]?.url??null);
  const emerging = isEmerging(a, appearances);
  const totalShows = dates.length + appearances.length;
  const allCities = [...new Set([...dates.map(d=>d.city), ...appearances.map(ap=>ap.city)].filter(Boolean))];
  const statItems = [
    a.festivals.length>0 && { n: a.festivals.length, label: "stage credits" },
    totalShows>0 && { n: totalShows, label: "shows recorded" },
    allCities.length>1 && { n: allCities.length, label: "cities played" },
    connections.length>0 && { n: connections.length, label: "connections" },
    ytVideos.length>0 && { n: ytVideos.length, label: "videos" },
    a.gallery.length>0 && { n: a.gallery.length, label: "photos" },
  ].filter(Boolean) as { n:number; label:string }[];

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`${a.name} — ${a.genres[0]??"Electronic"} · ${city||"India"} | Cats Can Dance`}
        description={a.bio?.slice(0,155)??`${a.name} — Book via Cats Can Dance.`}
        path={`/artists/${a.slug}`}
        jsonLd={{"@context":"https://schema.org","@type":"MusicGroup",name:a.name,genre:a.genres.join(", "),description:a.bio?.slice(0,155),image:coverImg??undefined}}
      />
      <Nav/>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="pt-[60px] md:pt-[72px]">
        <div className="relative w-full overflow-hidden border-b-4 border-ink" style={{height:"min(70vh, 580px)"}}>
          {coverImg
            ? <img src={coverImg} alt={a.name} className="absolute inset-0 w-full h-full object-cover"/>
            : <div className="absolute inset-0" style={{background:nameBg(a.name)}}/>}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-ink"/>

          {/* Back */}
          <div className="absolute top-5 left-5">
            <a href="/artists" className="font-display text-[10px] uppercase text-cream/50 hover:text-cream bg-ink/40 px-3 py-1.5 border border-cream/20 backdrop-blur-sm">← All artists</a>
          </div>

          {/* Badges top right */}
          <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
            {a.featured && <span className="font-display text-[10px] uppercase bg-acid-yellow text-ink px-3 py-1.5 border-2 border-ink">⭐ CCD Featured</span>}
            {emerging && <span className="font-display text-[10px] uppercase bg-electric-blue text-cream px-3 py-1.5 border-2 border-cream/30">✦ Emerging</span>}
            {isOwnProfile && <span className="font-display text-[10px] uppercase bg-magenta text-cream px-3 py-1.5 border-2 border-cream/30">Your Profile</span>}
          </div>

          {/* Hero content */}
          <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {a.genres.map(g => <span key={g} className="font-display text-[10px] uppercase bg-acid-yellow text-ink px-2 py-1 border-2 border-ink">{g}</span>)}
                {city && <span className="font-display text-[10px] uppercase bg-cream/10 border border-cream/20 text-cream px-2 py-1">📍 {city}</span>}
                {a.labels && <span className="font-display text-[10px] text-cream/50 border border-cream/20 px-2 py-1">{a.labels}</span>}
              </div>
              <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-cream uppercase leading-none tracking-tight"
                style={{textShadow:"3px 3px 0 rgba(0,0,0,0.3)"}}>{a.name}</h1>
              {a.members && <p className="text-cream/50 text-sm mt-2">{a.members}</p>}
            </div>

            {/* Social links */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {ig && <a href={ig} target="_blank" rel="noreferrer" className="font-display text-[10px] uppercase px-3 py-2 border-2 border-cream/40 text-cream hover:border-cream hover:bg-cream hover:text-ink transition-all">IG ↗</a>}
              {sc && <a href={sc} target="_blank" rel="noreferrer" className="font-display text-[10px] uppercase px-3 py-2 bg-[#ff5500] text-cream border-2 border-[#ff5500]">SC ↗</a>}
              {ensUrl(a.spotify) && <a href={ensUrl(a.spotify)!} target="_blank" rel="noreferrer" className="font-display text-[10px] uppercase px-3 py-2 bg-[#1db954] text-cream border-2 border-[#1db954]">SP ↗</a>}
              {ensUrl(a.bandcamp) && <a href={ensUrl(a.bandcamp)!} target="_blank" rel="noreferrer" className="font-display text-[10px] uppercase px-3 py-2 bg-[#1da0c3] text-cream border-2 border-[#1da0c3]">BC ↗</a>}
              {ensUrl(a.website) && <a href={ensUrl(a.website)!} target="_blank" rel="noreferrer" className="font-display text-[10px] uppercase px-3 py-2 border-2 border-cream/40 text-cream hover:border-cream">WEB ↗</a>}
              <a href="#epk" className="font-display text-[10px] uppercase px-3 py-2 bg-cream text-ink border-2 border-cream hover:bg-acid-yellow transition-colors">EPK ↓</a>
            </div>
          </div>
        </div>

        {/* ── STATS RIBBON ─────────────────────────────────────────────── */}
        {statItems.length > 0 && (
          <div className="bg-ink border-b-4 border-ink overflow-hidden">
            <div className="flex overflow-x-auto">
              {statItems.map(({n,label}) => (
                <div key={label} className="shrink-0 px-8 py-5 text-center border-r border-cream/10 last:border-r-0">
                  <p className="font-display text-3xl text-cream">{n}</p>
                  <p className="font-display text-[10px] uppercase text-cream/40 mt-0.5 whitespace-nowrap">{label}</p>
                </div>
              ))}
              {a.available_cities.length>0 && (
                <div className="shrink-0 px-8 py-5 text-center border-r border-cream/10">
                  <p className="font-display text-xs uppercase text-cream/40 mb-1">Available in</p>
                  <p className="font-display text-sm text-cream">{a.available_cities.slice(0,4).join(" · ")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MAIN BODY (2-col) ─────────────────────────────────────────── */}
        <div className="container py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* CONTENT (left 2/3) */}
          <div className="lg:col-span-2 space-y-16">

            {/* BIO + WHY BOOK */}
            {(a.bio || a.why) && (
              <div>
                {a.why && (
                  <div className="bg-acid-yellow border-4 border-ink p-6 mb-6">
                    <p className="font-display text-[10px] uppercase text-ink/50 mb-2">Why Book</p>
                    <p className="font-display text-2xl md:text-3xl text-ink leading-tight">"{a.why}"</p>
                  </div>
                )}
                {a.bio && (
                  <p className="text-ink/80 leading-relaxed text-base whitespace-pre-line">{a.bio}</p>
                )}
              </div>
            )}

            {/* MUSIC */}
            {sc && (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-ink/10"/>
                  <p className="font-display text-xs uppercase text-ink/40 shrink-0">Listen</p>
                  <div className="flex-1 h-px bg-ink/10"/>
                </div>
                <iframe className="w-full border-4 border-ink" height="180" scrolling="no" frameBorder="no" allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(sc)}&color=%23E91E8C&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`}
                  title={`${a.name} on SoundCloud`}/>
              </div>
            )}

            {/* UPCOMING SHOWS */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-sm uppercase text-ink border-b-2 border-ink pb-1">Upcoming Shows</p>
                  <span className="font-display text-xs text-ink/30">{upcoming.length}</span>
                </div>
                <div className="space-y-2">
                  {upcoming.map(d => {
                    const dt = new Date(d.event_date+"T00:00:00");
                    const isClose = (dt.getTime()-Date.now()) < 7*86400000;
                    return (
                      <div key={d.id} className={`flex items-center gap-4 border-4 p-4 ${isClose ? "border-magenta bg-magenta/5" : "border-ink bg-cream"}`}>
                        <div className="text-center min-w-[48px]">
                          <p className="font-display text-2xl text-ink leading-none">{dt.getDate()}</p>
                          <p className="font-display text-[10px] text-ink/50 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                          <p className="font-display text-[9px] text-ink/30">{dt.getFullYear()}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-display text-base text-ink uppercase">{d.city}</p>
                          {d.venue && <p className="text-sm text-ink/50">{d.venue}</p>}
                          <span className={`text-[9px] font-display uppercase px-1.5 py-0.5 border mt-1 inline-block ${d.status==="confirmed"?"bg-acid-yellow text-ink border-acid-yellow":"border-ink/20 text-ink/40"}`}>{d.status}</span>
                        </div>
                        {isClose && <span className="font-display text-[9px] uppercase bg-magenta text-cream px-2 py-1 animate-pulse">SOON</span>}
                        {d.ticket_url && <a href={d.ticket_url.startsWith("http")?d.ticket_url:`https://${d.ticket_url}`} target="_blank" rel="noreferrer" className="font-display text-[10px] uppercase bg-magenta text-cream px-3 py-2 border-2 border-ink shrink-0 hover:bg-ink transition-colors">Tickets →</a>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAST SHOWS / TIMELINE */}
            {past.length > 0 && (
              <div>
                <p className="font-display text-sm uppercase text-ink border-b-2 border-ink pb-1 mb-4">Show History</p>
                <div className="space-y-2">
                  {past.slice(0,8).map(d => {
                    const dt = new Date(d.event_date+"T00:00:00");
                    return (
                      <div key={d.id} className="flex items-center gap-4 border-2 border-ink/10 p-3 opacity-70 hover:opacity-100 transition-opacity">
                        <div className="text-center min-w-[44px]">
                          <p className="font-display text-lg text-ink leading-none">{dt.getDate()}</p>
                          <p className="font-display text-[9px] text-ink/40 uppercase">{dt.toLocaleString("en",{month:"short"})} {dt.getFullYear()}</p>
                        </div>
                        <div>
                          <p className="font-display text-sm text-ink">{d.city}</p>
                          {d.venue && <p className="text-xs text-ink/40">{d.venue}</p>}
                        </div>
                      </div>
                    );
                  })}
                  {past.length > 8 && <p className="text-xs text-ink/30 font-display uppercase text-center pt-2">+{past.length-8} more shows</p>}
                </div>
              </div>
            )}

            {/* STAGE CREDITS */}
            {a.festivals.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-ink/10"/>
                  <p className="font-display text-xs uppercase text-ink/40 shrink-0">Stage Credits</p>
                  <div className="flex-1 h-px bg-ink/10"/>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.festivals.map(f => (
                    <span key={f} className="font-display text-xs px-3 py-1.5 border-4 border-ink chunk-shadow bg-cream text-ink hover:bg-acid-yellow transition-colors cursor-default">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CONNECTION GRAPH */}
            {connections.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-sm uppercase text-ink border-b-2 border-ink pb-1">The Network</p>
                  <span className="font-display text-xs text-ink/30">{connections.length} connections</span>
                </div>
                <ConnectionGraph artist={a} connections={connections} allArtists={allArtists}/>
              </div>
            )}

            {/* VENUE AFFINITY */}
            {(appearances.length > 0 || a.festivals.length > 1) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <VenueAffinity appearances={appearances} festivals={a.festivals}/>
                {allCities.length > 1 && (
                  <div>
                    <p className="font-display text-xs uppercase text-ink/40 mb-4">Cities Played</p>
                    <div className="flex flex-wrap gap-2">
                      {allCities.map(c => c && (
                        <span key={c} className="font-display text-xs uppercase bg-ink text-cream px-3 py-1.5 border-2 border-ink">📍 {c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIDEOS */}
            {ytVideos.length > 0 && (
              <div>
                <p className="font-display text-sm uppercase text-ink border-b-2 border-ink pb-1 mb-4">Videos</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ytVideos.map(v => (
                    <div key={v.youtube_id} className="border-4 border-ink bg-ink overflow-hidden">
                      <div className="aspect-video"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${v.youtube_id}`} title={v.title??"Video"} allowFullScreen/></div>
                      {v.title && <p className="font-display text-xs text-cream p-2 truncate">{v.title}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GALLERY */}
            {a.gallery.length > 0 && (
              <div>
                <p className="font-display text-sm uppercase text-ink border-b-2 border-ink pb-1 mb-4">Gallery</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {a.gallery.map((g,i) => (
                    <figure key={i} className="border-4 border-ink overflow-hidden cursor-zoom-in" onClick={()=>setLightbox(g.url)}>
                      <img src={g.url} alt={g.caption??a.name} className="w-full h-40 object-cover hover:scale-105 transition-transform"/>
                      {g.caption && <figcaption className="p-2 font-display text-[10px] text-ink/50">{g.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* EPK */}
            <EPKCard artist={a} dates={dates} appearances={appearances} isOwnProfile={isOwnProfile}
              onEdit={isOwnProfile ? () => router.push(`/artist/dashboard`) : undefined}/>
          </div>

          {/* SIDEBAR (right 1/3) */}
          <div className="space-y-4">
            <BookingGate artist={a}/>

            {!a.claimed_by && (
              <div className="border-4 border-ink bg-ink text-cream p-4">
                <p className="font-display text-sm uppercase mb-2">Are you {a.name}?</p>
                <p className="text-xs text-cream/50 mb-3">Claim this profile to edit your bio, add links, manage bookings, and download your EPK.</p>
                <a href={`/sign-in?redirect_url=/artist/dashboard?claim=${a.id}`}
                  className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-2 border-2 border-cream inline-block hover:bg-cream transition-colors">
                  Claim this profile →
                </a>
              </div>
            )}

            {isOwnProfile && (
              <div className="border-4 border-acid-yellow bg-acid-yellow p-4">
                <p className="font-display text-sm uppercase text-ink mb-2">✦ Artist Profile</p>
                <p className="text-xs text-ink/60 mb-3">Edit your bio, links, gallery, and download your press kit.</p>
                <a href="/artist/dashboard" className="font-display text-xs uppercase bg-ink text-cream px-4 py-2 border-2 border-ink inline-block hover:bg-magenta transition-colors">Edit Profile →</a>
              </div>
            )}
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="border-t-4 border-ink bg-ink text-cream py-12">
            <div className="container">
              <p className="font-display text-2xl uppercase text-cream mb-6">More From The Scene</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {related.map(r => (
                  <a key={r.id} href={`/artists/${r.slug}`} className="block border-4 border-cream/20 hover:border-cream transition-colors overflow-hidden group">
                    {r.photo_url
                      ? <img src={r.photo_url} alt={r.name} className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"/>
                      : <div className="w-full h-28 flex items-center justify-center font-display text-3xl text-cream/20" style={{background:nameBg(r.name)}}>{r.name[0]}</div>}
                    <div className="p-2">
                      <p className="font-display text-cream uppercase text-xs truncate">{r.name}</p>
                      <p className="text-cream/30 text-[10px] mt-0.5">{r.based_city||""}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="Gallery" className="max-w-full max-h-full object-contain border-4 border-cream"/>
        </div>
      )}
      <Footer/>
    </div>
  );
};

export default ArtistDetail;
