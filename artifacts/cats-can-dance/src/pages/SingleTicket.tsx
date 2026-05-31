/**
 * SingleTicket — /my-tickets/[token]
 * Fullscreen QR code for door scan. Mobile-first, high contrast.
 * Also used as a direct link so recipients can view a transferred ticket.
 */
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { getTicketByToken } from "@/lib/ticketing-api";
import Nav from "@/components/Nav";
import { Link } from "@/lib/compat-router";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  issued:           { bg: "#b9f542",    text: "#1a1a1a", label: "✓ VALID" },
  checked_in:       { bg: "#1a1a1a",    text: "#f5e642", label: "✓ CHECKED IN" },
  refunded:         { bg: "#e040fb",    text: "#fff",    label: "✗ REFUNDED" },
  transferred:      { bg: "#aaa",       text: "#1a1a1a", label: "→ TRANSFERRED" },
  transfer_pending: { bg: "#f5e642",    text: "#1a1a1a", label: "⏳ TRANSFER PENDING" },
  voided:           { bg: "#ccc",       text: "#666",    label: "✗ VOIDED" },
};

export default function SingleTicket() {
  const [, navigate] = useLocation();
  const { token } = useParams<{ token?: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getTicketByToken(token as string)
      .then(d => { setTicket(d.ticket); setEvent(d.event); })
      .catch(e => setError(e.message ?? "Ticket not found"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cream border-t-magenta rounded-full animate-spin" />
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-24 text-center">
        <p className="font-display text-4xl text-magenta mb-4">TICKET NOT FOUND</p>
        <p className="text-ink/60 mb-6">{error}</p>
        <Link to="/my-tickets" className="inline-block bg-ink text-cream font-display px-5 py-3 border-4 border-ink chunk-shadow">
          MY TICKETS
        </Link>
      </div>
    </div>
  );

  const statusStyle = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.issued;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(ticket.qr_token)}&format=svg&margin=12`;

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Back link */}
      <div className="px-4 pt-safe pt-4">
        <Link to="/my-tickets" className="font-display text-cream/40 text-xs uppercase hover:text-cream transition-colors">
          ← MY TICKETS
        </Link>
      </div>

      {/* Main ticket card */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-xs">
          {/* Status banner */}
          <div className="border-4 border-ink mb-0" style={{ background: statusStyle.bg }}>
            <p className="font-display text-2xl text-center py-3 uppercase tracking-widest" style={{ color: statusStyle.text }}>
              {statusStyle.label}
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white border-x-4 border-ink flex items-center justify-center p-4">
            <img
              src={qrSrc}
              alt="Ticket QR Code"
              width={280}
              height={280}
              className="block"
            />
          </div>

          {/* Ticket info */}
          <div className="bg-cream border-4 border-ink border-t-0 p-5 space-y-3">
            <div>
              <p className="font-display text-[10px] uppercase text-ink/40">EVENT</p>
              <p className="font-display text-xl text-ink uppercase leading-tight">{ticket.event_title ?? event?.title ?? ticket.event_slug}</p>
              <p className="text-ink/60 text-sm">{ticket.event_date ?? event?.date ?? "—"} · {ticket.event_venue ?? event?.venue ?? "—"}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-display text-[10px] uppercase text-ink/40">TIER</p>
                <p className="font-medium text-ink text-sm">{ticket.tier_name}</p>
              </div>
              <div>
                <p className="font-display text-[10px] uppercase text-ink/40">HOLDER</p>
                <p className="font-medium text-ink text-sm truncate">{ticket.holder_name}</p>
              </div>
            </div>

            {ticket.checked_in_at && (
              <div className="bg-ink/5 border-2 border-ink/20 px-3 py-2">
                <p className="font-display text-[10px] uppercase text-ink/40">Checked in</p>
                <p className="text-sm text-ink">
                  {new Date(ticket.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  {ticket.check_in_gate ? ` · ${ticket.check_in_gate}` : ""}
                </p>
              </div>
            )}

            {/* Token ID */}
            <p className="font-mono text-[9px] text-ink/20 text-center break-all select-all">
              {ticket.qr_token}
            </p>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center pb-safe pb-4 px-4">
        <p className="font-display text-cream/20 text-[10px] uppercase">
          Show this QR at the door · catscandance.com
        </p>
      </div>
    </div>
  );
}
