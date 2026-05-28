import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "@/lib/compat-router";
import { useUser, useClerk, useAuth } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/supabase-shim";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import PackagesManager from "@/components/portal/PackagesManager";
import CalendarManager from "@/components/portal/CalendarManager";
import { DEFAULT_PACKAGES, type TalentKind } from "@/lib/talent-config";

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
const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  new:       { label: "New",       bg: "bg-acid-yellow",     text: "text-ink" },
  quoted:    { label: "Quoted",    bg: "bg-electric-blue",   text: "text-cream" },
  held:      { label: "Held",      bg: "bg-orange",          text: "text-ink" },
  confirmed: { label: "Confirmed", bg: "bg-lime",            text: "text-ink" },
  declined:  { label: "Declined",  bg: "bg-ink/40",          text: "text-cream" },
  cancelled: { label: "Cancelled", bg: "bg-ink/20",          text: "text-ink" },
  completed: { label: "Completed", bg: "bg-ink",             text: "text-cream" },
};

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; colour: string }[]> = {
  new:    [{ next: "quoted",   label: "Send Quote",   colour: "bg-electric-blue text-cream" }, { next: "declined", label: "Decline", colour: "bg-magenta text-cream" }],
  quoted: [{ next: "held",     label: "Place Hold",   colour: "bg-orange text-ink" },          { next: "declined", label: "Decline", colour: "bg-magenta text-cream" }],
  held:   [{ next: "confirmed",label: "Confirm",      colour: "bg-lime text-ink" },             { next: "declined", label: "Decline", colour: "bg-magenta text-cream" }],
  confirmed: [{ next: "completed", label: "Mark Done", colour: "bg-ink text-cream" },           { next: "cancelled", label: "Cancel", colour: "bg-magenta text-cream" }],
};

type BookingRequest = {
  id: string; requester_email: string; requester_name?: string; requester_phone: string | null;
  purpose: string | null; created_at: string; verified_at: string | null; forward_requested: boolean;
  // New structured fields
  status?: string; event_type?: string; event_date?: string; event_date_end?: string;
  venue_name?: string; venue_city?: string; budget_inr?: number; notes?: string;
  quoted_inr?: number; hold_expires_at?: string; confirmed_at?: string; source?: string;
};

