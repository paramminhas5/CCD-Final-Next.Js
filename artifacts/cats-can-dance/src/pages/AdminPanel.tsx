/**
 * AdminPanel — full backend management, no Supabase dashboard needed
 *
 * Sections:
 * - Applications: approve/reject artist & promoter applications
 * - Roles: view all user_roles, directly assign roles
 * - Artists: quick content overview, trigger enrichment
 * - XP Leaderboard: top fans by XP/tier
 * - System: trigger scraper, view recent event_signals
 *
 * Gated to admin role only.
 */
import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import Nav from "@/components/Nav";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const ADMIN_PW = "84838281";

async function adminFetch(path: string, method = "GET", body?: object) {
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.ok ? r.json() : null);
}

/* ── Types ── */
type Application = {
  id: string; user_id: string; email: string; display_name: string;
  requested_role: string; entity_slug: string | null; message: string | null;
  links: { instagram?: string; soundcloud?: string };
  status: string; created_at: string;
};
type UserRoleRow = {
  id: string; user_id: string; email: string; display_name: string;
  role: string; entity_slug: string | null; entity_name: string | null;
  created_at: string;
};
type FanProfile = {
  id: string; user_id: string; display_name: string; xp: number;
  ccd_points: number; tier: string; total_interactions: number; created_at: string;
};
type ArtistRow = {
  id: string; slug: string; name: string; bio: string | null;
  instagram: string | null; soundcloud: string | null; photo_url: string | null;
  festivals: string[]; based_city: string | null;
};

/* ── Tab components ──────────────────────────────────────────────────────── */

