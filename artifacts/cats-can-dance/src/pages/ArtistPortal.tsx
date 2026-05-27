import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "@/lib/compat-router";
import { useUser, useClerk } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/supabase-shim";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Artist = {
  id: string; slug: string; name: string; members: string | null;
  from_city: string | null; based_city: string | null;
  genres: string[]; festivals: string[]; bio: string | null; why: string | null;
  instagram: string | null; soundcloud: string | null; bandcamp: string | null;
  spotify: string | null; website: string | null;
  booking_email: string | null; manager_email: string | null;
  labels: string | null; photo_url: string | null;
  fee_min_inr: number | null; fee_max_inr: number | null;
  open_to_bookings: boolean; available_cities: string[];
};

type ArtistDate = {
  id: string; city: string; venue: string | null; event_date: string;
  event_time: string | null; status: string; ticket_url: string | null;
  notes: string | null; is_public: boolean;
};

type Booking = {
  id: string; requester_email: string; requester_phone: string | null;
  purpose: string | null; created_at: string;
  verified_at: string | null; forward_requested: boolean;
};

/* ─── Profile Editor ─────────────────────────────────────────────────────── */
function ProfileEditor({ artist, onSaved }: { artist: Artist; onSaved: (a: Artist) => void }) {
  const [form, setForm] = useState({
    bio: artist.bio ?? "",
    why: artist.why ?? "",
    instagram: artist.instagram ?? "",
    soundcloud: artist.soundcloud ?? "",
    bandcamp: artist.bandcamp ?? "",
    spotify: artist.spotify ?? "",
    website: artist.website ?? "",
    booking_email: artist.booking_email ?? "",
    manager_email: artist.manager_email ?? "",
    labels: artist.labels ?? "",
    open_to_bookings: artist.open_to_bookings,
    available_cities: (artist.available_cities ?? []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        bio: form.bio || null,
        why: form.why || null,
        instagram: form.instagram || null,
        soundcloud: form.soundcloud || null,
        bandcamp: form.bandcamp || null,
        spotify: form.spotify || null,
        website: form.website || null,
        booking_email: form.booking_email || null,
        manager_email: form.manager_email || null,
        labels: form.labels || null,
        open_to_bookings: form.open_to_bookings,
        available_cities: form.available_cities.split(",").map((s: string) => s.trim()).filter(Boolean),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("artists")
        .update(patch)
        .eq("id", artist.id)
        .select()
        .single();
      if (error) throw error;
      toast.success("Profile updated!");
      onSaved(data as Artist);
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block">
      <span className="font-display text-xs uppercase text-ink block mb-1">{label}</span>
      {children}
    </label>
  );

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl uppercase text-ink border-b-4 border-ink pb-2">Edit Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Bio">
            <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={5} className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none resize-y" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Why book you (one-liner hook for promoters)">
            <input value={form.why} onChange={(e) => setForm(f => ({ ...f, why: e.target.value }))}
              className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none" />
          </Field>
        </div>
        {([
          ["Instagram handle (no @)", "instagram"],
          ["SoundCloud URL", "soundcloud"],
          ["Bandcamp URL", "bandcamp"],
          ["Spotify URL", "spotify"],
          ["Website URL", "website"],
          ["Booking email", "booking_email"],
          ["Manager email", "manager_email"],
          ["Labels", "labels"],
          ["Cities available in (comma-separated)", "available_cities"],
        ] as [string, keyof typeof form][]).map(([label, key]) => (
          <Field key={key} label={label}>
            <input value={form[key] as string}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none" />
          </Field>
        ))}
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.open_to_bookings}
          onChange={(e) => setForm(f => ({ ...f, open_to_bookings: e.target.checked }))}
          className="w-5 h-5 accent-magenta" />
        <span className="font-display text-sm uppercase text-ink">Open to bookings</span>
      </label>
      <button onClick={save} disabled={saving}
        className="bg-magenta text-cream font-display px-6 py-3 border-4 border-ink chunk-shadow uppercase disabled:opacity-60">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}

/* ─── Date Manager ───────────────────────────────────────────────────────── */
const emptyDate = () => ({ city: "", venue: "", event_date: "", event_time: "", status: "confirmed", ticket_url: "", notes: "", is_public: true });

function DateManager({ artistId }: { artistId: string }) {
  const [dates, setDates] = useState<ArtistDate[]>([]);
  const [form, setForm] = useState(emptyDate());
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("artist_dates")
      .select("*")
      .eq("artist_id", artistId)
      .order("event_date");
    setDates((data ?? []) as ArtistDate[]);
  }, [artistId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.city || !form.event_date) { toast.error("City and date required"); return; }
    setBusy(true);
    try {
      if (editId) {
        const { error } = await supabase.from("artist_dates").update({ ...form, created_by: "artist" }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artist_dates").insert({ ...form, artist_id: artistId, created_by: "artist" });
        if (error) throw error;
      }
      toast.success(editId ? "Date updated" : "Date added");
      setForm(emptyDate()); setEditId(null); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this date?")) return;
    await supabase.from("artist_dates").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const edit = (d: ArtistDate) => {
    setEditId(d.id);
    setForm({ city: d.city, venue: d.venue ?? "", event_date: d.event_date,
               event_time: d.event_time ?? "", status: d.status,
               ticket_url: d.ticket_url ?? "", notes: d.notes ?? "", is_public: d.is_public });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl uppercase text-ink border-b-4 border-ink pb-2">Tour Dates</h2>
      <div className="border-4 border-ink p-5 bg-cream chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/70">{editId ? "Edit Date" : "Add Date"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([["City *", "city", "text"], ["Venue", "venue", "text"], ["Date *", "event_date", "date"], ["Time", "event_time", "text"]] as [string,string,string][]).map(([label, key, type]) => (
            <label key={key} className="block">
              <span className="font-display text-xs uppercase text-ink block mb-1">{label}</span>
              <input type={type} value={(form as any)[key]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none" />
            </label>
          ))}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink block mb-1">Status</span>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border-4 border-ink px-3 py-2 bg-cream font-display text-ink focus:outline-none">
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Tentative</option>
              <option value="available">Available (open slot)</option>
            </select>
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink block mb-1">Ticket URL</span>
            <input value={form.ticket_url}
              onChange={(e) => setForm(f => ({ ...f, ticket_url: e.target.value }))}
              className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none" />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_public}
            onChange={(e) => setForm(f => ({ ...f, is_public: e.target.checked }))}
            className="w-4 h-4 accent-magenta" />
          <span className="font-display text-xs uppercase text-ink">Show on public profile</span>
        </label>
        <div className="flex gap-3">
          <button onClick={save} disabled={busy}
            className="bg-magenta text-cream font-display px-5 py-2.5 border-4 border-ink chunk-shadow uppercase text-sm disabled:opacity-60">
            {busy ? "…" : editId ? "Update" : "Add date"}
          </button>
          {editId && <button onClick={() => { setEditId(null); setForm(emptyDate()); }}
            className="font-display text-sm uppercase text-ink/60 underline">Cancel</button>}
        </div>
      </div>
      {dates.length === 0
        ? <p className="text-ink/50 font-display text-sm">No dates yet. Add your upcoming shows above.</p>
        : <div className="space-y-3">
          {dates.sort((a, b) => a.event_date.localeCompare(b.event_date)).map((d) => (
            <div key={d.id} className="flex items-center gap-4 border-4 border-ink bg-cream p-4">
              <div className="flex-1">
                <p className="font-display text-lg uppercase text-ink">{d.event_date} — {d.city}</p>
                {d.venue && <p className="text-sm text-ink/70">{d.venue}</p>}
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs font-display uppercase px-2 py-0.5 border border-ink ${d.status==="confirmed"?"bg-acid-yellow":d.status==="tentative"?"bg-cream text-ink/60":"bg-ink text-cream"}`}>{d.status}</span>
                  {!d.is_public && <span className="text-xs font-display uppercase px-2 py-0.5 border border-ink/30 text-ink/40">Private</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(d)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors">Edit</button>
                <button onClick={() => del(d.id)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-cream transition-colors">Del</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

/* ─── Booking Inbox ──────────────────────────────────────────────────────── */
function BookingInbox({ artistId }: { artistId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("booking_requests")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setBookings((data ?? []) as Booking[]); setLoading(false); });
  }, [artistId]);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl uppercase text-ink border-b-4 border-ink pb-2">Booking Requests</h2>
      {loading
        ? <p className="font-display text-sm text-ink/50 animate-pulse">Loading…</p>
        : bookings.length === 0
        ? <p className="font-display text-sm text-ink/50">No booking requests yet.</p>
        : <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="border-4 border-ink bg-cream p-5 chunk-shadow">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-display text-lg text-ink">{b.requester_email}</p>
                  {b.requester_phone && <p className="text-sm text-ink/60">{b.requester_phone}</p>}
                  {b.purpose && <p className="text-sm text-ink/80 mt-2 whitespace-pre-line">{b.purpose}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-xs text-ink/50">{new Date(b.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
                  {b.verified_at && <span className="font-display text-xs bg-acid-yellow text-ink px-2 py-0.5 border border-ink">Verified</span>}
                </div>
              </div>
              <a href={`mailto:${b.requester_email}`}
                className="mt-3 inline-block font-display text-xs uppercase bg-magenta text-cream px-4 py-2 border-2 border-ink">
                Reply →
              </a>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

/* ─── Marketplace Inbox ──────────────────────────────────────────────────── */
function MarketplaceInbox({ artistSlug, artistName }: { artistSlug: string; artistName: string }) {
  const [inquiries, setInquiries] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/booking-inquiries?artist_slug=${encodeURIComponent(artistSlug)}`)
      .then(r => r.json())
      .then(data => { setInquiries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [artistSlug]);

  return (
    <div className="space-y-5">
      <div className="border-b-4 border-ink pb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl uppercase text-ink">Booking Inquiries</h2>
          <p className="text-sm text-ink/60 mt-1">Direct booking requests from venues and promoters via <a href="/book" className="underline text-magenta">/book</a></p>
        </div>
        {inquiries.length > 0 && (
          <span className="font-display text-xs uppercase bg-acid-yellow text-ink px-3 py-1 border-2 border-ink">
            {inquiries.length} request{inquiries.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {loading ? (
        <p className="font-display text-sm text-ink/50 animate-pulse">Loading…</p>
      ) : inquiries.length === 0 ? (
        <div className="border-4 border-ink bg-acid-yellow p-8 text-center">
          <p className="font-display text-lg text-ink mb-2">No Inquiries Yet</p>
          <p className="text-sm text-ink/60">Booking inquiries sent through <a href="/book" className="underline">catscandance.com/book</a> will appear here.</p>
          <p className="text-sm text-ink/50 mt-2">Make sure your profile shows <strong>open_to_bookings: true</strong> and has cities set.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((b) => (
            <div key={b.id} className="border-4 border-ink bg-cream p-5 chunk-shadow">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink">{b.requester_email}</p>
                  {b.requester_phone && <p className="text-sm text-ink/60 mt-0.5">{b.requester_phone}</p>}
                  {b.purpose && (
                    <div className="mt-2 space-y-1">
                      {b.purpose.split(" | ").map((part, i) => (
                        <p key={i} className="text-sm text-ink/80">{part}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-xs text-ink/50">
                    {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <span className="font-display text-[10px] uppercase bg-electric-blue text-cream px-2 py-0.5 border border-ink mt-1 inline-block">
                    Marketplace
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <a href={`mailto:${b.requester_email}?subject=Re: Booking request for ${artistName}`}
                  className="font-display text-xs uppercase bg-magenta text-cream px-4 py-2 border-2 border-ink hover:bg-ink transition-colors">
                  Reply by Email →
                </a>
                {b.requester_phone && (
                  <a href={`https://wa.me/${b.requester_phone.replace(/\D/g, "")}?text=Hi, I received your booking inquiry for ${artistName}`}
                    target="_blank" rel="noreferrer"
                    className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-2 border-2 border-ink hover:bg-orange transition-colors">
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
type Tab = "profile" | "dates" | "bookings" | "inquiries";

const ArtistPortal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimId = searchParams.get("claim");

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.href : "/artist/dashboard",
  )}`;

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      setLoading(true);

      if (claimId) {
        setClaiming(true);
        try {
          await api.post(`/artists/${claimId}/claim`, { userId: user.id });
          toast.success("Profile claimed!");
        } catch (e: any) {
          toast.error("Could not claim profile: " + e.message);
        }
        setClaiming(false);
      }

      try {
        const data = await api.get<any>("/artists/by-user");
        setArtist(
          data
            ? {
                ...data,
                genres: Array.isArray(data.genres) ? data.genres : [],
                festivals: Array.isArray(data.festivals) ? data.festivals : [],
                gallery: Array.isArray(data.gallery) ? data.gallery : [],
                videos: Array.isArray(data.videos) ? data.videos : [],
                available_cities: Array.isArray(data.available_cities) ? data.available_cities : [],
                open_to_bookings: data.open_to_bookings !== false,
              } as Artist
            : null,
        );
      } catch {
        setArtist(null);
      }

      setLoading(false);
    })();
  }, [isLoaded, user, claimId]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/artists");
  };

  if (!isLoaded || (!user && loading)) return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-2xl text-ink animate-pulse">Loading…</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream">
      <SEO title="Artist Portal | Cats Can Dance" description="Manage your artist profile, tour dates, and booking requests." path="/artist/dashboard" />
      <Nav />
      <div className="container py-24 max-w-lg">
        <h1 className="font-display text-4xl uppercase text-ink mb-2">Artist Portal</h1>
        <p className="text-ink/70 mb-8">
          Sign in to manage your profile, tour dates, and booking requests.
        </p>
        <Link
          to={signInUrl}
          className="inline-block w-full text-center bg-magenta text-cream font-display px-6 py-4 border-4 border-ink chunk-shadow uppercase text-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
        >
          Sign in
        </Link>
      </div>
      <Footer />
    </div>
  );

  if (loading || claiming) return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-2xl text-ink animate-pulse">
          {claiming ? "Claiming profile…" : "Loading…"}
        </p>
      </div>
    </div>
  );

  if (!artist) return (
    <div className="min-h-screen bg-cream">
      <SEO title="Artist Portal | Cats Can Dance" description="" path="/artist/dashboard" />
      <Nav />
      <div className="container py-24 max-w-2xl">
        <h1 className="font-display text-4xl uppercase text-ink mb-4">No Profile Linked</h1>
        <p className="text-ink/70 mb-6">
          You're signed in as <strong>{userEmail}</strong> but no artist profile is linked yet.
        </p>
        <p className="text-ink/70 mb-4">
          Go to the{" "}
          <Link to="/artists" className="underline text-magenta">artists directory</Link>,
          find your profile, and click "Are you [name]?" to link it to your account.
        </p>
        <button onClick={handleSignOut} className="font-display text-sm uppercase underline text-ink/60">
          Sign out
        </button>
      </div>
      <Footer />
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "dates", label: "Dates" },
    { key: "bookings", label: "Bookings" },
    { key: "inquiries", label: "📩 Inquiries" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <SEO title={`${artist.name} Portal | Cats Can Dance`} description="" path="/artist/dashboard" />
      <Nav />
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-4 border-ink pb-6">
          <div>
            <p className="font-display text-xs uppercase text-ink/50 mb-1">Artist Portal</p>
            <h1 className="font-display text-4xl uppercase text-ink">{artist.name}</h1>
            <p className="text-sm text-ink/60 mt-1">{userEmail}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/artists/${artist.slug}`}
              target="_blank"
              className="font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-acid-yellow text-ink chunk-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform"
            >
              View public profile ↗
            </Link>
            <button
              onClick={handleSignOut}
              className="font-display text-xs uppercase px-4 py-2 border-4 border-ink text-ink/60 hover:bg-ink hover:text-cream transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-8 border-b-4 border-ink">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-display text-sm uppercase px-5 py-2.5 border-4 border-b-0 border-ink transition-colors ${
                tab === t.key ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfileEditor artist={artist} onSaved={setArtist} />}
        {tab === "dates" && <DateManager artistId={artist.id} />}
        {tab === "bookings" && <BookingInbox artistId={artist.id} />}
        {tab === "inquiries" && <MarketplaceInbox artistSlug={artist.slug} artistName={artist.name} />}
      </div>
      <Footer />
    </div>
  );
};

export default ArtistPortal;
