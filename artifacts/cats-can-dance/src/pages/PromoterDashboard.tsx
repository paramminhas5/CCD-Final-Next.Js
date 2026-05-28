"use client";
/**
 * PromoterDashboard — /promoter/dashboard
 *
 * Tabs:
 *   1. Shortlist      — saved artists + brief editor + fan-out button
 *   2. Bookings       — active booking requests with status + thread link
 *   3. Messages       — threaded in-app messaging per booking
 *   4. Fan-out Brief  — build a brief and blast to all shortlisted artists
 *   5. Profile        — company profile editor + registration gate
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ListChecks, MessageSquare, Zap, Building2,
  Plus, Trash2, Send, Check, Loader2, X, MapPin,
  Music, ChevronDown, IndianRupee, CalendarDays,
  ExternalLink, RefreshCw, Info,
} from "lucide-react";
import { useUser, useClerk, useAuth } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { toast } from "sonner";


// ── Types ──────────────────────────────────────────────────────────────────────
type PromoterProfile = {
  id: string; clerk_user_id: string; email: string;
  company_name: string; contact_name: string | null;
  bio: string | null; primary_city: string | null;
  cities: string[]; genre_focus: string[];
  is_verified: boolean; bookings_count: number;
  website: string | null; instagram: string | null;
};

type ShortlistEntry = {
  id: string; artist_id: string; contacted: boolean;
  contacted_at: string | null;
  brief_event_type: string | null; brief_date: string | null;
  brief_date_end: string | null; brief_cities: string[];
  brief_budget_inr: number | null; brief_notes: string | null;
  artist: {
    id: string; slug: string; name: string; photo_url: string | null;
    based_city: string | null; genres: string[]; fee_min_inr: number | null;
    open_to_bookings: boolean; kind: string;
  } | null;
};

type BookingRequest = {
  id: string; artist_name: string; status: string;
  event_type: string | null; event_date: string | null;
  venue_city: string | null; budget_inr: number | null;
  quoted_inr: number | null; hold_expires_at: string | null;
  created_at: string; updated_at: string;
  artist_id_resolved: string | null;
};

type BookingMessage = {
  id: string; booking_id: string; sender_role: string;
  sender_name: string | null; body: string;
  is_system: boolean; quote_inr: number | null;
  created_at: string;
  read_by_artist: boolean; read_by_promoter: boolean;
};

type BookingThread = {
  booking: BookingRequest;
  messages: BookingMessage[];
  artist: { name: string; slug: string; photo_url: string | null } | null;
};


// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  new:       { label: "New",       bg: "bg-acid-yellow",   text: "text-ink"  },
  quoted:    { label: "Quoted",    bg: "bg-electric-blue", text: "text-cream"},
  held:      { label: "Hold",      bg: "bg-orange",        text: "text-ink"  },
  confirmed: { label: "Confirmed", bg: "bg-lime",          text: "text-ink"  },
  declined:  { label: "Declined",  bg: "bg-ink/30",        text: "text-cream"},
  cancelled: { label: "Cancelled", bg: "bg-ink/20",        text: "text-ink"  },
  completed: { label: "Done",      bg: "bg-ink",           text: "text-cream"},
};

const KIND_LABEL: Record<string, string> = {
  musician: "Musician", photographer: "Photographer",
  lighting: "Lighting", mix_engineer: "Mix Engineer",
  production: "Production", videographer: "Videographer", mc: "MC",
};

const EVENT_TYPES = [
  "Club night", "Festival", "Rooftop party", "Warehouse rave",
  "Corporate event", "Private party", "Wedding", "Conference", "Other",
];

const CITIES = ["Bengaluru","Mumbai","Delhi","Goa","Hyderabad","Pune","Chennai","Kolkata"];

// ── Auth headers helper (module-level, uses closure) ──────────────────────────
// Defined inside the component via useAuth().getToken

// ── Shared field component ─────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="block">
      <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">{label}</span>
      {children}
    </label>
  );
}

function inputCls(extra = "") {
  return `w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors ${extra}`;
}


// ── Shortlist Tab ──────────────────────────────────────────────────────────────
function ShortlistTab({
  shortlist, loading, onRemove, onUpdate,
  authHdrs,
}: {
  shortlist: ShortlistEntry[];
  loading: boolean;
  onRemove: (slug: string) => void;
  onUpdate: (slug: string, patch: Partial<ShortlistEntry>) => void;
  authHdrs: () => Promise<Record<string, string>>;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [briefForm, setBriefForm] = useState({
    brief_event_type: "", brief_date: "", brief_date_end: "",
    brief_cities: "", brief_budget_inr: "", brief_notes: "",
  });
  const [saving, setSaving] = useState(false);

  function startEdit(e: ShortlistEntry) {
    setEditId(e.id);
    setBriefForm({
      brief_event_type: e.brief_event_type ?? "",
      brief_date: e.brief_date ?? "",
      brief_date_end: e.brief_date_end ?? "",
      brief_cities: (e.brief_cities ?? []).join(", "),
      brief_budget_inr: e.brief_budget_inr ? String(e.brief_budget_inr) : "",
      brief_notes: e.brief_notes ?? "",
    });
  }

  async function saveBrief(slug: string) {
    setSaving(true);
    try {
      const hdrs = await authHdrs();
      await fetch(`/api/shortlist/${slug}`, {
        method: "PATCH", headers: hdrs,
        body: JSON.stringify({
          ...briefForm,
          brief_cities: briefForm.brief_cities.split(",").map(s => s.trim()).filter(Boolean),
          brief_budget_inr: briefForm.brief_budget_inr ? Number(briefForm.brief_budget_inr) : null,
        }),
      });
      toast.success("Brief updated");
      setEditId(null);
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="h-40 bg-ink/5 animate-pulse border-4 border-ink" />;

  if (!shortlist.length) return (
    <div className="border-4 border-ink bg-cream p-10 text-center">
      <Users className="w-10 h-10 text-ink/20 mx-auto mb-3" />
      <p className="font-display text-xl text-ink uppercase mb-2">Shortlist is empty</p>
      <p className="text-sm text-ink/60 mb-5">Browse the artist marketplace and save artists you're considering.</p>
      <Link href="/book" className="inline-flex items-center gap-2 bg-ink text-cream font-display text-xs uppercase px-5 py-2.5 border-4 border-ink chunk-shadow hover:bg-magenta transition-colors">
        Browse Artists →
      </Link>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2">
        <p className="font-display text-xs uppercase text-ink/50 tracking-widest">
          {shortlist.length} artist{shortlist.length !== 1 ? "s" : ""} · {shortlist.filter(e => !e.contacted).length} not yet contacted
        </p>
        <Link href="/book" className="font-display text-xs uppercase text-ink/50 hover:text-magenta flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add more
        </Link>
      </div>

      {shortlist.map(entry => {
        const a = entry.artist;
        const isEditing = editId === entry.id;
        return (
          <div key={entry.id} className={`border-4 border-ink bg-cream ${entry.contacted ? "opacity-60" : ""}`}>
            {/* Artist row */}
            <div className="flex items-center gap-3 p-4">
              {/* Photo */}
              <div className="w-12 h-12 border-2 border-ink bg-acid-yellow shrink-0 overflow-hidden">
                {a?.photo_url
                  ? <img src={a.photo_url} alt={a?.name} className="w-full h-full object-cover" />
                  : <Music className="w-5 h-5 text-ink/30 m-auto mt-3" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-lg text-ink uppercase leading-tight">{a?.name ?? "Unknown"}</p>
                  {a?.kind && a.kind !== "musician" && (
                    <span className="font-display text-[10px] uppercase px-1.5 py-0.5 bg-electric-blue text-cream border border-ink">
                      {KIND_LABEL[a.kind] ?? a.kind}
                    </span>
                  )}
                  {entry.contacted && (
                    <span className="font-display text-[10px] uppercase px-1.5 py-0.5 bg-lime text-ink border border-ink">
                      ✓ Contacted
                    </span>
                  )}
                </div>
                {a?.based_city && (
                  <p className="text-xs text-ink/50 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{a.based_city}
                  </p>
                )}
                {entry.brief_event_type && (
                  <p className="text-xs text-ink/50 mt-0.5">{entry.brief_event_type}{entry.brief_date ? ` · ${entry.brief_date}` : ""}</p>
                )}
              </div>
              {/* Actions */}
              <div className="flex gap-1.5 shrink-0">
                {a?.slug && (
                  <Link href={`/artists/${a.slug}`} target="_blank"
                    className="w-8 h-8 border-2 border-ink flex items-center justify-center hover:bg-acid-yellow transition-colors"
                    title="View profile">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button onClick={() => isEditing ? setEditId(null) : startEdit(entry)}
                  className={`w-8 h-8 border-2 border-ink flex items-center justify-center transition-colors ${isEditing ? "bg-ink text-cream" : "hover:bg-acid-yellow"}`}
                  title="Edit brief">
                  <ListChecks className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => a?.slug && onRemove(a.slug)}
                  className="w-8 h-8 border-2 border-ink flex items-center justify-center hover:border-magenta hover:text-magenta transition-colors"
                  title="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Brief editor */}
            {isEditing && (
              <div className="border-t-4 border-ink p-4 bg-acid-yellow/10 space-y-3">
                <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Edit Brief for {a?.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Event type">
                    <select value={briefForm.brief_event_type}
                      onChange={e => setBriefForm(f => ({ ...f, brief_event_type: e.target.value }))}
                      className={inputCls("appearance-none")}>
                      <option value="">Select…</option>
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Cities (comma-separated)">
                    <input value={briefForm.brief_cities}
                      onChange={e => setBriefForm(f => ({ ...f, brief_cities: e.target.value }))}
                      placeholder="Bengaluru, Goa" className={inputCls()} />
                  </Field>
                  <Field label="Date from">
                    <input type="date" value={briefForm.brief_date}
                      onChange={e => setBriefForm(f => ({ ...f, brief_date: e.target.value }))}
                      className={inputCls()} />
                  </Field>
                  <Field label="Date to (optional)">
                    <input type="date" value={briefForm.brief_date_end}
                      onChange={e => setBriefForm(f => ({ ...f, brief_date_end: e.target.value }))}
                      className={inputCls()} />
                  </Field>
                  <Field label="Budget (INR)">
                    <input type="number" value={briefForm.brief_budget_inr}
                      onChange={e => setBriefForm(f => ({ ...f, brief_budget_inr: e.target.value }))}
                      placeholder="45000" className={inputCls()} />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea value={briefForm.brief_notes} rows={2}
                    onChange={e => setBriefForm(f => ({ ...f, brief_notes: e.target.value }))}
                    placeholder="Crowd size, set length, vibe…" className={inputCls("resize-none")} />
                </Field>
                <div className="flex gap-2">
                  <button disabled={saving} onClick={() => a?.slug && saveBrief(a.slug)}
                    className="flex items-center gap-1.5 bg-ink text-cream font-display text-xs uppercase px-4 py-2 border-2 border-ink hover:bg-magenta transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Brief
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="font-display text-xs uppercase px-3 py-2 border-2 border-ink text-ink/60 hover:bg-ink/10">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ── Bookings Tab ───────────────────────────────────────────────────────────────
function BookingsTab({
  bookings, loading, onOpenThread,
}: {
  bookings: BookingRequest[];
  loading: boolean;
  onOpenThread: (id: string) => void;
}) {
  if (loading) return <div className="h-40 bg-ink/5 animate-pulse border-4 border-ink" />;
  if (!bookings.length) return (
    <div className="border-4 border-ink bg-cream p-10 text-center">
      <ListChecks className="w-10 h-10 text-ink/20 mx-auto mb-3" />
      <p className="font-display text-xl text-ink uppercase mb-2">No Bookings Yet</p>
      <p className="text-sm text-ink/60">Send booking requests from your shortlist or via the artist marketplace.</p>
    </div>
  );

  const active   = bookings.filter(b => !["completed","declined","cancelled"].includes(b.status));
  const archived = bookings.filter(b =>  ["completed","declined","cancelled"].includes(b.status));

  function BookingRow({ b }: { b: BookingRequest }) {
    const sm = STATUS_META[b.status] ?? STATUS_META.new;
    const isHeld = b.status === "held" && b.hold_expires_at;
    const holdExpired = isHeld && new Date(b.hold_expires_at!) < new Date();
    return (
      <div className="border-4 border-ink bg-cream">
        <div className={`flex items-center justify-between px-4 py-2 border-b-4 border-ink ${sm.bg}`}>
          <span className={`font-display text-xs uppercase tracking-widest ${sm.text}`}>{sm.label}</span>
          {isHeld && (
            <span className={`font-display text-xs ${holdExpired ? "text-magenta" : sm.text} opacity-80`}>
              {holdExpired ? "Hold expired" : `Hold until ${new Date(b.hold_expires_at!).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`}
            </span>
          )}
        </div>
        <div className="p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl text-ink uppercase leading-tight">{b.artist_name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-ink/50">
              {b.event_type && <span>{b.event_type}</span>}
              {b.event_date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{b.event_date}</span>}
              {b.venue_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.venue_city}</span>}
              {b.budget_inr && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{b.budget_inr.toLocaleString("en-IN")}</span>}
            </div>
            {b.quoted_inr && (
              <p className="font-display text-sm text-ink mt-1">
                Quote: <span className="text-electric-blue">₹{b.quoted_inr.toLocaleString("en-IN")}</span>
              </p>
            )}
          </div>
          <button onClick={() => onOpenThread(b.id)}
            className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-2 border-4 border-ink bg-cream hover:bg-acid-yellow transition-colors shrink-0">
            <MessageSquare className="w-3.5 h-3.5" /> Thread
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="font-display text-xs uppercase text-ink/40 tracking-widest">Active</p>
          {active.map(b => <BookingRow key={b.id} b={b} />)}
        </div>
      )}
      {archived.length > 0 && (
        <div className="space-y-3">
          <p className="font-display text-xs uppercase text-ink/40 tracking-widest">Completed / Declined</p>
          {archived.map(b => <BookingRow key={b.id} b={b} />)}
        </div>
      )}
    </div>
  );
}


// ── Message Thread Panel ───────────────────────────────────────────────────────
function MessageThread({
  bookingId, promoterName, authHdrs, onClose,
}: {
  bookingId: string;
  promoterName: string;
  authHdrs: () => Promise<Record<string, string>>;
  onClose: () => void;
}) {
  const [thread, setThread] = useState<BookingThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const hdrs = await authHdrs();
      const r = await fetch(`/api/booking-requests/${bookingId}/thread`, { headers: hdrs });
      if (r.ok) setThread(await r.json());
    } catch { toast.error("Failed to load thread"); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  async function sendMessage() {
    if (!msgBody.trim()) return;
    setSending(true);
    try {
      const hdrs = await authHdrs();
      await fetch(`/api/booking-messages/${bookingId}`, {
        method: "POST", headers: hdrs,
        body: JSON.stringify({ body: msgBody }),
      });
      setMsgBody("");
      load();
    } catch { toast.error("Send failed"); }
    finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="bg-cream border-4 border-ink w-full max-w-lg max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-ink bg-acid-yellow shrink-0">
          <div>
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Message Thread</p>
            <p className="font-display text-xl text-ink uppercase">
              {thread?.artist?.name ?? "Loading…"}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={load} className="w-8 h-8 border-2 border-ink flex items-center justify-center hover:bg-cream transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-8 h-8 border-2 border-ink bg-ink text-cream flex items-center justify-center hover:bg-magenta transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-ink/5 animate-pulse border border-ink/10" />)}
            </div>
          ) : !thread?.messages?.length ? (
            <p className="text-center text-ink/50 font-display text-sm uppercase py-8">No messages yet — start the conversation</p>
          ) : (
            thread.messages.map(msg => {
              const isPromoter = msg.sender_role === "promoter";
              const isSystem   = msg.is_system;
              return (
                <div key={msg.id} className={`flex ${isPromoter ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] border-2 border-ink p-3 ${
                    isSystem ? "bg-ink/5 w-full text-center border-ink/20" :
                    isPromoter ? "bg-ink text-cream" : "bg-cream"
                  }`}>
                    {!isSystem && (
                      <p className={`font-display text-[10px] uppercase tracking-widest mb-1 ${isPromoter ? "text-cream/60" : "text-ink/50"}`}>
                        {msg.sender_name ?? msg.sender_role}
                      </p>
                    )}
                    <p className={`text-sm whitespace-pre-wrap ${isSystem ? "text-ink/50 italic font-display text-xs" : ""}`}>{msg.body}</p>
                    {msg.quote_inr && (
                      <p className="mt-1.5 font-display text-sm text-acid-yellow">
                        Quote: ₹{msg.quote_inr.toLocaleString("en-IN")}
                      </p>
                    )}
                    <p className={`text-[10px] mt-1 ${isPromoter ? "text-cream/40" : "text-ink/30"}`}>
                      {new Date(msg.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Compose */}
        <div className="border-t-4 border-ink p-4 shrink-0">
          <div className="flex gap-2">
            <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)}
              rows={2} placeholder="Type a message…"
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }}
              className="flex-1 border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink focus:outline-none resize-none" />
            <button disabled={sending || !msgBody.trim()} onClick={sendMessage}
              className="border-4 border-ink bg-ink text-cream px-4 flex items-center justify-center hover:bg-magenta transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-ink/30 mt-1 font-display">⌘+Enter to send</p>
        </div>
      </div>
    </div>
  );
}


// ── Fan-out Tab ────────────────────────────────────────────────────────────────
function FanOutTab({
  shortlist, authHdrs, onComplete,
}: {
  shortlist: ShortlistEntry[];
  authHdrs: () => Promise<Record<string, string>>;
  onComplete: () => void;
}) {
  const uncontacted = shortlist.filter(e => !e.contacted && e.artist);
  const [form, setForm] = useState({
    brief_event_type: "", brief_date: "", brief_date_end: "",
    brief_cities: "", brief_budget_inr: "", brief_notes: "",
    requester_name: "", requester_email: "", requester_phone: "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function sendFanOut() {
    if (!uncontacted.length) return;
    setSending(true);
    try {
      const hdrs = await authHdrs();
      const r = await fetch("/api/shortlist/fan-out", {
        method: "POST", headers: hdrs,
        body: JSON.stringify({
          ...form,
          brief_cities: form.brief_cities.split(",").map(s => s.trim()).filter(Boolean),
          brief_budget_inr: form.brief_budget_inr ? Number(form.brief_budget_inr) : null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResult({ sent: data.sent, failed: data.failed ?? 0 });
      toast.success(`Brief sent to ${data.sent} artist${data.sent !== 1 ? "s" : ""}`);
      onComplete();
    } catch (e: any) { toast.error(e.message ?? "Fan-out failed"); }
    finally { setSending(false); }
  }

  if (result) return (
    <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-8 text-center">
      <div className="w-16 h-16 border-4 border-ink bg-cream flex items-center justify-center mx-auto mb-4">
        <Zap className="w-8 h-8 text-ink" />
      </div>
      <p className="font-display text-2xl text-ink uppercase mb-2">Brief Sent!</p>
      <p className="text-ink/70 text-sm">Contacted <strong>{result.sent} artist{result.sent !== 1 ? "s" : ""}</strong>.{result.failed > 0 ? ` ${result.failed} failed.` : ""}</p>
      <p className="text-ink/60 text-sm mt-1">Check the Bookings tab to track responses.</p>
      <button onClick={() => setResult(null)} className="mt-5 font-display text-xs uppercase px-5 py-2.5 border-4 border-ink bg-ink text-cream hover:bg-magenta transition-colors">
        Send Another Brief
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="border-b-4 border-ink pb-4">
        <h2 className="font-display text-2xl uppercase text-ink">Fan-out Brief</h2>
        <p className="text-sm text-ink/60 mt-0.5">
          Send the same booking brief to all <strong>{uncontacted.length}</strong> un-contacted artists on your shortlist at once.
        </p>
      </div>

      {uncontacted.length === 0 ? (
        <div className="border-4 border-ink bg-cream p-8 text-center">
          <Check className="w-10 h-10 text-lime mx-auto mb-3" />
          <p className="font-display text-xl text-ink uppercase mb-2">All Artists Contacted</p>
          <p className="text-sm text-ink/60">Add more artists to your shortlist to send a new brief.</p>
          <Link href="/book" className="inline-flex mt-4 items-center gap-2 bg-ink text-cream font-display text-xs uppercase px-5 py-2.5 border-4 border-ink chunk-shadow hover:bg-magenta transition-colors">
            <Plus className="w-4 h-4" /> Browse Artists
          </Link>
        </div>
      ) : (
        <>
          {/* Artists preview */}
          <div>
            <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-2">Will contact ({uncontacted.length})</p>
            <div className="flex flex-wrap gap-2">
              {uncontacted.map(e => (
                <span key={e.id} className="font-display text-xs uppercase px-3 py-1 border-2 border-ink bg-cream">
                  {e.artist?.name}
                </span>
              ))}
            </div>
          </div>

          {/* Brief form */}
          <div className="border-4 border-ink bg-cream p-5 space-y-4">
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Event Brief</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Event Type *">
                <select value={form.brief_event_type} onChange={set("brief_event_type")} className={inputCls("appearance-none")}>
                  <option value="">Select…</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Date from *">
                <input type="date" value={form.brief_date} onChange={set("brief_date")} className={inputCls()} />
              </Field>
              <Field label="Date to">
                <input type="date" value={form.brief_date_end} onChange={set("brief_date_end")} className={inputCls()} />
              </Field>
              <Field label="Cities (comma-separated)">
                <input value={form.brief_cities} onChange={set("brief_cities")} placeholder="Bengaluru, Goa" className={inputCls()} />
              </Field>
              <Field label="Budget (INR)">
                <input type="number" value={form.brief_budget_inr} onChange={set("brief_budget_inr")} placeholder="45000" className={inputCls()} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.brief_notes} rows={3} onChange={set("brief_notes")}
                placeholder="Crowd size, set length, vibe, anything specific…" className={inputCls("resize-none")} />
            </Field>

            <div className="border-t-4 border-ink pt-4 space-y-3">
              <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Your Contact Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Your Name *">
                  <input value={form.requester_name} onChange={set("requester_name")} placeholder="Company / venue name" className={inputCls()} />
                </Field>
                <Field label="Email *">
                  <input type="email" value={form.requester_email} onChange={set("requester_email")} placeholder="you@venue.com" className={inputCls()} />
                </Field>
                <Field label="Phone (WhatsApp)">
                  <input value={form.requester_phone} onChange={set("requester_phone")} placeholder="+91 98765 43210" className={inputCls()} />
                </Field>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex gap-2 items-start border-4 border-ink/20 bg-electric-blue/10 p-3">
            <Info className="w-4 h-4 text-electric-blue shrink-0 mt-0.5" />
            <p className="text-xs text-ink/70 font-sans leading-relaxed">
              Each artist receives a separate booking request. They reply independently — you'll see each response in the <strong>Bookings</strong> tab. No commission, no middleman.
            </p>
          </div>

          <button
            disabled={sending || !form.brief_event_type || !form.brief_date || !form.requester_name || !form.requester_email}
            onClick={sendFanOut}
            className="flex items-center justify-center gap-2 w-full py-4 border-4 border-ink bg-ink text-cream font-display text-sm uppercase chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {sending ? "Sending…" : `Send Brief to ${uncontacted.length} Artist${uncontacted.length !== 1 ? "s" : ""} →`}
          </button>
        </>
      )}
    </div>
  );
}


// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({
  profile, authHdrs, onSaved,
}: {
  profile: PromoterProfile;
  authHdrs: () => Promise<Record<string, string>>;
  onSaved: (p: PromoterProfile) => void;
}) {
  const [form, setForm] = useState({
    company_name: profile.company_name,
    contact_name: profile.contact_name ?? "",
    bio: profile.bio ?? "",
    primary_city: profile.primary_city ?? "",
    cities: (profile.cities ?? []).join(", "),
    genre_focus: (profile.genre_focus ?? []).join(", "),
    website: profile.website ?? "",
    instagram: profile.instagram ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      const hdrs = await authHdrs();
      const r = await fetch("/api/promoter/me", {
        method: "PATCH", headers: hdrs,
        body: JSON.stringify({
          ...form,
          cities: form.cities.split(",").map(s => s.trim()).filter(Boolean),
          genre_focus: form.genre_focus.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Profile saved");
      onSaved({
        ...profile,
        ...form,
        cities: form.cities.split(",").map(s => s.trim()).filter(Boolean),
        genre_focus: form.genre_focus.split(",").map(s => s.trim()).filter(Boolean),
      });
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3 border-b-4 border-ink pb-4">
        <div className="w-12 h-12 border-4 border-ink bg-acid-yellow flex items-center justify-center">
          <Building2 className="w-5 h-5 text-ink" />
        </div>
        <div>
          <p className="font-display text-2xl text-ink uppercase">{profile.company_name}</p>
          <p className="text-xs text-ink/50">{profile.email}</p>
        </div>
        {profile.is_verified && (
          <span className="ml-auto font-display text-xs uppercase px-2 py-1 bg-lime text-ink border-2 border-ink">
            ✓ Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company / Venue Name *">
          <input value={form.company_name} onChange={set("company_name")} className={inputCls()} />
        </Field>
        <Field label="Contact Name">
          <input value={form.contact_name} onChange={set("contact_name")} placeholder="Your name" className={inputCls()} />
        </Field>
        <Field label="Primary City">
          <input value={form.primary_city} onChange={set("primary_city")} placeholder="Bengaluru" className={inputCls()} />
        </Field>
        <Field label="All Cities (comma-separated)">
          <input value={form.cities} onChange={set("cities")} placeholder="Bengaluru, Goa, Mumbai" className={inputCls()} />
        </Field>
        <Field label="Genre Focus (comma-separated)">
          <input value={form.genre_focus} onChange={set("genre_focus")} placeholder="Techno, House, Jungle" className={inputCls()} />
        </Field>
        <Field label="Website">
          <input value={form.website} onChange={set("website")} placeholder="https://…" className={inputCls()} />
        </Field>
        <Field label="Instagram handle">
          <input value={form.instagram} onChange={set("instagram")} placeholder="@yourhandle" className={inputCls()} />
        </Field>
      </div>

      <Field label="About">
        <textarea value={form.bio} onChange={set("bio")} rows={3}
          placeholder="Describe your venue or events…" className={inputCls("resize-y")} />
      </Field>

      <button disabled={saving} onClick={save}
        className="flex items-center gap-2 bg-magenta text-cream font-display text-sm uppercase px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Profile"}
      </button>

      {!profile.is_verified && (
        <div className="flex gap-2 items-start border-4 border-ink/20 bg-acid-yellow/20 p-3">
          <Info className="w-4 h-4 text-ink shrink-0 mt-0.5" />
          <p className="text-xs text-ink/70 font-sans">
            Your profile is <strong>not yet verified</strong>. Artists can still receive your booking requests. Verification gives you a badge and increases response rates. Contact the CCD team to get verified.
          </p>
        </div>
      )}
    </div>
  );
}


// ── Registration gate ──────────────────────────────────────────────────────────
function RegistrationGate({
  userEmail, authHdrs, onRegistered,
}: {
  userEmail: string;
  authHdrs: () => Promise<Record<string, string>>;
  onRegistered: (p: PromoterProfile) => void;
}) {
  const [form, setForm] = useState({ company_name: "", contact_name: "", primary_city: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function register() {
    if (!form.company_name) return toast.error("Company name required");
    setSaving(true);
    try {
      const hdrs = await authHdrs();
      const r = await fetch("/api/promoter/register", {
        method: "POST", headers: hdrs,
        body: JSON.stringify({ ...form, email: userEmail }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast.success("Account created!");
      onRegistered(data);
    } catch (e: any) { toast.error(e.message ?? "Registration failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="container py-24 max-w-lg">
      <div className="border-4 border-ink bg-cream chunk-shadow p-8">
        <div className="w-14 h-14 border-4 border-ink bg-acid-yellow flex items-center justify-center mb-5">
          <Building2 className="w-6 h-6 text-ink" />
        </div>
        <h1 className="font-display text-3xl uppercase text-ink mb-2">Promoter Account</h1>
        <p className="text-sm text-ink/60 mb-6">
          Set up your promoter profile to shortlist artists, send booking briefs, and manage requests — all in one place.
        </p>
        <div className="space-y-4">
          <Field label="Company / Venue Name *">
            <input value={form.company_name} onChange={set("company_name")} placeholder="Your club, agency, or festival" className={inputCls()} />
          </Field>
          <Field label="Your Name">
            <input value={form.contact_name} onChange={set("contact_name")} placeholder="Booking manager name" className={inputCls()} />
          </Field>
          <Field label="Primary City">
            <input value={form.primary_city} onChange={set("primary_city")} placeholder="Bengaluru" className={inputCls()} />
          </Field>
          <p className="text-xs text-ink/40 font-sans">Signing up as: {userEmail}</p>
          <button disabled={saving || !form.company_name} onClick={register}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-4 border-ink bg-ink text-cream font-display text-sm uppercase chunk-shadow hover:bg-magenta transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {saving ? "Creating…" : "Create Promoter Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Main page ──────────────────────────────────────────────────────────────────
type Tab = "shortlist" | "bookings" | "messages" | "fanout" | "profile";

export default function PromoterDashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  const [promoter, setPromoter]   = useState<PromoterProfile | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [bookings,  setBookings]  = useState<BookingRequest[]>([]);
  const [tab,       setTab]       = useState<Tab>("shortlist");
  const [loading,   setLoading]   = useState(true);
  const [threadBookingId, setThreadBookingId] = useState<string | null>(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";

  async function authHdrs(): Promise<Record<string, string>> {
    const token = await getToken();
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  const loadPromoter = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const hdrs = await authHdrs();
      const r = await fetch("/api/promoter/me", { headers: hdrs });
      if (r.ok) {
        setPromoter(await r.json());
      } else if (r.status === 404) {
        setPromoter(null); // not registered yet
      }
    } catch { setPromoter(null); }
    finally { setLoading(false); }
  }, [user]);

  const loadShortlist = useCallback(async () => {
    if (!user || !promoter) return;
    const hdrs = await authHdrs();
    const r = await fetch("/api/shortlist", { headers: hdrs });
    if (r.ok) setShortlist(await r.json());
  }, [user, promoter]);

  const loadBookings = useCallback(async () => {
    if (!user || !promoter) return;
    const hdrs = await authHdrs();
    const r = await fetch("/api/promoter/bookings", { headers: hdrs });
    if (r.ok) setBookings(await r.json());
  }, [user, promoter]);

  useEffect(() => { loadPromoter(); }, [loadPromoter]);
  useEffect(() => { if (promoter) { loadShortlist(); loadBookings(); } }, [promoter]);

  async function removeFromShortlist(slug: string) {
    const hdrs = await authHdrs();
    await fetch(`/api/shortlist/${slug}`, { method: "DELETE", headers: hdrs });
    toast.success("Removed from shortlist");
    loadShortlist();
  }

  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/promoter/dashboard")}`;

  // ── Not loaded ──
  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-2xl text-ink animate-pulse">Loading…</p>
      </div>
    </div>
  );

  // ── Not signed in ──
  if (!user) return (
    <div className="min-h-screen bg-cream"><Nav />
      <SEO title="Promoter Dashboard | Cats Can Dance" description="Book artists and manage your events." path="/promoter/dashboard" />
      <div className="container py-24 max-w-lg">
        <h1 className="font-display text-4xl uppercase text-ink mb-2">Promoter Dashboard</h1>
        <p className="text-ink/70 mb-6">Sign in to shortlist artists, send briefs, and manage bookings.</p>
        <a href={signInUrl} className="inline-block w-full text-center bg-magenta text-cream font-display px-6 py-4 border-4 border-ink chunk-shadow uppercase text-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
          Sign in →
        </a>
      </div>
      <Footer />
    </div>
  );

  // ── Not registered as promoter ──
  if (!promoter) return (
    <div className="min-h-screen bg-cream"><Nav />
      <SEO title="Promoter Dashboard | Cats Can Dance" description="" path="/promoter/dashboard" />
      <RegistrationGate userEmail={userEmail} authHdrs={authHdrs} onRegistered={p => { setPromoter(p); }} />
      <Footer />
    </div>
  );

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "shortlist", label: "Shortlist",  count: shortlist.filter(e => !e.contacted).length || undefined },
    { key: "bookings",  label: "Bookings",   count: bookings.filter(b => b.status === "new" || b.status === "quoted").length || undefined },
    { key: "messages",  label: "Messages" },
    { key: "fanout",    label: "⚡ Fan-out", count: shortlist.filter(e => !e.contacted).length || undefined },
    { key: "profile",   label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <SEO title={`${promoter.company_name} | Promoter Dashboard | CCD`} description="" path="/promoter/dashboard" />
      <Nav />

      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-4 border-ink pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-4 border-ink bg-acid-yellow flex items-center justify-center">
              <Building2 className="w-5 h-5 text-ink" />
            </div>
            <div>
              <p className="font-display text-xs uppercase text-ink/50 mb-0.5">Promoter Dashboard</p>
              <h1 className="font-display text-3xl uppercase text-ink leading-tight">{promoter.company_name}</h1>
              {promoter.is_verified && (
                <span className="font-display text-[10px] uppercase bg-lime text-ink px-2 py-0.5 border border-ink">✓ Verified</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/book" className="font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-acid-yellow text-ink chunk-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform">
              Browse Artists ↗
            </Link>
            <button onClick={() => signOut()} className="font-display text-xs uppercase px-4 py-2 border-4 border-ink text-ink/60 hover:bg-ink hover:text-cream transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "On shortlist",   val: shortlist.length },
            { label: "Active bookings",val: bookings.filter(b => ["new","quoted","held","confirmed"].includes(b.status)).length },
            { label: "Confirmed",      val: bookings.filter(b => b.status === "confirmed").length },
            { label: "Completed",      val: bookings.filter(b => b.status === "completed").length },
          ].map(s => (
            <div key={s.label} className="border-4 border-ink bg-cream p-4">
              <p className="font-display text-3xl text-ink">{s.val}</p>
              <p className="font-display text-xs uppercase text-ink/50 tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-b-4 border-ink overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`font-display text-sm uppercase px-5 py-2.5 border-4 border-b-0 border-ink whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
              } ${t.key === "fanout" ? "text-electric-blue" : ""}`}>
              {t.label}
              {t.count ? <span className="ml-1.5 inline-block w-5 h-5 text-[10px] bg-magenta text-cream rounded-full leading-5 text-center">{t.count}</span> : null}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "shortlist" && (
          <ShortlistTab shortlist={shortlist} loading={false}
            onRemove={removeFromShortlist}
            onUpdate={async () => loadShortlist()}
            authHdrs={authHdrs} />
        )}
        {tab === "bookings" && (
          <BookingsTab bookings={bookings} loading={false}
            onOpenThread={id => { setThreadBookingId(id); }} />
        )}
        {tab === "messages" && (
          <div className="space-y-3">
            <p className="font-display text-xs uppercase text-ink/50 tracking-widest border-b-4 border-ink pb-3">
              Click a booking to open its thread
            </p>
            {bookings.length === 0 ? (
              <p className="text-sm text-ink/50">No bookings yet.</p>
            ) : bookings.map(b => (
              <button key={b.id} onClick={() => setThreadBookingId(b.id)}
                className="w-full text-left border-4 border-ink bg-cream p-4 hover:bg-acid-yellow/20 transition-colors flex items-center gap-4">
                <MessageSquare className="w-5 h-5 text-ink/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-ink uppercase">{b.artist_name}</p>
                  <p className="text-xs text-ink/50">{b.event_type ?? ""}{b.event_date ? ` · ${b.event_date}` : ""}</p>
                </div>
                <span className={`font-display text-xs uppercase px-2 py-1 border border-ink ${(STATUS_META[b.status] ?? STATUS_META.new).bg} ${(STATUS_META[b.status] ?? STATUS_META.new).text}`}>
                  {(STATUS_META[b.status] ?? STATUS_META.new).label}
                </span>
              </button>
            ))}
          </div>
        )}
        {tab === "fanout" && (
          <FanOutTab shortlist={shortlist} authHdrs={authHdrs}
            onComplete={() => { loadShortlist(); loadBookings(); setTab("bookings"); }} />
        )}
        {tab === "profile" && (
          <ProfileTab profile={promoter} authHdrs={authHdrs}
            onSaved={p => setPromoter(p as PromoterProfile)} />
        )}
      </div>

      <Footer />

      {/* Message thread overlay */}
      {threadBookingId && (
        <MessageThread
          bookingId={threadBookingId}
          promoterName={promoter.company_name}
          authHdrs={authHdrs}
          onClose={() => setThreadBookingId(null)} />
      )}
    </div>
  );
}
