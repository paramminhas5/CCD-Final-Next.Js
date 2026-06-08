"use client";
/**
 * BookingThreadView
 *
 * In-app messaging thread for a single booking request.
 * Shows the full conversation between artist and promoter,
 * allows the artist to send messages, submit quotes, and advance
 * the booking status (quoted → held → confirmed → declined).
 *
 * Used inside the Artist Portal Bookings Kanban.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, Send, Loader2, Check, IndianRupee, ChevronDown,
  Clock, MapPin, Calendar, User, MessageSquare, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BookingRequest {
  id: string;
  artist_name: string;
  requester_name?: string | null;
  requester_email: string;
  requester_phone?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  event_date_end?: string | null;
  venue_name?: string | null;
  venue_city?: string | null;
  budget_inr?: number | null;
  notes?: string | null;
  status: string;
  quoted_inr?: number | null;
  hold_expires_at?: string | null;
  confirmed_at?: string | null;
  package_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface BookingMessage {
  id: string;
  booking_id: string;
  sender_role: "artist" | "promoter" | "system";
  sender_name?: string | null;
  body: string;
  is_system: boolean;
  quote_inr?: number | null;
  quote_valid_until?: string | null;
  read_by_artist: boolean;
  read_by_promoter: boolean;
  created_at: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  new:       { label: "New",       bg: "bg-electric-blue", text: "text-cream" },
  quoted:    { label: "Quoted",    bg: "bg-acid-yellow",   text: "text-ink" },
  held:      { label: "Held",      bg: "bg-orange",        text: "text-ink" },
  confirmed: { label: "Confirmed", bg: "bg-lime",          text: "text-ink" },
  declined:  { label: "Declined",  bg: "bg-magenta",       text: "text-cream" },
  cancelled: { label: "Cancelled", bg: "bg-ink/40",        text: "text-cream" },
  completed: { label: "Completed", bg: "bg-ink",           text: "text-cream" },
};

const VALID_TRANSITIONS: Record<string, Array<{ to: string; label: string; color: string }>> = {
  new:       [
    { to: "quoted",   label: "Send Quote",    color: "bg-acid-yellow text-ink" },
    { to: "declined", label: "Decline",       color: "bg-magenta text-cream" },
  ],
  quoted:    [
    { to: "held",     label: "Place Hold",    color: "bg-orange text-ink" },
    { to: "declined", label: "Decline",       color: "bg-magenta text-cream" },
  ],
  held:      [
    { to: "confirmed", label: "Confirm Gig",  color: "bg-lime text-ink" },
    { to: "declined",  label: "Decline",      color: "bg-magenta text-cream" },
  ],
  confirmed: [
    { to: "completed", label: "Mark Done",    color: "bg-ink text-cream" },
    { to: "cancelled", label: "Cancel",       color: "bg-magenta text-cream" },
  ],
};

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: BookingMessage }) {
  const isArtist = msg.sender_role === "artist";
  const isSystem = msg.is_system || msg.sender_role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="font-display text-[10px] uppercase bg-ink/10 text-ink/50 px-3 py-1 border border-ink/20">
          {msg.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isArtist ? "flex-row-reverse" : "flex-row"}`}>
      {/* Role indicator */}
      <div className={`w-8 h-8 border-2 border-ink flex items-center justify-center shrink-0 font-display text-xs ${isArtist ? "bg-magenta text-cream" : "bg-electric-blue text-cream"}`}>
        {isArtist ? "A" : "P"}
      </div>

      <div className={`max-w-[75%] space-y-1 ${isArtist ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender name + time */}
        <span className="font-display text-[10px] uppercase text-ink/40">
          {msg.sender_name ?? (isArtist ? "You" : "Promoter")} · {fmtTime(msg.created_at)}
        </span>

        {/* Message body */}
        <div className={`border-4 border-ink p-3 ${isArtist ? "bg-magenta text-cream" : "bg-cream text-ink"}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>

          {/* Quote card inside message */}
          {msg.quote_inr && (
            <div className={`mt-2 p-2 border-2 ${isArtist ? "border-cream/40 bg-cream/10" : "border-ink/20 bg-acid-yellow/20"}`}>
              <p className={`font-display text-xs uppercase ${isArtist ? "text-cream/70" : "text-ink/60"}`}>Quote</p>
              <p className={`font-display text-xl ${isArtist ? "text-acid-yellow" : "text-ink"}`}>
                ₹{msg.quote_inr.toLocaleString("en-IN")}
              </p>
              {msg.quote_valid_until && (
                <p className={`text-[10px] font-display ${isArtist ? "text-cream/50" : "text-ink/40"}`}>
                  Valid until {fmtDate(msg.quote_valid_until)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BookingThreadView({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: BookingRequest;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgBody, setMsgBody] = useState("");
  const [quoteInr, setQuoteInr] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const [sending, setSending] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [quotedInrState, setQuotedInrState] = useState<string>("");
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transitions = VALID_TRANSITIONS[booking.status] ?? [];
  const statusMeta = STATUS_META[booking.status] ?? STATUS_META["new"];

  async function authHeaders() {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const loadMessages = useCallback(async () => {
    try {
      const hdrs = await authHeaders();
      const r = await fetch(`/api/booking-messages/${booking.id}`, { headers: hdrs });
      const data = await r.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  }, [booking.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!msgBody.trim()) return;
    setSending(true);
    try {
      const hdrs = await authHeaders();
      const payload: any = { body: msgBody.trim() };
      if (showQuote && quoteInr) {
        payload.quote_inr = Number(quoteInr);
        payload.quote_valid_hours = 72;
      }
      await fetch(`/api/booking-messages/${booking.id}`, {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify(payload),
      });
      setMsgBody("");
      setQuoteInr("");
      setShowQuote(false);
      loadMessages();
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  }

  async function advanceStatus(toStatus: string) {
    setTransitioning(toStatus);
    try {
      const hdrs = await authHeaders();
      const body: any = { status: toStatus };
      if (toStatus === "quoted" && quotedInrState) body.quoted_inr = Number(quotedInrState);
      const r = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: hdrs,
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Booking ${toStatus}`);
      onStatusChange?.(booking.id, toStatus);
    } catch (e: any) { toast.error(e.message); }
    finally { setTransitioning(null); setShowStatusPanel(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl bg-cream border-4 border-ink flex flex-col max-h-[95vh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b-4 border-ink bg-ink shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-display text-[10px] uppercase px-2 py-0.5 border-2 border-cream/40 ${statusMeta.bg} ${statusMeta.text}`}>
                {statusMeta.label}
              </span>
              {booking.quoted_inr && (
                <span className="font-display text-[10px] uppercase px-2 py-0.5 bg-acid-yellow text-ink border border-cream/20">
                  Quoted ₹{booking.quoted_inr.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <p className="font-display text-lg text-cream uppercase leading-tight truncate">
              {booking.requester_name ?? booking.requester_email}
            </p>
            <div className="flex flex-wrap gap-3 mt-1 text-cream/50 text-xs">
              {booking.event_type && <span>{booking.event_type}</span>}
              {booking.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{fmtDate(booking.event_date)}
                  {booking.event_date_end && booking.event_date_end !== booking.event_date
                    ? ` – ${fmtDate(booking.event_date_end)}`
                    : ""}
                </span>
              )}
              {booking.venue_city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{booking.venue_city}
                </span>
              )}
              {booking.budget_inr && (
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />₹{booking.budget_inr.toLocaleString("en-IN")} budget
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-cream/40 flex items-center justify-center text-cream hover:bg-cream/10 shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status action bar */}
        {transitions.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b-4 border-ink bg-acid-yellow/20 shrink-0 flex-wrap">
            <span className="font-display text-xs uppercase text-ink/60">Advance:</span>
            {transitions.map((t) => (
              <button
                key={t.to}
                disabled={!!transitioning}
                onClick={() => {
                  if (t.to === "quoted") { setShowStatusPanel(true); }
                  else { advanceStatus(t.to); }
                }}
                className={`flex items-center gap-1.5 font-display text-xs uppercase px-3 py-1.5 border-2 border-ink chunk-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 ${t.color}`}
              >
                {transitioning === t.to ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {t.label}
              </button>
            ))}
            {/* Quoted INR input */}
            {showStatusPanel && (
              <div className="flex items-center gap-2 w-full mt-1">
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink/40" />
                  <input
                    type="number"
                    value={quotedInrState}
                    onChange={(e) => setQuotedInrState(e.target.value)}
                    placeholder="Quote amount"
                    className="border-4 border-ink pl-6 pr-3 py-1.5 bg-cream font-sans text-sm text-ink focus:outline-none w-40"
                  />
                </div>
                <button
                  onClick={() => advanceStatus("quoted")}
                  disabled={!quotedInrState || !!transitioning}
                  className="flex items-center gap-1 bg-acid-yellow text-ink font-display text-xs uppercase px-3 py-1.5 border-2 border-ink disabled:opacity-50"
                >
                  {transitioning === "quoted" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Send Quote
                </button>
                <button onClick={() => setShowStatusPanel(false)} className="text-ink/40 hover:text-ink">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 bg-ink/10 border-2 border-ink shrink-0" />
                  <div className="w-48 h-16 bg-ink/5 border-4 border-ink" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-ink/20 mx-auto mb-2" />
              <p className="font-display text-sm text-ink/40 uppercase">No messages yet</p>
              <p className="text-xs text-ink/30 mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}
        </div>

        {/* Compose area */}
        {!["declined", "cancelled", "completed"].includes(booking.status) && (
          <div className="border-t-4 border-ink p-4 space-y-2 shrink-0 bg-cream">
            {showQuote && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink/40" />
                  <input
                    type="number"
                    value={quoteInr}
                    onChange={(e) => setQuoteInr(e.target.value)}
                    placeholder="Quote (INR)"
                    className="border-4 border-ink pl-6 pr-3 py-1.5 bg-acid-yellow/20 font-sans text-sm text-ink focus:outline-none w-36"
                  />
                </div>
                <span className="font-display text-xs text-ink/50 uppercase">Will be shown in message</span>
                <button onClick={() => { setShowQuote(false); setQuoteInr(""); }} className="text-ink/40 hover:text-ink ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <textarea
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                rows={2}
                className="flex-1 border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors resize-none"
              />
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setShowQuote(!showQuote)}
                  title="Attach quote"
                  className="w-9 h-9 border-4 border-ink flex items-center justify-center hover:bg-acid-yellow transition-colors"
                >
                  <IndianRupee className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sending || !msgBody.trim()}
                  className="w-9 h-9 bg-ink text-cream border-4 border-ink flex items-center justify-center hover:bg-magenta transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-ink/30 font-display uppercase">
              Replies go directly to {booking.requester_email}
            </p>
          </div>
        )}

        {/* Closed booking notice */}
        {["declined", "cancelled", "completed"].includes(booking.status) && (
          <div className="border-t-4 border-ink p-4 bg-ink/5 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-ink/40 shrink-0" />
            <p className="font-display text-xs uppercase text-ink/40">
              This booking is {booking.status} — messaging is closed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
