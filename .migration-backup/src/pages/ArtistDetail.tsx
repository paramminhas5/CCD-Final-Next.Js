import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Artist = {
  id: string; slug: string; name: string; members: string | null;
  from_city: string | null; based_city: string | null;
  genres: string[]; festivals: string[]; bio: string | null; why: string | null;
  instagram: string | null; soundcloud: string | null; bandcamp: string | null;
  spotify: string | null; website: string | null;
  booking_email: string | null; manager_email: string | null;
  labels: string | null; photo_url: string | null;
  fee_min_inr: number | null; fee_max_inr: number | null; fee_currency: string;
  gallery: { url: string; caption?: string }[];
  videos: { youtube_id?: string; title?: string; source?: string }[];
  open_to_bookings: boolean; available_cities: string[]; claimed_by: string | null;
};

type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
};

const ensureUrl = (s: string | null) => (s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null);

const formatFee = (a: Artist) => {
  if (!a.fee_min_inr && !a.fee_max_inr) return null;
  const fmt = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return String(n);
  };
  const sym = (a.fee_currency || "INR") === "USD" ? "$" : "\u20b9";
  if (a.fee_min_inr && a.fee_max_inr && a.fee_min_inr !== a.fee_max_inr)
    return `${sym}${fmt(a.fee_min_inr)} \u2013 ${sym}${fmt(a.fee_max_inr)}`;
  return `${sym}${fmt(a.fee_min_inr ?? a.fee_max_inr!)}`;
};

type OtpStep = "idle" | "form" | "sending" | "verify" | "verifying" | "done";

