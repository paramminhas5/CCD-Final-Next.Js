"use client";
/**
 * BookingForm — shared promoter-facing booking request form.
 *
 * Used by:
 *   1. ArtistDetail.tsx  → inline on the BOOK tab
 *   2. BookArtist.tsx    → inside the BookingDialog modal
 *
 * Features vs the old flat form:
 *   • Fetches artist packages  → promoter selects one (or "custom")
 *   • Fetches artist calendar  → date picker highlights busy / available days
 *   • Posts to /api/booking-inquiry-v2 (structured) with graceful fallback
 *     to /api/booking-inquiry (legacy) if v2 returns 404.
 *   • Multi-day date range (from + optional to).
 *   • Budget field is numeric INR, not a dropdown string.
 *   • Source tag passed through ("artist_profile" vs "marketplace").
 */
import { useEffect, useMemo, useState } from "react";
import {
  Send, Loader2, Check, X, ChevronDown, Clock,
  IndianRupee, CalendarDays, MapPin, Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ArtistPackage {
  id: string;
  name: string;
  description: string | null;
  suitable_for: string[];
  price_inr: number;
  price_is_minimum: boolean;
  travel_included: boolean;
  travel_note: string | null;
  set_duration_min: number | null;
  set_type: string;
  tech_rider: string | null;
}

type DayStatus = "busy" | "tentative" | "available" | "open";

interface CalendarData {
  days: Record<string, DayStatus>;
  open_to_bookings: boolean;
  available_cities: string[];
}

export interface BookingFormProps {
  artistSlug: string;
  artistName: string;
  /** "artist_profile" when on /artists/[slug], "marketplace" when on /book */
  source?: "artist_profile" | "marketplace";
  /** Called after successful submission */
  onSuccess?: () => void;
  /** Called when user clicks cancel (only shown if provided) */
  onCancel?: () => void;
}

// ── Mini calendar strip (date picker) ────────────────────────────────────────
const DAY_ABBR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function MiniCalendar({
  calData,
  selectedStart,
  selectedEnd,
  onSelect,
}: {
  calData: CalendarData | null;
  selectedStart: string;
  selectedEnd: string;
  onSelect: (start: string, end: string) => void;
}) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const todayISO = toISO(today);

  // Show 3 months starting from today
  const months = useMemo(() => {
    const out = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const firstDow = d.getDay();
      out.push({ year: d.getFullYear(), month: d.getMonth(), firstDow, lastDay });
    }
    return out;
  }, []);

  const [hovered, setHovered] = useState<string | null>(null);
  const [picking, setPicking] = useState<"start" | "end">("start");

  function handleClick(iso: string) {
    if (picking === "start") {
      onSelect(iso, iso);
      setPicking("end");
    } else {
      if (iso < selectedStart) {
        onSelect(iso, selectedStart);
      } else {
        onSelect(selectedStart, iso);
      }
      setPicking("start");
    }
  }

  function dayClass(iso: string): string {
    if (iso < todayISO) return "opacity-25 cursor-not-allowed text-ink/40";
    const status = calData?.days[iso];
    const inRange = selectedStart && selectedEnd && iso >= selectedStart && iso <= selectedEnd;
    const isStart = iso === selectedStart;
    const isEnd = iso === selectedEnd;
    const isHover = hovered && selectedStart && picking === "end" &&
      ((iso >= selectedStart && iso <= hovered) || (iso <= selectedStart && iso >= hovered));

    if (isStart || isEnd) return "bg-ink text-cream border-ink cursor-pointer font-bold";
    if (inRange || isHover) return "bg-acid-yellow text-ink border-ink/30 cursor-pointer";
    if (status === "busy") return "bg-magenta/20 text-magenta border-magenta/20 cursor-pointer";
    if (status === "available") return "bg-lime/30 text-ink border-lime/30 cursor-pointer hover:bg-lime/50";
    if (status === "tentative") return "bg-electric-blue/20 text-ink border-electric-blue/20 cursor-pointer";
    return "bg-cream text-ink/70 border-ink/10 cursor-pointer hover:bg-acid-yellow/30";
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-display uppercase">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-lime/50 border border-ink/20 inline-block"/>Open</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-magenta/20 border border-magenta/20 inline-block"/>Busy</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-electric-blue/20 border border-electric-blue/20 inline-block"/>Tour leg</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-ink inline-block"/>Your pick</span>
      </div>
      {months.map(({ year, month, firstDow, lastDay }) => {
        const label = new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({length: lastDay}, (_,i)=>i+1)];
        return (
          <div key={`${year}-${month}`}>
            <p className="font-display text-xs uppercase text-ink/60 mb-1">{label}</p>
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_ABBR.map(d => (
                <div key={d} className="text-center font-display text-[9px] uppercase text-ink/30 py-0.5">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const status = calData?.days[iso];
                return (
                  <button
                    key={iso}
                    type="button"
                    title={status ? `${iso} — ${status}` : iso}
                    onClick={() => iso >= todayISO && handleClick(iso)}
                    onMouseEnter={() => setHovered(iso)}
                    onMouseLeave={() => setHovered(null)}
                    className={`aspect-square text-[11px] font-display border flex items-center justify-center transition-colors ${dayClass(iso)}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-ink/40 font-display uppercase">
        {picking === "start" ? "Click to set your event date" : "Click to set end date (or click same day for single day)"}
      </p>
    </div>
  );
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ── Package card (selectable) ─────────────────────────────────────────────────
function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: ArtistPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 border-4 transition-all ${
        selected
          ? "border-ink bg-ink text-cream chunk-shadow"
          : "border-ink bg-cream text-ink hover:bg-acid-yellow/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-display text-sm uppercase leading-tight ${selected ? "text-cream" : "text-ink"}`}>
            {pkg.name}
          </p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className={`font-display text-xs px-2 py-0.5 border ${selected ? "border-cream/40 bg-acid-yellow text-ink" : "border-ink bg-acid-yellow text-ink"}`}>
              {pkg.price_is_minimum ? "from " : ""}₹{pkg.price_inr.toLocaleString("en-IN")}
            </span>
            {pkg.set_duration_min && (
              <span className={`font-display text-xs flex items-center gap-1 ${selected ? "text-cream/70" : "text-ink/50"}`}>
                <Clock className="w-3 h-3" />{pkg.set_duration_min} min
              </span>
            )}
            {pkg.travel_included && (
              <span className={`font-display text-xs ${selected ? "text-cream/70" : "text-ink/50"}`}>✈ Travel incl.</span>
            )}
          </div>
          {pkg.description && (
            <p className={`text-xs mt-1.5 line-clamp-2 ${selected ? "text-cream/70" : "text-ink/50"}`}>
              {pkg.description}
            </p>
          )}
        </div>
        <div className={`w-5 h-5 border-4 shrink-0 flex items-center justify-center mt-0.5 ${selected ? "border-cream bg-acid-yellow" : "border-ink bg-cream"}`}>
          {selected && <Check className="w-3 h-3 text-ink" />}
        </div>
      </div>
    </button>
  );
}


// ── Main form ─────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  "Club night", "Festival", "Rooftop party", "Warehouse rave",
  "Corporate event", "Private party", "Wedding", "Conference", "Other",
];

export default function BookingForm({
  artistSlug,
  artistName,
  source = "artist_profile",
  onSuccess,
  onCancel,
}: BookingFormProps) {
  // ── Remote data ──────────────────────────────────────────────────────────
  const [packages, setPackages] = useState<ArtistPackage[]>([]);
  const [calData, setCalData] = useState<CalendarData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      fetch(`/api/artist-packages?artist_slug=${encodeURIComponent(artistSlug)}`).then(r => r.json()).catch(() => []),
      fetch(`/api/artist-calendar?slug=${encodeURIComponent(artistSlug)}`).then(r => r.json()).catch(() => null),
    ]).then(([pkgs, cal]) => {
      setPackages(Array.isArray(pkgs) ? (pkgs as ArtistPackage[]) : []);
      setCalData(cal && typeof cal === "object" ? (cal as CalendarData) : null);
    }).finally(() => setLoadingData(false));
  }, [artistSlug]);

  // ── Form state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState<"package" | "details" | "confirm">("package");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [form, setForm] = useState({
    requester_name: "",
    requester_email: "",
    requester_phone: "",
    event_type: "",
    event_date: "",
    event_date_end: "",
    venue_name: "",
    venue_city: "",
    budget_inr: "",
    notes: "",
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) =>
    (e: { target: { value: string } }) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const selectedPackage = packages.find(p => p.id === selectedPackageId) ?? null;

  // ── Step navigation ──────────────────────────────────────────────────────
  const canGoToDetails = true; // package is optional
  const canSubmit =
    form.requester_name.trim() &&
    form.requester_email.trim() &&
    form.event_type &&
    form.event_date;

  // ── Day status helper ────────────────────────────────────────────────────
  function getDayStatus(iso: string): DayStatus | null {
    return calData?.days[iso] ?? null;
  }

  const eventDateStatus = form.event_date ? getDayStatus(form.event_date) : null;

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setError(null);

    try {
      // Try v2 first
      const res = await fetch("/api/booking-inquiry-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist_slug: artistSlug,
          artist_name: artistName,
          package_id: selectedPackageId ?? undefined,
          source,
          requester_name: form.requester_name,
          requester_email: form.requester_email,
          requester_phone: form.requester_phone || undefined,
          event_type: form.event_type,
          event_date: form.event_date || undefined,
          event_date_end: form.event_date_end || undefined,
          venue_name: form.venue_name || undefined,
          venue_city: form.venue_city || undefined,
          budget_inr: form.budget_inr ? Number(form.budget_inr) : undefined,
          notes: form.notes || undefined,
        }),
      });

      if (res.status === 404) {
        // Fallback to legacy endpoint
        const legacy = await fetch("/api/booking-inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artist_slug: artistSlug,
            artist_name: artistName,
            requester_name: form.requester_name,
            requester_email: form.requester_email,
            requester_phone: form.requester_phone || undefined,
            purpose: form.event_type,
            event_date: form.event_date || undefined,
            venue: [form.venue_name, form.venue_city].filter(Boolean).join(", ") || undefined,
            budget: form.budget_inr ? `₹${Number(form.budget_inr).toLocaleString("en-IN")}` : undefined,
            notes: form.notes || undefined,
          }),
        });
        const d = await legacy.json();
        if (!legacy.ok) throw new Error(d.error || "Failed");
      } else {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      }

      setSent(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  // ── Sent state ────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-8 text-center">
        <div className="w-16 h-16 border-4 border-ink bg-cream flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-ink" />
        </div>
        <h3 className="font-display text-2xl text-ink uppercase mb-2">Request Sent!</h3>
        <p className="text-ink/70 max-w-md mx-auto text-sm leading-relaxed">
          Your booking request for <strong>{artistName}</strong> is in.
          {selectedPackage && <> They'll see you selected "<em>{selectedPackage.name}</em>".</>}
          {" "}They'll reply to <strong>{form.requester_email}</strong>.
        </p>
        {onCancel && (
          <button onClick={onCancel} className="mt-6 font-display text-sm uppercase px-5 py-2.5 border-4 border-ink bg-ink text-cream hover:bg-magenta transition-colors">
            Close
          </button>
        )}
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 border-4 border-ink bg-ink/5" />
        <div className="h-10 border-4 border-ink bg-ink/5" />
        <div className="h-10 border-4 border-ink bg-ink/5" />
      </div>
    );
  }


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className="space-y-0">
      {/* ── STEP 1 — Package selector ─────────────────────────────────────── */}
      <div className="border-4 border-ink bg-cream">

        {/* Step header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b-4 border-ink bg-ink/5">
          <span className="font-display text-xs uppercase bg-ink text-cream px-2 py-0.5">01</span>
          <span className="font-display text-sm uppercase text-ink">Choose a Package</span>
          <span className="ml-auto font-display text-xs text-ink/40 uppercase">Optional</span>
        </div>

        <div className="p-5 space-y-3">
          {packages.length === 0 ? (
            <p className="text-sm text-ink/50 font-sans">
              This artist hasn't set up packages yet — just describe what you need below.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2">
                {packages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selectedPackageId === pkg.id}
                    onSelect={() => setSelectedPackageId(
                      selectedPackageId === pkg.id ? null : pkg.id
                    )}
                  />
                ))}
              </div>
              {/* Custom request option */}
              <button type="button"
                onClick={() => setSelectedPackageId(null)}
                className={`w-full p-3 border-2 font-display text-xs uppercase text-left transition-colors ${
                  selectedPackageId === null
                    ? "border-ink bg-ink/10 text-ink"
                    : "border-ink/30 text-ink/50 hover:border-ink hover:text-ink"
                }`}>
                Custom / other arrangement →
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── STEP 2 — Event details ────────────────────────────────────────── */}
      <div className="border-4 border-t-0 border-ink bg-cream">
        <div className="flex items-center gap-3 px-5 py-3 border-b-4 border-ink bg-ink/5">
          <span className="font-display text-xs uppercase bg-ink text-cream px-2 py-0.5">02</span>
          <span className="font-display text-sm uppercase text-ink">Event Details</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Event type + date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Event Type *</span>
              <div className="relative">
                <select required value={form.event_type} onChange={set("event_type")}
                  className="w-full border-4 border-ink bg-cream px-3 py-2 font-display text-xs uppercase text-ink focus:outline-none focus:bg-acid-yellow/20 appearance-none">
                  <option value="">Select…</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40 pointer-events-none" />
              </div>
            </label>

            {/* Date — show mini calendar picker */}
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Event Date *</span>
              <button type="button" onClick={() => setShowCalendar(v => !v)}
                className={`w-full border-4 border-ink px-3 py-2 font-display text-xs uppercase text-left flex items-center gap-2 transition-colors ${
                  form.event_date ? "bg-acid-yellow text-ink" : "bg-cream text-ink/50 hover:bg-acid-yellow/20"
                }`}>
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {form.event_date
                  ? `${form.event_date}${form.event_date_end && form.event_date_end !== form.event_date ? ` → ${form.event_date_end}` : ""}`
                  : "Pick a date"}
                {/* Availability signal */}
                {eventDateStatus === "busy" && (
                  <span className="ml-auto font-display text-[10px] uppercase px-1.5 py-0.5 bg-magenta text-cream border border-ink/20">
                    Busy
                  </span>
                )}
                {eventDateStatus === "available" && (
                  <span className="ml-auto font-display text-[10px] uppercase px-1.5 py-0.5 bg-lime text-ink border border-ink/20">
                    Open slot
                  </span>
                )}
              </button>
            </label>
          </div>

          {/* Inline mini calendar */}
          {showCalendar && (
            <div className="border-4 border-ink bg-cream p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-xs uppercase text-ink/60">
                  {eventDateStatus === "busy"
                    ? "⚠ Artist appears busy — you can still request"
                    : eventDateStatus === "available"
                    ? "✓ Artist has marked this as an open slot"
                    : "Select your preferred event date(s)"}
                </p>
                <button type="button" onClick={() => setShowCalendar(false)}
                  className="text-ink/40 hover:text-ink">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <MiniCalendar
                calData={calData}
                selectedStart={form.event_date}
                selectedEnd={form.event_date_end || form.event_date}
                onSelect={(start, end) => {
                  setForm(f => ({ ...f, event_date: start, event_date_end: end === start ? "" : end }));
                  if (start) setShowCalendar(false);
                }}
              />
            </div>
          )}

          {/* Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Venue Name</span>
              <input value={form.venue_name} onChange={set("venue_name")}
                placeholder="e.g. Bar Wild"
                className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors" />
            </label>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">City</span>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
                <input value={form.venue_city} onChange={set("venue_city")}
                  placeholder="Bengaluru"
                  className="w-full border-4 border-ink bg-cream pl-8 pr-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors" />
              </div>
            </label>
          </div>

          {/* Budget */}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">
              Budget (INR)
              {selectedPackage && (
                <span className="ml-2 text-ink/40 normal-case font-sans">
                  · {selectedPackage.name} starts {selectedPackage.price_is_minimum ? "from " : "at "}₹{selectedPackage.price_inr.toLocaleString("en-IN")}
                </span>
              )}
            </span>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
              <input type="number" min={0} value={form.budget_inr} onChange={set("budget_inr")}
                placeholder="e.g. 45000"
                className="w-full border-4 border-ink bg-cream pl-8 pr-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors" />
            </div>
          </label>

          {/* Notes */}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Notes</span>
            <textarea value={form.notes} onChange={set("notes")} rows={3}
              placeholder="Expected crowd size, set duration, stage setup, anything else…"
              className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors resize-none" />
          </label>
        </div>
      </div>

      {/* ── STEP 3 — Contact details ──────────────────────────────────────── */}
      <div className="border-4 border-t-0 border-ink bg-cream">
        <div className="flex items-center gap-3 px-5 py-3 border-b-4 border-ink bg-ink/5">
          <span className="font-display text-xs uppercase bg-ink text-cream px-2 py-0.5">03</span>
          <span className="font-display text-sm uppercase text-ink">Your Contact</span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Your Name *</span>
              <input required value={form.requester_name} onChange={set("requester_name")}
                placeholder="Venue / promoter / company"
                className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors" />
            </label>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Email *</span>
              <input required type="email" value={form.requester_email} onChange={set("requester_email")}
                placeholder="your@email.com"
                className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors" />
            </label>
          </div>
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Phone (WhatsApp preferred)</span>
            <input value={form.requester_phone} onChange={set("requester_phone")}
              placeholder="+91 98765 43210"
              className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors" />
          </label>
        </div>
      </div>

      {/* ── Error + submit ────────────────────────────────────────────────── */}
      <div className="border-4 border-t-0 border-ink bg-cream p-5 space-y-3">
        {/* Availability warning */}
        {eventDateStatus === "busy" && (
          <div className="flex gap-2 items-start border-2 border-magenta bg-magenta/10 p-3">
            <Info className="w-4 h-4 text-magenta shrink-0 mt-0.5" />
            <p className="text-xs text-ink/70 font-sans">
              The artist appears busy on this date. You can still send a request — they may have flexibility.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-cream bg-magenta border-2 border-ink px-3 py-2 font-display">
            {error}
          </p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={sending || !canSubmit}
            className="flex items-center justify-center gap-2 flex-1 py-3.5 border-4 border-ink bg-ink text-cream font-display text-sm uppercase chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : `Book ${artistName.split(" ")[0]}`}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="font-display text-sm uppercase px-5 py-3.5 border-4 border-ink text-ink/60 hover:bg-ink/10 transition-colors">
              Cancel
            </button>
          )}
        </div>

        <p className="text-[10px] text-ink/40 font-sans text-center">
          No commission. No middleman. The artist gets your request directly.
        </p>
      </div>
    </form>
  );
}
