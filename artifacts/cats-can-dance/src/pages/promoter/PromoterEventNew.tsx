/**
 * PromoterEventNew — /promoter/events/new
 * Let a promoter pick an existing CCD event and configure ticketing for it.
 */
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Link } from "@/lib/compat-router";
import { useSafeUser } from "@/lib/clerk-safe";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-shim";
import { createEventTicketing, createTier } from "@/lib/ticketing-api";

const MODES = [
  { value: "rsvp_invite", label: "RSVP → Invite", desc: "Fans RSVP, you approve, then send a payment link." },
  { value: "direct_sale", label: "Direct Sale", desc: "Fans buy tickets immediately without RSVP." },
  { value: "free_rsvp", label: "Free RSVP", desc: "No payment — just name-on-the-door." },
];

export default function PromoterEventNew() {
  const { user, isLoaded } = useSafeUser();
  const [events, setEvents] = useState<any[]>([]);
  const [step, setStep] = useState<"event" | "tiers" | "done">("event");
  const [busy, setBusy] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");

  const [cfg, setCfg] = useState({
    event_slug: "", ticketing_mode: "rsvp_invite", is_free: false,
    total_capacity: "", max_tickets_per_order: 4, allow_transfers: true,
    require_phone: false, payment_link_expiry_hours: 48,
  });

  // Tier form
  const [tiers, setTiers] = useState<any[]>([]);
  const [tierForm, setTierForm] = useState({ name: "", price_inr: "", capacity: "", description: "", is_free: false });

  useEffect(() => {
    supabase.from("events").select("slug,title,date,venue,city,status").then(({ data }) => {
      if (data) setEvents((data as any[]).filter(e => e.status === "upcoming"));
    });
  }, []);

  const submitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg.event_slug) { toast.error("Select an event"); return; }
    setBusy(true);
    try {
      await createEventTicketing({
        ...cfg,
        total_capacity: cfg.total_capacity ? parseInt(cfg.total_capacity) : null,
        is_free: cfg.ticketing_mode === "free_rsvp" ? true : cfg.is_free,
      });
      setCreatedSlug(cfg.event_slug);
      setStep("tiers");
      toast.success("Ticketing enabled!");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const addTier = async () => {
    if (!tierForm.name) { toast.error("Tier name required"); return; }
    setBusy(true);
    try {
      const res = await createTier(createdSlug, {
        ...tierForm,
        price_inr: tierForm.is_free ? 0 : (parseInt(tierForm.price_inr) || 0),
        capacity: tierForm.capacity ? parseInt(tierForm.capacity) : null,
      });
      setTiers(t => [...t, res.tier]);
      setTierForm({ name: "", price_inr: "", capacity: "", description: "", is_free: false });
      toast.success(`Tier "${res.tier.name}" added`);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (!isLoaded || !user) return <div className="min-h-screen bg-cream"><Nav /></div>;

  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <div className="bg-ink border-b-4 border-ink pt-[72px]">
        <div className="container py-8">
          <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ PROMOTER PORTAL</p>
          <h1 className="font-display text-4xl text-cream uppercase">Enable Ticketing</h1>
        </div>
      </div>

      <div className="container max-w-2xl py-10">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-8">
          {[["event", "01 Configure"], ["tiers", "02 Ticket Tiers"], ["done", "03 Done"]].map(([s, l]) => (
            <div key={s} className={`flex items-center gap-2 font-display text-xs uppercase ${step === s ? "text-ink" : step > s ? "text-ink/40" : "text-ink/20"}`}>
              <span className={`w-6 h-6 flex items-center justify-center border-2 text-[10px] ${step === s ? "border-ink bg-ink text-cream" : "border-ink/30"}`}>{s === "done" && step === "done" ? "✓" : l.slice(0, 2)}</span>
              <span className="hidden sm:inline">{l.slice(3)}</span>
            </div>
          ))}
        </div>

        {step === "event" && (
          <form onSubmit={submitConfig} className="space-y-6">
            <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-5">
              <p className="font-display text-xl text-ink uppercase">Select Event & Mode</p>
              <div>
                <label className="block font-display text-sm text-ink mb-1">EVENT *</label>
                <select required value={cfg.event_slug} onChange={e => setCfg(c => ({ ...c, event_slug: e.target.value }))}
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-display focus:outline-none focus:bg-acid-yellow">
                  <option value="">— Pick an event —</option>
                  {events.map(ev => <option key={ev.slug} value={ev.slug}>{ev.title} · {ev.date}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-display text-sm text-ink mb-2">TICKETING MODE *</label>
                <div className="space-y-2">
                  {MODES.map(m => (
                    <label key={m.value} className={`flex items-start gap-3 p-4 border-4 cursor-pointer transition-colors ${cfg.ticketing_mode === m.value ? "border-magenta bg-magenta/5" : "border-ink hover:bg-acid-yellow/20"}`}>
                      <input type="radio" name="mode" value={m.value} checked={cfg.ticketing_mode === m.value}
                        onChange={() => setCfg(c => ({ ...c, ticketing_mode: m.value, is_free: m.value === "free_rsvp" }))} className="mt-1" />
                      <div><p className="font-display text-base text-ink uppercase">{m.label}</p><p className="text-ink/60 text-sm">{m.desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>

              {cfg.ticketing_mode !== "free_rsvp" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={cfg.is_free} onChange={e => setCfg(c => ({ ...c, is_free: e.target.checked }))} className="w-5 h-5" />
                  <span className="font-display text-sm text-ink uppercase">Free Event (no payment, just reservation)</span>
                </label>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block font-display text-sm text-ink mb-1">TOTAL CAPACITY <span className="text-ink/40 font-normal">(optional)</span></label>
                  <input type="number" value={cfg.total_capacity} onChange={e => setCfg(c => ({ ...c, total_capacity: e.target.value }))} placeholder="e.g. 200" className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
                <div><label className="block font-display text-sm text-ink mb-1">MAX TICKETS / ORDER</label>
                  <input type="number" min={1} max={20} value={cfg.max_tickets_per_order} onChange={e => setCfg(c => ({ ...c, max_tickets_per_order: parseInt(e.target.value) || 4 }))} className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cfg.allow_transfers} onChange={e => setCfg(c => ({ ...c, allow_transfers: e.target.checked }))} className="w-4 h-4" />
                  <span className="font-display text-xs text-ink uppercase">Allow Ticket Transfers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cfg.require_phone} onChange={e => setCfg(c => ({ ...c, require_phone: e.target.checked }))} className="w-4 h-4" />
                  <span className="font-display text-xs text-ink uppercase">Require Phone Number</span>
                </label>
              </div>

              {cfg.ticketing_mode === "rsvp_invite" && (
                <div><label className="block font-display text-sm text-ink mb-1">PAYMENT LINK EXPIRY (hours)</label>
                  <input type="number" value={cfg.payment_link_expiry_hours} onChange={e => setCfg(c => ({ ...c, payment_link_expiry_hours: parseInt(e.target.value) || 48 }))} className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
              )}
            </div>

            <button type="submit" disabled={busy} className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
              {busy ? "SAVING…" : cfg.ticketing_mode === "free_rsvp" ? "ENABLE FREE RSVP →" : "CONTINUE: ADD TICKET TIERS →"}
            </button>
          </form>
        )}

        {step === "tiers" && (
          <div className="space-y-6">
            <div className="bg-cream border-4 border-ink chunk-shadow p-6">
              <p className="font-display text-xl text-ink uppercase mb-4">Add Ticket Tiers</p>
              <p className="text-ink/60 text-sm mb-5">Create at least one tier (e.g. General Admission ₹500). You can add more later.</p>

              {/* Existing tiers */}
              {tiers.length > 0 && (
                <div className="space-y-2 mb-5">
                  {tiers.map(t => (
                    <div key={t.id} className="flex items-center justify-between border-2 border-ink/20 px-4 py-3 bg-lime">
                      <span className="font-display text-sm text-ink uppercase">{t.name}</span>
                      <span className="font-display text-sm text-ink">{t.is_free ? "FREE" : `₹${t.price_inr}`}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="block font-display text-[10px] uppercase text-ink mb-1">TIER NAME *</label>
                    <input value={tierForm.name} onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))} placeholder="General Admission" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow" /></div>
                  <div><label className="block font-display text-[10px] uppercase text-ink mb-1">PRICE (₹) {tierForm.is_free && "(free)"}</label>
                    <input type="number" disabled={tierForm.is_free} value={tierForm.price_inr} onChange={e => setTierForm(f => ({ ...f, price_inr: e.target.value }))} placeholder="500" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow disabled:opacity-40" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="block font-display text-[10px] uppercase text-ink mb-1">CAPACITY <span className="text-ink/40 font-normal">(optional)</span></label>
                    <input type="number" value={tierForm.capacity} onChange={e => setTierForm(f => ({ ...f, capacity: e.target.value }))} placeholder="100" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow" /></div>
                  <div><label className="block font-display text-[10px] uppercase text-ink mb-1">DESCRIPTION <span className="text-ink/40 font-normal">(optional)</span></label>
                    <input value={tierForm.description} onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))} placeholder="Includes free drink" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow" /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tierForm.is_free} onChange={e => setTierForm(f => ({ ...f, is_free: e.target.checked, price_inr: e.target.checked ? "0" : f.price_inr }))} className="w-4 h-4" />
                  <span className="font-display text-xs text-ink uppercase">Free Tier (comp / press)</span>
                </label>
                <button onClick={addTier} disabled={busy} className="w-full bg-ink text-cream font-display py-3 border-4 border-ink hover:bg-magenta transition-colors disabled:opacity-60">
                  {busy ? "ADDING…" : "+ ADD TIER"}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("done")} disabled={tiers.length === 0}
                className="flex-1 bg-magenta text-cream font-display text-lg py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-40">
                DONE — GO TO DASHBOARD →
              </button>
              <button onClick={() => setStep("done")} className="bg-cream text-ink font-display text-sm py-3 px-5 border-4 border-ink hover:bg-acid-yellow transition-colors">
                SKIP
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="bg-lime border-4 border-ink chunk-shadow p-8 text-center">
            <p className="font-display text-5xl text-ink mb-4">✓ LIVE.</p>
            <p className="text-ink/80 font-medium text-lg mb-6">Ticketing is enabled for this event. Manage RSVPs, view sales, and scan tickets from your event dashboard.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to={`/promoter/events/${createdSlug}`} className="inline-block bg-ink text-cream font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">MANAGE EVENT →</Link>
              <Link to="/promoter" className="inline-block bg-cream text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">DASHBOARD</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
