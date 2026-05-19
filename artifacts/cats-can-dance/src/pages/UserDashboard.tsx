/**
 * UserDashboard — role-aware entry point
 *
 * user → fan dashboard (saved events, RSVPs, bookmarks)
 * artist → redirect to artist portal (edit profile, EPK, stats)
 * promoter → event management
 * venue → venue profile
 * admin → admin panel
 *
 * "Apply for access" UI for unverified users
 */
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

/* ── Types ── */
type RsvpRow = { event_slug: string; created_at: string; name: string };

/* ── Fan Dashboard ──────────────────────────────────────────────────────────── */
function FanDashboard({ user }: { user: any }) {
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyRole, setApplyRole] = useState<"artist"|"promoter"|"venue"|null>(null);
  const [appForm, setAppForm] = useState({ message: "", instagram: "", soundcloud: "", entity_slug: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/event-rsvp?email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress??"")}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setRsvps(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const submitApplication = async () => {
    if (!applyRole) return;
    const res = await fetch("/api/role-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        display_name: user.fullName || user.username || "Unknown",
        requested_role: applyRole,
        entity_slug: appForm.entity_slug || null,
        message: appForm.message,
        links: { instagram: appForm.instagram, soundcloud: appForm.soundcloud },
      }),
    });
    if (res.ok) { setSubmitted(true); toast.success("Application submitted! We'll review it shortly."); }
    else toast.error("Failed to submit — please try again.");
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-acid-yellow border-4 border-ink p-6">
        <p className="font-display text-xs uppercase text-ink/50 mb-1">Welcome back</p>
        <h2 className="font-display text-3xl text-ink uppercase">{user.fullName || user.username || "Fan"}</h2>
        <p className="text-ink/60 text-sm mt-1">{user.primaryEmailAddress?.emailAddress}</p>
      </div>

      {/* RSVPs */}
      <div className="border-4 border-ink">
        <div className="bg-ink text-cream px-5 py-3 border-b-4 border-ink">
          <h3 className="font-display text-sm uppercase">Your RSVPs</h3>
        </div>
        <div className="p-5">
          {rsvps.length === 0
            ? <p className="text-ink/40 text-sm">No RSVPs yet. <a href="/#discover" className="underline">Discover events →</a></p>
            : <div className="space-y-2">{rsvps.slice(0,8).map((r,i) => (
                <div key={i} className="flex items-center justify-between p-3 border-2 border-ink/10">
                  <p className="font-display text-sm text-ink uppercase">{r.event_slug}</p>
                  <p className="text-xs text-ink/40">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                </div>
              ))}</div>
          }
        </div>
      </div>

      {/* Apply for role */}
      {!submitted && (
        <div className="border-4 border-ink">
          <div className="bg-ink text-cream px-5 py-3 border-b-4 border-ink">
            <h3 className="font-display text-sm uppercase">Are you part of the scene?</h3>
          </div>
          <div className="p-5">
            <p className="text-ink/60 text-sm mb-4">Apply for a role to unlock more features.</p>
            {!applying ? (
              <div className="grid grid-cols-3 gap-3">
                {([
                  { role:"artist" as const, label:"Artist", desc:"Edit your profile, manage EPK, accept bookings", icon:"🎛" },
                  { role:"promoter" as const, label:"Promoter", desc:"Create and manage events on CCD", icon:"🎪" },
                  { role:"venue" as const, label:"Venue", desc:"Manage your venue profile and calendar", icon:"🏛" },
                ]).map(({ role, label, desc, icon }) => (
                  <button key={role} onClick={() => { setApplying(true); setApplyRole(role); }}
                    className="border-4 border-ink p-4 text-left hover:bg-acid-yellow transition-colors group">
                    <span className="text-2xl block mb-2">{icon}</span>
                    <p className="font-display text-sm uppercase text-ink">{label}</p>
                    <p className="text-xs text-ink/50 mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-w-md">
                <p className="font-display text-sm uppercase text-ink">Apply as {applyRole}</p>
                {applyRole === "artist" && (
                  <label className="block">
                    <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">Your Artist Slug (e.g. kohra)</span>
                    <input type="text" value={appForm.entity_slug} onChange={e=>setAppForm(p=>({...p,entity_slug:e.target.value}))}
                      placeholder="your-artist-name" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
                  </label>
                )}
                <label className="block">
                  <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">Instagram</span>
                  <input type="text" value={appForm.instagram} onChange={e=>setAppForm(p=>({...p,instagram:e.target.value}))}
                    placeholder="@yourhandle" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
                </label>
                <label className="block">
                  <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">SoundCloud / Music Link</span>
                  <input type="text" value={appForm.soundcloud} onChange={e=>setAppForm(p=>({...p,soundcloud:e.target.value}))}
                    placeholder="soundcloud.com/you" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
                </label>
                <label className="block">
                  <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">Why? (optional)</span>
                  <textarea value={appForm.message} onChange={e=>setAppForm(p=>({...p,message:e.target.value}))} rows={3}
                    placeholder="Tell us a bit about yourself and your work..."
                    className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none resize-none"/>
                </label>
                <div className="flex gap-3">
                  <button onClick={submitApplication}
                    className="flex-1 font-display text-sm uppercase bg-ink text-cream px-4 py-3 border-4 border-ink hover:bg-magenta transition-colors">
                    Submit Application
                  </button>
                  <button onClick={() => { setApplying(false); setApplyRole(null); }}
                    className="font-display text-sm uppercase bg-cream text-ink px-4 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {submitted && (
        <div className="border-4 border-acid-yellow bg-acid-yellow p-6 text-center">
          <p className="font-display text-2xl text-ink mb-2">✓ Application Submitted</p>
          <p className="text-ink/60">We'll review your application and update your access within 48 hours.</p>
        </div>
      )}
    </div>
  );
}

/* ── Artist Portal ──────────────────────────────────────────────────────────── */
function ArtistPortal({ user, roleInfo }: { user: any; roleInfo: ReturnType<typeof useUserRole> }) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleInfo.entitySlug) { setLoading(false); return; }
    fetch(`/api/artists/${roleInfo.entitySlug}`).then(r=>r.ok?r.json():null).then(d=>{setArtist(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [roleInfo.entitySlug]);

  const save = async () => {
    if (!artist) return;
    setSaving(true);
    const res = await fetch(`/api/artists/${artist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": "84838281" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { toast.success("Saved!"); setArtist((prev: any) => ({...prev,...editing})); setEditing({}); }
    else toast.error("Save failed");
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse h-40 bg-ink/5 border-4 border-ink/10"/>;

  return (
    <div className="space-y-6">
      <div className="bg-acid-yellow border-4 border-ink p-6 flex items-start justify-between">
        <div>
          <p className="font-display text-xs uppercase text-ink/50 mb-1">Artist Portal</p>
          <h2 className="font-display text-3xl text-ink uppercase">{artist?.name || roleInfo.entityName}</h2>
          <p className="text-ink/60 text-sm mt-1">{roleInfo.entitySlug && <a href={`/artists/${roleInfo.entitySlug}`} className="underline">/artists/{roleInfo.entitySlug} ↗</a>}</p>
        </div>
        {Object.keys(editing).length > 0 && (
          <button onClick={save} disabled={saving}
            className="font-display text-sm uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta disabled:opacity-50 transition-colors">
            {saving?"Saving…":"Save Changes"}
          </button>
        )}
      </div>

      {artist && (
        <div className="grid md:grid-cols-2 gap-4">
          {([
            {key:"bio", label:"Bio", multiline:true},
            {key:"why", label:"Why Book (Headline)", multiline:false},
            {key:"instagram", label:"Instagram URL"},
            {key:"soundcloud", label:"SoundCloud URL"},
            {key:"spotify", label:"Spotify URL"},
            {key:"website", label:"Website"},
            {key:"booking_email", label:"Booking Email"},
            {key:"labels", label:"Label(s)"},
          ] as {key:string;label:string;multiline?:boolean}[]).map(({key,label,multiline})=>{
            const current = editing[key] ?? artist[key] ?? "";
            const changed = key in editing;
            return (
              <div key={key} className={`border-4 ${changed?"border-magenta bg-magenta/5":"border-ink/20"} p-4`}>
                <p className="font-display text-[10px] uppercase text-ink/40 mb-2">{label}</p>
                {multiline
                  ? <textarea rows={4} value={current} onChange={e=>setEditing(p=>({...p,[key]:e.target.value}))}
                      className="w-full bg-transparent font-sans text-sm text-ink focus:outline-none resize-none"/>
                  : <input type="text" value={current} onChange={e=>setEditing(p=>({...p,[key]:e.target.value}))}
                      className="w-full bg-transparent font-sans text-sm text-ink focus:outline-none"/>
                }
              </div>
            );
          })}
        </div>
      )}

      <div className="border-4 border-ink p-5">
        <p className="font-display text-sm uppercase text-ink mb-4">Your EPK</p>
        <div className="flex gap-3">
          {roleInfo.entitySlug && (
            <a href={`/artists/${roleInfo.entitySlug}#epk`}
              className="font-display text-xs uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
              View EPK ↗
            </a>
          )}
          <button onClick={() => window.print()}
            className="font-display text-xs uppercase bg-acid-yellow text-ink px-5 py-3 border-4 border-ink hover:bg-cream transition-colors">
            🖨 Download / Print
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Promoter Portal ────────────────────────────────────────────────────────── */
function PromoterPortal({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-magenta text-cream border-4 border-ink p-6">
        <p className="font-display text-xs uppercase opacity-60 mb-1">Promoter Portal</p>
        <h2 className="font-display text-3xl uppercase">{user.fullName || user.username}</h2>
      </div>
      <div className="border-4 border-ink p-6 space-y-4">
        <p className="font-display text-sm uppercase text-ink">Your Events</p>
        <p className="text-ink/50 text-sm">Event management coming soon. Submit events via the submit form for now.</p>
        <a href="/submit-event" className="inline-block font-display text-xs uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
          + Submit New Event
        </a>
      </div>
    </div>
  );
}

/* ── Venue Portal ────────────────────────────────────────────────────────────── */
function VenuePortal({ user, roleInfo }: { user: any; roleInfo: ReturnType<typeof useUserRole> }) {
  return (
    <div className="space-y-6">
      <div className="bg-electric-blue text-cream border-4 border-ink p-6">
        <p className="font-display text-xs uppercase opacity-60 mb-1">Venue Portal</p>
        <h2 className="font-display text-3xl uppercase">{roleInfo.entityName || user.fullName}</h2>
      </div>
      <div className="border-4 border-ink p-6">
        <p className="text-ink/50 text-sm">Venue management dashboard coming soon.</p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────────────────── */
const UserDashboard = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const roleInfo = useUserRole();

  if (!isLoaded || roleInfo.loading) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-display text-ink/30 text-sm uppercase animate-pulse">Loading…</div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="container py-32 text-center">
        <p className="font-display text-5xl text-ink uppercase mb-4">Sign in</p>
        <p className="text-ink/50 mb-8">to access your dashboard.</p>
        <button onClick={() => openSignIn()} className="font-display text-sm uppercase bg-ink text-cream px-8 py-4 border-4 border-ink hover:bg-magenta transition-colors">
          Sign In / Create Account
        </button>
      </div>
    </div>
  );

  // Admin: redirect to admin panel
  if (roleInfo.isAdmin) {
    router.push("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Nav/>
      <div className="container py-16 max-w-3xl">
        {roleInfo.role === "artist"   && <ArtistPortal user={user} roleInfo={roleInfo}/>}
        {roleInfo.role === "promoter" && <PromoterPortal user={user}/>}
        {roleInfo.role === "venue"    && <VenuePortal user={user} roleInfo={roleInfo}/>}
        {roleInfo.role === "user"     && <FanDashboard user={user}/>}
      </div>
      <Footer/>
    </div>
  );
};

export default UserDashboard;