function BookingInbox({ artistId }: { artistId: string }) {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actioning, setActioning] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<Record<string, string>>({});

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  async function load() {
    setLoading(true);
    try {
      const hdrs = await authHeaders();
      const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const r = await fetch(`/api/booking-requests/mine${qs}`, { headers: hdrs });
      if (r.ok) {
        const data = await r.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        // Fallback: old supabase direct query for backward compat
        const { data } = await supabase
          .from("booking_requests")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false });
        setBookings((data ?? []) as BookingRequest[]);
      }
    } catch {
      toast.error("Failed to load bookings");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [artistId, statusFilter]);

  async function handleTransition(bookingId: string, nextStatus: string, quotedInr?: number) {
    setActioning(bookingId);
    try {
      const hdrs = await authHeaders();
      const r = await fetch(`/api/booking-requests/${bookingId}/status`, {
        method: "PATCH", headers: hdrs,
        body: JSON.stringify({ status: nextStatus, quoted_inr: quotedInr }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      toast.success(`Booking ${nextStatus}`);
      load();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setActioning(null); }
  }

  const statusCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    const s = b.status ?? "new";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-4 flex-wrap">
        <h2 className="font-display text-2xl uppercase text-ink">Booking Requests</h2>
        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {["all", "new", "quoted", "held", "confirmed", "completed"].map(s => {
            const meta = s === "all" ? null : STATUS_META[s];
            const count = s === "all" ? bookings.length : (statusCounts[s] ?? 0);
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`font-display text-xs uppercase px-3 py-1.5 border-2 border-ink transition-colors ${
                  statusFilter === s ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                }`}>
                {s} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="font-display text-sm text-ink/50 animate-pulse">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="border-4 border-ink bg-acid-yellow p-8 text-center">
          <p className="font-display text-lg text-ink mb-1">No Requests Yet</p>
          <p className="text-sm text-ink/60">
            {statusFilter === "all" ? "Booking requests will appear here once promoters reach out." : `No ${statusFilter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const statusMeta = STATUS_META[b.status ?? "new"] ?? STATUS_META.new;
            const transitions = STATUS_TRANSITIONS[b.status ?? "new"] ?? [];
            const isActioning = actioning === b.id;

            return (
              <div key={b.id} className="border-4 border-ink bg-cream chunk-shadow">
                {/* Status bar */}
                <div className={`flex items-center justify-between px-5 py-2 border-b-4 border-ink ${statusMeta.bg}`}>
                  <span className={`font-display text-xs uppercase tracking-widest ${statusMeta.text}`}>
                    {statusMeta.label}
                  </span>
                  <span className={`font-display text-xs ${statusMeta.text} opacity-60`}>
                    {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                    {/* Contact */}
                    <div>
                      <p className="font-display text-xs uppercase text-ink/40 mb-0.5">From</p>
                      <p className="font-sans text-sm text-ink font-medium">{b.requester_name ?? b.requester_email}</p>
                      <p className="font-sans text-xs text-ink/60">{b.requester_email}</p>
                      {b.requester_phone && <p className="font-sans text-xs text-ink/60">{b.requester_phone}</p>}
                    </div>
                    {/* Event details */}
                    {(b.event_type || b.event_date || b.venue_city) && (
                      <div>
                        <p className="font-display text-xs uppercase text-ink/40 mb-0.5">Event</p>
                        {b.event_type && <p className="font-sans text-sm text-ink">{b.event_type}</p>}
                        {b.event_date && (
                          <p className="font-sans text-xs text-ink/60">
                            {b.event_date}{b.event_date_end ? ` → ${b.event_date_end}` : ""}
                          </p>
                        )}
                        {(b.venue_name || b.venue_city) && (
                          <p className="font-sans text-xs text-ink/60">{[b.venue_name, b.venue_city].filter(Boolean).join(", ")}</p>
                        )}
                        {b.budget_inr && <p className="font-sans text-xs text-ink/60">Budget: ₹{b.budget_inr.toLocaleString("en-IN")}</p>}
                      </div>
                    )}
                    {/* Legacy purpose blob */}
                    {!b.event_type && b.purpose && (
                      <div className="sm:col-span-2">
                        <p className="font-display text-xs uppercase text-ink/40 mb-0.5">Details</p>
                        {b.purpose.split(" | ").map((p, i) => <p key={i} className="text-sm text-ink/80">{p}</p>)}
                      </div>
                    )}
                    {/* Notes */}
                    {b.notes && (
                      <div className="sm:col-span-2">
                        <p className="font-display text-xs uppercase text-ink/40 mb-0.5">Notes</p>
                        <p className="text-sm text-ink/70 whitespace-pre-line">{b.notes}</p>
                      </div>
                    )}
                    {/* Quote amount if set */}
                    {b.quoted_inr && (
                      <div>
                        <p className="font-display text-xs uppercase text-ink/40 mb-0.5">Your Quote</p>
                        <p className="font-display text-lg text-ink">₹{b.quoted_inr.toLocaleString("en-IN")}</p>
                      </div>
                    )}
                    {/* Hold expiry */}
                    {b.hold_expires_at && b.status === "held" && (
                      <div>
                        <p className="font-display text-xs uppercase text-ink/40 mb-0.5">Hold Expires</p>
                        <p className="font-sans text-xs text-ink/70">
                          {new Date(b.hold_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="flex flex-wrap gap-2 items-center border-t-4 border-ink/10 pt-4">
                    {/* Quote amount input if transitioning to quoted */}
                    {b.status === "new" && (
                      <div className="flex items-center gap-2 border-4 border-ink bg-cream">
                        <span className="pl-3 font-display text-xs text-ink/40">₹</span>
                        <input
                          type="number" min={0}
                          value={quoteAmount[b.id] ?? ""}
                          onChange={e => setQuoteAmount(q => ({ ...q, [b.id]: e.target.value }))}
                          placeholder="Your quote amount"
                          className="w-36 px-2 py-2 bg-transparent font-sans text-sm text-ink focus:outline-none"
                        />
                      </div>
                    )}

                    {transitions.map(t => (
                      <button key={t.next} disabled={isActioning}
                        onClick={() => handleTransition(b.id, t.next, t.next === "quoted" ? Number(quoteAmount[b.id]) : undefined)}
                        className={`font-display text-xs uppercase px-4 py-2 border-2 border-ink transition-all ${t.colour} hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50`}>
                        {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : t.label}
                      </button>
                    ))}

                    <a href={`mailto:${b.requester_email}?subject=Re: Your booking request`}
                      className="ml-auto font-display text-xs uppercase px-4 py-2 border-2 border-ink bg-cream hover:bg-acid-yellow transition-colors">
                      Reply by Email →
                    </a>
                    {b.requester_phone && (
                      <a href={`https://wa.me/${b.requester_phone.replace(/\D/g, "")}`}
                        target="_blank" rel="noreferrer"
                        className="font-display text-xs uppercase px-4 py-2 border-2 border-ink bg-cream hover:bg-lime transition-colors">
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
// ── Packages tab with role-specific auto-seeding ──────────────────────────────
// On first visit (0 packages), seeds the artist's role-specific default packages.
function PackagesManagerWithSeeding({
  artistId, artistKind, getToken,
}: { artistId: string; artistKind: string; getToken: () => Promise<string | null> }) {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded) return;
    (async () => {
      try {
        const r = await fetch(`/api/artist-packages?artist_id=${artistId}`);
        const existing = await r.json();
        if (Array.isArray(existing) && existing.length === 0) {
          const kind = artistKind as TalentKind;
          const templates = DEFAULT_PACKAGES[kind] ?? DEFAULT_PACKAGES.musician;
          if (templates.length === 0) return;
          const token = await getToken();
          const hdrs = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
          for (const tpl of templates) {
            await fetch("/api/artist-packages", {
              method: "POST", headers: hdrs,
              body: JSON.stringify(tpl),
            });
          }
          toast.success(`${templates.length} starter packages added for your role — edit them to match your pricing`);
        }
      } catch { /* non-fatal */ }
      finally { setSeeded(true); }
    })();
  }, [artistId, artistKind]);

  return <PackagesManager artistId={artistId} />;
}

type Tab = "profile" | "calendar" | "packages" | "bookings" | "inquiries";

const ArtistPortal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimId = searchParams.get("claim");

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

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
    { key: "profile",   label: "Profile" },
    { key: "calendar",  label: "📅 Calendar" },
    { key: "packages",  label: "💰 Packages" },
    { key: "bookings",  label: "Bookings" },
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
        {tab === "calendar"  && <CalendarManager artistId={artist.id} />}
        {tab === "packages"  && <PackagesManagerWithSeeding artistId={artist.id} artistKind={(artist as any).kind ?? "musician"} getToken={getToken} />}
        {tab === "bookings"  && <BookingInbox artistId={artist.id} />}
        {tab === "inquiries" && <MarketplaceInbox artistSlug={artist.slug} artistName={artist.name} />}
      </div>
      <Footer />
    </div>
  );
};

export default ArtistPortal;
