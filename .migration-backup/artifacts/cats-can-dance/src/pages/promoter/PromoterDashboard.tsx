/**
 * PromoterDashboard — /promoter
 *
 * Works WITHOUT Clerk. Auth priority:
 *   1. Clerk signed-in user with promoter role
 *   2. Promoter token in sessionStorage (set via PromoterLogin)
 *
 * Shows token login form if neither is present.
 */
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "@/lib/compat-router";
import { useSafeUser } from "@/lib/clerk-safe";
import { getPromoterToken, clearPromoterToken } from "@/lib/promoter-auth";
import { toast } from "sonner";
import { getPromoterMe, getPromoterEvents } from "@/lib/ticketing-api";
import PromoterLogin from "@/components/PromoterLogin";

type PromoterEvent = { config: any; event: any };

export default function PromoterDashboard() {
  const { user, isLoaded } = useSafeUser();
  const [promoterUser, setPromoterUser] = useState<any>(null);
  const [promoter, setPromoter] = useState<any>(null);
  const [events, setEvents] = useState<PromoterEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [me, evData] = await Promise.all([getPromoterMe(), getPromoterEvents()]);
      setPromoterUser(me.promoter_user);
      setPromoter(me.promoter);
      setEvents(evData.events ?? []);
    } catch (e: any) {
      if (e.status === 401 || e.status === 403) {
        // Token invalid / expired — clear it
        clearPromoterToken();
        setPromoterUser(null);
      } else {
        toast.error("Failed to load dashboard: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    // Either Clerk user or stored token means we can try loading
    if (user || getPromoterToken()) {
      load();
    } else {
      setLoading(false);
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-display text-ink/30 text-sm uppercase animate-pulse">Loading…</p>
      </div>
    </div>
  );

  // Not authenticated at all — show login form
  if (!user && !getPromoterToken() && !promoterUser) {
    return <PromoterLogin onSuccess={pu => { setPromoterUser(pu); setLoading(true); load(); }} />;
  }

  // Token was tried but failed (e.g. expired)
  if (!promoterUser && !loading) {
    return <PromoterLogin onSuccess={pu => { setPromoterUser(pu); setLoading(true); load(); }} />;
  }

  const displayName = promoter?.name ?? promoterUser?.display_name ?? "Your Dashboard";
  const totalSold = events.reduce((a, e) => a + (e.config?.tickets_sold ?? 0), 0);

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Promoter Dashboard | CCD" description="Manage your events, tickets and RSVPs." path="/promoter" />
      <Nav />

      <div className="bg-ink border-b-4 border-ink pt-[72px]">
        <div className="container py-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ PROMOTER PORTAL</p>
            <h1 className="font-display text-5xl text-cream uppercase">{displayName}</h1>
            <p className="text-cream/40 text-sm mt-1">
              {promoterUser?.email ?? user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <button onClick={() => { clearPromoterToken(); window.location.reload(); }}
            className="font-display text-xs uppercase text-cream/30 border border-cream/20 px-3 py-1.5 hover:border-cream/60 hover:text-cream/60 transition-colors mt-2">
            Sign out
          </button>
        </div>
      </div>

      <div className="container py-10 max-w-5xl">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border-4 border-ink mb-10">
          {[
            { label: "Events",       value: events.length },
            { label: "Tickets Sold", value: totalSold },
            { label: "City",         value: promoter?.city ?? "—" },
            { label: "Status",       value: promoter?.trusted ? "✓ Verified" : "Active" },
          ].map(s => (
            <div key={s.label} className="bg-cream p-5">
              <p className="font-display text-4xl text-ink">{s.value}</p>
              <p className="font-display text-[10px] uppercase tracking-widest text-ink/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link to="/promoter/events/new"
            className="bg-magenta text-cream font-display text-base px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
            + ENABLE TICKETING FOR AN EVENT
          </Link>
          <Link to="/events"
            className="bg-cream text-ink font-display text-base px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
            VIEW EVENTS PAGE →
          </Link>
        </div>

        {/* Events list */}
        <h2 className="font-display text-2xl uppercase text-ink mb-5">/ YOUR EVENTS</h2>
        {events.length === 0 ? (
          <div className="border-4 border-dashed border-ink/20 p-16 text-center">
            <p className="font-display text-3xl text-ink/30 mb-3">NO EVENTS YET</p>
            <p className="text-ink/40 text-sm mb-6">Set up ticketing for one of your events to get started.</p>
            <Link to="/promoter/events/new"
              className="inline-block bg-ink text-cream font-display px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
              SET UP AN EVENT →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(({ config, event }) => (
              <Link key={config.event_slug} to={`/promoter/events/${config.event_slug}`}
                className="block border-4 border-ink bg-cream p-5 chunk-shadow hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl text-ink uppercase">{event?.title ?? config.event_slug}</p>
                    <p className="text-ink/50 text-sm">{event?.date ?? "—"} · {event?.venue ?? "—"}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${
                        config.ticketing_mode === "direct_sale" ? "bg-acid-yellow text-ink" :
                        config.ticketing_mode === "free_rsvp"   ? "bg-electric-blue text-cream" : "bg-magenta text-cream"
                      }`}>
                        {config.ticketing_mode === "direct_sale" ? "Direct Sale" :
                         config.ticketing_mode === "free_rsvp"   ? "Free RSVP" : "RSVP → Invite"}
                      </span>
                      {config.is_free && (
                        <span className="font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink bg-lime text-ink">FREE</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block font-display text-xs uppercase bg-ink text-cream px-3 py-1 hover:bg-magenta transition-colors">
                      MANAGE →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