function BookingPanel({ artist }: { artist: Artist }) {
  const [step, setStep] = useState<OtpStep>("idle");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [code, setCode] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ email: string | null; manager: string | null } | null>(null);
  const fee = formatFee(artist);

  const sendOtp = async () => {
    if (!email.trim()) { toast.error("Email required"); return; }
    setStep("sending");
    try {
      const { data, error } = await supabase.functions.invoke("booking-otp-start", {
        body: { artist_id: artist.id, requester_email: email, requester_phone: phone, purpose },
      });
      if (error) throw error;
      setBookingId((data as any)?.booking_id ?? null);
      setStep("verify");
      toast.success("Code sent — check your inbox.");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); setStep("form"); }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(code)) { toast.error("Enter the 6-digit code"); return; }
    setStep("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("booking-otp-verify", {
        body: { requester_email: email, code, booking_id: bookingId, forward_requested: false },
      });
      if (error) throw error;
      setRevealed({ email: (data as any)?.artist_email ?? null, manager: (data as any)?.manager_email ?? null });
      setStep("done");
    } catch (e: any) { toast.error(e?.message ?? "Invalid code"); setStep("verify"); }
  };

  return (
    <div className="bg-cream border-4 border-ink chunk-shadow">
      {fee && (
        <div className="bg-magenta text-cream border-b-4 border-ink p-5">
          <p className="font-display text-xs uppercase opacity-70 mb-1">Est. Fee</p>
          {step === "done" ? (
            <p className="font-display text-3xl">{fee}</p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="font-display text-3xl blur-sm select-none" aria-hidden>\u20b9XX\u2013YYL</p>
              <span className="text-xs opacity-80">Revealed after verification</span>
            </div>
          )}
          <p className="text-xs opacity-70 mt-1">Indicative \u2014 final quote per booking</p>
        </div>
      )}
      <div className="p-5 space-y-4">
        <h3 className="font-display text-lg uppercase text-ink">Book {artist.name}</h3>
        {step === "idle" && (
          <>
            {!artist.open_to_bookings && (
              <p className="text-xs text-ink/60 bg-ink/5 p-3 border-2 border-ink/20">Currently not actively taking bookings \u2014 enquiries still welcome.</p>
            )}
            <p className="text-sm text-ink/70">Verify your email to reveal the booking contact and fee range.</p>
            <button onClick={() => setStep("form")} className="w-full bg-acid-yellow text-ink font-display px-4 py-3 border-4 border-ink chunk-shadow text-sm uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Get booking contact \u2192
            </button>
          </>
        )}
        {(step === "form" || step === "sending") && (
          <div className="space-y-3">
            {[["Your email *", "email", email, (v: string) => setEmail(v), "you@example.com"],
              ["Phone (optional)", "text", phone, (v: string) => setPhone(v), "+91 98765 43210"]].map(([label, type, val, setter, ph]: any) => (
              <label key={label} className="block">
                <span className="font-display text-xs uppercase text-ink block mb-1">{label}</span>
                <input type={type} value={val} onChange={(e) => setter(e.target.value)} placeholder={ph}
                  className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none" />
              </label>
            ))}
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">What\u2019s the booking for?</span>
              <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="Date, city, event type, budget range\u2026"
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none resize-none" />
            </label>
            <button onClick={sendOtp} disabled={step === "sending"}
              className="w-full bg-magenta text-cream font-display px-4 py-3 border-4 border-ink chunk-shadow text-sm uppercase disabled:opacity-60">
              {step === "sending" ? "Sending\u2026" : "Send verification code"}
            </button>
          </div>
        )}
        {(step === "verify" || step === "verifying") && (
          <div className="space-y-3">
            <p className="text-sm text-ink/70">We sent a 6-digit code to <strong>{email}</strong>.</p>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">Code</span>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-display text-2xl tracking-widest text-center focus:outline-none"
                placeholder="\u00b7 \u00b7 \u00b7 \u00b7 \u00b7 \u00b7" />
            </label>
            <button onClick={verifyOtp} disabled={step === "verifying"}
              className="w-full bg-acid-yellow text-ink font-display px-4 py-3 border-4 border-ink chunk-shadow text-sm uppercase disabled:opacity-60">
              {step === "verifying" ? "Verifying\u2026" : "Verify & reveal contact"}
            </button>
          </div>
        )}
        {step === "done" && revealed && (
          <div className="space-y-3">
            {revealed.email ? (
              <>
                <p className="font-display text-xs uppercase text-ink/60">Booking contact</p>
                <a href={`mailto:${revealed.email}`}
                  className="block font-display text-lg text-ink bg-acid-yellow border-4 border-ink p-3 break-all hover:bg-magenta hover:text-cream transition-colors">
                  \u2709 {revealed.email}
                </a>
              </>
            ) : (
              <p className="text-sm text-ink/80 bg-ink/5 p-3 border-2 border-ink/20">No direct contact on file \u2014 CCD will forward your enquiry.</p>
            )}
            {revealed.manager && revealed.manager !== revealed.email && (
              <a href={`mailto:${revealed.manager}`} className="block font-display text-sm text-ink/70 underline break-all">
                Manager: {revealed.manager}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimBanner({ artist }: { artist: Artist }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (artist.claimed_by) return null;
  const claim = async () => {
    if (!email.trim()) { toast.error("Email required"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/artist/dashboard?claim=${artist.id}`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your inbox for a magic link.");
    } catch (e: any) { toast.error(e?.message ?? "Failed to send link"); }
    finally { setBusy(false); }
  };
  return (
    <div className="border-4 border-ink bg-ink text-cream p-4 mt-2">
      <p className="font-display text-sm uppercase mb-2">Are you {artist.name}?</p>
      {sent ? (
        <p className="text-sm opacity-80">Magic link sent to {email} \u2014 click it to claim your profile.</p>
      ) : (
        <div className="flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
            className="flex-1 px-3 py-2 bg-cream text-ink border-2 border-cream font-sans text-sm focus:outline-none" />
          <button onClick={claim} disabled={busy}
            className="font-display text-xs uppercase px-4 py-2 bg-acid-yellow text-ink border-2 border-cream disabled:opacity-60">
            {busy ? "\u2026" : "Claim"}
          </button>
        </div>
      )}
    </div>
  );
}

function SoundCloudEmbed({ url, name }: { url: string; name: string }) {
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23E91E8C&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`;
  return (
    <div className="border-4 border-ink chunk-shadow">
      <iframe className="w-full" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={src} title={`${name} on SoundCloud`} />
    </div>
  );
}

function TourDates({ dates }: { dates: ArtistDate[] }) {
  const upcoming = dates
    .filter((d) => new Date(d.event_date + "T00:00:00") >= new Date(new Date().toDateString()))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  if (!upcoming.length) return null;
  return (
    <section className="container pb-10">
      <h2 className="font-display text-3xl uppercase text-ink mb-4 border-b-4 border-ink pb-2">Upcoming Dates</h2>
      <div className="space-y-3">
        {upcoming.map((d) => {
          const dt = new Date(d.event_date + "T00:00:00");
          return (
            <div key={d.id} className="flex items-center gap-4 border-4 border-ink bg-cream p-4 chunk-shadow">
              <div className="text-center min-w-[64px]">
                <p className="font-display text-2xl text-ink leading-none">{dt.getDate()}</p>
                <p className="font-display text-xs text-ink/60 uppercase">{dt.toLocaleString("en",{month:"short"})}</p>
                <p className="font-display text-xs text-ink/40">{dt.getFullYear()}</p>
              </div>
              <div className="flex-1">
                <p className="font-display text-lg text-ink uppercase">{d.city}</p>
                {d.venue && <p className="text-sm text-ink/70">{d.venue}</p>}
                {d.event_time && <p className="text-xs text-ink/50">{d.event_time}</p>}
                <span className={`text-xs font-display uppercase px-2 py-0.5 border-2 border-ink mt-1 inline-block ${
                  d.status==="confirmed"?"bg-acid-yellow text-ink":d.status==="tentative"?"bg-cream text-ink/60":"bg-ink text-cream"
                }`}>{d.status}</span>
              </div>
              {d.ticket_url && (
                <a href={d.ticket_url.startsWith("http")?d.ticket_url:`https://${d.ticket_url}`} target="_blank" rel="noreferrer"
                  className="font-display text-xs uppercase bg-magenta text-cream px-3 py-2 border-2 border-ink shrink-0">
                  Tickets \u2192
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Placeholder({ name }: { name: string }) {
  const i = name.split(/\s+/).slice(0,2).map((w)=>w[0]).join("").toUpperCase();
  return (
    <div className="w-full aspect-[16/9] bg-ink text-cream flex items-center justify-center border-b-4 border-ink">
      <span className="font-display text-[20vw] md:text-[14rem] leading-none tracking-tighter opacity-10">{i}</span>
    </div>
  );
}

const ArtistDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [a, setA] = useState<Artist | null>(null);
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [related, setRelated] = useState<Pick<Artist,"id"|"slug"|"name"|"based_city"|"from_city"|"genres"|"photo_url">[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("artists").select("*").eq("slug",slug).eq("status","approved").maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      const norm = (r: any): Artist => ({
        ...r,
        gallery: Array.isArray(r.gallery)?r.gallery:[],
        videos: Array.isArray(r.videos)?r.videos:[],
        genres: Array.isArray(r.genres)?r.genres:[],
        festivals: Array.isArray(r.festivals)?r.festivals:[],
        available_cities: Array.isArray(r.available_cities)?r.available_cities:[],
        open_to_bookings: r.open_to_bookings!==false,
      });
      setA(norm(data));
      const { data: dd } = await supabase.from("artist_dates").select("*").eq("artist_id",data.id).eq("is_public",true).order("event_date");
      setDates((dd??[]) as ArtistDate[]);
      const { data: rel } = await supabase.from("artists").select("id,slug,name,based_city,from_city,genres,photo_url").eq("status","approved").neq("slug",slug).limit(3);
      setRelated(rel??[]);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-cream"><Nav /><div className="container py-32 text-center font-display text-2xl text-ink animate-pulse">Loading\u2026</div></div>;
  if (notFound||!a) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink mb-4 uppercase">Artist not found.</p>
        <Link to="/artists" className="font-display underline text-magenta">\u2190 Back to artists</Link>
      </div>
    </div>
  );

  const city = a.based_city||a.from_city||"";
  const igUrl = a.instagram ? (a.instagram.startsWith("http")?a.instagram:`https://instagram.com/${a.instagram.replace(/^@/,"")}`) : null;
  const scUrl = ensureUrl(a.soundcloud);
  const bandcampUrl = ensureUrl(a.bandcamp);
  const spotifyUrl = ensureUrl(a.spotify);
  const webUrl = ensureUrl(a.website);
  const youtubeVideos = a.videos.filter((v)=>v.youtube_id);
  const hasUpcoming = dates.some((d)=>new Date(d.event_date+"T00:00:00")>=new Date(new Date().toDateString()));

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`${a.name} \u2014 ${a.genres[0]??"Electronic"} \u00b7 ${city||"India"} | Cats Can Dance`}
        description={a.why||a.bio?.slice(0,155)||`Book ${a.name} via Cats Can Dance.`}
        path={`/artists/${a.slug}`}
        jsonLd={{ "@context":"https://schema.org","@type":"MusicGroup",name:a.name,genre:a.genres.join(", "),image:a.photo_url??undefined,description:a.why||a.bio?.slice(0,155),url:`https://catscan.dance/artists/${a.slug}` }}
      />
      <Nav />

      <header className="pt-20">
        {a.photo_url?<img src={a.photo_url} alt={a.name} className="w-full aspect-[16/9] object-cover border-b-4 border-ink"/>:<Placeholder name={a.name}/>}
        <div className="container py-6 border-b-4 border-ink">
          <Link to="/artists" className="font-display text-xs uppercase text-ink/50 hover:text-magenta transition-colors">\u2190 All artists</Link>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-ink leading-none mt-2">{a.name}</h1>
          {a.members&&<p className="text-base text-ink/60 mt-2">{a.members}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {city&&<span className="text-xs font-display uppercase bg-ink text-cream px-2 py-1 border-2 border-ink">{city}</span>}
            {a.genres.map((g)=><span key={g} className="text-xs font-display uppercase bg-acid-yellow text-ink px-2 py-1 border-2 border-ink">{g}</span>)}
            {!a.open_to_bookings&&<span className="text-xs font-display uppercase text-ink/40 border-2 border-ink/20 px-2 py-1">Not actively booking</span>}
            {hasUpcoming&&<span className="text-xs font-display uppercase bg-magenta text-cream px-2 py-1 border-2 border-ink">Upcoming shows</span>}
          </div>
          {a.available_cities.length>0&&<p className="text-xs text-ink/50 mt-2 font-display">Available in: {a.available_cities.join(" \u00b7 ")}</p>}
        </div>
      </header>

      <section className="container py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {a.why&&(
            <div className="bg-acid-yellow border-4 border-ink p-5">
              <p className="font-display text-xs uppercase text-ink/60 mb-2">Why book them</p>
              <p className="text-ink font-medium text-lg leading-snug">{a.why}</p>
            </div>
          )}
          {a.bio&&(
            <div>
              <h2 className="font-display text-2xl uppercase text-ink mb-3 border-b-2 border-ink/20 pb-2">Bio</h2>
              <p className="text-ink/90 leading-relaxed whitespace-pre-line">{a.bio}</p>
            </div>
          )}
          {scUrl&&(
            <div>
              <h2 className="font-display text-2xl uppercase text-ink mb-3 border-b-2 border-ink/20 pb-2">Listen</h2>
              <SoundCloudEmbed url={scUrl} name={a.name}/>
            </div>
          )}
          {a.festivals.length>0&&(
            <div>
              <h2 className="font-display text-2xl uppercase text-ink mb-3 border-b-2 border-ink/20 pb-2">Stage Credits</h2>
              <div className="flex flex-wrap gap-2">
                {a.festivals.map((f)=><span key={f} className="text-sm font-display bg-cream border-4 border-ink px-3 py-1.5 chunk-shadow">{f}</span>)}
              </div>
            </div>
          )}
          {a.labels&&<p className="text-sm text-ink/70"><span className="font-display">Label:</span> {a.labels}</p>}
        </div>

        <aside className="space-y-5">
          <BookingPanel artist={a}/>
          <div className="bg-cream border-4 border-ink chunk-shadow p-4 space-y-2">
            <h3 className="font-display text-sm uppercase text-ink/70">Links</h3>
            <div className="flex flex-wrap gap-2">
              {igUrl&&<a href={igUrl} target="_blank" rel="noreferrer" className="text-xs font-display bg-ink text-cream px-3 py-2 border-2 border-ink hover:bg-magenta transition-colors">Instagram</a>}
              {scUrl&&<a href={scUrl} target="_blank" rel="noreferrer" className="text-xs font-display bg-[#ff5500] text-cream px-3 py-2 border-2 border-ink">SoundCloud</a>}
              {bandcampUrl&&<a href={bandcampUrl} target="_blank" rel="noreferrer" className="text-xs font-display bg-[#1da0c3] text-cream px-3 py-2 border-2 border-ink">Bandcamp</a>}
              {spotifyUrl&&<a href={spotifyUrl} target="_blank" rel="noreferrer" className="text-xs font-display bg-[#1db954] text-cream px-3 py-2 border-2 border-ink">Spotify</a>}
              {webUrl&&<a href={webUrl} target="_blank" rel="noreferrer" className="text-xs font-display bg-cream text-ink px-3 py-2 border-2 border-ink">Website \u2197</a>}
            </div>
          </div>
          <ClaimBanner artist={a}/>
        </aside>
      </section>

      <TourDates dates={dates}/>

      {youtubeVideos.length>0&&(
        <section className="container pb-10">
          <h2 className="font-display text-3xl uppercase text-ink mb-4 border-b-4 border-ink pb-2">Watch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {youtubeVideos.map((v)=>(
              <div key={v.youtube_id} className="border-4 border-ink chunk-shadow bg-ink">
                <div className="aspect-video">
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${v.youtube_id}`} title={v.title??a.name} allowFullScreen/>
                </div>
                {v.title&&<p className="p-3 font-display text-sm text-cream line-clamp-1">{v.title}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {a.gallery.length>0&&(
        <section className="container pb-10">
          <h2 className="font-display text-3xl uppercase text-ink mb-4 border-b-4 border-ink pb-2">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {a.gallery.map((g,i)=>(
              <figure key={i} className="border-4 border-ink chunk-shadow overflow-hidden cursor-zoom-in" onClick={()=>setLightbox(g.url)}>
                <img src={g.url} alt={g.caption??a.name} className="w-full h-48 object-cover hover:scale-105 transition-transform"/>
              </figure>
            ))}
          </div>
        </section>
      )}

      {lightbox&&(
        <div className="fixed inset-0 bg-ink/90 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="Gallery" className="max-w-full max-h-full object-contain border-4 border-cream"/>
        </div>
      )}

      {related.length>0&&(
        <section className="container pb-16">
          <h2 className="font-display text-3xl uppercase text-ink mb-4 border-b-4 border-ink pb-2">More Artists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r)=>(
              <Link key={r.id} to={`/artists/${r.slug}`} className="block bg-cream border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform overflow-hidden">
                {r.photo_url?<img src={r.photo_url} alt={r.name} className="w-full h-32 object-cover border-b-2 border-ink"/>:<div className="w-full h-32 bg-ink/5 border-b-2 border-ink flex items-center justify-center font-display text-4xl text-ink/20">{r.name[0]}</div>}
                <div className="p-4">
                  <p className="font-display text-xl text-ink uppercase">{r.name}</p>
                  <p className="text-xs text-ink/60 mt-1">{r.based_city||r.from_city||""}</p>
                  <p className="text-xs text-ink/50 mt-1">{r.genres?.slice(0,3).join(" \u00b7 ")}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <Footer/>
    </div>
  );
};

export default ArtistDetail;
