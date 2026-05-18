import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser, useClerk } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { toast } from "sonner";

/* ── Types ────────────────────────────────────────────────────────────────── */
type Artist = { id: string; slug: string; name: string; genres: string[]; based_city: string | null; photo_url: string | null };
type Event  = { id: string; slug: string; title: string; date: string; city: string; venue: string; status: string };

type Tab = "home" | "submit-artist" | "submit-event" | "my-artist";

/* ── Artist submit form ───────────────────────────────────────────────────── */
function SubmitArtistForm({ userEmail, onDone }: { userEmail: string; onDone: () => void }) {
  const [f, setF] = useState({
    name: "", bio: "", from_city: "", based_city: "",
    genres: "", instagram: "", soundcloud: "", spotify: "", website: "",
    booking_email: "", labels: "", submitter_role: "artist",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/artist-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          genres: f.genres.split(",").map(s => s.trim()).filter(Boolean),
          submitter_email: userEmail,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Submitted! We'll review and add you to the directory.");
      onDone();
    } catch { toast.error("Submission failed — try again"); }
    finally { setBusy(false); }
  };

  const field = (label: string, key: keyof typeof f, placeholder = "", type = "text") => (
    <label className="block">
      <span className="font-display text-xs uppercase text-ink block mb-1">{label}</span>
      <input type={type} value={f[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none text-sm" />
    </label>
  );

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-ink/60 text-sm">Fill in what you know — we'll complete the rest.</p>
      {field("Artist / Act Name *", "name", "e.g. Kohra, Lost Stories")}
      <div className="grid grid-cols-2 gap-3">
        {field("From City", "from_city", "e.g. Mumbai")}
        {field("Based In", "based_city", "e.g. Bengaluru")}
      </div>
      {field("Genres (comma-separated)", "genres", "e.g. Techno, House, Ambient")}
      <label className="block">
        <span className="font-display text-xs uppercase text-ink block mb-1">Bio</span>
        <textarea value={f.bio} onChange={e => set("bio", e.target.value)} rows={3}
          placeholder="Short bio — 2–3 sentences"
          className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none resize-none" />
      </label>
      {field("Instagram URL", "instagram", "https://instagram.com/...")}
      {field("SoundCloud URL", "soundcloud", "https://soundcloud.com/...")}
      {field("Spotify URL", "spotify", "https://open.spotify.com/artist/...")}
      {field("Website", "website", "https://...")}
      {field("Booking Email", "booking_email", "booking@...")}
      {field("Label(s)", "labels", "e.g. Anjunadeep, Qilla Records")}
      <label className="block">
        <span className="font-display text-xs uppercase text-ink block mb-1">You are</span>
        <select value={f.submitter_role} onChange={e => set("submitter_role", e.target.value)}
          className="w-full border-4 border-ink px-3 py-2 bg-cream font-display text-sm focus:outline-none">
          <option value="artist">The artist</option>
          <option value="manager">Manager / Label rep</option>
          <option value="fan">Fan / Community member</option>
        </select>
      </label>
      <button onClick={submit} disabled={busy}
        className="w-full bg-magenta text-cream font-display text-sm uppercase px-4 py-3 border-4 border-ink disabled:opacity-60 hover:bg-ink transition-colors">
        {busy ? "Submitting…" : "Submit Artist →"}
      </button>
    </div>
  );
}

/* ── Event submit form ────────────────────────────────────────────────────── */
function SubmitEventForm({ userEmail, onDone }: { userEmail: string; onDone: () => void }) {
  const [f, setF] = useState({
    title: "", date: "", city: "", venue: "", blurb: "",
    lineup_raw: "", ticket_url: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.title.trim() || !f.city.trim()) { toast.error("Title and city required"); return; }
    setBusy(true);
    try {
      // Submit as curated event (pending review)
      const res = await fetch("/api/artist-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `[EVENT] ${f.title}`,
          bio: `${f.blurb}\n\nLineup: ${f.lineup_raw}\nTickets: ${f.ticket_url}`,
          from_city: f.city,
          based_city: `${f.city} @ ${f.venue} on ${f.date}`,
          submitter_email: userEmail,
          submitter_role: "event_submitter",
          notes: JSON.stringify({ ...f, type: "event_submission" }),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Event submitted! We'll add it to the calendar.");
      onDone();
    } catch { toast.error("Submission failed"); }
    finally { setBusy(false); }
  };

  const field = (label: string, key: keyof typeof f, placeholder = "", type = "text") => (
    <label className="block">
      <span className="font-display text-xs uppercase text-ink block mb-1">{label}</span>
      <input type={type} value={f[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none" />
    </label>
  );

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-ink/60 text-sm">Submit an upcoming event — we'll verify and add it to the calendar.</p>
      {field("Event Name *", "title", "e.g. Warehouse Wednesday")}
      {field("Date", "date", "e.g. 2026-06-14", "date")}
      <div className="grid grid-cols-2 gap-3">
        {field("City *", "city", "e.g. Bengaluru")}
        {field("Venue", "venue", "e.g. Bhavana")}
      </div>
      <label className="block">
        <span className="font-display text-xs uppercase text-ink block mb-1">Description</span>
        <textarea value={f.blurb} onChange={e => set("blurb", e.target.value)} rows={3}
          placeholder="What's the vibe?"
          className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none resize-none" />
      </label>
      {field("Lineup (comma-separated)", "lineup_raw", "e.g. Kohra, Prismer, DJ Pants")}
      {field("Ticket / RSVP Link", "ticket_url", "https://...")}
      <button onClick={submit} disabled={busy}
        className="w-full bg-acid-yellow text-ink font-display text-sm uppercase px-4 py-3 border-4 border-ink disabled:opacity-60 hover:bg-magenta hover:text-cream transition-colors">
        {busy ? "Submitting…" : "Submit Event →"}
      </button>
    </div>
  );
}

/* ── My Artist (claimed profile) ──────────────────────────────────────────── */
function MyArtist({ userId }: { userId: string }) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/artists/by-user?user_id=${userId}`)
      .then(r => r.json()).then(d => { setArtist(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <p className="text-ink/40 font-display animate-pulse">Loading…</p>;
  if (!artist) return (
    <div className="max-w-xl">
      <p className="text-ink/70 mb-4">No artist profile linked to your account yet.</p>
      <p className="text-sm text-ink/50 mb-6">
        Browse the <a href="/artists" className="underline text-magenta">artists directory</a>, find your
        profile, and click "Are you [name]?" to link it. Or submit yourself using the form above.
      </p>
    </div>
  );

  return (
    <div className="max-w-xl">
      <div className="border-4 border-ink p-5 bg-acid-yellow flex items-center gap-4 mb-6">
        {artist.photo_url
          ? <img src={artist.photo_url} alt={artist.name} className="w-14 h-14 rounded-full object-cover border-2 border-ink" />
          : <div className="w-14 h-14 rounded-full bg-ink flex items-center justify-center"><span className="font-display text-cream text-xl">{artist.name[0]}</span></div>
        }
        <div>
          <p className="font-display text-xl text-ink uppercase">{artist.name}</p>
          <p className="text-ink/60 text-sm">{artist.based_city || artist.from_city || ""}</p>
        </div>
        <a href={`/artist/dashboard`}
          className="ml-auto font-display text-xs uppercase bg-ink text-cream px-4 py-2 border-2 border-ink hover:bg-magenta transition-colors">
          Edit Profile →
        </a>
      </div>
      <a href={`/artists/${artist.slug}`}
        className="font-display text-sm underline text-magenta">
        View public profile →
      </a>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────────────────────── */
export default function UserDashboard() {
  const { user, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [submitDone, setSubmitDone] = useState<"artist" | "event" | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";
  const name = user?.firstName ?? email.split("@")[0];

  if (!isLoaded) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-ink border-t-magenta rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream"><Nav />
      <SEO title="Sign In | Cats Can Dance" description="Sign in to your CCD account." path="/dashboard" />
      <div className="container py-32 max-w-md text-center">
        <p className="font-display text-5xl text-ink uppercase mb-4">Join the Pack</p>
        <p className="text-ink/60 mb-8">Sign in to save artists, submit events, and manage your profile.</p>
        <button onClick={() => openSignIn({ afterSignInUrl: "/dashboard" })}
          className="w-full bg-magenta text-cream font-display text-lg uppercase px-6 py-4 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
          Sign In / Sign Up →
        </button>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "home", label: "Home", emoji: "🏠" },
    { id: "submit-artist", label: "Submit Artist", emoji: "🎧" },
    { id: "submit-event", label: "Submit Event", emoji: "📅" },
    { id: "my-artist", label: "My Artist Profile", emoji: "⭐" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Dashboard | Cats Can Dance" description="Your CCD dashboard." path="/dashboard" noindex />
      <Nav />

      <div className="pt-[60px] md:pt-[72px]">
        {/* Header */}
        <div className="bg-ink border-b-4 border-ink text-cream px-4 md:px-8 py-6">
          <div className="max-w-screen-lg mx-auto flex items-center justify-between">
            <div>
              <p className="font-display text-xs uppercase text-cream/40 mb-1">Welcome back</p>
              <h1 className="font-display text-2xl md:text-3xl uppercase">{name}</h1>
              <p className="text-cream/40 text-sm mt-0.5">{email}</p>
            </div>
            <button onClick={() => signOut().then(() => router.push("/"))}
              className="font-display text-xs uppercase px-4 py-2 border-2 border-cream/20 text-cream/50 hover:border-cream hover:text-cream transition-colors">
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-ink border-b-4 border-cream/10 overflow-x-auto">
          <div className="max-w-screen-lg mx-auto flex">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSubmitDone(null); }}
                className={`font-display text-sm uppercase px-4 py-3 whitespace-nowrap border-r border-cream/10 transition-colors ${
                  tab === t.id ? "bg-cream text-ink" : "text-cream/50 hover:text-cream"
                }`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-8">

          {tab === "home" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => setTab("submit-artist")}
                  className="border-4 border-ink p-6 text-left bg-cream hover:bg-acid-yellow transition-colors group">
                  <p className="text-3xl mb-3">🎧</p>
                  <p className="font-display text-xl text-ink uppercase">Add an Artist</p>
                  <p className="text-sm text-ink/60 mt-1">Submit a DJ or producer to the CCD directory</p>
                </button>
                <button onClick={() => setTab("submit-event")}
                  className="border-4 border-ink p-6 text-left bg-cream hover:bg-acid-yellow transition-colors">
                  <p className="text-3xl mb-3">📅</p>
                  <p className="font-display text-xl text-ink uppercase">Submit an Event</p>
                  <p className="text-sm text-ink/60 mt-1">Got a gig coming up? Get it listed</p>
                </button>
                <button onClick={() => setTab("my-artist")}
                  className="border-4 border-ink p-6 text-left bg-cream hover:bg-acid-yellow transition-colors">
                  <p className="text-3xl mb-3">⭐</p>
                  <p className="font-display text-xl text-ink uppercase">My Artist Profile</p>
                  <p className="text-sm text-ink/60 mt-1">Claim and manage your artist page</p>
                </button>
              </div>

              <div className="border-t-4 border-ink pt-6">
                <h2 className="font-display text-lg uppercase text-ink mb-4">Quick Links</h2>
                <div className="flex flex-wrap gap-3">
                  <a href="/artists" className="font-display text-sm uppercase px-4 py-2 border-4 border-ink hover:bg-ink hover:text-cream transition-colors">Browse Artists</a>
                  <a href="/events" className="font-display text-sm uppercase px-4 py-2 border-4 border-ink hover:bg-ink hover:text-cream transition-colors">See Events</a>
                  <a href="/artist/dashboard" className="font-display text-sm uppercase px-4 py-2 border-4 border-ink bg-acid-yellow hover:bg-magenta hover:text-cream transition-colors">Artist Portal</a>
                </div>
              </div>
            </div>
          )}

          {tab === "submit-artist" && (
            <div>
              <h2 className="font-display text-2xl uppercase text-ink mb-2">Submit an Artist</h2>
              {submitDone === "artist" ? (
                <div className="border-4 border-ink bg-acid-yellow p-8 max-w-md text-center">
                  <p className="font-display text-3xl text-ink mb-2">✓ Submitted!</p>
                  <p className="text-ink/70 mb-4">We'll review and add them to the directory shortly.</p>
                  <button onClick={() => setSubmitDone(null)} className="font-display text-sm uppercase underline text-ink/50">Submit another</button>
                </div>
              ) : (
                <SubmitArtistForm userEmail={email} onDone={() => setSubmitDone("artist")} />
              )}
            </div>
          )}

          {tab === "submit-event" && (
            <div>
              <h2 className="font-display text-2xl uppercase text-ink mb-2">Submit an Event</h2>
              {submitDone === "event" ? (
                <div className="border-4 border-ink bg-acid-yellow p-8 max-w-md text-center">
                  <p className="font-display text-3xl text-ink mb-2">✓ Submitted!</p>
                  <p className="text-ink/70 mb-4">We'll verify and add it to the calendar.</p>
                  <button onClick={() => setSubmitDone(null)} className="font-display text-sm uppercase underline text-ink/50">Submit another</button>
                </div>
              ) : (
                <SubmitEventForm userEmail={email} onDone={() => setSubmitDone("event")} />
              )}
            </div>
          )}

          {tab === "my-artist" && (
            <div>
              <h2 className="font-display text-2xl uppercase text-ink mb-2">My Artist Profile</h2>
              <MyArtist userId={user.id} />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
