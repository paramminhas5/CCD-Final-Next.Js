/**
 * PromoterLogin — zero-friction promoter authentication.
 *
 * Works without Clerk. Three paths visible to user:
 *   1. Paste your promoter token  (admin gives you this when approving your application)
 *   2. Sign in with Clerk         (only shown when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set)
 *   3. Apply to become a promoter (if not yet approved)
 *
 * On success: stores token in sessionStorage and calls onSuccess().
 */
import { useState } from "react";
import { isClerkEnabled } from "@/lib/clerk-safe";
import { setPromoterToken } from "@/lib/promoter-auth";
import { verifyPromoterToken } from "@/lib/ticketing-api";
import { toast } from "sonner";
import { Link } from "@/lib/compat-router";
import Nav from "@/components/Nav";

type Props = {
  onSuccess: (promoterUser: any) => void;
};

export default function PromoterLogin({ onSuccess }: Props) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const clerkEnabled = isClerkEnabled();

  const tryToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) { toast.error("Paste your promoter token"); return; }
    setBusy(true);
    try {
      const data = await verifyPromoterToken(t);
      setPromoterToken(t);
      toast.success(`Welcome, ${data.promoter?.name ?? data.promoter_user?.display_name ?? "promoter"}!`);
      onSuccess(data.promoter_user);
    } catch (err: any) {
      toast.error(err.message === "Invalid promoter token" ? "Invalid token — check with your CCD contact" : err.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <div className="container max-w-lg py-24">
        <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-2">/ PROMOTER PORTAL</p>
        <h1 className="font-display text-5xl uppercase text-ink mb-3">Promoter Login</h1>
        <p className="text-ink/60 mb-10">
          Sign in to manage your events, RSVPs, tickets and door check-in.
        </p>

        {/* Token login — always shown */}
        <div className="border-4 border-ink bg-cream chunk-shadow p-6 mb-5">
          <p className="font-display text-sm uppercase text-ink mb-1">Option 1 — Promoter token</p>
          <p className="text-ink/50 text-xs mb-4">
            Your token was generated when your application was approved.
            Check the email you used to apply, or ask your CCD contact.
          </p>
          <form onSubmit={tryToken} className="space-y-3">
            <input
              value={token} onChange={e => setToken(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-mono text-sm focus:outline-none focus:bg-acid-yellow"
              autoFocus
            />
            <button type="submit" disabled={busy}
              className="w-full bg-magenta text-cream font-display text-lg py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
              {busy ? "VERIFYING…" : "ENTER PORTAL →"}
            </button>
          </form>
        </div>

        {/* Clerk login — only if configured */}
        {clerkEnabled && (
          <div className="border-4 border-ink bg-cream chunk-shadow p-6 mb-5">
            <p className="font-display text-sm uppercase text-ink mb-3">Option 2 — Sign in with account</p>
            <a href="/sign-in?redirect_url=/promoter"
              className="block w-full text-center bg-ink text-cream font-display text-base py-3 border-4 border-ink hover:bg-acid-yellow hover:text-ink transition-colors">
              SIGN IN WITH CLERK →
            </a>
          </div>
        )}

        <div className="border-4 border-dashed border-ink/20 p-5">
          <p className="font-display text-sm uppercase text-ink/50 mb-2">Not a promoter yet?</p>
          <p className="text-ink/40 text-sm mb-3">
            Apply to become a verified CCD promoter. We review within 48 hours.
          </p>
          <Link to="/promoter/apply"
            className="inline-block bg-cream text-ink font-display text-sm px-5 py-2.5 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">
            APPLY NOW →
          </Link>
        </div>
      </div>
    </div>
  );
}
