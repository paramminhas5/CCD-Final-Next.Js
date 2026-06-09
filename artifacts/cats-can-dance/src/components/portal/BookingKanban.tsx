"use client";
/**
 * BookingKanban — Artist Portal Bookings Tab (replaces flat BookingInbox)
 *
 * A Kanban-style pipeline view:
 *   NEW → QUOTED → HELD → CONFIRMED | COMPLETED / DECLINED / CANCELLED
 *
 * Each column shows the booking cards with key info.
 * Clicking a card opens the full BookingThreadView (in-app messaging).
 *
 * Also shows:
 *   - Unread message badge on each card
 *   - Total potential revenue (quoted + confirmed bookings)
 *   - Quick-action buttons (Quote, Decline) inline on cards
 */

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, MessageSquare, IndianRupee, Calendar, MapPin,
  RefreshCw, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSafeAuth } from "@/lib/clerk-safe";
import BookingThreadView, { type BookingRequest } from "./BookingThreadView";

// ── Column config ─────────────────────────────────────────────────────────────
const COLUMNS: Array<{
  key: string;
  label: string;
  statuses: string[];
  bg: string;
  accent: string;
  icon: React.ReactNode;
}> = [
  { key: "new",       label: "New",       statuses: ["new"],                   bg: "bg-electric-blue/10", accent: "bg-electric-blue", icon: <AlertCircle className="w-4 h-4" /> },
  { key: "active",    label: "Quoted / Held", statuses: ["quoted", "held"],    bg: "bg-acid-yellow/10",   accent: "bg-acid-yellow",   icon: <Clock className="w-4 h-4" /> },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed"],             bg: "bg-lime/10",          accent: "bg-lime",          icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: "closed",    label: "Done",      statuses: ["completed","declined","cancelled"], bg: "bg-ink/5", accent: "bg-ink/40",     icon: <XCircle className="w-4 h-4" /> },
];

const STATUS_BADGE: Record<string, string> = {
  new:       "bg-electric-blue text-cream",
  quoted:    "bg-acid-yellow text-ink",
  held:      "bg-orange text-ink",
  confirmed: "bg-lime text-ink",
  declined:  "bg-magenta text-cream",
  cancelled: "bg-ink/40 text-cream",
  completed: "bg-ink text-cream",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
  catch { return iso; }
}

