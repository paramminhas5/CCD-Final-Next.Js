/**
 * ClaimTransfer — /tickets/claim/[claimToken]
 * Recipient lands here from transfer email, enters their name and claims the ticket.
 */
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { claimTransfer, getTicketByToken } from "@/lib/ticketing-api";
import { useSafeUser } from "@/lib/clerk-safe";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";
import { Link } from "@/lib/compat-router";

export default function ClaimTransfer() {
  const [, navigate] = useLocation();
  const { claimToken } = useParams<{ claimToken?: string }>();
  const { user } = useSafeUser();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const [claimed, setClaimed] = useState<any>(null);
  const [error, setError] = useState("");

  // Pre-fill name from Clerk user if signed in
  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
  }, [user]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimToken) return;
    setBusy(true);
    try {
      const result = await claimTransfer(claimToken as string, {
        recipient_name: name.trim() || undefined,
        recipient_clerk_id: user?.id,
      });
      setBurst(true);
      setTimeout(() => setBurst(false), 1500);
      setClaimed(result);
    } catch (err: any) {
      const msg = err.message ?? "Claim failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <Confetti active={burst} />

      <div className="container max-w-md py-16 md:py-24">
        {claimed ? (
          <div className="space-y-5">
            <div className="bg-lime border-4 border-ink chunk-shadow p-6">
              <p className="font-display text-5xl text-ink mb-2">✓</p>
              <p className="font-display text-3xl text-ink uppercase mb-2">Ticket Claimed!</p>
              <p className="text-ink/70">Your ticket has been issued. Check your email for the QR code, or view it below.</p>
            </div>

            <div className="border-4 border-ink p-5 bg-cream">
              <p className="font-display text-[10px] uppercase text-ink/40 mb-2">YOUR TICKET</p>
              <p className="font-display text-xl text-ink uppercase">{claimed.ticket?.tier_name}</p>
              <p className="text-ink/50 text-sm">{claimed.ticket?.event_title ?? "—"}</p>
            </div>

            <div className="flex gap-3">
              <a
                href={`/my-tickets/${claimed.new_qr_token}`}
                className="flex-1 bg-ink text-cream font-display text-base py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform text-center"
              >
                VIEW QR TICKET →
              </a>
              <Link
                to="/my-tickets"
                className="bg-cream text-ink font-display text-sm py-3 px-4 border-4 border-ink hover:bg-acid-yellow transition-colors"
              >
                MY TICKETS
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-magenta text-cream border-4 border-ink chunk-shadow p-6 mb-6">
              <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ TICKET TRANSFER</p>
              <h1 className="font-display text-4xl uppercase leading-tight">Someone sent you a ticket.</h1>
              <p className="text-cream/80 mt-2 text-sm">Confirm your name below to claim it.</p>
            </div>

            {error ? (
              <div className="border-4 border-ink bg-cream p-6 text-center space-y-4">
                <p className="font-display text-2xl text-magenta uppercase">Link Invalid</p>
                <p className="text-ink/60 text-sm">{error}</p>
                <p className="text-ink/40 text-xs">This link may have expired (24h limit) or already been claimed.</p>
                <Link to="/events" className="inline-block bg-ink text-cream font-display px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
                  BROWSE EVENTS
                </Link>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="space-y-4">
                <div className="bg-cream border-4 border-ink p-5 space-y-4">
                  <div>
                    <label className="block font-display text-sm text-ink mb-1">YOUR NAME</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                    />
                  </div>
                  <div className="bg-acid-yellow/20 border-2 border-ink/20 p-3 text-xs text-ink/60">
                    <strong className="font-display text-[10px] uppercase block mb-1">Face-value transfers only</strong>
                    This ticket was transferred at its original price. CCD does not allow resale above face value.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
                >
                  {busy ? "CLAIMING…" : "CLAIM MY TICKET →"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
