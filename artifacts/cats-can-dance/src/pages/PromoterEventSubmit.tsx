/**
 * PromoterEventSubmit — /submit-event/event
 *
 * Auth-gated form for verified promoters to submit events directly
 * to the curated_events table.
 *
 * Trusted promoters → auto-published
 * Non-trusted promoters → goes to pending queue, visible in admin
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const CITIES = [
  "Bengaluru", "Mumbai", "Delhi", "Pune", "Goa",
  "Hyderabad", "Chennai", "Kolkata", "Jaipur", "Ahmedabad", "Other",
];

const GENRES = [
  "House", "Techno", "Disco", "Jungle", "Drum & Bass",
  "UK Garage", "Ambient", "Experimental", "Psytrance", "Electronic", "Live Music",
];

type Step = "form" | "submitting" | "success" | "not_promoter";

export default function PromoterEventSubmit() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();

  const [step,   setStep]   = useState<Step>("form");
  const [result, setResult] = useState<any>(null);
  const [form,   setForm]   = useState({
    title:       "",
    url:         "",
    event_date:  "",
    event_time:  "",
    city:        "",
    venue:       "",
    blurb:       "",
    genre:       [] as string[],
    image_url:   "",
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { navigate("/sign-in?redirect_url=/submit-event/event"); return; }
  }, [isLoaded, isSignedIn, router]);

  const upd = (k: keyof typeof form, v: string | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleGenre = (g: string) =>
    upd("genre", form.genre.includes(g) ? form.genre.filter(x => x !== g) : [...form.genre, g]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url || !form.event_date || !form.city) {
      toast.error("Fill in title, URL, date and city");
      return;
    }
    setStep("submitting");

    try {
      // Get the session token from Clerk
      const token = await (user as any)?.getToken?.() ?? "";
      const res = await fetch("/api/promoters/submit-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setStep("not_promoter");
        } else {
          toast.error(data.error ?? "Submit failed");
          setStep("form");
        }
        return;
      }

      setResult(data);
      setStep("success");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setStep("form");
    }
  };

  if (!isLoaded) {
    return (
      <main className="bg-cream min-h-screen">
        <Nav />
        <div className="container pt-32 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream min-h-screen">
      <SEO
        title="Submit Event — Cats Can Dance"
        description="Submit your upcoming event to the CCD Discover feed."
        path="/submit-event/event"
      />
      <Nav />

      <div className="border-b-4 border-ink bg-ink pt-[72px] py-8">
        <div className="container">
          <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ SUBMIT EVENT</p>
          <h1 className="font-display text-5xl text-cream uppercase">Your Night.</h1>
          <p className="text-cream/50 text-sm mt-2">Submit an event to the CCD Discover feed.</p>
        </div>
      </div>

      <div className="container max-w-2xl py-12">

        {/* Not a promoter */}
        {step === "not_promoter" && (
          <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-8 text-center">
            <AlertCircle className="w-10 h-10 text-ink mx-auto mb-3" />
            <p className="font-display text-3xl text-ink uppercase mb-3">Not Verified Yet</p>
            <p className="text-ink/80 mb-6">
              Your account doesn't have a linked promoter profile. Apply first — we review within 48 hours.
            </p>
            <a
              href="/submit-event"
              className="inline-block font-display text-sm uppercase bg-ink text-cream px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
            >
              Apply to Become a Promoter →
            </a>
          </div>
        )}

        {/* Success */}
        {step === "success" && result && (
          <div className="border-4 border-ink bg-lime chunk-shadow p-8 text-center">
            <CheckCircle className="w-10 h-10 text-ink mx-auto mb-3" />
            <p className="font-display text-3xl text-ink uppercase mb-3">
              {result.submission_status === "published" ? "✓ Live!" : "✓ Received!"}
            </p>
            <p className="text-ink/80 mb-6">{result.message}</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <a
                href="/discover"
                className="inline-block font-display text-sm uppercase bg-ink text-cream px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                View on Discover →
              </a>
              <button
                onClick={() => { setStep("form"); setForm({ title:"",url:"",event_date:"",event_time:"",city:"",venue:"",blurb:"",genre:[],image_url:"" }); }}
                className="font-display text-sm uppercase bg-cream text-ink px-6 py-3 border-4 border-ink chunk-shadow hover:bg-acid-yellow transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {(step === "form" || step === "submitting") && (
          <form onSubmit={submit} className="space-y-6">
            <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
              <p className="font-display text-2xl text-ink mb-4">EVENT DETAILS</p>

              {/* Title + URL */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-display text-xs uppercase text-ink mb-1">Event Name *</label>
                  <input
                    required value={form.title}
                    onChange={e => upd("title", e.target.value)}
                    placeholder="e.g. Subculture × Bonobo"
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
                <div>
                  <label className="block font-display text-xs uppercase text-ink mb-1">Ticket / Event URL *</label>
                  <input
                    required type="url" value={form.url}
                    onChange={e => upd("url", e.target.value)}
                    placeholder="https://insider.in/go/..."
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-display text-xs uppercase text-ink mb-1">Date *</label>
                  <input
                    required type="date" value={form.event_date}
                    onChange={e => upd("event_date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
                <div>
                  <label className="block font-display text-xs uppercase text-ink mb-1">Start Time</label>
                  <input
                    type="time" value={form.event_time}
                    onChange={e => upd("event_time", e.target.value)}
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
              </div>

              {/* City + Venue */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-display text-xs uppercase text-ink mb-1">City *</label>
                  <select
                    required value={form.city}
                    onChange={e => upd("city", e.target.value)}
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-display focus:outline-none focus:bg-acid-yellow"
                  >
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-display text-xs uppercase text-ink mb-1">Venue</label>
                  <input
                    value={form.venue}
                    onChange={e => upd("venue", e.target.value)}
                    placeholder="e.g. Counterculture, Bengaluru"
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block font-display text-xs uppercase text-ink mb-2">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button
                      key={g} type="button" onClick={() => toggleGenre(g)}
                      className={`font-display text-xs uppercase px-3 py-1.5 border-2 border-ink transition-colors ${
                        form.genre.includes(g) ? "bg-magenta text-cream border-magenta" : "bg-cream text-ink hover:bg-acid-yellow"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blurb */}
              <div>
                <label className="block font-display text-xs uppercase text-ink mb-1">
                  Description
                  <span className="text-ink/40 font-normal text-[10px] ml-2">max 200 chars</span>
                </label>
                <textarea
                  rows={3} value={form.blurb}
                  onChange={e => upd("blurb", e.target.value.slice(0, 200))}
                  placeholder="What's the vibe? Who's playing?"
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow resize-none"
                />
                <p className="text-ink/40 text-[10px] text-right mt-1">{form.blurb.length}/200</p>
              </div>

              {/* Flyer URL */}
              <div>
                <label className="block font-display text-xs uppercase text-ink mb-1">
                  Flyer / Image URL
                  <span className="text-ink/40 font-normal text-[10px] ml-2">optional</span>
                </label>
                <input
                  type="url" value={form.image_url}
                  onChange={e => upd("image_url", e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={step === "submitting"}
              className="w-full flex items-center justify-center gap-2 bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
            >
              {step === "submitting" ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> SUBMITTING…</>
              ) : (
                "SUBMIT EVENT →"
              )}
            </button>

            <p className="text-ink/40 text-sm text-center">
              Trusted promoters publish immediately.
              New promoters go through a quick review (usually within 24h).
            </p>
          </form>
        )}
      </div>
      <Footer />
    </main>
  );
}