// ── Booking card ──────────────────────────────────────────────────────────────
function BookingCard({
  booking,
  onClick,
}: {
  booking: BookingRequest;
  onClick: () => void;
}) {
  const badge = STATUS_BADGE[booking.status] ?? "bg-ink text-cream";
  const isExpiringSoon =
    booking.status === "held" &&
    booking.hold_expires_at &&
    new Date(booking.hold_expires_at).getTime() - Date.now() < 24 * 3600 * 1000;

  return (
    <button
      onClick={onClick}
      className="w-full text-left border-4 border-ink bg-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
    >
      {/* Top accent bar */}
      <div className={`h-1 ${badge.split(" ")[0]}`} />

      <div className="p-4 space-y-2">
        {/* Status + date */}
        <div className="flex items-start justify-between gap-2">
          <span className={`font-display text-[10px] uppercase px-2 py-0.5 border border-ink/30 ${badge}`}>
            {booking.status}
          </span>
          <span className="font-display text-[10px] text-ink/40 shrink-0">
            {fmtDate(booking.created_at)}
          </span>
        </div>

        {/* Requester name */}
        <p className="font-display text-base uppercase text-ink leading-tight truncate">
          {booking.requester_name ?? booking.requester_email.split("@")[0]}
        </p>

        {/* Event details */}
        <div className="space-y-1">
          {booking.event_type && (
            <p className="text-xs text-ink/60 font-display uppercase">{booking.event_type}</p>
          )}
          {booking.event_date && (
            <p className="text-xs text-ink/50 flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {fmtDate(booking.event_date)}
              {booking.event_date_end && booking.event_date_end !== booking.event_date
                ? ` – ${fmtDate(booking.event_date_end)}`
                : ""}
            </p>
          )}
          {booking.venue_city && (
            <p className="text-xs text-ink/50 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />{booking.venue_city}
            </p>
          )}
        </div>

        {/* Budget / quote row */}
        <div className="flex items-center gap-2 flex-wrap">
          {booking.budget_inr && (
            <span className="font-display text-xs px-2 py-0.5 bg-acid-yellow text-ink border border-ink">
              ₹{booking.budget_inr.toLocaleString("en-IN")} budget
            </span>
          )}
          {booking.quoted_inr && (
            <span className="font-display text-xs px-2 py-0.5 bg-lime text-ink border border-ink">
              Quoted ₹{booking.quoted_inr.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Hold expiry warning */}
        {isExpiringSoon && (
          <div className="flex items-center gap-1 text-orange">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="font-display text-[10px] uppercase">Hold expires soon</span>
          </div>
        )}

        {/* Footer — open thread hint */}
        <div className="flex items-center gap-1 text-magenta opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageSquare className="w-3 h-3" />
          <span className="font-display text-[10px] uppercase">Open thread</span>
        </div>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BookingKanban({ artistId }: { artistId: string }) {
  const { getToken } = useSafeAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<BookingRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function authHeaders() {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const hdrs = await authHeaders();
      // Fetch from the extracted /api/bookings endpoint
      const r = await fetch(`/api/bookings?artist_id=${artistId}`, { headers: hdrs });
      const data = r.ok ? await r.json() : [];
      setBookings(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [artistId]);

  useEffect(() => { load(); }, [load]);

  function handleStatusChange(id: string, newStatus: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)),
    );
    // Update the active thread too
    if (activeThread?.id === id) {
      setActiveThread((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
  }

  // ── Revenue stats ──────────────────────────────────────────────────────────
  const quotedRevenue = bookings
    .filter((b) => b.status === "quoted" && b.quoted_inr)
    .reduce((sum, b) => sum + (b.quoted_inr ?? 0), 0);
  const confirmedRevenue = bookings
    .filter((b) => b.status === "confirmed" && b.quoted_inr)
    .reduce((sum, b) => sum + (b.quoted_inr ?? 0), 0);

  // ── Kanban columns ─────────────────────────────────────────────────────────
  const columns = COLUMNS.map((col) => ({
    ...col,
    bookings: bookings.filter((b) => col.statuses.includes(b.status)),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-4">
        <div>
          <h2 className="font-display text-2xl uppercase text-ink">Booking Pipeline</h2>
          <p className="text-sm text-ink/60 mt-0.5">
            {bookings.length} total · Click any card to open the message thread
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-2 border-4 border-ink hover:bg-acid-yellow transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Revenue summary */}
      {(quotedRevenue > 0 || confirmedRevenue > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {quotedRevenue > 0 && (
            <div className="border-4 border-ink bg-acid-yellow p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-ink shrink-0" />
              <div>
                <p className="font-display text-xs uppercase text-ink/60">Potential</p>
                <p className="font-display text-2xl text-ink">₹{quotedRevenue.toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
          {confirmedRevenue > 0 && (
            <div className="border-4 border-ink bg-lime p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-ink shrink-0" />
              <div>
                <p className="font-display text-xs uppercase text-ink/60">Confirmed</p>
                <p className="font-display text-2xl text-ink">₹{confirmedRevenue.toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="space-y-3">
              <div className="h-8 bg-ink/10 border-2 border-ink animate-pulse" />
              {[1, 2].map((i) => (
                <div key={i} className="h-32 border-4 border-ink bg-ink/5 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="border-4 border-ink bg-acid-yellow p-10 text-center">
          <MessageSquare className="w-10 h-10 text-ink/30 mx-auto mb-3" />
          <p className="font-display text-xl text-ink uppercase mb-2">No Booking Requests Yet</p>
          <p className="text-sm text-ink/60 max-w-sm mx-auto">
            When promoters submit booking requests, they'll appear here in the pipeline.
            Make sure your profile has "Open to Bookings" enabled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="space-y-3">
              {/* Column header */}
              <div className={`flex items-center gap-2 p-3 border-4 border-ink ${col.bg}`}>
                <span className={`w-5 h-5 flex items-center justify-center ${col.accent} border-2 border-ink text-ink`}>
                  {col.icon}
                </span>
                <span className="font-display text-xs uppercase text-ink">{col.label}</span>
                <span className="ml-auto font-display text-xs text-ink/40 border border-ink/20 px-1.5 py-0.5">
                  {col.bookings.length}
                </span>
              </div>

              {/* Cards */}
              {col.bookings.length === 0 ? (
                <div className="border-4 border-ink/20 border-dashed p-6 text-center">
                  <p className="font-display text-xs uppercase text-ink/30">Empty</p>
                </div>
              ) : (
                col.bookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onClick={() => setActiveThread(b)}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Thread modal */}
      {activeThread && (
        <BookingThreadView
          booking={activeThread}
          onClose={() => setActiveThread(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