function ApplicationsTab({ userId }: { userId: string }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = () => {
    setLoading(true);
    const q = filter === "pending" ? "?status=eq.pending" : "";
    fetch(`/api/role-applications${q}`, { headers: { "x-admin-password": ADMIN_PW } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setApps(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(load, [filter]);

  const review = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/role-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
      body: JSON.stringify({ status, reviewer_id: userId }),
    });
    if (res.ok) {
      toast.success(`Application ${status}`);
      load();
    } else {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-xl uppercase text-ink">Role Applications</h2>
        <div className="flex border-2 border-ink">
          {(["pending", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-display text-xs uppercase px-3 py-1.5 transition-colors ${filter === f ? "bg-ink text-cream" : "text-ink hover:bg-acid-yellow"}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="font-display text-xs text-ink/40">{apps.length} total</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-ink/5 border-4 border-ink/10"/>)}
        </div>
      ) : apps.length === 0 ? (
        <div className="border-4 border-dashed border-ink/20 p-12 text-center">
          <p className="font-display text-2xl text-ink/30">NO {filter === "pending" ? "PENDING " : ""}APPLICATIONS</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => (
            <div key={app.id} className={`border-4 p-5 ${app.status === "pending" ? "border-acid-yellow" : app.status === "approved" ? "border-ink/20" : "border-magenta/20"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display text-lg text-ink uppercase">{app.display_name}</p>
                    <span className={`font-display text-[10px] uppercase px-2 py-0.5 border-2 ${
                      app.requested_role === "artist" ? "bg-magenta text-cream border-magenta" :
                      app.requested_role === "promoter" ? "bg-electric-blue text-cream border-electric-blue" :
                      "bg-ink text-cream border-ink"}`}>
                      → {app.requested_role}
                    </span>
                    <span className={`font-display text-[10px] uppercase px-2 py-0.5 ${
                      app.status === "pending" ? "bg-acid-yellow text-ink" :
                      app.status === "approved" ? "bg-ink/10 text-ink/50" : "bg-magenta/20 text-magenta"}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink/60">{app.email}</p>
                  {app.entity_slug && <p className="font-display text-xs text-ink/40">Claiming: /artists/{app.entity_slug}</p>}
                  {app.links?.instagram && <p className="text-xs text-ink/50">IG: {app.links.instagram}</p>}
                  {app.links?.soundcloud && <p className="text-xs text-ink/50">SC: {app.links.soundcloud}</p>}
                  {app.message && (
                    <p className="text-sm text-ink/70 bg-ink/5 border border-ink/10 p-3 mt-2 max-w-xl">
                      "{app.message}"
                    </p>
                  )}
                  <p className="text-[10px] text-ink/30 mt-1">{new Date(app.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</p>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => review(app.id, "approved")}
                      className="font-display text-xs uppercase bg-ink text-cream px-4 py-2 border-4 border-ink hover:bg-acid-yellow hover:text-ink transition-colors">
                      ✓ Approve
                    </button>
                    <button onClick={() => review(app.id, "rejected")}
                      className="font-display text-xs uppercase bg-cream text-ink px-4 py-2 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RolesTab({ userId }: { userId: string }) {
  const [roles, setRoles] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ user_id: "", email: "", display_name: "", role: "artist", entity_slug: "" });

  useEffect(() => {
    fetch("/api/admin-roles", { headers: { "x-admin-password": ADMIN_PW } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRoles(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const assign = async () => {
    if (!form.user_id || !form.email) { toast.error("user_id and email required"); return; }
    const res = await fetch("/api/user-role", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": ADMIN_PW },
      body: JSON.stringify({ ...form, granted_by: userId, granted_at: new Date().toISOString() }),
    });
    if (res.ok) {
      toast.success(`Role '${form.role}' assigned`);
      setShowAssign(false);
      setRoles(prev => [...prev.filter(r => r.user_id !== form.user_id), { ...form, id: "new", entity_name: null, created_at: new Date().toISOString() } as UserRoleRow]);
    } else {
      toast.error("Failed");
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-magenta text-cream",
    artist: "bg-acid-yellow text-ink",
    promoter: "bg-electric-blue text-cream",
    venue: "bg-orange text-cream",
    user: "bg-ink/10 text-ink",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase text-ink">User Roles</h2>
        <button onClick={() => setShowAssign(v => !v)}
          className="font-display text-xs uppercase bg-ink text-cream px-4 py-2 border-4 border-ink hover:bg-magenta transition-colors">
          + Assign Role
        </button>
      </div>

      {showAssign && (
        <div className="border-4 border-acid-yellow p-5 space-y-3">
          <p className="font-display text-sm uppercase text-ink">Assign Role Directly</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k:"user_id", l:"Clerk User ID", ph:"user_2abc..." },
              { k:"email", l:"Email", ph:"artist@email.com" },
              { k:"display_name", l:"Display Name", ph:"Kohra" },
              { k:"entity_slug", l:"Entity Slug (if artist)", ph:"kohra" },
            ].map(f => (
              <label key={f.k} className="block">
                <span className="font-display text-[10px] uppercase text-ink/40 block mb-1">{f.l}</span>
                <input value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))}
                  placeholder={f.ph} className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm focus:outline-none"/>
              </label>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["user","artist","promoter","venue","admin"] as const).map(r => (
              <button key={r} onClick={() => setForm(p => ({...p, role: r}))}
                className={`font-display text-xs uppercase px-3 py-1.5 border-2 border-ink transition-colors ${form.role === r ? "bg-ink text-cream" : "hover:bg-acid-yellow"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={assign} className="font-display text-sm uppercase bg-ink text-cream px-5 py-2.5 border-4 border-ink hover:bg-acid-yellow hover:text-ink transition-colors">
              Assign
            </button>
            <button onClick={() => setShowAssign(false)} className="font-display text-sm uppercase bg-cream text-ink px-5 py-2.5 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-ink/5 border-4 border-ink/10"/>)}</div>
      ) : (
        <div className="border-4 border-ink overflow-hidden">
          <div className="bg-ink text-cream grid grid-cols-4 px-5 py-2 font-display text-[10px] uppercase">
            <span>User / Email</span><span>Role</span><span>Entity</span><span>Since</span>
          </div>
          {roles.map(r => (
            <div key={r.id} className="grid grid-cols-4 items-center px-5 py-3 border-t border-ink/10 hover:bg-ink/3 transition-colors">
              <div>
                <p className="font-display text-xs text-ink">{r.display_name || "—"}</p>
                <p className="text-[10px] text-ink/40 truncate">{r.email}</p>
              </div>
              <span className={`font-display text-[10px] uppercase px-2 py-0.5 w-fit border ${ROLE_COLORS[r.role] ?? "bg-cream text-ink border-ink"}`}>{r.role}</span>
              <p className="text-xs text-ink/50 truncate">{r.entity_slug || "—"}</p>
              <p className="text-[10px] text-ink/30">{new Date(r.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArtistsTab() {
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/artists?limit=100", { headers: { "x-admin-password": ADMIN_PW } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setArtists(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const hasBio = artists.filter(a => a.bio && a.bio.length > 50).length;
  const hasIG = artists.filter(a => a.instagram).length;
  const hasSC = artists.filter(a => a.soundcloud).length;
  const hasPhoto = artists.filter(a => a.photo_url).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase text-ink">Artists ({artists.length})</h2>
        <a href="/api/cron/trigger" target="_blank"
          className="font-display text-xs uppercase bg-ink text-cream px-4 py-2 border-4 border-ink hover:bg-magenta transition-colors">
          Run Scraper
        </a>
      </div>

      {/* Coverage stats */}
      <div className="grid grid-cols-4 gap-px bg-ink border-4 border-ink">
        {[
          { n: hasBio, label: "have real bio", pct: Math.round(hasBio/artists.length*100) },
          { n: hasIG, label: "have Instagram", pct: Math.round(hasIG/artists.length*100) },
          { n: hasSC, label: "have SoundCloud", pct: Math.round(hasSC/artists.length*100) },
          { n: hasPhoto, label: "have photo", pct: Math.round(hasPhoto/artists.length*100) },
        ].map(s => (
          <div key={s.label} className="bg-cream p-4 text-center">
            <p className="font-display text-3xl text-ink">{s.n}</p>
            <p className="font-display text-[10px] uppercase text-ink/50 mt-0.5">{s.label}</p>
            <div className="mt-2 h-1.5 bg-ink/10 overflow-hidden">
              <div className="h-full bg-magenta" style={{width:`${s.pct}%`}}/>
            </div>
            <p className="font-display text-[9px] text-ink/30 mt-1">{s.pct}%</p>
          </div>
        ))}
      </div>

      {/* Artist list */}
      <div className="border-4 border-ink overflow-hidden max-h-[600px] overflow-y-auto">
        <div className="bg-ink text-cream grid grid-cols-5 px-5 py-2 font-display text-[10px] uppercase sticky top-0">
          <span className="col-span-2">Artist</span><span>City</span><span>Links</span><span>Festivals</span>
        </div>
        {loading ? <div className="animate-pulse p-8 text-center text-ink/30 font-display">Loading…</div> :
          artists.map(a => (
            <div key={a.id} className="grid grid-cols-5 items-center px-5 py-2.5 border-t border-ink/10 hover:bg-acid-yellow/5 transition-colors">
              <div className="col-span-2">
                <a href={`/artists/${a.slug}`} className="font-display text-xs text-ink uppercase hover:text-magenta">{a.name}</a>
                <p className={`text-[9px] mt-0.5 ${a.bio && a.bio.length > 50 ? "text-ink/40" : "text-magenta/60"}`}>
                  {a.bio && a.bio.length > 50 ? `Bio: ${a.bio.length}c` : "⚠ needs bio"}
                </p>
              </div>
              <p className="text-xs text-ink/50 truncate">{a.based_city || "—"}</p>
              <div className="flex gap-1">
                <span className={`w-4 h-4 text-[10px] flex items-center justify-center ${a.instagram ? "bg-ink text-cream" : "bg-ink/10 text-ink/20"}`}>I</span>
                <span className={`w-4 h-4 text-[10px] flex items-center justify-center ${a.soundcloud ? "bg-ink text-cream" : "bg-ink/10 text-ink/20"}`}>S</span>
                <span className={`w-4 h-4 text-[10px] flex items-center justify-center ${a.photo_url ? "bg-ink text-cream" : "bg-ink/10 text-ink/20"}`}>P</span>
              </div>
              <span className="font-display text-xs text-ink">{(a.festivals || []).length}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function XPTab() {
  const [fans, setFans] = useState<FanProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fan-profiles?order=xp.desc&limit=50", { headers: { "x-admin-password": ADMIN_PW } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setFans(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const TIER_COLORS: Record<string, string> = {
    lurker: "bg-ink/10 text-ink/40",
    regular: "bg-electric-blue/20 text-electric-blue",
    maker: "bg-acid-yellow text-ink",
    legend: "bg-magenta text-cream",
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase text-ink">XP Leaderboard</h2>
      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(8)].map((_,i)=><div key={i} className="h-12 bg-ink/5 border-4 border-ink/10"/>)}</div>
      ) : fans.length === 0 ? (
        <div className="border-4 border-dashed border-ink/20 p-12 text-center">
          <p className="font-display text-2xl text-ink/30">NO FANS YET</p>
          <p className="text-ink/30 text-sm mt-2">XP data will populate as users interact with the site.</p>
        </div>
      ) : (
        <div className="border-4 border-ink overflow-hidden">
          <div className="bg-ink text-cream grid grid-cols-5 px-5 py-2 font-display text-[10px] uppercase">
            <span>#</span><span className="col-span-2">Fan</span><span>XP / Points</span><span>Tier</span>
          </div>
          {fans.map((f, i) => (
            <div key={f.id} className="grid grid-cols-5 items-center px-5 py-3 border-t border-ink/10">
              <span className={`font-display text-sm ${i < 3 ? "text-magenta" : "text-ink/40"}`}>{i + 1}</span>
              <div className="col-span-2">
                <p className="font-display text-xs text-ink">{f.display_name || "Anonymous"}</p>
                <p className="text-[10px] text-ink/30">{f.total_interactions} interactions</p>
              </div>
              <div>
                <p className="font-display text-sm text-ink">{f.xp.toLocaleString()} XP</p>
                <p className="text-[10px] text-ink/40">{f.ccd_points} pts</p>
              </div>
              <span className={`font-display text-[10px] uppercase px-2 py-0.5 w-fit ${TIER_COLORS[f.tier] ?? "bg-ink/10 text-ink"}`}>{f.tier}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemTab() {
  const [scraperStatus, setScraperStatus] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const triggerScraper = async () => {
    setRunning(true);
    const res = await fetch("/api/cron/scrape-events", {
      method: "POST",
      headers: { "x-admin-password": ADMIN_PW },
    });
    const data = res.ok ? await res.json() : { error: "Failed" };
    setScraperStatus(data);
    setRunning(false);
    if (data.ok) toast.success(`Scraped ${data.scraped} events, published ${data.upserted}`);
    else toast.error("Scraper failed");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase text-ink">System</h2>

      <div className="border-4 border-ink p-5 space-y-4">
        <p className="font-display text-sm uppercase text-ink">Event Curation Scraper</p>
        <p className="text-sm text-ink/60">Runs nightly at 2am IST via Vercel cron. Sources: District.in, Insider.in, HighApe, Skillbox. Scored by Claude Haiku (threshold ≥6/10).</p>
        <button onClick={triggerScraper} disabled={running}
          className="font-display text-sm uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta disabled:opacity-50 transition-colors">
          {running ? "Running…" : "▶ Run Scraper Now"}
        </button>
        {scraperStatus && (
          <div className="bg-ink/5 border-2 border-ink/10 p-4 font-mono text-xs">
            <pre className="whitespace-pre-wrap text-ink/70">
              {JSON.stringify(scraperStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="border-4 border-ink p-5">
        <p className="font-display text-sm uppercase text-ink mb-3">Quick SQL Reference</p>
        <div className="space-y-2">
          {[
            "Run migration: paste 001_knowledge_graph.sql in Supabase SQL Editor",
            "Run seed data: paste 002_seed_data.sql after migration",
            "Check event appearances: SELECT * FROM event_appearances ORDER BY event_date DESC LIMIT 20;",
            "Check artist connections: SELECT * FROM artist_connections ORDER BY strength DESC;",
            "Fan leaderboard: SELECT * FROM fan_profiles ORDER BY xp DESC LIMIT 10;",
          ].map((s, i) => (
            <p key={i} className="text-xs text-ink/60 font-mono bg-ink/5 px-3 py-2 border border-ink/10">{s}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main AdminPanel ─────────────────────────────────────────────────────── */
const AdminPanel = () => {
  const { user, isLoaded } = useUser();
  const roleInfo = useUserRole();
  const [activeTab, setActiveTab] = useState<"applications" | "roles" | "artists" | "xp" | "system">("applications");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!roleInfo.isAdmin) return;
    fetch("/api/role-applications?status=eq.pending", { headers: { "x-admin-password": ADMIN_PW } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setPendingCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [roleInfo.isAdmin]);

  if (!isLoaded || roleInfo.loading) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-display text-ink/30 text-sm uppercase animate-pulse">Loading…</div>
      </div>
    </div>
  );

  if (!user || !roleInfo.isAdmin) return (
    <div className="min-h-screen bg-cream"><Nav/>
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink uppercase mb-4">Access Denied</p>
        <p className="text-ink/50">Admin access only.</p>
      </div>
    </div>
  );

  const TABS = [
    { key: "applications" as const, label: `Applications${pendingCount > 0 ? ` (${pendingCount})` : ""}`, alert: pendingCount > 0 },
    { key: "roles" as const, label: "Roles" },
    { key: "artists" as const, label: "Artists" },
    { key: "xp" as const, label: "XP / Fans" },
    { key: "system" as const, label: "System" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <Nav/>
      <div className="border-b-4 border-ink bg-ink pt-[72px]">
        <div className="container py-6">
          <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ ADMIN</p>
          <h1 className="font-display text-5xl text-cream uppercase">CCD Backend</h1>
          <p className="text-cream/40 text-sm mt-1">{user.primaryEmailAddress?.emailAddress}</p>
        </div>
        <div className="container">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`font-display text-xs uppercase px-5 py-4 border-r border-cream/10 whitespace-nowrap transition-colors relative ${
                  activeTab === tab.key ? "bg-cream text-ink" : "text-cream/50 hover:text-cream hover:bg-cream/10"}`}>
                {tab.label}
                {tab.alert && <span className="ml-1 w-2 h-2 bg-magenta inline-block rounded-full"/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-5xl">
        {activeTab === "applications" && <ApplicationsTab userId={user.id}/>}
        {activeTab === "roles"        && <RolesTab userId={user.id}/>}
        {activeTab === "artists"      && <ArtistsTab/>}
        {activeTab === "xp"           && <XPTab/>}
        {activeTab === "system"       && <SystemTab/>}
      </div>
    </div>
  );
};

export default AdminPanel;
