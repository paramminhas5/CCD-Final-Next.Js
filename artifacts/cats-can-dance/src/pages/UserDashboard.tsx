/**
 * UserDashboard — role-aware, XP-driven
 *
 * Fan:     auto-tiered by XP (no application needed)
 * Artist:  applied → approved by admin → profile management + EPK download
 * Promoter: applied → approved → event management
 * Venue:   applied → approved → venue profile
 * Admin:   redirect to /admin
 */
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

/* ── Types ── */
type FanProfile = {
  xp: number; ccd_points: number; tier: string;
  total_interactions: number; events_rsvpd: number;
  events_saved: number; shares: number;
};
type XPEvent = { action: string; xp_earned: number; points_earned: number; created_at: string; ref_type?: string };

/* ── XP config ── */
const TIERS = [
  { key:"lurker",  label:"Scene Lurker",  xp:0,    color:"bg-ink/10 text-ink/40",         nextXp:100  },
  { key:"regular", label:"Scene Regular", xp:100,  color:"bg-electric-blue text-cream",    nextXp:500  },
  { key:"maker",   label:"Scene Maker",   xp:500,  color:"bg-acid-yellow text-ink",        nextXp:2000 },
  { key:"legend",  label:"Scene Legend",  xp:2000, color:"bg-magenta text-cream",          nextXp:null },
];
const XP_ACTIONS: Record<string, string> = {
  first_visit:"First visit", event_click:"Event clicked", event_rsvp:"RSVP'd to event",
  event_save:"Saved event", event_share:"Shared event", social_share:"Social share",
  artist_view:"Viewed artist", artist_follow:"Followed artist",
};

