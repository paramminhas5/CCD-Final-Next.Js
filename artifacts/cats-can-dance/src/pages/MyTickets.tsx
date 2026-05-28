/**
 * MyTickets — /my-tickets
 *
 * Works WITHOUT Clerk. Two access paths:
 *   1. Clerk signed-in user  → tickets fetched by holder_clerk_id (accurate)
 *   2. Email lookup form     → enter email, see all tickets for that address
 *
 * QR codes, transfer button, and full-screen ticket link work in both paths.
 */
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "@/lib/compat-router";
import { useSafeUser, isClerkEnabled } from "@/lib/clerk-safe";
import { toast } from "sonner";
import TransferDialog from "@/components/TransferDialog";

function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=svg&margin=8`;
  return <img src={src} alt="QR Code" width={size} height={size} className="block border-4 border-ink bg-white" loading="lazy" />;
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  issued:           { bg: "bg-lime text-ink border-lime",         label: "VALID" },
  checked_in:       { bg: "bg-ink text-cream border-ink",         label: "CHECKED IN" },
  refunded:         { bg: "bg-magenta text-cream border-magenta", label: "REFUNDED" },
  transferred:      { bg: "bg-ink/20 text-ink/50 border-ink/20",  label: "TRANSFERRED" },
  transfer_pending: { bg: "bg-acid-yellow text-ink border-ink",   label: "TRANSFER PENDING" },
  voided:           { bg: "bg-ink/10 text-ink/30 border-ink/10",  label: "VOIDED" },
};

// ─── Email lookup form ────────────────────────────────────────────────────────

function EmailLookup({ onFound }: { onFound: (email: string, tickets: any[]) => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/ticketing/my-tickets?email=${encodeURIComponent(trimmed)}`, {
        headers: { "x-ticket-email": trimmed },
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Lookup failed");
        return;
      }
      const tickets = await res.json();
      onFound(trimmed, Array.isArray(tickets) ? tickets : []);
    } catch {
      toast.error("Could not reach server — check your connection");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container max-w-md py-20">
      <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-2">/ MY TICKETS</p>
      <h1 className="font-display text-4xl uppercase text-ink mb-3">Find your tickets</h1>
      <p className="text-ink/60 mb-8 text-sm">
        Enter the email address you used when buying or RSVPing.
        {isClerkEnabled() && (
          <> Or <a href="/sign-in?redirect_url=/my-tickets" className="text-magenta underline">sign in</a> for a full account view.</>
        )}
      </p>
      <form onSubmit={lookup} className="space-y-4">
        <div>
          <label className="font-display text-sm text-ink mb-1 block">EMAIL ADDRESS</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <button type="submit" disabled={busy}
          className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
          {busy ? "LOOKING UP…" : "FIND MY TICKETS →"}
        </button>
      </form>
    </div>
  );
}

// ─── Ticket list ──────────────────────────────────────────────────────────────

