import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/supabase-shim";
import { toast } from "sonner";

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
  videos: { youtube_id?: string; title?: string; source?: string }[];
  open_to_bookings: boolean; available_cities: string[];
  claimed_by: string | null;
};
type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
};

const url = (s: string | null) =>
  s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null;
const ig = (s: string | null) =>
  s ? url(s.startsWith("http") ? s : `https://instagram.com/${s.replace(/^@/, "")}`) : null;

const nameBg = (name: string) => {
  const c = ["#E91E8C","#0066FF","#0D0D0D","#FF6B00","#F5E642"];
  let h = 0; for (let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffffffff;
  return c[Math.abs(h)%c.length];
};

function Avatar({ artist, size = 96 }: { artist: Artist; size?: number }) {
  const initials = artist.name.split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const bg = nameBg(artist.name);
  if (artist.photo_url) {
    return (
      <img src={artist.photo_url} alt={artist.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-4 border-ink" />
    );
  }
  return (
    <div style={{ width: size, height: size, background: bg }}
      className="rounded-full border-4 border-ink flex items-center justify-center shrink-0">
      <span className="font-display text-cream leading-none"
        style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="font-display text-ink text-lg leading-none">{value}</p>
      <p className="text-ink/50 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function SCEmbed({ url: scUrl, name }: { url: string; name: string }) {
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&color=%23E91E8C&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`;
  return (
    <iframe className="w-full rounded-none" height="200" scrolling="no" frameBorder="no"
      allow="autoplay" src={src} title={`${name} on SoundCloud`} />
  );
}

function YTEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="border-4 border-ink bg-ink overflow-hidden">
      <div className="aspect-video">
        <iframe className="w-full h-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={title ?? "Video"} allowFullScreen />
      </div>
      {title && <p className="font-display text-xs text-cream p-2 truncate">{title}</p>}
    </div>
  );
}

function BookingModal({ artist, onClose }: { artist: Artist; onClose: () => void }) {
  const [step, setStep] = useState<"form"|"sent">("form");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) { toast.error("Email required"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/event-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: `booking-${artist.slug}`,
          name: email.split("@")[0],
          email, plus_ones: 0,
        }),
      });
      if (!res.ok) throw new Error();
      setStep("sent");
    } catch { toast.error("Something went wrong"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="bg-cream border-4 border-ink w-full max-w-md">
        <div className="bg-ink text-cream p-4 flex items-center justify-between">
          <p className="font-display text-lg uppercase">Book {artist.name}</p>
          <button onClick={onClose} className="font-display text-xl">✕</button>
        </div>
        {step === "sent" ? (
          <div className="p-8 text-center">
            <p className="font-display text-3xl text-ink mb-2">✓ Sent</p>
            <p className="text-ink/60">We'll forward your inquiry to the booking contact.</p>
            <button onClick={onClose} className="mt-6 font-display text-sm uppercase bg-acid-yellow text-ink px-6 py-3 border-4 border-ink">Close</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {artist.booking_email && (
              <div className="bg-acid-yellow border-4 border-ink p-3">
                <p className="font-display text-xs uppercase text-ink/60 mb-1">Direct booking</p>
                <a href={`mailto:${artist.booking_email}`} className="font-display text-ink hover:text-magenta">
                  ✉ {artist.booking_email}
                </a>
              </div>
            )}
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Your email *</span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans focus:outline-none" />
            </label>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Tell us about the booking</span>
              <textarea value={purpose} onChange={e=>setPurpose(e.target.value)} rows={3}
                placeholder="Date, city, event type, estimated budget…"
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans focus:outline-none resize-none" />
            </label>
            <button onClick={submit} disabled={busy}
              className="w-full bg-magenta text-cream font-display px-4 py-3 border-4 border-ink text-sm uppercase disabled:opacity-60">
              {busy ? "Sending…" : "Send Booking Enquiry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const ArtistDetail = () => {
  const router = useRouter();
  const slug = router.query.slug as string | undefined;
  const [a, setA] = useState<Artist | null>(null);
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"about"|"music"|"shows"|"gallery">("about");

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setNotFound(false);
    (async () => {
      // Use direct API call — avoids shim slug filter bug
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
      };
      setA(norm);
      // load dates
      const dr = await fetch(`/api/artist-dates?artist_id=${raw.id}`);
      if (dr.ok) setDates(await dr.json());
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-ink/10 animate-pulse mx-auto" />
          <div className="h-4 w-32 bg-ink/10 animate-pulse mx-auto" />
          <div className="h-3 w-24 bg-ink/5 animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );

  if (notFound || !a) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink mb-4 uppercase">Artist not found.</p>
        <a href="/artists" className="font-display underline text-magenta">← Back to artists</a>
      </div>
    </div>
  );

  const city = a.based_city || a.from_city || "";
  const scUrl = url(a.soundcloud);
  const igUrl = ig(a.instagram);
  const ytVideos = a.videos.filter(v => v.youtube_id);
  const upcoming = dates
    .filter(d => new Date(d.event_date + "T00:00:00") >= new Date(new Date().toDateString()))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const tabs = [
    { id: "about", label: "About" },
    { id: "music", label: "Music", show: !!(scUrl || ytVideos.length) },
    { id: "shows", label: `Shows${upcoming.length ? ` (${upcoming.length})` : ""}`, show: upcoming.length > 0 },
    { id: "gallery", label: "Gallery", show: a.gallery.length > 0 },
  ].filter(t => t.show !== false);

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`${a.name} — ${a.genres[0] ?? "Electronic"} · ${city || "India"} | Cats Can Dance`}
        description={a.bio?.slice(0, 155) ?? `${a.name} — Book via Cats Can Dance.`}
        path={`/artists/${a.slug}`}
        jsonLd={{ "@context":"https://schema.org","@type":"MusicGroup",name:a.name,genre:a.genres.join(", "),description:a.bio?.slice(0,155) }}
      />
      <Nav />

      {/* ── Cover / banner ─────────────────────────────────────────────── */}
      <div className="pt-[60px] md:pt-[72px]">
        {/* Banner — YouTube thumbnail, gallery, or solid colour */}
        <div className="w-full h-48 md:h-64 overflow-hidden bg-ink relative border-b-4 border-ink">
          {ytVideos[0] ? (
            <img
              src={`https://img.youtube.com/vi/${ytVideos[0].youtube_id}/maxresdefault.jpg`}
              alt={a.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : a.gallery[0] ? (
            <img src={a.gallery[0].url} alt={a.name} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full" style={{ background: `${nameBg(a.name)}33` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
        </div>

        {/* ── Profile row ────────────────────────────────────────────────── */}
        <div className="border-b-4 border-ink bg-cream">
          <div className="container">
            {/* Avatar + actions */}
            <div className="flex items-end justify-between -mt-12 pb-4">
              <Avatar artist={a} size={88} />
              <div className="flex gap-2 pb-1">
                {igUrl && (
                  <a href={igUrl} target="_blank" rel="noreferrer"
                    className="font-display text-xs uppercase px-3 py-2 border-4 border-ink bg-cream text-ink hover:bg-ink hover:text-cream transition-colors">
                    Instagram ↗
                  </a>
                )}
                {scUrl && (
                  <a href={scUrl} target="_blank" rel="noreferrer"
                    className="font-display text-xs uppercase px-3 py-2 border-4 border-ink bg-[#ff5500] text-cream hover:opacity-80 transition-opacity">
                    SoundCloud ↗
                  </a>
                )}
                <button onClick={() => setBookingOpen(true)}
                  className="font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-magenta text-cream hover:bg-ink transition-colors">
                  Book
                </button>
              </div>
            </div>

            {/* Name + meta */}
            <div className="pb-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="font-display text-2xl md:text-3xl text-ink uppercase leading-none">{a.name}</h1>
                {a.members && <span className="text-ink/50 text-sm">{a.members}</span>}
              </div>
              {city && <p className="text-ink/60 text-sm mt-1">📍 {city}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {a.genres.map(g => (
                  <span key={g} className="text-xs font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border-2 border-ink">{g}</span>
                ))}
                {a.labels && <span className="text-xs font-display text-ink/50 px-2 py-0.5 border-2 border-ink/20">{a.labels}</span>}
              </div>

              {/* Stats row */}
              {(a.festivals.length > 0 || ytVideos.length > 0 || upcoming.length > 0) && (
                <div className="flex gap-6 mt-4 pt-4 border-t-2 border-ink/10">
                  {a.festivals.length > 0 && <StatPill label="Festivals" value={a.festivals.length} />}
                  {ytVideos.length > 0 && <StatPill label="Videos" value={ytVideos.length} />}
                  {upcoming.length > 0 && <StatPill label="Shows" value={upcoming.length} />}
                  {a.genres.length > 0 && <StatPill label="Genres" value={a.genres.length} />}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-t-4 border-ink -mx-4 px-4 md:-mx-8 md:px-8 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                  className={`font-display text-sm uppercase px-4 py-3 border-r-4 border-ink whitespace-nowrap transition-colors ${
                    activeTab === t.id ? "bg-ink text-cream" : "bg-cream text-ink/60 hover:text-ink"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div className="container py-8">
          {activeTab === "about" && (
            <div className="max-w-2xl space-y-6">
              {a.why && (
                <div className="bg-acid-yellow border-4 border-ink p-5">
                  <p className="font-display text-xs uppercase text-ink/60 mb-2">Why book them</p>
                  <p className="text-ink text-lg font-medium leading-snug">{a.why}</p>
                </div>
              )}
              {a.bio && (
                <div>
                  <h2 className="font-display text-sm uppercase text-ink/60 mb-3">Bio</h2>
                  <p className="text-ink/90 leading-relaxed whitespace-pre-line">{a.bio}</p>
                </div>
              )}
              {a.festivals.length > 0 && (
                <div>
                  <h2 className="font-display text-sm uppercase text-ink/60 mb-3">Stage credits</h2>
                  <div className="flex flex-wrap gap-2">
                    {a.festivals.map(f => (
                      <span key={f} className="text-sm font-display bg-cream border-4 border-ink px-3 py-1.5">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                {url(a.website) && <a href={url(a.website)!} target="_blank" rel="noreferrer" className="text-xs font-display border-2 border-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors">Website ↗</a>}
                {url(a.bandcamp) && <a href={url(a.bandcamp)!} target="_blank" rel="noreferrer" className="text-xs font-display border-2 border-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors">Bandcamp ↗</a>}
                {url(a.spotify) && <a href={url(a.spotify)!} target="_blank" rel="noreferrer" className="text-xs font-display border-2 border-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors">Spotify ↗</a>}
              </div>
            </div>
          )}

          {activeTab === "music" && (
            <div className="space-y-6 max-w-2xl">
              {scUrl && (
                <div>
                  <h2 className="font-display text-sm uppercase text-ink/60 mb-3">SoundCloud</h2>
                  <div className="border-4 border-ink">
                    <SCEmbed url={scUrl} name={a.name} />
                  </div>
                </div>
              )}
              {ytVideos.length > 0 && (
                <div>
                  <h2 className="font-display text-sm uppercase text-ink/60 mb-3">Videos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ytVideos.map(v => (
                      <YTEmbed key={v.youtube_id} id={v.youtube_id!} title={v.title} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "shows" && (
            <div className="space-y-3 max-w-xl">
              {upcoming.map(d => {
                const dt = new Date(d.event_date + "T00:00:00");
                return (
                  <div key={d.id} className="flex items-center gap-4 border-4 border-ink bg-cream p-4">
                    <div className="text-center min-w-[52px]">
                      <p className="font-display text-2xl text-ink leading-none">{dt.getDate()}</p>
                      <p className="font-display text-xs text-ink/50 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                      <p className="font-display text-xs text-ink/30">{dt.getFullYear()}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-lg text-ink uppercase">{d.city}</p>
                      {d.venue && <p className="text-sm text-ink/60">{d.venue}</p>}
                      <span className={`text-xs font-display uppercase px-2 py-0.5 border-2 border-ink mt-1 inline-block ${
                        d.status==="confirmed"?"bg-acid-yellow text-ink":d.status==="tentative"?"bg-cream text-ink/50":"bg-ink text-cream"
                      }`}>{d.status}</span>
                    </div>
                    {d.ticket_url && (
                      <a href={d.ticket_url.startsWith("http")?d.ticket_url:`https://${d.ticket_url}`}
                        target="_blank" rel="noreferrer"
                        className="font-display text-xs uppercase bg-magenta text-cream px-3 py-2 border-2 border-ink shrink-0">
                        Tickets →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {a.gallery.map((g, i) => (
                <figure key={i} className="border-4 border-ink overflow-hidden">
                  <img src={g.url} alt={g.caption ?? a.name} className="w-full h-48 object-cover" />
                  {g.caption && <figcaption className="p-2 font-display text-xs text-ink/60">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>

      {bookingOpen && <BookingModal artist={a} onClose={() => setBookingOpen(false)} />}
      <Footer />
    </div>
  );
};

export default ArtistDetail;
