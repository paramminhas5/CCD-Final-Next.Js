/**
 * PromoterApply — /promoter/apply
 * Promoter application form. On success, shows confirmation.
 * Mirrors the existing SubmitEvent page style but saves to the
 * new promoter_applications table via /api/ticketing/promoter/apply.
 */
import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { applyAsPromoter } from "@/lib/ticketing-api";
import { Link } from "@/lib/compat-router";

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Chennai", "Hyderabad", "Other"];
const GENRES = ["House", "Techno", "Disco", "Jungle", "Drum & Bass", "Garage", "Ambient", "Electronic", "Live Music", "Multi-genre"];

export default function PromoterApply() {
  const [step, setStep] = useState<"apply" | "submitted">("apply");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", instagram: "", website: "", city: "",
    genres: [] as string[], bio: "", sample_event: "",
  });

  const upd = (k: keyof typeof form, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));
  const toggleGenre = (g: string) => upd("genres", form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.city || !form.bio) { toast.error("Fill in name, email, city and bio"); return; }
    setBusy(true);
    try {
      await applyAsPromoter({ ...form, email: form.email.trim().toLowerCase() });
      setStep("submitted");
    } catch (err: any) {
      toast.error(err?.message?.includes("pending") ? "You've already applied with this email — we'll be in touch." : "Submit failed — try again.");
    } finally { setBusy(false); }
  };

  return (
    <main className="bg-background text-foreground">
      <SEO title="Become a Promoter | Cats Can Dance" description="Apply to become a verified CCD promoter and sell tickets directly on catscandance.com." path="/promoter/apply" />
      <Nav />
      <PageHero eyebrow="PROMOTERS" title="SELL YOUR NIGHT." bg="bg-ink" textColor="text-cream" eyebrowColor="text-acid-yellow" shadowColor="hsl(var(--cream))">
        <p className="text-cream/80 font-display text-xl md:text-2xl mt-2">APPLY. GET APPROVED. SELL TICKETS.</p>
      </PageHero>

      <div className="container max-w-2xl py-12 md:py-20">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Promoter Portal", to: "/promoter" }, { label: "Apply" }]} />

        {step === "submitted" ? (
          <div className="mt-10 bg-lime border-4 border-ink chunk-shadow p-8 text-center">
            <p className="font-display text-5xl text-ink mb-4">✓ RECEIVED.</p>
            <p className="text-ink/80 font-medium text-lg mb-6">
              We'll review your application within 48 hours. Once approved you'll get access to the promoter portal — create events, set ticket prices, and manage RSVPs.
            </p>
            <Link to="/events" className="inline-block bg-ink text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
              BACK TO EVENTS →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 mb-10 grid sm:grid-cols-3 gap-4">
              {[["01", "Apply", "Tell us about your nights."], ["02", "Get verified", "We review in 48 hours."], ["03", "Sell tickets", "Set prices, manage RSVPs, get paid."]].map(([n, t, d]) => (
                <div key={n} className="bg-cream border-4 border-ink p-5 chunk-shadow">
                  <p className="font-display text-3xl text-magenta mb-1">{n}</p>
                  <p className="font-display text-xl text-ink mb-2">{t.toUpperCase()}</p>
                  <p className="text-ink/70 font-medium text-sm">{d}</p>
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-6">
              <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
                <p className="font-display text-2xl text-ink mb-2">PROMOTER APPLICATION</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="block font-display text-sm text-ink mb-1">YOUR NAME *</label>
                    <input required value={form.name} onChange={e => upd("name", e.target.value)} className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
                  <div><label className="block font-display text-sm text-ink mb-1">EMAIL *</label>
                    <input required type="email" value={form.email} onChange={e => upd("email", e.target.value)} className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="block font-display text-sm text-ink mb-1">INSTAGRAM</label>
                    <input value={form.instagram} onChange={e => upd("instagram", e.target.value)} placeholder="@handle" className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
                  <div><label className="block font-display text-sm text-ink mb-1">WEBSITE</label>
                    <input value={form.website} onChange={e => upd("website", e.target.value)} placeholder="https://" className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
                </div>
                <div><label className="block font-display text-sm text-ink mb-1">PRIMARY CITY *</label>
                  <select required value={form.city} onChange={e => upd("city", e.target.value)} className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-display focus:outline-none focus:bg-acid-yellow">
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block font-display text-sm text-ink mb-2">GENRES YOU BOOK</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(g => (
                      <button key={g} type="button" onClick={() => toggleGenre(g)}
                        className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${form.genres.includes(g) ? "bg-magenta text-cream border-magenta" : "bg-cream text-ink hover:bg-acid-yellow"}`}>{g}</button>
                    ))}
                  </div></div>
                <div><label className="block font-display text-sm text-ink mb-1">ABOUT YOUR NIGHTS *</label>
                  <textarea required rows={4} value={form.bio} onChange={e => upd("bio", e.target.value)} placeholder="What do you run? What's the vibe? Capacity, frequency, etc." className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
                <div><label className="block font-display text-sm text-ink mb-1">LINK TO A RECENT EVENT <span className="text-ink/40 font-normal text-xs">(optional)</span></label>
                  <input value={form.sample_event} onChange={e => upd("sample_event", e.target.value)} placeholder="Instagram post, event page…" className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" /></div>
              </div>
              <button type="submit" disabled={busy} className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
                {busy ? "SUBMITTING…" : "APPLY TO BECOME A PROMOTER →"}
              </button>
              <p className="text-ink/50 text-sm text-center">Already approved? <Link to="/promoter" className="underline hover:text-ink">Go to your dashboard →</Link></p>
            </form>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