function TicketList({ tickets, holderEmail }: { tickets: any[]; holderEmail?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [transferTicket, setTransferTicket] = useState<any>(null);
  const [localTickets, setLocalTickets] = useState(tickets);

  useEffect(() => { setLocalTickets(tickets); }, [tickets]);

  const byEvent: Record<string, any[]> = {};
  for (const t of localTickets) {
    if (!byEvent[t.event_slug]) byEvent[t.event_slug] = [];
    byEvent[t.event_slug].push(t);
  }

  if (localTickets.length === 0) {
    return (
      <div className="border-4 border-dashed border-ink/20 p-16 text-center">
        <p className="font-display text-3xl text-ink/30 mb-3">NO TICKETS FOUND</p>
        <p className="text-ink/40 text-sm mb-6">
          No tickets for this email address.{" "}
          {holderEmail && <span>Double-check the email you used at checkout.</span>}
        </p>
        <Link to="/events" className="inline-block bg-ink text-cream font-display px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
          BROWSE EVENTS →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(byEvent).map(([slug, eventTickets]) => {
          const sample = eventTickets[0];
          return (
            <div key={slug}>
              <div className="bg-magenta text-cream border-4 border-ink px-5 py-4 mb-3">
                <p className="font-display text-2xl uppercase leading-tight">{sample.event_title ?? slug}</p>
                <p className="text-cream/70 text-sm">{sample.event_date ?? "—"} · {sample.event_venue ?? "—"}</p>
              </div>
              <div className="space-y-3">
                {eventTickets.map(ticket => {
                  const isOpen = expanded === ticket.id;
                  const styleInfo = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.issued;
                  const canTransfer = ticket.status === "issued" && (ticket.transfer_count ?? 0) < 3;
                  const ticketUrl = `${typeof window !== "undefined" ? window.location.origin : "https://catscandance.com"}/my-tickets/${ticket.qr_token}`;

                  return (
                    <div key={ticket.id} className="border-4 border-ink bg-cream overflow-hidden">
                      <button type="button" onClick={() => setExpanded(isOpen ? null : ticket.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-acid-yellow/10 transition-colors text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`font-display text-[10px] uppercase px-2 py-0.5 border-2 shrink-0 ${styleInfo.bg}`}>
                            {styleInfo.label}
                          </span>
                          <div className="min-w-0">
                            <p className="font-display text-base text-ink uppercase truncate">{ticket.tier_name}</p>
                            <p className="text-ink/40 text-xs">{ticket.holder_name}</p>
                          </div>
                        </div>
                        <span className="font-display text-ink text-lg ml-3">{isOpen ? "↑" : "↓"}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t-4 border-ink px-5 py-5">
                          <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="shrink-0">
                              <QrCode value={ticket.qr_token} size={180} />
                              <p className="font-mono text-[9px] text-ink/30 text-center mt-1 break-all max-w-[180px]">
                                {ticket.qr_token.slice(0, 16).toUpperCase()}…
                              </p>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <p className="font-display text-[10px] uppercase text-ink/40 mb-0.5">TICKET HOLDER</p>
                                <p className="font-medium text-ink">{ticket.holder_name}</p>
                                <p className="text-ink/50 text-sm">{ticket.holder_email}</p>
                              </div>
                              <div>
                                <p className="font-display text-[10px] uppercase text-ink/40 mb-0.5">TIER</p>
                                <p className="font-medium text-ink">{ticket.tier_name}</p>
                              </div>
                              {ticket.checked_in_at && (
                                <div>
                                  <p className="font-display text-[10px] uppercase text-ink/40 mb-0.5">CHECKED IN</p>
                                  <p className="text-sm text-ink">
                                    {new Date(ticket.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    {ticket.check_in_gate ? ` · ${ticket.check_in_gate}` : ""}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <a href={`/my-tickets/${ticket.qr_token}`}
                                  className="font-display text-xs uppercase bg-ink text-cream px-3 py-2 border-2 border-ink hover:bg-magenta transition-colors">
                                  FULL SCREEN QR
                                </a>
                                {canTransfer && (
                                  <button type="button" onClick={() => setTransferTicket({ ...ticket, holderEmail })}
                                    className="font-display text-xs uppercase bg-cream text-ink px-3 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
                                    TRANSFER →
                                  </button>
                                )}
                                <button type="button" onClick={async () => {
                                  try {
                                    await navigator.share?.({ title: ticket.event_title, url: ticketUrl });
                                  } catch {
                                    await navigator.clipboard.writeText(ticketUrl);
                                    toast.success("Ticket link copied");
                                  }
                                }} className="font-display text-xs uppercase bg-cream text-ink px-3 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
                                  SHARE / COPY LINK
                                </button>
                              </div>
                              {(ticket.transfer_count ?? 0) >= 3 && ticket.status === "issued" && (
                                <p className="text-ink/40 text-xs">Max transfers reached (3/3)</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {transferTicket && (
        <TransferDialog
          ticket={transferTicket}
          onClose={() => setTransferTicket(null)}
          onSuccess={() => { setTransferTicket(null); }}
        />
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyTickets() {
  const { user, isLoaded } = useSafeUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Load tickets for signed-in Clerk user
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setLoading(false); return; }
    fetch("/api/ticketing/my-tickets", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load tickets"))
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  const handleEmailFound = (email: string, found: any[]) => {
    setLookupEmail(email);
    setTickets(found);
    setShowEmailForm(false);
  };

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-display text-ink/30 text-sm uppercase animate-pulse">Loading…</div>
      </div>
    </div>
  );

  const byEvent: Record<string, any[]> = {};
  for (const t of tickets) { if (!byEvent[t.event_slug]) byEvent[t.event_slug] = []; byEvent[t.event_slug].push(t); }

  // Not signed in and no email lookup yet — show lookup form
  if (!user && !lookupEmail) {
    return (
      <div className="min-h-screen bg-cream">
        <SEO title="My Tickets | Cats Can Dance" description="Find and view your CCD event tickets" path="/my-tickets" />
        <Nav />
        <EmailLookup onFound={handleEmailFound} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="My Tickets | Cats Can Dance" description="Your CCD event tickets" path="/my-tickets" />
      <Nav />

      <div className="bg-ink border-b-4 border-ink pt-[72px]">
        <div className="container py-8">
          <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ MY TICKETS</p>
          <h1 className="font-display text-5xl text-cream uppercase">Your Tickets</h1>
          <p className="text-cream/40 text-sm mt-1">
            {lookupEmail ? `Showing tickets for ${lookupEmail}` : user?.primaryEmailAddress?.emailAddress ?? ""}
            {" · "}{tickets.length} ticket{tickets.length !== 1 ? "s" : ""} across {Object.keys(byEvent).length} event{Object.keys(byEvent).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="container max-w-3xl py-10">
        {/* Option to search a different email */}
        {(lookupEmail || !user) && (
          <div className="mb-6">
            {showEmailForm ? (
              <div className="border-4 border-ink p-4 bg-cream mb-4">
                <p className="font-display text-sm uppercase text-ink mb-3">Search different email</p>
                <EmailLookup onFound={handleEmailFound} />
              </div>
            ) : (
              <button onClick={() => setShowEmailForm(true)}
                className="font-display text-xs uppercase text-ink/40 border-2 border-ink/20 px-3 py-1.5 hover:border-ink hover:text-ink transition-colors">
                ← Search different email
              </button>
            )}
          </div>
        )}

        <TicketList tickets={tickets} holderEmail={lookupEmail ?? user?.primaryEmailAddress?.emailAddress} />
      </div>

      <Footer />
    </div>
  );
}
