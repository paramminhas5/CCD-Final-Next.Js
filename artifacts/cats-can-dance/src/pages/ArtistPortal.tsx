import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/supabase-shim";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  CheckCircle2, AlertCircle, ExternalLink, Music, Calendar,
  Inbox, FileText, BookOpen, Star, Disc3, Newspaper,
  Upload, Plus, Trash2, Pencil, X, Settings2,
} from "lucide-react";

// ── Lazy-load heavy portal tabs ───────────────────────────────────────────────
const BookingKanban  = dynamic(() => import("@/components/portal/BookingKanban"),  { loading: () => <div className="h-32 border-4 border-ink animate-pulse bg-ink/5" /> });
const CalendarManager = dynamic(() => import("@/components/portal/CalendarManager"), { loading: () => <div className="h-32 border-4 border-ink animate-pulse bg-ink/5" /> });
const PackagesManager = dynamic(() => import("@/components/portal/PackagesManager"), { loading: () => <div className="h-32 border-4 border-ink animate-pulse bg-ink/5" /> });

// ── Image upload — dynamic to avoid SSR canvas issues ─────────────────────────
const ImageUploadRaw = dynamic(() => import("@/components/portal/ImageUpload"), { ssr: false });
function ImageUploadWidget({ currentUrl, onUpload }: { currentUrl?: string | null; onUpload: (url: string) => void }) {
  return <ImageUploadRaw currentUrl={currentUrl} onUpload={onUpload} label="Upload Photo" hint="JPG, PNG or WebP · Max 5 MB · Drag & drop or click" aspectClass="aspect-square max-w-[200px]" />;
}

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
  claimed_by: string | null;
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

type Milestone = {
  id: string; type: string; title: string; description: string | null;
  date: string; year: number | null; city: string | null; venue: string | null;
  is_featured: boolean; importance: number;
};

type Press = {
  id: string; title: string; publication: string; author: string | null;
  excerpt: string | null; url: string | null; type: string;
  date_published: string | null; is_featured: boolean; quote_for_epk: string | null;
};

type Discography = {
  id: string; title: string; release_type: string; release_date: string | null;
  year: number | null; label: string | null; artwork_url: string | null;
  spotify_url: string | null; soundcloud_url: string | null;
  bandcamp_url: string | null; description: string | null;
};



/* ─── Profile completion score ──────────────────────────────────────────── */
function profileScore(a: Artist): { score: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!a.bio && a.bio.length > 50, "Bio (50+ chars)"],
    [!!a.photo_url, "Profile photo"],
    [!!a.instagram, "Instagram"],
    [!!a.soundcloud || !!a.spotify, "SoundCloud or Spotify"],
    [(a.genres ?? []).length > 0, "Genres"],
    [!!a.booking_email, "Booking email"],
    [(a.available_cities ?? []).length > 0, "Available cities"],
    [!!a.fee_min_inr || !!a.fee_max_inr, "Fee range"],
    [!!a.why, "Booking hook (why book you)"],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  const score = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return { score, missing };
}

function ProfileCompletion({ artist }: { artist: Artist }) {
  const { score, missing } = profileScore(artist);
  const color = score >= 80 ? "bg-lime" : score >= 50 ? "bg-acid-yellow" : "bg-magenta";
  return (
    <div className="border-4 border-ink bg-cream chunk-shadow p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-sm uppercase text-ink">Profile Completeness</p>
        <span className={`font-display text-lg px-3 py-0.5 border-2 border-ink ${color} text-ink`}>{score}%</span>
      </div>
      <div className="h-3 border-2 border-ink bg-cream overflow-hidden mb-3">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missing.map(m => (
            <span key={m} className="flex items-center gap-1 text-[10px] font-display uppercase text-ink/60 border border-ink/30 px-2 py-0.5">
              <AlertCircle className="w-3 h-3" /> {m}
            </span>
          ))}
        </div>
      )}
      {missing.length === 0 && (
        <p className="flex items-center gap-1 text-sm text-ink font-display">
          <CheckCircle2 className="w-4 h-4 text-lime" /> Profile complete — you're searchable to promoters!
        </p>
      )}
    </div>
  );
}



