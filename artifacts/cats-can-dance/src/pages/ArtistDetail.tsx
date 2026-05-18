import { useEffect, useState } from "react";
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
  claimed_by: string | null;
};
type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
};

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

/* ── Sub-components ─────────────────────────────────────────────────────────── */
function SCEmbed({ url, name }: { url: string; name: string }) {
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23E91E8C&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`;
  return <iframe className="w-full rounded-none border-4 border-ink" height="200" scrolling="no" frameBorder="no" allow="autoplay" src={src} title={`${name} on SoundCloud`} />;
}

function YTEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="border-4 border-ink bg-ink overflow-hidden">
      <div className="aspect-video"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}`} title={title ?? "Video"} allowFullScreen /></div>
      {title && <p className="font-display text-xs text-cream p-2 truncate">{title}</p>}
    </div>
  );
}

function ContactGate({ artist }: { artist: Artist }) {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [enquiry, setEnquiry] = useState("");
  const [sent, setSent] = useState(false);
  const fee = fmtFee(artist);

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

  const isRevealed = user || verified;

  return (
    <div className="border-4 border-ink bg-cream">
      {fee && (
        <div className="bg-magenta text-cream border-b-4 border-ink p-4">
          <p className="font-display text-xs uppercase opacity-70 mb-1">Estimated Fee</p>
          {isRevealed
            ? <p className="font-display text-3xl">{fee}</p>
            : <p className="font-display text-3xl blur-sm select-none">₹XXk–YYL</p>
          }
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
            <p className="text-sm text-ink/70">Sign in or verify your email to reveal the booking contact and fee.</p>
            <button onClick={() => openSignIn()}
              className="w-full bg-ink text-cream font-display text-sm uppercase px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">
              Sign In to Reveal Contact
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
              <span className="font-display text-xs uppercase text-ink block mb-1">Send a Booking Enquiry</span>
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

/* ── Main page ────────────────────────────────────────────────────────────── */
const ArtistDetail = () => {
  const router = useRouter();
  const slug = router.query.slug as string | undefined;
  const [a, setA] = useState<Artist | null>(null);
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [related, setRelated] = useState<Pick<Artist,"id"|"slug"|"name"|"based_city"|"genres"|"photo_url">[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

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
      };
      setA(norm);
      const [dr, rr] = await Promise.all([
        fetch(`/api/artist-dates?artist_id=${raw.id}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/artists`).then(r => r.ok ? r.json() : []).then((all: any[]) => all.filter(x => x.slug !== slug).sort(() => Math.random()-0.5).slice(0,4)),
      ]);
      setDates(Array.isArray(dr) ? dr : []);
      setRelated(rr);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="flex items-center justify-center min-h-[80vh] pt-20">
        <div className="space-y-4 text-center">
          <div className="w-24 h-24 rounded-none bg-ink/5 border-4 border-ink/10 mx-auto animate-pulse" />
          <div className="h-6 w-48 bg-ink/10 mx-auto animate-pulse" />
          <div className="h-4 w-32 bg-ink/5 mx-auto animate-pulse" />
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
  const upcoming = dates.filter(d => new Date(d.event_date+"T00:00:00") >= new Date(new Date().toDateString())).sort((x,y) => x.event_date.localeCompare(y.event_date));
  const coverImg = a.photo_url || (ytVideos[0] ? `https://img.youtube.com/vi/${ytVideos[0].youtube_id}/maxresdefault.jpg` : null) || (a.gallery[0]?.url ?? null);

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`${a.name} — ${a.genres[0] ?? "Electronic"} · ${city || "India"} | Cats Can Dance`}
        description={a.bio?.slice(0,155) ?? `${a.name} — Book via Cats Can Dance.`}
        path={`/artists/${a.slug}`}
        jsonLd={{"@context":"https://schema.org","@type":"MusicGroup",name:a.name,genre:a.genres.join(", "),description:a.bio?.slice(0,155),image:coverImg??undefined}}
      />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pt-[60px] md:pt-[72px]">
        {/* Full-width cover */}
        <div className="relative w-full h-[40vh] md:h-[55vh] overflow-hidden border-b-4 border-ink">
          {coverImg
            ? <img src={coverImg} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: nameBg(a.name) }} />
          }
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/80" />
          {/* Name overlay */}
          <div className="absolute bottom-0 inset-x-0 p-6 md:p-10">
            <a href="/artists" className="font-display text-xs uppercase text-cream/50 hover:text-cream mb-2 inline-block">← All artists</a>
            <h1 className="font-display text-4xl sm:text-6xl md:text-8xl text-cream uppercase leading-none"
              style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.4)" }}>{a.name}</h1>
            {a.members && <p className="text-cream/60 text-base mt-1">{a.members}</p>}
          </div>
        </div>

        {/* ── Meta strip ──────────────────────────────────────────────────── */}
        <div className="bg-ink text-cream border-b-4 border-cream/10">
          <div className="container py-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {city && <span className="font-display text-xs uppercase bg-cream/10 text-cream px-3 py-1.5 border border-cream/20">📍 {city}</span>}
              {a.genres.map(g => <span key={g} className="font-display text-xs uppercase bg-acid-yellow text-ink px-2 py-1.5 border-2 border-acid-yellow">{g}</span>)}
              {a.labels && <span className="font-display text-xs text-cream/50 px-2 py-1.5 border border-cream/20">{a.labels}</span>}
            </div>
            <div className="flex items-center gap-2">
              {ig && <a href={ig} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-2 border-2 border-cream/30 text-cream hover:border-cream transition-colors">Instagram ↗</a>}
              {sc && <a href={sc} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-2 bg-[#ff5500] text-cream border-2 border-[#ff5500] hover:opacity-80">SoundCloud ↗</a>}
              {ensUrl(a.spotify) && <a href={ensUrl(a.spotify)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-2 bg-[#1db954] text-cream border-2 border-[#1db954]">Spotify ↗</a>}
              {ensUrl(a.bandcamp) && <a href={ensUrl(a.bandcamp)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-2 bg-[#1da0c3] text-cream border-2 border-[#1da0c3]">Bandcamp ↗</a>}
              {ensUrl(a.website) && <a href={ensUrl(a.website)!} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-2 border-2 border-cream/30 text-cream hover:border-cream">Website ↗</a>}
            </div>
          </div>
        </div>

        {/* ── Body: 2-col on desktop ───────────────────────────────────────── */}
        <div className="container py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT: all content */}
          <div className="lg:col-span-2 space-y-10">

            {/* Why book */}
            {a.why && (
              <div className="bg-acid-yellow border-4 border-ink p-6">
                <p className="font-display text-xs uppercase text-ink/60 mb-2">Why book them</p>
                <p className="font-display text-2xl text-ink leading-tight">{a.why}</p>
              </div>
            )}

            {/* Bio */}
            {a.bio && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Bio</h2>
                <p className="text-ink/90 leading-relaxed whitespace-pre-line text-base">{a.bio}</p>
              </div>
            )}

            {/* SoundCloud */}
            {sc && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Listen</h2>
                <SCEmbed url={sc} name={a.name} />
              </div>
            )}

            {/* YouTube videos — all of them */}
            {ytVideos.length > 0 && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">
                  Videos ({ytVideos.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ytVideos.map(v => <YTEmbed key={v.youtube_id} id={v.youtube_id!} title={v.title} />)}
                </div>
              </div>
            )}

            {/* Upcoming shows */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">
                  Upcoming Shows ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map(d => {
                    const dt = new Date(d.event_date+"T00:00:00");
                    return (
                      <div key={d.id} className="flex items-center gap-4 border-4 border-ink p-4 bg-cream">
                        <div className="text-center min-w-[52px]">
                          <p className="font-display text-2xl text-ink leading-none">{dt.getDate()}</p>
                          <p className="font-display text-xs text-ink/50 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                          <p className="font-display text-xs text-ink/30">{dt.getFullYear()}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-display text-lg text-ink uppercase">{d.city}</p>
                          {d.venue && <p className="text-sm text-ink/60">{d.venue}</p>}
                          <span className={`text-xs font-display uppercase px-2 py-0.5 border-2 border-ink mt-1 inline-block ${d.status==="confirmed"?"bg-acid-yellow text-ink":d.status==="tentative"?"bg-cream text-ink/50":"bg-ink text-cream"}`}>{d.status}</span>
                        </div>
                        {d.ticket_url && <a href={d.ticket_url.startsWith("http")?d.ticket_url:`https://${d.ticket_url}`} target="_blank" rel="noreferrer" className="font-display text-xs uppercase bg-magenta text-cream px-3 py-2 border-2 border-ink shrink-0">Tickets →</a>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Festival credits */}
            {a.festivals.length > 0 && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">
                  Stage Credits ({a.festivals.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {a.festivals.map(f => <span key={f} className="font-display text-sm bg-cream border-4 border-ink px-3 py-1.5 chunk-shadow">{f}</span>)}
                </div>
              </div>
            )}

            {/* Gallery */}
            {a.gallery.length > 0 && (
              <div>
                <h2 className="font-display text-sm uppercase text-ink/50 border-b-2 border-ink/20 pb-2 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {a.gallery.map((g,i) => (
                    <figure key={i} className="border-4 border-ink overflow-hidden cursor-zoom-in" onClick={() => setLightbox(g.url)}>
                      <img src={g.url} alt={g.caption ?? a.name} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                      {g.caption && <figcaption className="p-2 font-display text-xs text-ink/60">{g.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Available in */}
            {a.available_cities.length > 0 && (
              <p className="font-display text-sm text-ink/50">Available in: {a.available_cities.join(" · ")}</p>
            )}
          </div>

          {/* RIGHT: booking sidebar (sticky) */}
          <div className="space-y-5">
            <div className="lg:sticky lg:top-24">
              <ContactGate artist={a} />

              {/* Quick stats */}
              <div className="border-4 border-ink p-4 mt-4 grid grid-cols-2 gap-4 bg-cream">
                {a.festivals.length > 0 && <div><p className="font-display text-2xl text-ink">{a.festivals.length}</p><p className="text-xs text-ink/50">Festival credits</p></div>}
                {ytVideos.length > 0 && <div><p className="font-display text-2xl text-ink">{ytVideos.length}</p><p className="text-xs text-ink/50">Videos</p></div>}
                {upcoming.length > 0 && <div><p className="font-display text-2xl text-ink">{upcoming.length}</p><p className="text-xs text-ink/50">Upcoming shows</p></div>}
                {a.genres.length > 0 && <div><p className="font-display text-2xl text-ink">{a.genres.length}</p><p className="text-xs text-ink/50">Genres</p></div>}
              </div>

              {/* Claim banner */}
              {!a.claimed_by && (
                <div className="border-4 border-ink bg-ink text-cream p-4 mt-4">
                  <p className="font-display text-sm uppercase mb-2">Are you {a.name}?</p>
                  <a href={`/sign-in?redirect_url=/artist/dashboard?claim=${a.id}`}
                    className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-2 border-2 border-cream inline-block">
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
              <h2 className="font-display text-2xl uppercase text-cream mb-6">More Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(r => {
                  const rCover = r.photo_url;
                  return (
                    <a key={r.id} href={`/artists/${r.slug}`}
                      className="block border-4 border-cream/20 hover:border-cream transition-colors overflow-hidden">
                      {rCover
                        ? <img src={rCover} alt={r.name} className="w-full h-32 object-cover" />
                        : <div className="w-full h-32 flex items-center justify-center font-display text-4xl text-cream/20" style={{ background: nameBg(r.name) }}>{r.name[0]}</div>
                      }
                      <div className="p-3">
                        <p className="font-display text-cream uppercase text-sm">{r.name}</p>
                        <p className="text-cream/40 text-xs mt-0.5">{r.based_city || ""}</p>
                      </div>
                    </a>
                  );
                })}
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
