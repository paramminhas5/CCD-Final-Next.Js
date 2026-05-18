import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import PartnerContactDialog from "@/components/PartnerContactDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Other"];
const GENRES = ["House", "Techno", "Disco", "Jungle", "Drum & Bass", "Garage", "Ambient", "Electronic", "Live Music", "Multi-genre"];

type Step = "apply" | "submitted";

const SubmitEvent = () => {
  const [step, setStep] = useState<Step>("apply");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    instagram: "",
    website: "",
    city: "",
    genres: [] as string[],
    bio: "",
    sample_event: "",
  });

  const upd = (k: keyof typeof form, v: string | string[]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleGenre = (g: string) => {
    const next = form.genres.includes(g)
      ? form.genres.filter((x) => x !== g)
      : [...form.genres, g];
    upd("genres", next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.city || !form.bio) {
      toast.error("Fill in name, email, city and bio");
      return;
    }
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("promoter_applications").insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
        city: form.city,
        genres: form.genres,
        bio: form.bio.trim(),
        sample_event: form.sample_event.trim() || null,
        status: "pending",
      });
      if (error) throw error;
      setStep("submitted");
    } catch (err: any) {
      toast.error(err?.message?.includes("duplicate") ? "You've already applied with this email." : "Submit failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-background text-foreground">
      <SEO
        title="Submit Your Event | Cats Can Dance — Bangalore Underground"
        description="Apply to become a verified promoter and submit your underground dance music events to the Cats Can Dance discover feed."
        path="/submit-event"
      />
      <Nav />

      <PageHero
        eyebrow="SUBMIT"
        title="YOUR NIGHT."
        bg="bg-acid-yellow"
        textColor="text-ink"
        eyebrowColor="text-magenta"
        shadowColor="hsl(var(--ink))"
      >
        <p className="text-ink/80 font-display text-xl md:text-2xl mt-2">
          BECOME A VERIFIED PROMOTER. GET ON THE DISCOVER FEED.
        </p>
      </PageHero>

      <div className="container max-w-2xl py-12 md:py-20">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Events", to: "/events" }, { label: "Submit Event" }]} />

        {step === "submitted" ? (
          <div className="mt-10 bg-lime border-4 border-ink chunk-shadow p-8 text-center">
            <p className="font-display text-5xl text-ink mb-4">✓ RECEIVED.</p>
            <p className="text-ink/80 font-medium text-lg mb-6">
              We'll review your application and get back to you within 48 hours. Once approved,
              you'll be able to submit events directly to the discover feed.
            </p>
            <a href="/events"
              className="inline-block bg-ink text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
              BACK TO EVENTS →
            </a>
          </div>
        ) : (
          <>
            {/* How it works */}
            <div className="mt-10 mb-10">
              <p className="font-display text-magenta text-lg mb-3">/ HOW IT WORKS</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  ["01", "Apply", "Fill in this form — tell us who you are and what you run."],
                  ["02", "Get verified", "We review and approve promoters within 48 hours."],
                  ["03", "Submit events", "Approved promoters can add events straight to the discover feed."],
                ].map(([num, title, desc]) => (
                  <div key={num} className="bg-cream border-4 border-ink p-5 chunk-shadow">
                    <p className="font-display text-3xl text-magenta mb-1">{num}</p>
                    <p className="font-display text-xl text-ink mb-2">{title.toUpperCase()}</p>
                    <p className="text-ink/70 font-medium text-sm">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
              <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
                <p className="font-display text-2xl text-ink mb-2">PROMOTER APPLICATION</p>

                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-display text-sm text-ink mb-1">YOUR NAME *</label>
                    <input required value={form.name} onChange={(e) => upd("name", e.target.value)}
                      placeholder="Full name or alias"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
                  </div>
                  <div>
                    <label className="block font-display text-sm text-ink mb-1">EMAIL *</label>
                    <input required type="email" value={form.email} onChange={(e) => upd("email", e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
                  </div>
                </div>

                {/* Instagram + Website */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-display text-sm text-ink mb-1">INSTAGRAM</label>
                    <input value={form.instagram} onChange={(e) => upd("instagram", e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
                  </div>
                  <div>
                    <label className="block font-display text-sm text-ink mb-1">WEBSITE / LINKTREE</label>
                    <input value={form.website} onChange={(e) => upd("website", e.target.value)}
                      placeholder="https://"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block font-display text-sm text-ink mb-1">WHICH CITY DO YOU PRIMARILY RUN EVENTS IN? *</label>
                  <select required value={form.city} onChange={(e) => upd("city", e.target.value)}
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-display focus:outline-none focus:bg-acid-yellow">
                    <option value="">Select a city</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Genres */}
                <div>
                  <label className="block font-display text-sm text-ink mb-2">GENRES YOU TYPICALLY BOOK</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => (
                      <button key={g} type="button" onClick={() => toggleGenre(g)}
                        className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${
                          form.genres.includes(g) ? "bg-magenta text-cream border-magenta" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block font-display text-sm text-ink mb-1">
                    TELL US ABOUT YOUR NIGHTS *
                    <span className="text-ink/50 font-normal text-xs ml-2">What do you run? What's the vibe?</span>
                  </label>
                  <textarea required rows={4} value={form.bio} onChange={(e) => upd("bio", e.target.value)}
                    placeholder="e.g. We've been running monthly house and jungle nights in Bangalore since 2023, RSVP-only, 150-300 cap..."
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
                </div>

                {/* Sample event */}
                <div>
                  <label className="block font-display text-sm text-ink mb-1">
                    LINK TO A RECENT EVENT
                    <span className="text-ink/50 font-normal text-xs ml-2">Optional — Instagram post, event page, etc.</span>
                  </label>
                  <input value={form.sample_event} onChange={(e) => upd("sample_event", e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
                </div>
              </div>

              <button type="submit" disabled={busy}
                className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
                {busy ? "SUBMITTING…" : "APPLY TO BECOME A PROMOTER →"}
              </button>

              <p className="text-ink/50 text-sm text-center font-medium">
                Already a verified promoter?{" "}
                <PartnerContactDialog
                  kind="submit-event"
                  defaultReason="Verified promoter — submit event"
                  trigger={
                    <button type="button" className="underline hover:text-ink">Send us your event</button>
                  }
                />{" "}
                directly.
              </p>
            </form>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
};

export default SubmitEvent;