/* ─── Profile Editor ─────────────────────────────────────────────────────── */
function ProfileEditor({ artist, onSaved }: { artist: Artist; onSaved: (a: Artist) => void }) {
  const [form, setForm] = useState({
    bio: artist.bio ?? "",
    why: artist.why ?? "",
    photo_url: artist.photo_url ?? "",
    genres: (artist.genres ?? []).join(", "),
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
    fee_min_inr: artist.fee_min_inr?.toString() ?? "",
    fee_max_inr: artist.fee_max_inr?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const userId = (typeof window !== "undefined" && (window as any).__clerk_user_id) || null;
      // Resolve user_id from Clerk — accessed from the outer component via useUser()
      // We pass it in via the _userId ref injected by the parent (see usage below).
      const patchFields = {
        bio: form.bio || null, why: form.why || null,
        photo_url: form.photo_url || null,
        genres: form.genres.split(",").map(s => s.trim()).filter(Boolean),
        instagram: form.instagram || null, soundcloud: form.soundcloud || null,
        bandcamp: form.bandcamp || null, spotify: form.spotify || null,
        website: form.website || null, booking_email: form.booking_email || null,
        manager_email: form.manager_email || null, labels: form.labels || null,
        open_to_bookings: form.open_to_bookings,
        available_cities: form.available_cities.split(",").map(s => s.trim()).filter(Boolean),
        fee_min_inr: form.fee_min_inr ? parseInt(form.fee_min_inr) : null,
        fee_max_inr: form.fee_max_inr ? parseInt(form.fee_max_inr) : null,
      };
      // Use the dedicated self-update endpoint which enforces ownership via claimed_by.
      // The user_id field is required for ownership verification.
      const res = await fetch(`/api/artists/${artist.id}/self-update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: artist.claimed_by, ...patchFields }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");
      toast.success("Profile updated!");
      onSaved({ ...artist, ...patchFields } as Artist);
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block">
      <span className="font-display text-xs uppercase text-ink/70 block mb-1">{label}</span>
      {children}
    </label>
  );
  const inp = "w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors";

  return (
    <div className="space-y-6">
      <ProfileCompletion artist={{ ...artist, ...{ bio: form.bio, photo_url: form.photo_url, instagram: form.instagram, soundcloud: form.soundcloud, spotify: form.spotify, genres: form.genres.split(",").map(s=>s.trim()).filter(Boolean), booking_email: form.booking_email, available_cities: form.available_cities.split(",").map(s=>s.trim()).filter(Boolean), fee_min_inr: form.fee_min_inr ? parseInt(form.fee_min_inr) : null, fee_max_inr: form.fee_max_inr ? parseInt(form.fee_max_inr) : null, why: form.why }}} />
      <div className="border-4 border-ink bg-cream p-5 chunk-shadow space-y-5">
        <h3 className="font-display text-sm uppercase text-ink/60">Core info</h3>
        <F label="Photo URL (paste image URL — or use the Upload button below)">
          <input value={form.photo_url} onChange={e => setForm(f=>({...f,photo_url:e.target.value}))} placeholder="https://..." className={inp} />
        </F>
        {/* ── Image Upload Component ── */}
        {typeof window !== "undefined" && (
          <div className="pt-2">
            {/* Lazy import to avoid SSR issues */}
            <ImageUploadWidget
              currentUrl={form.photo_url}
              onUpload={(url) => setForm(f => ({ ...f, photo_url: url }))}
            />
          </div>
        )}
        <F label="Bio">
          <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} rows={5} className={inp + " resize-y"} placeholder="Tell your story…" />
        </F>
        <F label="Booking hook — why book you? (one punchy line for promoters)">
          <input value={form.why} onChange={e => setForm(f=>({...f,why:e.target.value}))} className={inp} placeholder="e.g. Genre-blending 4-deck sets that keep floors moving from 1am to close" />
        </F>
        <F label="Genres (comma-separated)">
          <input value={form.genres} onChange={e => setForm(f=>({...f,genres:e.target.value}))} className={inp} placeholder="House, Techno, Breaks" />
        </F>
      </div>
      <div className="border-4 border-ink bg-cream p-5 chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/60">Links & socials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([["Instagram handle (no @)", "instagram"], ["SoundCloud URL", "soundcloud"], ["Bandcamp URL", "bandcamp"], ["Spotify URL", "spotify"], ["Website URL", "website"]] as [string, keyof typeof form][]).map(([label, key]) => (
            <F key={key} label={label}><input value={form[key] as string} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} className={inp} /></F>
          ))}
        </div>
      </div>
      <div className="border-4 border-ink bg-cream p-5 chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/60">Booking & availability</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Booking email"><input value={form.booking_email} onChange={e=>setForm(f=>({...f,booking_email:e.target.value}))} className={inp} /></F>
          <F label="Manager email"><input value={form.manager_email} onChange={e=>setForm(f=>({...f,manager_email:e.target.value}))} className={inp} /></F>
          <F label="Min fee (INR)"><input type="number" value={form.fee_min_inr} onChange={e=>setForm(f=>({...f,fee_min_inr:e.target.value}))} className={inp} placeholder="25000" /></F>
          <F label="Max fee (INR)"><input type="number" value={form.fee_max_inr} onChange={e=>setForm(f=>({...f,fee_max_inr:e.target.value}))} className={inp} placeholder="75000" /></F>
          <F label="Labels"><input value={form.labels} onChange={e=>setForm(f=>({...f,labels:e.target.value}))} className={inp} /></F>
          <F label="Cities available in (comma-separated)"><input value={form.available_cities} onChange={e=>setForm(f=>({...f,available_cities:e.target.value}))} className={inp} placeholder="Bengaluru, Mumbai, Delhi" /></F>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.open_to_bookings} onChange={e=>setForm(f=>({...f,open_to_bookings:e.target.checked}))} className="w-5 h-5 accent-magenta" />
          <span className="font-display text-sm uppercase text-ink">Open to bookings</span>
        </label>
      </div>
      <button onClick={save} disabled={saving} className="bg-magenta text-cream font-display px-8 py-3 border-4 border-ink chunk-shadow uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform disabled:opacity-60">
        {saving ? "Saving…" : "Save Profile"}
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
  const inp = "w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors";

  const load = useCallback(async () => {
    const { data } = await supabase.from("artist_dates").select("*").eq("artist_id", artistId).order("event_date");
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
    setForm({ city: d.city, venue: d.venue ?? "", event_date: d.event_date, event_time: d.event_time ?? "", status: d.status, ticket_url: d.ticket_url ?? "", notes: d.notes ?? "", is_public: d.is_public });
  };

  return (
    <div className="space-y-6">
      <div className="border-4 border-ink p-5 bg-cream chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/70">{editId ? "Edit Date" : "Add Date"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([["City *", "city", "text"], ["Venue", "venue", "text"], ["Date *", "event_date", "date"], ["Time", "event_time", "text"]] as [string,string,string][]).map(([label, key, type]) => (
            <label key={key} className="block">
              <span className="font-display text-xs uppercase text-ink/70 block mb-1">{label}</span>
              <input type={type} value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} className={inp} />
            </label>
          ))}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Status</span>
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className={inp}>
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Tentative</option>
              <option value="available">Available (open slot)</option>
            </select>
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Ticket URL</span>
            <input value={form.ticket_url} onChange={e=>setForm(f=>({...f,ticket_url:e.target.value}))} className={inp} />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_public} onChange={e=>setForm(f=>({...f,is_public:e.target.checked}))} className="w-4 h-4 accent-magenta" />
          <span className="font-display text-xs uppercase text-ink">Show on public profile</span>
        </label>
        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className="bg-magenta text-cream font-display px-5 py-2.5 border-4 border-ink chunk-shadow uppercase text-sm disabled:opacity-60">{busy ? "…" : editId ? "Update" : "Add date"}</button>
          {editId && <button onClick={() => { setEditId(null); setForm(emptyDate()); }} className="font-display text-sm uppercase text-ink/60 underline">Cancel</button>}
        </div>
      </div>
      {dates.length === 0
        ? <p className="text-ink/50 font-display text-sm">No dates yet.</p>
        : <div className="space-y-3">
          {dates.sort((a, b) => a.event_date.localeCompare(b.event_date)).map(d => (
            <div key={d.id} className="flex items-center gap-4 border-4 border-ink bg-cream p-4">
              <div className="flex-1">
                <p className="font-display text-base uppercase text-ink">{d.event_date} — {d.city}</p>
                {d.venue && <p className="text-sm text-ink/70">{d.venue}</p>}
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs font-display uppercase px-2 py-0.5 border border-ink ${d.status==="confirmed"?"bg-acid-yellow":d.status==="tentative"?"bg-cream text-ink/60":"bg-lime text-ink"}`}>{d.status}</span>
                  {!d.is_public && <span className="text-xs font-display uppercase px-2 py-0.5 border border-ink/30 text-ink/40">Private</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(d)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => del(d.id)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-cream transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}



/* ─── Milestone Manager ──────────────────────────────────────────────────── */
const MILESTONE_TYPES = ["first_gig","festival_debut","label_signing","release","milestone_followers","tour","b2b","residency","award","radio_show","other"];
const emptyMilestone = () => ({ type: "first_gig", title: "", description: "", date: "", year: "", city: "", venue: "", is_featured: false, importance: "5" });

function MilestoneManager({ artistId, artistSlug }: { artistId: string; artistSlug: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [form, setForm] = useState(emptyMilestone());
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inp = "w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors";

  const load = useCallback(async () => {
    const { data } = await supabase.from("artist_milestones").select("*").eq("artist_slug", artistSlug).order("date");
    setMilestones((data ?? []) as Milestone[]);
  }, [artistSlug]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.date) { toast.error("Title and date required"); return; }
    setBusy(true);
    try {
      const row = { artist_id: artistId, artist_slug: artistSlug, type: form.type, title: form.title, description: form.description || null, date: form.date, year: form.year ? parseInt(form.year) : parseInt(form.date.slice(0,4)), city: form.city || null, venue: form.venue || null, is_featured: form.is_featured, importance: parseInt(form.importance), source: "manual" };
      if (editId) {
        const { error } = await supabase.from("artist_milestones").update(row).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artist_milestones").insert(row);
        if (error) throw error;
      }
      toast.success(editId ? "Milestone updated" : "Milestone added");
      setForm(emptyMilestone()); setEditId(null); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    await supabase.from("artist_milestones").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const edit = (m: Milestone) => {
    setEditId(m.id);
    setForm({ type: m.type, title: m.title, description: m.description ?? "", date: m.date, year: m.year?.toString() ?? "", city: m.city ?? "", venue: m.venue ?? "", is_featured: m.is_featured, importance: m.importance.toString() });
  };

  return (
    <div className="space-y-6">
      <p className="text-ink/60 text-sm">Add key moments in your career — first gig, festival debut, releases, awards. These appear in your public Journey timeline.</p>
      <div className="border-4 border-ink bg-cream p-5 chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/70">{editId ? "Edit Milestone" : "Add Milestone"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Type</span>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={inp}>
              {MILESTONE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ").toUpperCase()}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Title *</span>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inp} placeholder="e.g. First gig at Bhawana Bangalore" />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Description</span>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className={inp + " resize-none"} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Date * (YYYY-MM-DD)</span>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">City</span>
            <input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Venue</span>
            <input value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Importance (1–10)</span>
            <input type="number" min="1" max="10" value={form.importance} onChange={e=>setForm(f=>({...f,importance:e.target.value}))} className={inp} />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} className="w-4 h-4 accent-magenta" />
          <span className="font-display text-xs uppercase text-ink">Featured milestone (shown prominently)</span>
        </label>
        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className="bg-magenta text-cream font-display px-5 py-2.5 border-4 border-ink chunk-shadow uppercase text-sm disabled:opacity-60">{busy ? "…" : editId ? "Update" : "Add milestone"}</button>
          {editId && <button onClick={() => { setEditId(null); setForm(emptyMilestone()); }} className="font-display text-sm uppercase text-ink/60 underline">Cancel</button>}
        </div>
      </div>
      {milestones.length === 0
        ? <p className="text-ink/50 font-display text-sm">No milestones yet. Add your career highlights above.</p>
        : <div className="space-y-3">
          {milestones.map(m => (
            <div key={m.id} className="flex items-start gap-4 border-4 border-ink bg-cream p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-xs uppercase bg-ink text-cream px-2 py-0.5">{m.type.replace(/_/g," ")}</span>
                  {m.is_featured && <span className="font-display text-xs bg-acid-yellow text-ink px-2 py-0.5 border border-ink">★ Featured</span>}
                </div>
                <p className="font-display text-base uppercase text-ink mt-1">{m.title}</p>
                <p className="text-xs text-ink/50 font-display">{m.date}{m.city ? ` · ${m.city}` : ""}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => edit(m)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => del(m.id)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-cream transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}



/* ─── Press Manager ──────────────────────────────────────────────────────── */
const emptyPress = () => ({ title: "", publication: "", author: "", excerpt: "", url: "", type: "review", date_published: "", is_featured: false, quote_for_epk: "" });

function PressManager({ artistId, artistSlug }: { artistId: string; artistSlug: string }) {
  const [items, setItems] = useState<Press[]>([]);
  const [form, setForm] = useState(emptyPress());
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inp = "w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors";

  const load = useCallback(async () => {
    const { data } = await supabase.from("artist_press").select("*").eq("artist_slug", artistSlug).order("date_published", { ascending: false });
    setItems((data ?? []) as Press[]);
  }, [artistSlug]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.publication) { toast.error("Title and publication required"); return; }
    setBusy(true);
    try {
      const row = { artist_id: artistId, artist_slug: artistSlug, title: form.title, publication: form.publication, author: form.author || null, excerpt: form.excerpt || null, url: form.url || null, type: form.type, date_published: form.date_published || null, is_featured: form.is_featured, quote_for_epk: form.quote_for_epk || null, source: "manual" };
      if (editId) {
        const { error } = await supabase.from("artist_press").update(row).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artist_press").insert(row);
        if (error) throw error;
      }
      toast.success(editId ? "Press item updated" : "Press item added");
      setForm(emptyPress()); setEditId(null); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("artist_press").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const edit = (p: Press) => {
    setEditId(p.id);
    setForm({ title: p.title, publication: p.publication, author: p.author ?? "", excerpt: p.excerpt ?? "", url: p.url ?? "", type: p.type, date_published: p.date_published ?? "", is_featured: p.is_featured, quote_for_epk: p.quote_for_epk ?? "" });
  };

  return (
    <div className="space-y-6">
      <p className="text-ink/60 text-sm">Add reviews, interviews, and press features. Starred quotes appear in your EPK.</p>
      <div className="border-4 border-ink bg-cream p-5 chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/70">{editId ? "Edit Press Item" : "Add Press Item"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Title *</span>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inp} placeholder="Review headline or article title" />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Publication *</span>
            <input value={form.publication} onChange={e=>setForm(f=>({...f,publication:e.target.value}))} className={inp} placeholder="RA, Mixmag, Wild City…" />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Author</span>
            <input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Type</span>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={inp}>
              {["review","interview","feature","premiere","mention","podcast"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">URL</span>
            <input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} className={inp} placeholder="https://…" />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Date published</span>
            <input type="date" value={form.date_published} onChange={e=>setForm(f=>({...f,date_published:e.target.value}))} className={inp} />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Excerpt</span>
            <textarea value={form.excerpt} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} rows={2} className={inp + " resize-none"} />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Best pull quote (shown in EPK)</span>
            <input value={form.quote_for_epk} onChange={e=>setForm(f=>({...f,quote_for_epk:e.target.value}))} className={inp} placeholder="&quot;One of the most exciting DJs in the country&quot;" />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} className="w-4 h-4 accent-magenta" />
          <span className="font-display text-xs uppercase text-ink">Feature on profile (show prominently)</span>
        </label>
        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className="bg-magenta text-cream font-display px-5 py-2.5 border-4 border-ink chunk-shadow uppercase text-sm disabled:opacity-60">{busy ? "…" : editId ? "Update" : "Add press item"}</button>
          {editId && <button onClick={() => { setEditId(null); setForm(emptyPress()); }} className="font-display text-sm uppercase text-ink/60 underline">Cancel</button>}
        </div>
      </div>
      {items.length === 0
        ? <p className="text-ink/50 font-display text-sm">No press items yet.</p>
        : <div className="space-y-3">
          {items.map(p => (
            <div key={p.id} className="flex items-start gap-4 border-4 border-ink bg-cream p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-display text-xs uppercase bg-electric-blue text-cream px-2 py-0.5">{p.type}</span>
                  {p.is_featured && <span className="font-display text-xs bg-acid-yellow text-ink px-2 py-0.5 border border-ink">★ Featured</span>}
                </div>
                <p className="font-display text-base text-ink">{p.title}</p>
                <p className="text-xs text-ink/50">{p.publication}{p.date_published ? ` · ${p.date_published}` : ""}</p>
                {p.quote_for_epk && <p className="text-sm text-ink/70 italic mt-1">"{p.quote_for_epk}"</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors"><ExternalLink className="w-3 h-3" /></a>}
                <button onClick={() => edit(p)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => del(p.id)} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-cream transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}



/* ─── Discography Manager ────────────────────────────────────────────────── */
const RELEASE_TYPES = ["single","ep","album","remix","feature","compilation","mix"];
const emptyRelease = () => ({ title: "", release_type: "single", release_date: "", year: "", label: "", artwork_url: "", spotify_url: "", soundcloud_url: "", bandcamp_url: "", description: "" });

function DiscographyManager({ artistId, artistSlug }: { artistId: string; artistSlug: string }) {
  const [releases, setReleases] = useState<Discography[]>([]);
  const [form, setForm] = useState(emptyRelease());
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inp = "w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors";

  const load = useCallback(async () => {
    const { data } = await supabase.from("artist_discography").select("*").eq("artist_slug", artistSlug).order("release_date", { ascending: false });
    setReleases((data ?? []) as Discography[]);
  }, [artistSlug]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setBusy(true);
    try {
      const row = { artist_id: artistId, artist_slug: artistSlug, title: form.title, release_type: form.release_type, release_date: form.release_date || null, year: form.year ? parseInt(form.year) : (form.release_date ? parseInt(form.release_date.slice(0,4)) : null), label: form.label || null, artwork_url: form.artwork_url || null, spotify_url: form.spotify_url || null, soundcloud_url: form.soundcloud_url || null, bandcamp_url: form.bandcamp_url || null, description: form.description || null, source: "manual" };
      if (editId) {
        const { error } = await supabase.from("artist_discography").update(row).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artist_discography").insert(row);
        if (error) throw error;
      }
      toast.success(editId ? "Release updated" : "Release added");
      setForm(emptyRelease()); setEditId(null); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this release?")) return;
    await supabase.from("artist_discography").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const edit = (r: Discography) => {
    setEditId(r.id);
    setForm({ title: r.title, release_type: r.release_type, release_date: r.release_date ?? "", year: r.year?.toString() ?? "", label: r.label ?? "", artwork_url: r.artwork_url ?? "", spotify_url: r.spotify_url ?? "", soundcloud_url: r.soundcloud_url ?? "", bandcamp_url: r.bandcamp_url ?? "", description: r.description ?? "" });
  };

  return (
    <div className="space-y-6">
      <p className="text-ink/60 text-sm">Add your releases — singles, EPs, albums, remixes. These appear on your public profile EPK.</p>
      <div className="border-4 border-ink bg-cream p-5 chunk-shadow space-y-4">
        <h3 className="font-display text-sm uppercase text-ink/70">{editId ? "Edit Release" : "Add Release"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Title *</span>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Type</span>
            <select value={form.release_type} onChange={e=>setForm(f=>({...f,release_type:e.target.value}))} className={inp}>
              {RELEASE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Release date</span>
            <input type="date" value={form.release_date} onChange={e=>setForm(f=>({...f,release_date:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Label</span>
            <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} className={inp} />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Artwork URL</span>
            <input value={form.artwork_url} onChange={e=>setForm(f=>({...f,artwork_url:e.target.value}))} className={inp} placeholder="https://…" />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Spotify URL</span>
            <input value={form.spotify_url} onChange={e=>setForm(f=>({...f,spotify_url:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">SoundCloud URL</span>
            <input value={form.soundcloud_url} onChange={e=>setForm(f=>({...f,soundcloud_url:e.target.value}))} className={inp} />
          </label>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Bandcamp URL</span>
            <input value={form.bandcamp_url} onChange={e=>setForm(f=>({...f,bandcamp_url:e.target.value}))} className={inp} />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display text-xs uppercase text-ink/70 block mb-1">Description</span>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className={inp + " resize-none"} />
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className="bg-magenta text-cream font-display px-5 py-2.5 border-4 border-ink chunk-shadow uppercase text-sm disabled:opacity-60">{busy ? "…" : editId ? "Update" : "Add release"}</button>
          {editId && <button onClick={() => { setEditId(null); setForm(emptyRelease()); }} className="font-display text-sm uppercase text-ink/60 underline">Cancel</button>}
        </div>
      </div>
      {releases.length === 0
        ? <p className="text-ink/50 font-display text-sm">No releases yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {releases.map(r => (
            <div key={r.id} className="border-4 border-ink bg-cream p-4 flex gap-3">
              {r.artwork_url && <img src={r.artwork_url} alt={r.title} className="w-16 h-16 object-cover border-2 border-ink shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-[10px] uppercase bg-ink text-cream px-2 py-0.5">{r.release_type}</span>
                  {r.year && <span className="font-display text-[10px] text-ink/50">{r.year}</span>}
                </div>
                <p className="font-display text-sm text-ink truncate">{r.title}</p>
                {r.label && <p className="text-xs text-ink/50">{r.label}</p>}
                <div className="flex gap-2 mt-2">
                  {r.spotify_url && <a href={r.spotify_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-2 py-0.5 border border-ink hover:bg-acid-yellow">Spotify</a>}
                  {r.soundcloud_url && <a href={r.soundcloud_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-2 py-0.5 border border-ink hover:bg-acid-yellow">SC</a>}
                  {r.bandcamp_url && <a href={r.bandcamp_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-2 py-0.5 border border-ink hover:bg-acid-yellow">BC</a>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => edit(r)} className="p-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => del(r.id)} className="p-1.5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-cream transition-colors"><Trash2 className="w-3 h-3" /></button>
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
    // Query both artist_id and artist_id_resolved to catch all bookings regardless
    // of which path they came in on (v1 legacy uses artist_id, v2 uses artist_id_resolved).
    Promise.all([
      fetch(`/api/bookings?artist_id=${artistId}`)
        .then(r => r.ok ? r.json() : []).catch(() => []),
      // Fallback: also fetch by legacy artist_id column via shim
      supabase.from("booking_requests")
        .select("*").eq("artist_id", artistId)
        .order("created_at", { ascending: false })
        .then(({ data }) => data ?? []).catch(() => []),
    ]).then(([resolved, legacy]) => {
      // Merge and deduplicate by id — resolved takes priority
      const seen = new Set<string>();
      const merged: Booking[] = [];
      for (const b of [...(Array.isArray(resolved) ? resolved : []), ...(Array.isArray(legacy) ? legacy : [])]) {
        if (!seen.has(b.id)) { seen.add(b.id); merged.push(b); }
      }
      // Sort by created_at descending
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBookings(merged as Booking[]);
      setLoading(false);
    });
  }, [artistId]);

  return (
    <div className="space-y-5">
      {loading ? <p className="font-display text-sm text-ink/50 animate-pulse">Loading…</p>
        : bookings.length === 0 ? <p className="font-display text-sm text-ink/50">No booking requests yet.</p>
        : <div className="space-y-4">
          {bookings.map(b => (
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
              <a href={`mailto:${b.requester_email}`} className="mt-3 inline-block font-display text-xs uppercase bg-magenta text-cream px-4 py-2 border-2 border-ink">Reply →</a>
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
      .then(r => r.json()).then(data => { setInquiries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [artistSlug]);

  return (
    <div className="space-y-5">
      <div className="border-b-4 border-ink pb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl uppercase text-ink">Booking Inquiries</h2>
          <p className="text-sm text-ink/60 mt-1">From <a href="/book" className="underline text-magenta">/book</a> marketplace</p>
        </div>
        {inquiries.length > 0 && <span className="font-display text-xs uppercase bg-acid-yellow text-ink px-3 py-1 border-2 border-ink">{inquiries.length} request{inquiries.length !== 1 ? "s" : ""}</span>}
      </div>
      {loading ? <p className="font-display text-sm text-ink/50 animate-pulse">Loading…</p>
        : inquiries.length === 0 ? (
          <div className="border-4 border-ink bg-acid-yellow p-8 text-center">
            <p className="font-display text-lg text-ink mb-2">No Inquiries Yet</p>
            <p className="text-sm text-ink/60">Make sure your profile has <strong>open_to_bookings: true</strong> and cities set.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map(b => (
              <div key={b.id} className="border-4 border-ink bg-cream p-5 chunk-shadow">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink">{b.requester_email}</p>
                    {b.requester_phone && <p className="text-sm text-ink/60 mt-0.5">{b.requester_phone}</p>}
                    {b.purpose && <div className="mt-2 space-y-1">{b.purpose.split(" | ").map((part, i) => <p key={i} className="text-sm text-ink/80">{part}</p>)}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-xs text-ink/50">{new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <span className="font-display text-[10px] uppercase bg-electric-blue text-cream px-2 py-0.5 border border-ink mt-1 inline-block">Marketplace</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <a href={`mailto:${b.requester_email}?subject=Re: Booking request for ${artistName}`} className="font-display text-xs uppercase bg-magenta text-cream px-4 py-2 border-2 border-ink hover:bg-ink transition-colors">Reply by Email →</a>
                  {b.requester_phone && <a href={`https://wa.me/${b.requester_phone.replace(/\D/g, "")}?text=Hi, I received your booking inquiry for ${artistName}`} target="_blank" rel="noreferrer" className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-2 border-2 border-ink hover:bg-orange transition-colors">WhatsApp</a>}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}



/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
type Tab = "profile" | "dates" | "milestones" | "press" | "discography" | "bookings" | "inquiries" | "calendar" | "packages";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profile",      label: "Profile",      icon: <Music className="w-4 h-4" /> },
  { key: "bookings",     label: "Bookings",     icon: <Inbox className="w-4 h-4" /> },
  { key: "packages",     label: "Packages",     icon: <FileText className="w-4 h-4" /> },
  { key: "calendar",     label: "Calendar",     icon: <Calendar className="w-4 h-4" /> },
  { key: "dates",        label: "Dates",        icon: <Calendar className="w-4 h-4" /> },
  { key: "milestones",   label: "Journey",      icon: <Star className="w-4 h-4" /> },
  { key: "press",        label: "Press",        icon: <Newspaper className="w-4 h-4" /> },
  { key: "discography",  label: "Releases",     icon: <Disc3 className="w-4 h-4" /> },
  { key: "inquiries",    label: "Inquiries",    icon: <Settings2 className="w-4 h-4" /> },
];

const ArtistPortal = () => {
  const router = useRouter();
  const claimId = router.query.claim as string | undefined;
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/artist/dashboard")}`;

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      if (claimId) {
        setClaiming(true);
        try { await api.post(`/artists/${claimId}/claim`, { userId: user.id }); toast.success("Profile claimed!"); }
        catch (e: any) { toast.error("Could not claim profile: " + e.message); }
        setClaiming(false);
      }
      try {
        const data = await api.get<any>("/artists/by-user");
        setArtist(data ? { ...data, genres: Array.isArray(data.genres) ? data.genres : [], festivals: Array.isArray(data.festivals) ? data.festivals : [], available_cities: Array.isArray(data.available_cities) ? data.available_cities : [], open_to_bookings: data.open_to_bookings !== false } as Artist : null);
      } catch { setArtist(null); }
      setLoading(false);
    })();
  }, [isLoaded, user, claimId]);

  const handleSignOut = async () => { await signOut(); router.push("/artists"); };

  if (!isLoaded || (!user && loading)) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-32 text-center"><p className="font-display text-2xl text-ink animate-pulse">Loading…</p></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream">
      <SEO title="Artist Portal | Cats Can Dance" description="Manage your artist profile, tour dates, and booking requests." path="/artist/dashboard" />
      <Nav />
      <div className="container py-24 max-w-lg">
        <h1 className="font-display text-4xl uppercase text-ink mb-2">Artist Portal</h1>
        <p className="text-ink/70 mb-8">Sign in to manage your profile, tour dates, releases, press and booking requests.</p>
        <Link href={signInUrl} className="inline-block w-full text-center bg-magenta text-cream font-display px-6 py-4 border-4 border-ink chunk-shadow uppercase text-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">Sign in</Link>
        <p className="text-sm text-ink/50 mt-4 text-center">No account? <Link href="/sign-up" className="underline text-magenta">Create one</Link> then claim your profile.</p>
      </div>
      <Footer />
    </div>
  );

  if (loading || claiming) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-32 text-center"><p className="font-display text-2xl text-ink animate-pulse">{claiming ? "Claiming profile…" : "Loading…"}</p></div>
    </div>
  );

  if (!artist) return (
    <div className="min-h-screen bg-cream">
      <SEO title="Artist Portal | Cats Can Dance" description="" path="/artist/dashboard" />
      <Nav />
      <div className="container py-24 max-w-2xl">
        <h1 className="font-display text-4xl uppercase text-ink mb-4">No Profile Linked</h1>
        <p className="text-ink/70 mb-6">Signed in as <strong>{userEmail}</strong> but no artist profile is linked yet.</p>
        <p className="text-ink/70 mb-4">Go to the <Link href="/artists" className="underline text-magenta">artists directory</Link>, find your profile, and click <strong>"Are you [name]?"</strong> to link it.</p>
        <button onClick={handleSignOut} className="font-display text-sm uppercase underline text-ink/60">Sign out</button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <SEO title={`${artist.name} Portal | Cats Can Dance`} description="" path="/artist/dashboard" />
      <Nav />
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-4 border-ink pb-6">
          <div className="flex items-center gap-4">
            {artist.photo_url && <img src={artist.photo_url} alt={artist.name} className="w-16 h-16 object-cover border-4 border-ink shrink-0" />}
            <div>
              <p className="font-display text-xs uppercase text-ink/50 mb-0.5">Artist Portal</p>
              <h1 className="font-display text-3xl uppercase text-ink">{artist.name}</h1>
              <p className="text-sm text-ink/50">{userEmail}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/artists/${artist.slug}`} target="_blank" className="font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-acid-yellow text-ink chunk-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> View public profile
            </Link>
            <Link href={`/artists/${artist.slug}/epk`} target="_blank" className="font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-electric-blue text-cream chunk-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Share EPK
            </Link>
            <button onClick={handleSignOut} className="font-display text-xs uppercase px-4 py-2 border-4 border-ink text-ink/60 hover:bg-ink hover:text-cream transition-colors">Sign out</button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex flex-wrap gap-0 mb-8 border-b-4 border-ink">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 font-display text-xs uppercase px-4 py-3 border-r-2 border-ink transition-colors ${tab === t.key ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "profile"     && <ProfileEditor artist={artist} onSaved={setArtist} />}
        {tab === "dates"       && <DateManager artistId={artist.id} />}
        {tab === "milestones"  && <MilestoneManager artistId={artist.id} artistSlug={artist.slug} />}
        {tab === "press"       && <PressManager artistId={artist.id} artistSlug={artist.slug} />}
        {tab === "discography" && <DiscographyManager artistId={artist.id} artistSlug={artist.slug} />}
        {tab === "bookings"    && <BookingKanban artistId={artist.id} />}
        {tab === "packages"    && <PackagesManager artistId={artist.id} />}
        {tab === "calendar"    && <CalendarManager artistId={artist.id} />}
        {tab === "inquiries"   && <MarketplaceInbox artistSlug={artist.slug} artistName={artist.name} />}
      </div>
      <Footer />
    </div>
  );
};

export default ArtistPortal;