function TierProgress({ fp }: { fp: FanProfile }) {
  const tier = TIERS.find(t => t.key === fp.tier) ?? TIERS[0];
  const next = TIERS.find(t => t.xp > fp.xp);
  const pct = next ? Math.min(100, ((fp.xp - tier.xp) / (next.xp - tier.xp)) * 100) : 100;

  return (
    <div className="bg-acid-yellow border-4 border-ink p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-display text-xs uppercase text-ink/50 mb-1">Your CCD Rank</p>
          <h2 className="font-display text-4xl text-ink uppercase">{tier.label}</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-ink">{fp.xp.toLocaleString()}</p>
          <p className="font-display text-xs uppercase text-ink/50">XP</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-3 bg-ink/10 border-2 border-ink overflow-hidden">
          <div className="h-full bg-ink transition-all" style={{width:`${pct}%`}}/>
        </div>
      </div>
      <div className="flex justify-between font-display text-[10px] uppercase text-ink/50">
        <span>{tier.label}</span>
        {next && <span>{(next.xp - fp.xp).toLocaleString()} XP to {TIERS.find(t=>t.xp===next.xp)?.label}</span>}
        {!next && <span>Max tier reached</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t-2 border-ink/20">
        {[
          { n: fp.ccd_points, label: "CCD Points" },
          { n: fp.events_rsvpd, label: "RSVPs" },
          { n: fp.events_saved, label: "Saved" },
          { n: fp.shares, label: "Shares" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="font-display text-2xl text-ink">{s.n}</p>
            <p className="font-display text-[9px] uppercase text-ink/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CCD Points info */}
      {fp.ccd_points > 0 && (
        <div className="mt-4 bg-ink text-cream p-3 border-2 border-ink">
          <p className="font-display text-xs uppercase mb-1">✦ CCD Points: {fp.ccd_points}</p>
          <p className="text-[11px] text-cream/60">Redeemable for merch and tickets — redemption launching soon.</p>
        </div>
      )}
    </div>
  );
}

/* ── How to earn XP ── */
function EarnXPGuide() {
  const actions = [
    { action: "RSVP to an event",  xp: 20, points: 2 },
    { action: "Share an event",     xp: 25, points: 3 },
    { action: "Save an event",      xp: 10, points: 1 },
    { action: "Click through to event", xp: 5, points: 0 },
    { action: "View an artist page", xp: 3, points: 0 },
    { action: "First visit bonus",  xp: 50, points: 5 },
  ];
  return (
    <div className="border-4 border-ink p-5">
      <p className="font-display text-sm uppercase text-ink mb-4">How to Earn XP</p>
      <div className="space-y-2">
        {actions.map(a => (
          <div key={a.action} className="flex items-center justify-between py-2 border-b border-ink/10 last:border-0">
            <p className="text-sm text-ink">{a.action}</p>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-display text-xs text-ink">+{a.xp} XP</span>
              {a.points > 0 && <span className="font-display text-[10px] text-ink/40">+{a.points} pts</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Fan Dashboard ── */
function FanDashboard({ user, fanProfile }: { user: any; fanProfile: FanProfile | null }) {
  const [xpHistory, setXpHistory] = useState<XPEvent[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyRole, setApplyRole] = useState<"artist"|"promoter"|"venue"|null>(null);
  const [appForm, setAppForm] = useState({ message: "", instagram: "", soundcloud: "", entity_slug: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/xp-events?user_id=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setXpHistory(Array.isArray(d) ? d.slice(0,12) : []))
      .catch(() => {});
  }, [user.id]);

  const submitApplication = async () => {
    if (!applyRole) return;
    const res = await fetch("/api/role-applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
    if (res.ok) { setSubmitted(true); toast.success("Application submitted! We'll review within 48h."); }
    else toast.error("Failed to submit");
  };

  const defaultFp: FanProfile = { xp:0, ccd_points:0, tier:"lurker", total_interactions:0, events_rsvpd:0, events_saved:0, shares:0 };
  const fp = fanProfile ?? defaultFp;

  return (
    <div className="space-y-6 max-w-2xl">
      <TierProgress fp={fp}/>

      {/* XP History */}
      {xpHistory.length > 0 && (
        <div className="border-4 border-ink">
          <div className="bg-ink text-cream px-5 py-3 border-b-4 border-ink">
            <h3 className="font-display text-sm uppercase">Recent XP Activity</h3>
          </div>
          <div className="divide-y divide-ink/10">
            {xpHistory.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-ink">{XP_ACTIONS[e.action] ?? e.action}</p>
                  <p className="text-[10px] text-ink/40">{new Date(e.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-sm text-ink">+{e.xp_earned} XP</p>
                  {e.points_earned > 0 && <p className="font-display text-[10px] text-ink/40">+{e.points_earned} pts</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EarnXPGuide/>

      {/* Apply for role */}
      {!submitted && (
        <div className="border-4 border-ink">
          <div className="bg-ink text-cream px-5 py-3 border-b-4 border-ink">
            <h3 className="font-display text-sm uppercase">Part of the scene?</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink/60 mb-4">
              Artists and promoters can apply for verified status — admins review within 48 hours.
            </p>
            {!applying ? (
              <div className="grid grid-cols-2 gap-3">
                {([
                  { role:"artist" as const, label:"Artist", desc:"Edit your profile, manage EPK, download press kit", icon:"🎛" },
                  { role:"promoter" as const, label:"Promoter", desc:"Create and manage events on the CCD platform", icon:"🎪" },
                ]).map(({ role, label, desc, icon }) => (
                  <button key={role} onClick={() => { setApplying(true); setApplyRole(role); }}
                    className="border-4 border-ink p-4 text-left hover:bg-acid-yellow transition-colors">
                    <span className="text-2xl block mb-2">{icon}</span>
                    <p className="font-display text-sm uppercase text-ink">{label}</p>
                    <p className="text-xs text-ink/50 mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <p className="font-display text-sm uppercase text-ink">Apply as {applyRole}</p>
                {applyRole === "artist" && (
                  <label className="block">
                    <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">Your Artist Slug (from the /artists/ URL)</span>
                    <input type="text" value={appForm.entity_slug} onChange={e=>setAppForm(p=>({...p,entity_slug:e.target.value}))}
                      placeholder="e.g. kohra" className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
                  </label>
                )}
                {[
                  { k:"instagram", l:"Instagram Handle or URL" },
                  { k:"soundcloud", l:"SoundCloud / Music Link" },
                ].map(f=>(
                  <label key={f.k} className="block">
                    <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">{f.l}</span>
                    <input type="text" value={(appForm as any)[f.k]} onChange={e=>setAppForm(p=>({...p,[f.k]:e.target.value}))}
                      className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
                  </label>
                ))}
                <label className="block">
                  <span className="font-display text-[10px] uppercase text-ink/50 block mb-1">Tell us about your work</span>
                  <textarea value={appForm.message} onChange={e=>setAppForm(p=>({...p,message:e.target.value}))} rows={3}
                    placeholder="What you do, what you've played, where you're based..."
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
        <div className="border-4 border-ink bg-acid-yellow p-6 text-center">
          <p className="font-display text-2xl text-ink mb-2">✓ Application Submitted</p>
          <p className="text-ink/60 text-sm">We'll review and respond within 48 hours.</p>
        </div>
      )}
    </div>
  );
}

/* ── Artist Portal ── */
function ArtistPortal({ user, roleInfo }: { user: any; roleInfo: any }) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string,any>>({});
  const [saving, setSaving] = useState(false);
  const [fp, setFp] = useState<FanProfile|null>(null);

  useEffect(() => {
    if (roleInfo.entitySlug) {
      fetch(`/api/artists/${roleInfo.entitySlug}`).then(r=>r.ok?r.json():null).then(d=>{setArtist(d);setLoading(false);}).catch(()=>setLoading(false));
    } else { setLoading(false); }
    fetch(`/api/fan-profiles?user_id=${encodeURIComponent(user.id)}`).then(r=>r.ok?r.json():null).then(setFp).catch(()=>{});
  }, [roleInfo.entitySlug, user.id]);

  const save = async () => {
    if (!artist || !Object.keys(editing).length) return;
    setSaving(true);
    const res = await fetch(`/api/artists/${artist.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": "84838281" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { toast.success("Saved!"); setArtist((prev: any) => ({...prev,...editing})); setEditing({}); }
    else toast.error("Save failed");
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse h-40 bg-ink/5 border-4 border-ink/10"/>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-acid-yellow border-4 border-ink p-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase text-ink/50 mb-1">Artist Portal</p>
          <h2 className="font-display text-3xl text-ink uppercase">{artist?.name || roleInfo.entityName}</h2>
          {roleInfo.entitySlug && <p className="font-display text-xs text-ink/50 mt-1"><a href={`/artists/${roleInfo.entitySlug}`} className="underline">/artists/{roleInfo.entitySlug} ↗</a></p>}
        </div>
        {fp && (
          <div className="text-right shrink-0">
            <p className="font-display text-2xl text-ink">{fp.xp.toLocaleString()}</p>
            <p className="font-display text-[10px] uppercase text-ink/50">XP · {fp.tier}</p>
          </div>
        )}
      </div>

      {/* Edit fields */}
      {artist && (
        <div className="border-4 border-ink">
          <div className="bg-ink text-cream px-5 py-3 border-b-4 border-ink flex items-center justify-between">
            <h3 className="font-display text-sm uppercase">Edit Profile</h3>
            {Object.keys(editing).length > 0 && (
              <button onClick={save} disabled={saving}
                className="font-display text-xs uppercase bg-acid-yellow text-ink px-4 py-1.5 border-2 border-cream disabled:opacity-50 hover:bg-cream transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            )}
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            {([
              {key:"bio", label:"Bio", multiline:true},
              {key:"why", label:"Why Book (headline copy)", multiline:false},
              {key:"instagram", label:"Instagram URL"},
              {key:"soundcloud", label:"SoundCloud URL"},
              {key:"spotify", label:"Spotify URL"},
              {key:"website", label:"Website"},
              {key:"booking_email", label:"Booking Email"},
              {key:"labels", label:"Label(s)"},
            ] as {key:string;label:string;multiline?:boolean}[]).map(({key,label,multiline})=>{
              const val = editing[key] ?? artist[key] ?? "";
              const changed = key in editing;
              return (
                <div key={key} className={`border-2 p-3 ${changed?"border-magenta bg-magenta/5":"border-ink/20"}`}>
                  <p className="font-display text-[9px] uppercase text-ink/40 mb-1">{label}</p>
                  {multiline
                    ? <textarea rows={5} value={val} onChange={e=>setEditing(p=>({...p,[key]:e.target.value}))}
                        className="w-full bg-transparent font-sans text-sm text-ink focus:outline-none resize-none"/>
                    : <input type="text" value={val} onChange={e=>setEditing(p=>({...p,[key]:e.target.value}))}
                        className="w-full bg-transparent font-sans text-sm text-ink focus:outline-none"/>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EPK */}
      <div className="border-4 border-ink p-5">
        <p className="font-display text-sm uppercase text-ink mb-3">Press Kit / EPK</p>
        <p className="text-sm text-ink/60 mb-4">Your full EPK lives on your artist page — it's always print-ready and shareable.</p>
        <div className="flex gap-3 flex-wrap">
          {roleInfo.entitySlug && <a href={`/artists/${roleInfo.entitySlug}#epk`} className="font-display text-xs uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">View EPK ↗</a>}
          <button onClick={() => window.print()} className="font-display text-xs uppercase bg-acid-yellow text-ink px-5 py-3 border-4 border-ink hover:bg-cream transition-colors">🖨 Print / Download PDF</button>
        </div>
      </div>
    </div>
  );
}

/* ── Promoter Portal ── */
function PromoterPortal({ user }: { user: any }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-magenta text-cream border-4 border-ink p-6">
        <p className="font-display text-xs uppercase opacity-60 mb-1">Promoter Portal</p>
        <h2 className="font-display text-3xl uppercase">{user.fullName || user.username}</h2>
      </div>
      <div className="border-4 border-ink p-6 space-y-4">
        <p className="font-display text-sm uppercase text-ink">Your Events</p>
        <p className="text-sm text-ink/50">Full event management dashboard coming soon. In the meantime, submit events via the form below.</p>
        <a href="/submit-event" className="inline-block font-display text-xs uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
          + Submit New Event
        </a>
      </div>
    </div>
  );
}

/* ── Main ── */
const UserDashboard = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const roleInfo = useUserRole();
  const [fanProfile, setFanProfile] = useState<FanProfile|null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/fan-profiles?user_id=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null).then(setFanProfile).catch(() => {});
    // First visit XP
    const key = `ccd_fv_${user.id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch("/api/fan-profiles/xp", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ user_id: user.id, action:"first_visit" }) }).catch(()=>{});
    }
  }, [user?.id]);

  if (!isLoaded || roleInfo.loading) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-display text-ink/30 text-sm uppercase animate-pulse">Loading…</div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="container py-32 text-center max-w-md">
        <p className="font-display text-5xl text-ink uppercase mb-4">Your Dashboard</p>
        <p className="text-ink/50 mb-8">Sign in to track your XP, earn CCD Points, and manage your profile.</p>
        <button onClick={() => openSignIn()} className="font-display text-sm uppercase bg-ink text-cream px-8 py-4 border-4 border-ink hover:bg-magenta transition-colors">
          Sign In / Create Account
        </button>
      </div>
    </div>
  );

  if (roleInfo.isAdmin) { router.push("/admin"); return null; }

  return (
    <div className="min-h-screen bg-cream">
      <Nav/>
      <div className="border-b-4 border-ink bg-ink pt-[72px] py-8">
        <div className="container">
          <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ DASHBOARD</p>
          <h1 className="font-display text-5xl text-cream uppercase">{user.fullName || user.username || "Hey"}</h1>
          <p className="text-cream/40 text-sm mt-1 capitalize">{roleInfo.role} · {user.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>
      <div className="container py-10">
        {roleInfo.role === "artist"   && <ArtistPortal user={user} roleInfo={roleInfo}/>}
        {roleInfo.role === "promoter" && <PromoterPortal user={user}/>}
        {roleInfo.role === "user"     && <FanDashboard user={user} fanProfile={fanProfile}/>}
      </div>
      <Footer/>
    </div>
  );
};

export default UserDashboard;
