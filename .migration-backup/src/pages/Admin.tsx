import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Nav from "@/components/Nav";
import SEO from "@/components/SEO";
import BlogCover from "@/components/BlogCover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { THEME_PRESETS, resolvePalette, applyTheme } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

type Category = "GUIDES" | "CULTURE" | "ARTISTS" | "JOURNAL" | "DROPS" | "PETS";
type DraftPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  coverTitle: string;
  coverColor: string;
  tag: string;
  tldr: string[];
  quickPicks: { title: string; items: string[] };
  pullQuote: string;
  whatWedSkip: string;
  body: string[];
  seoTitle: string;
  metaDescription: string;
  dateISO: string;
  date?: string;
  author?: string;
};

type Signup = { id: string; email: string; source: string | null; created_at: string };
type Platform = "spotify" | "youtube" | "soundcloud";
type PlaylistItem = {
  id: string;
  title: string;
  platform: Platform;
  embed_id: string;
  url: string;
  spotify_id?: string;
};
type Verifications = { google?: string; bing?: string; plausible_domain?: string };
type MarqueeConfig = {
  id: string; enabled: boolean; bg: string; reverse: boolean; size: "lg" | "sm"; items: string[];
};
type Settings = {
  id: string;
  playlists: PlaylistItem[];
  featured_playlist_id: string | null;
  seo_verifications?: Verifications;
  marquees?: MarqueeConfig[];
  theme?: { preset?: string; overrides?: Record<string, string> };
  home_content?: {
    about?: { kicker?: string; title?: string; body?: string; ctaLabel?: string; ctaHref?: string };
    cta?: { title?: string; body?: string; label?: string; href?: string };
  };
};
type MediaItem = { type: "image" | "video"; url: string; caption?: string };
type EventRow = {
  id?: string; slug: string; title: string; date: string; city: string; venue: string;
  blurb: string; lineup: string[]; status: string; poster_url: string | null; sort_order: number;
  media?: MediaItem[];
};
type Message = { id: string; name: string; email: string; message: string; created_at: string };

const PASS_KEY = "ccd_admin_pass";

const extractPlaylistInfo = (
  platform: Platform,
  input: string
): { embed_id: string; url: string } => {
  const trimmed = input.trim();
  if (platform === "spotify") {
    const m = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
    const id = m ? m[1] : trimmed;
    return { embed_id: id, url: `https://open.spotify.com/playlist/${id}` };
  }
  if (platform === "youtube") {
    // Accept full playlist URLs OR a bare playlist ID (PL..., UU..., LL..., FL..., RD...)
    const fromUrl = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const bareId = trimmed.match(/^(PL|UU|LL|FL|RD|OL)[a-zA-Z0-9_-]{10,}$/);
    const id = fromUrl ? fromUrl[1] : bareId ? trimmed : "";
    if (!id) {
      throw new Error("That looks like a video URL, not a playlist URL. Paste a YouTube playlist URL (with ?list=...) or a playlist ID starting with PL.");
    }
    return { embed_id: id, url: `https://www.youtube.com/playlist?list=${id}` };
  }
  return { embed_id: trimmed, url: trimmed };
};

const normalizePlaylist = (p: any): PlaylistItem => ({
  id: p.id,
  title: p.title,
  platform: (p.platform as Platform) ?? "spotify",
  embed_id: p.embed_id ?? p.spotify_id ?? "",
  url:
    p.url ??
    (p.spotify_id ? `https://open.spotify.com/playlist/${p.spotify_id}` : ""),
});

const platformGlyph = (p: Platform) =>
  p === "spotify" ? "♫" : p === "youtube" ? "▶" : "☁";

const MARQUEE_DEFAULTS: MarqueeConfig[] = [
  { id: "above-about", enabled: true, bg: "bg-acid-yellow", reverse: false, size: "lg",
    items: ["WHO WE ARE", "BANGALORE UNDERGROUND", "A CULTURE BRAND", "DANCE · PETS · STREETWEAR"] },
  { id: "above-events", enabled: true, bg: "bg-orange", reverse: true, size: "sm",
    items: ["EPISODE 01", "EPISODE 02", "CATCH US LIVE", "BANGALORE", "RSVP NOW"] },
  { id: "above-videos", enabled: true, bg: "bg-magenta", reverse: false, size: "sm",
    items: ["WATCH THE TAPES", "LIVE SETS", "RECAPS", "YOUTUBE"] },
  { id: "above-playlist", enabled: true, bg: "bg-acid-yellow", reverse: true, size: "sm",
    items: ["NOW SPINNING", "DANCE MUSIC", "LATE NIGHT", "WAREHOUSE CUTS"] },
  { id: "above-drops", enabled: true, bg: "bg-electric-blue", reverse: false, size: "sm",
    items: ["STREETWEAR", "LIMITED DROPS", "PET MERCH", "WEAR THE CULTURE"] },
  { id: "above-instagram", enabled: true, bg: "bg-acid-yellow", reverse: true, size: "sm",
    items: ["@CATSCANDANCE", "LATEST", "BTS", "FOLLOW"] },
  { id: "above-early-access", enabled: true, bg: "bg-orange", reverse: false, size: "sm",
    items: ["JOIN THE PACK", "EARLY ACCESS", "DON'T MISS A DROP"] },
];

const MARQUEE_BG_OPTIONS = [
  { value: "bg-acid-yellow", label: "Acid Yellow", swatch: "bg-acid-yellow" },
  { value: "bg-magenta", label: "Magenta", swatch: "bg-magenta" },
  { value: "bg-lime", label: "Lime", swatch: "bg-lime" },
  { value: "bg-electric-blue", label: "Electric Blue", swatch: "bg-electric-blue" },
  { value: "bg-orange", label: "Orange", swatch: "bg-orange" },
  { value: "bg-cream", label: "Cream", swatch: "bg-cream" },
];

const mergeMarquees = (raw?: MarqueeConfig[] | null): MarqueeConfig[] => {
  const byId = new Map<string, MarqueeConfig>();
  MARQUEE_DEFAULTS.forEach((m) => byId.set(m.id, { ...m }));
  for (const r of raw ?? []) {
    if (!r || typeof r.id !== "string") continue;
    const base = byId.get(r.id);
    if (!base) continue;
    byId.set(r.id, { ...base, ...r, items: Array.isArray(r.items) && r.items.length ? r.items : base.items });
  }
  return MARQUEE_DEFAULTS.map((d) => byId.get(d.id)!);
};

const Admin = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem(PASS_KEY) ?? "");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const themeCtx = useTheme();

  const [signups, setSignups] = useState<Signup[]>([]);
  const [signupSearch, setSignupSearch] = useState("");

  const [settings, setSettings] = useState<Settings | null>(null);
  const [newPlTitle, setNewPlTitle] = useState("");
  const [newPlUrl, setNewPlUrl] = useState("");
  const [newPlPlatform, setNewPlPlatform] = useState<Platform>("spotify");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgSearch, setMsgSearch] = useState("");
  const [rsvps, setRsvps] = useState<{ id: string; event_slug: string; name: string; email: string; plus_ones: number; created_at: string }[]>([]);
  const [rsvpEventFilter, setRsvpEventFilter] = useState<string>("");
  const [rsvpsLoaded, setRsvpsLoaded] = useState(false);

  // Artists
  type AdminArtist = {
    id: string; slug: string; name: string; instagram: string | null;
    photo_url: string | null; booking_email: string | null; manager_email: string | null;
    bio: string | null; based_city: string | null;
    enrichment_status: string; enriched_at: string | null;
  };
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [artistsLoaded, setArtistsLoaded] = useState(false);
  const [artistsBusy, setArtistsBusy] = useState(false);

  const loadArtists = async () => {
    const { data, error } = await supabase
      .from("artists")
      .select("id,slug,name,instagram,photo_url,booking_email,manager_email,bio,based_city,enrichment_status,enriched_at")
      .order("name");
    if (error) { toast.error("Failed to load artists"); return; }
    setArtists((data ?? []) as AdminArtist[]);
    setArtistsLoaded(true);
  };

  const callEnrich = async (body: Record<string, unknown>) => {
    const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${projectUrl}/functions/v1/enrich-artists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": pwd,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || "Enrichment failed");
    return j;
  };

  const enrichAllArtists = async (force: boolean) => {
    if (!confirm(force ? "Force re-enrich ALL artists? This will overwrite existing data." : "Enrich all pending artists?")) return;
    setArtistsBusy(true);
    toast.message("Enrichment started — this may take a few minutes.");
    try {
      const j = await callEnrich({ all: true, force });
      toast.success(`Enriched ${j.count} artists`);
      await loadArtists();
    } catch (e: any) { toast.error(e.message); }
    finally { setArtistsBusy(false); }
  };

  const enrichOneArtist = async (id: string) => {
    setArtistsBusy(true);
    try {
      await callEnrich({ artist_id: id, force: true });
      toast.success("Enriched");
      await loadArtists();
    } catch (e: any) { toast.error(e.message); }
    finally { setArtistsBusy(false); }
  };

  // Videos
  type SiteVideo = { id: string; youtube_id: string; title: string; thumbnail_url: string | null; published_at: string | null; sort_order: number; is_featured: boolean };
  const [videos, setVideos] = useState<SiteVideo[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);

  const callAdminVideos = async (init: { method: string; body?: any }) => {
    const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${projectUrl}/functions/v1/admin-videos`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": pwd,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Request failed");
    return j;
  };

  const loadVideos = async () => {
    try {
      const j = await callAdminVideos({ method: "GET" });
      setVideos(j.videos || []);
      setVideosLoaded(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to load videos");
    }
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim()) return;
    setVideoBusy(true);
    try {
      await callAdminVideos({ method: "POST", body: { url: newVideoUrl.trim(), title: newVideoTitle.trim() || undefined } });
      setNewVideoUrl("");
      setNewVideoTitle("");
      await loadVideos();
      toast.success("Video added");
    } catch (e: any) {
      toast.error(e.message || "Failed to add video");
    } finally {
      setVideoBusy(false);
    }
  };

  const toggleVideoFeatured = async (v: SiteVideo) => {
    try {
      await callAdminVideos({ method: "PUT", body: { id: v.id, is_featured: !v.is_featured } });
      await loadVideos();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const moveVideo = async (v: SiteVideo, dir: -1 | 1) => {
    const next = (v.sort_order || 0) + dir;
    try {
      await callAdminVideos({ method: "PUT", body: { id: v.id, sort_order: next } });
      await loadVideos();
    } catch (e: any) {
      toast.error(e.message || "Reorder failed");
    }
  };

  const deleteVideo = async (v: SiteVideo) => {
    if (!confirm(`Delete "${v.title}"?`)) return;
    try {
      await callAdminVideos({ method: "DELETE", body: { id: v.id } });
      await loadVideos();
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const callContent = async (init: RequestInit & { search?: string } = {}) => {
    const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${projectUrl}/functions/v1/admin-content${init.search ?? ""}`, {
      ...init,
      headers: {
        "x-admin-password": pwd,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error("request failed");
    return res.json();
  };

  const loadRsvps = async (eventSlug?: string) => {
    const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const qs = eventSlug ? `?event_slug=${encodeURIComponent(eventSlug)}` : "";
    try {
      const res = await fetch(`${projectUrl}/functions/v1/admin-rsvps${qs}`, {
        headers: {
          "x-admin-password": pwd,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setRsvps(data?.rsvps ?? []);
      setRsvpsLoaded(true);
    } catch (e) {
      toast.error("Could not load RSVPs");
    }
  };

  const downloadRsvpsCsv = () => {
    const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const params = new URLSearchParams({ format: "csv" });
    if (rsvpEventFilter) params.set("event_slug", rsvpEventFilter);
    const url = `${projectUrl}/functions/v1/admin-rsvps?${params.toString()}`;
    fetch(url, {
      headers: {
        "x-admin-password": pwd,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
      })
      .catch(() => toast.error("CSV download failed"));
  };

  const loadAll = async (pwd: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-signups", {
        headers: { "x-admin-password": pwd },
      });
      if (error || (data as any)?.error) throw new Error("auth");
      setSignups(((data as any)?.signups ?? []) as Signup[]);
      sessionStorage.setItem(PASS_KEY, pwd);
      setAuthed(true);

      const [s, e, m] = await Promise.all([
        callContent({ method: "GET", search: "?type=settings" }),
        callContent({ method: "GET", search: "?type=events" }),
        callContent({ method: "GET", search: "?type=messages" }),
      ]);
      setSettings(
        s.settings
          ? {
              ...s.settings,
              playlists: (s.settings.playlists ?? []).map(normalizePlaylist),
              seo_verifications: s.settings.seo_verifications ?? {},
              marquees: mergeMarquees(s.settings.marquees),
              theme: s.settings.theme ?? { preset: "default" },
              home_content: s.settings.home_content ?? {},
            }
          : null
      );
      setEvents(e.events);
      setMessages(m.messages);
    } catch {
      sessionStorage.removeItem(PASS_KEY);
      setAuthed(false);
      toast.error("Wrong password.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(PASS_KEY);
    if (stored) loadAll(stored);
  }, []);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    loadAll(password);
  };

  const onLogout = () => {
    sessionStorage.removeItem(PASS_KEY);
    setAuthed(false);
    setSignups([]);
    setPassword("");
  };

  const downloadCsv = async (kind: "signups" | "messages") => {
    if (kind === "signups") {
      const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${projectUrl}/functions/v1/admin-signups?format=csv`, {
        headers: {
          "x-admin-password": pwd,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (!res.ok) return toast.error("Could not download CSV");
      triggerDownload(await res.blob(), `early-access-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const rows = [
        ["name", "email", "message", "created_at"].join(","),
        ...messages.map((m) =>
          [m.name, m.email, m.message, m.created_at]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
      triggerDownload(new Blob([rows], { type: "text/csv" }), `messages-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  // Playlists
  const savePlaylists = async (next: Settings) => {
    setSettings(next);
    try {
      await callContent({
        method: "POST",
        body: JSON.stringify({ type: "settings", action: "upsert", payload: next }),
      });
      toast.success("Playlists saved");
    } catch {
      toast.error("Save failed");
    }
  };

  const addPlaylist = () => {
    if (!settings || !newPlTitle.trim() || !newPlUrl.trim()) return;
    let embed_id = "";
    let url = "";
    try {
      const info = extractPlaylistInfo(newPlPlatform, newPlUrl);
      embed_id = info.embed_id;
      url = info.url;
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid playlist URL");
      return;
    }
    if (!embed_id) { toast.error("Could not parse playlist ID"); return; }
    const id = `${Date.now()}`;
    const next: Settings = {
      ...settings,
      playlists: [
        ...settings.playlists,
        { id, title: newPlTitle.trim(), platform: newPlPlatform, embed_id, url },
      ],
      featured_playlist_id: settings.featured_playlist_id ?? id,
    };
    setNewPlTitle(""); setNewPlUrl("");
    savePlaylists(next);
  };

  const removePlaylist = (id: string) => {
    if (!settings) return;
    const remaining = settings.playlists.filter((p) => p.id !== id);
    const next: Settings = {
      ...settings,
      playlists: remaining,
      featured_playlist_id: settings.featured_playlist_id === id ? remaining[0]?.id ?? null : settings.featured_playlist_id,
    };
    savePlaylists(next);
  };

  const setFeatured = (id: string) => {
    if (!settings) return;
    savePlaylists({ ...settings, featured_playlist_id: id });
  };

  const saveVerifications = async (next: Verifications) => {
    if (!settings) return;
    const merged: Settings = { ...settings, seo_verifications: next };
    setSettings(merged);
    try {
      await callContent({
        method: "POST",
        body: JSON.stringify({ type: "settings", action: "upsert", payload: merged }),
      });
      toast.success("Verification saved");
    } catch {
      toast.error("Save failed");
    }
  };

  // Events
  const saveEvent = async (ev: EventRow) => {
    try {
      await callContent({
        method: "POST",
        body: JSON.stringify({ type: "events", action: "upsert", payload: ev }),
      });
      const e = await callContent({ method: "GET", search: "?type=events" });
      setEvents(e.events);
      toast.success("Event saved");
    } catch {
      toast.error("Save failed");
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await callContent({
        method: "POST",
        body: JSON.stringify({ type: "events", action: "delete", payload: { id } }),
      });
      setEvents(events.filter((e) => e.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const addEvent = () => {
    setEvents([
      ...events,
      {
        slug: `event-${Date.now()}`, title: "NEW EPISODE", date: "TBA", city: "TBA", venue: "TBA",
        blurb: "", lineup: [], status: "upcoming", poster_url: null, media: [],
        sort_order: (events[events.length - 1]?.sort_order ?? 0) + 1,
      },
    ]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 60);
    toast.success("New event added — fill it in and hit 💾 SAVE EVENT");
  };

  const filteredSignups = signups.filter((s) => s.email.toLowerCase().includes(signupSearch.toLowerCase()));
  const filteredMessages = messages.filter((m) =>
    [m.name, m.email, m.message].join(" ").toLowerCase().includes(msgSearch.toLowerCase())
  );

  return (
    <main className="bg-background text-foreground min-h-screen">
      <SEO title="Admin — Cats Can Dance" description="Admin dashboard" path="/admin" noindex />
      <Nav />
      <section className="pt-32 pb-16 container">
        {!authed ? (
          <div className="max-w-md mx-auto bg-cream border-4 border-ink chunk-shadow-lg p-8">
            <h1 className="font-display text-4xl text-ink mb-2">ADMIN</h1>
            <p className="text-ink/70 font-medium mb-6">Enter the admin password.</p>
            <form onSubmit={onLogin} className="space-y-4">
              <input
                type="password"
                required autoFocus value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-display text-lg focus:outline-none focus:bg-acid-yellow"
              />
              <button
                type="submit" disabled={busy}
                className="w-full bg-ink text-cream font-display text-xl py-3 hover:bg-magenta transition-colors disabled:opacity-60"
              >
                {busy ? "CHECKING…" : "UNLOCK"}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <h1 className="font-display text-4xl md:text-5xl text-ink">DASHBOARD</h1>
              <button onClick={onLogout} className="bg-cream text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                LOG OUT
              </button>
            </div>

            <Tabs defaultValue="signups" className="w-full">
              <TabsList className="bg-cream border-4 border-ink p-1 mb-6 flex-wrap h-auto">
                <TabsTrigger value="signups" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">SIGNUPS</TabsTrigger>
                <TabsTrigger value="playlists" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">PLAYLISTS</TabsTrigger>
                <TabsTrigger value="videos" onClick={() => { if (!videosLoaded) loadVideos(); }} className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">VIDEOS</TabsTrigger>
                <TabsTrigger value="events" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">EVENTS</TabsTrigger>
                <TabsTrigger value="messages" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">MESSAGES</TabsTrigger>
                <TabsTrigger value="blog" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">BLOG</TabsTrigger>
                <TabsTrigger value="curated" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">CURATED</TabsTrigger>
                <TabsTrigger value="promoters" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">PROMOTERS</TabsTrigger>
                <TabsTrigger value="artists" onClick={() => { if (!artistsLoaded) loadArtists(); }} className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">ARTISTS</TabsTrigger>
                <TabsTrigger value="seo" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">SEO</TabsTrigger>
                <TabsTrigger value="marquees" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">MARQUEES</TabsTrigger>
                <TabsTrigger value="theme" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">THEME</TabsTrigger>
                <TabsTrigger value="homepage" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">HOMEPAGE</TabsTrigger>
                <TabsTrigger
                  value="rsvps"
                  onClick={() => { if (!rsvpsLoaded) loadRsvps(); }}
                  className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream"
                >
                  RSVPS
                </TabsTrigger>
              </TabsList>

              {/* SIGNUPS */}
              <TabsContent value="signups">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-ink/70 font-medium">{signups.length} total signups</p>
                  <button onClick={() => downloadCsv("signups")} className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                    DOWNLOAD CSV
                  </button>
                </div>
                <input
                  type="search" value={signupSearch}
                  onChange={(e) => setSignupSearch(e.target.value)}
                  placeholder="Search by email…"
                  className="w-full mb-4 bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                />
                <div className="border-4 border-ink chunk-shadow bg-cream overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-ink text-cream font-display">
                      <tr><th className="px-4 py-3">EMAIL</th><th className="px-4 py-3">SOURCE</th><th className="px-4 py-3">SIGNED UP</th></tr>
                    </thead>
                    <tbody>
                      {filteredSignups.map((s) => (
                        <tr key={s.id} className="border-t-2 border-ink/20">
                          <td className="px-4 py-3 font-medium">{s.email}</td>
                          <td className="px-4 py-3 text-ink/70">{s.source ?? "—"}</td>
                          <td className="px-4 py-3 text-ink/70">{new Date(s.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {filteredSignups.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/60">No signups yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* PLAYLISTS */}
              <TabsContent value="playlists">
                <div className="bg-cream border-4 border-ink chunk-shadow p-6 mb-6">
                  <h3 className="font-display text-2xl text-ink mb-4">ADD PLAYLIST</h3>
                  <div className="grid sm:grid-cols-3 gap-3 mb-3">
                    <select
                      value={newPlPlatform}
                      onChange={(e) => setNewPlPlatform(e.target.value as Platform)}
                      className="bg-cream text-ink border-4 border-ink px-4 py-3 font-display focus:outline-none focus:bg-acid-yellow"
                    >
                      <option value="spotify">♫ Spotify</option>
                      <option value="youtube">▶ YouTube</option>
                      <option value="soundcloud">☁ SoundCloud</option>
                    </select>
                    <input
                      placeholder="Title (e.g. Summer Mix)"
                      value={newPlTitle} onChange={(e) => setNewPlTitle(e.target.value)}
                      className="bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                    />
                    <input
                      placeholder={
                        newPlPlatform === "spotify"
                          ? "Spotify playlist URL"
                          : newPlPlatform === "youtube"
                          ? "YouTube playlist URL (with ?list=…)"
                          : "SoundCloud track or playlist URL"
                      }
                      value={newPlUrl} onChange={(e) => setNewPlUrl(e.target.value)}
                      className="bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                    />
                  </div>
                  <button onClick={addPlaylist} className="bg-ink text-cream font-display px-5 py-2 hover:bg-magenta transition-colors">
                    ADD
                  </button>
                </div>

                <div className="space-y-3">
                  {settings?.playlists.map((p) => (
                    <div key={p.id} className="bg-cream border-4 border-ink chunk-shadow p-4 flex flex-wrap items-center gap-3 justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-xl text-ink flex items-center gap-2">
                          <span aria-hidden>{platformGlyph(p.platform)}</span>
                          {p.title}
                          <span className="text-ink/50 text-xs uppercase">{p.platform}</span>
                        </p>
                        <p className="text-ink/60 text-sm font-mono truncate max-w-[60ch]">{p.url || p.embed_id}</p>
                      </div>
                      <div className="flex gap-2">
                        {settings.featured_playlist_id === p.id ? (
                          <span className="bg-acid-yellow text-ink font-display px-4 py-2 border-2 border-ink">FEATURED</span>
                        ) : (
                          <button onClick={() => setFeatured(p.id)} className="bg-cream text-ink font-display px-4 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
                            SET FEATURED
                          </button>
                        )}
                        <button onClick={() => removePlaylist(p.id)} className="bg-destructive text-cream font-display px-4 py-2 border-2 border-ink">
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!settings || settings.playlists.length === 0) && (
                    <p className="text-ink/60">No playlists yet.</p>
                  )}
                </div>
              </TabsContent>

              {/* VIDEOS */}
              <TabsContent value="videos">
                <div className="bg-cream border-4 border-ink chunk-shadow p-6 mb-6">
                  <h3 className="font-display text-2xl text-ink mb-4">ADD YOUTUBE VIDEO</h3>
                  <p className="text-ink/70 text-sm mb-3">
                    Paste a YouTube URL — title and thumbnail are auto-fetched. Admin-curated videos override the YouTube API feed everywhere on the site.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <input
                      placeholder="https://youtu.be/… or https://youtube.com/watch?v=…"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      className="bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                    />
                    <input
                      placeholder="Custom title (optional — defaults to YouTube title)"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      className="bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                    />
                  </div>
                  <button
                    onClick={addVideo}
                    disabled={videoBusy || !newVideoUrl.trim()}
                    className="bg-ink text-cream font-display px-5 py-2 hover:bg-magenta transition-colors disabled:opacity-50"
                  >
                    {videoBusy ? "ADDING…" : "ADD VIDEO"}
                  </button>
                </div>

                <div className="space-y-3">
                  {videos.map((v) => (
                    <div key={v.id} className="bg-cream border-4 border-ink chunk-shadow p-4 flex flex-wrap items-center gap-4 justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        {v.thumbnail_url && (
                          <img src={v.thumbnail_url} alt={v.title} className="w-32 h-20 object-cover border-2 border-ink shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-display text-lg text-ink line-clamp-2">{v.title}</p>
                          <p className="text-ink/60 text-xs font-mono">
                            {v.youtube_id} · sort {v.sort_order}
                            {v.published_at ? ` · ${new Date(v.published_at).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => moveVideo(v, -1)} className="bg-cream text-ink font-display px-3 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">↑</button>
                        <button onClick={() => moveVideo(v, 1)} className="bg-cream text-ink font-display px-3 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">↓</button>
                        <button
                          onClick={() => toggleVideoFeatured(v)}
                          className={`font-display px-4 py-2 border-2 border-ink ${v.is_featured ? "bg-acid-yellow text-ink" : "bg-cream text-ink hover:bg-acid-yellow transition-colors"}`}
                        >
                          {v.is_featured ? "★ FEATURED" : "FEATURE"}
                        </button>
                        <a
                          href={`https://www.youtube.com/watch?v=${v.youtube_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-cream text-ink font-display px-4 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors"
                        >
                          OPEN
                        </a>
                        <button onClick={() => deleteVideo(v)} className="bg-destructive text-cream font-display px-4 py-2 border-2 border-ink">
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))}
                  {videosLoaded && videos.length === 0 && (
                    <p className="text-ink/60">No admin videos yet. The site will fall back to the YouTube channel feed (RSS) automatically.</p>
                  )}
                  {!videosLoaded && (
                    <p className="text-ink/60">Loading videos…</p>
                  )}
                </div>
              </TabsContent>

              {/* EVENTS */}
              <TabsContent value="events">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-ink/70 font-medium">{events.length} events</p>
                  <button onClick={addEvent} className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                    + NEW EVENT
                  </button>
                </div>
                <div className="space-y-4">
                  {events.map((ev, idx) => (
                    <EventEditor
                      key={ev.id ?? ev.slug + idx}
                      event={ev}
                      onChange={(next) => setEvents(events.map((e, i) => (i === idx ? next : e)))}
                      onSave={() => saveEvent(events[idx])}
                      onDelete={() => ev.id ? deleteEvent(ev.id) : setEvents(events.filter((_, i) => i !== idx))}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* MESSAGES */}
              <TabsContent value="messages">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-ink/70 font-medium">{messages.length} messages</p>
                  <button onClick={() => downloadCsv("messages")} className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                    DOWNLOAD CSV
                  </button>
                </div>
                <input
                  type="search" value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full mb-4 bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                />
                <div className="space-y-3">
                  {filteredMessages.map((m) => (
                    <div key={m.id} className="bg-cream border-4 border-ink chunk-shadow p-5">
                      <div className="flex flex-wrap justify-between gap-2 mb-2">
                        <div>
                          <p className="font-display text-xl text-ink">{m.name}</p>
                          <a href={`mailto:${m.email}`} className="text-magenta underline font-medium">{m.email}</a>
                        </div>
                        <span className="text-ink/60 text-sm">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-ink/80 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                  {filteredMessages.length === 0 && (
                    <p className="text-ink/60 py-8 text-center">No messages.</p>
                  )}
                </div>
              </TabsContent>

              {/* BLOG */}
              <TabsContent value="blog">
                <BlogTab />
              </TabsContent>

              {/* CURATED EVENTS */}
              <TabsContent value="curated">
                <CuratedEventsTab />
              </TabsContent>

              {/* PROMOTERS */}
              <TabsContent value="promoters">
                <PromoterApplicationsTab />
              </TabsContent>

              {/* ARTISTS */}
              <TabsContent value="artists">
                <ArtistsTab
                  artists={artists}
                  reload={loadArtists}
                  enrichAll={enrichAllArtists}
                  enrichOne={enrichOneArtist}
                  busy={artistsBusy}
                />
              </TabsContent>

              {/* SEO CHECKLIST */}
              <TabsContent value="seo">
                <div className="space-y-6">
                  <div className="bg-cream border-4 border-ink chunk-shadow p-6">
                    <h3 className="font-display text-2xl text-ink mb-1">SEARCH CONSOLE & ANALYTICS</h3>
                    <p className="text-ink/70 font-medium mb-5">
                      Paste verification tokens — they'll appear in the page &lt;head&gt; site-wide.
                    </p>
                    <VerificationForm
                      value={settings?.seo_verifications ?? {}}
                      onSave={saveVerifications}
                    />
                  </div>

                  <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-5">
                    <div>
                      <h3 className="font-display text-2xl text-ink mb-1">SEO + GEO CHECKLIST</h3>
                      <p className="text-ink/70 font-medium">
                        Manual tasks to rank for "best parties / events in Bangalore & India" on Google and AI engines (ChatGPT, Perplexity, Gemini).
                      </p>
                    </div>

                    <LinkChecklistGroup
                      title="SEARCH ENGINES"
                      items={[
                        { label: "Google Search Console — submit sitemap.xml", url: "https://search.google.com/search-console" },
                        { label: "Bing Webmaster Tools — submit sitemap", url: "https://www.bing.com/webmasters" },
                        { label: "Verify ownership in GSC (DNS or HTML tag)", url: "https://search.google.com/search-console" },
                        { label: "Request indexing for /, /events, /about after each big update", url: "https://search.google.com/search-console" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="GOOGLE BUSINESS / MAPS"
                      items={[
                        { label: "Create Google Business Profile: 'Cats Can Dance — Event Organiser, Bangalore'", url: "https://business.google.com/create" },
                        { label: "Bing Places — claim & list", url: "https://www.bingplaces.com/" },
                        { label: "Add photos from Episodes, hours, contact, website link", url: "https://business.google.com/" },
                        { label: "Collect 5★ reviews from attendees after each Episode" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="LOCAL LISTINGS (INDIA)"
                      items={[
                        { label: "List on Insider.in (organiser signup)", url: "https://insider.in/organisers" },
                        { label: "List on BookMyShow Events", url: "https://in.bookmyshow.com/list-your-show" },
                        { label: "List on Paytm Insider", url: "https://insider.in/" },
                        { label: "Create Resident Advisor promoter profile", url: "https://ra.co/promoters" },
                        { label: "List on Skiddle (international reach)", url: "https://www.skiddle.com/promotioncentre/" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="BACKLINKS / PRESS (MUSIC)"
                      items={[
                        { label: "Pitch Rolling Stone India", url: "https://rollingstoneindia.com/contact-us/" },
                        { label: "Pitch Wild City", url: "https://wildcity.com/" },
                        { label: "Pitch Homegrown", url: "https://homegrown.co.in/" },
                        { label: "Pitch Mid-day Bangalore + Bangalore Mirror" },
                        { label: "Reach out to local music podcasts / Spotify editorial" },
                        { label: "Pitch The Hindu MetroPlus (Bangalore)", url: "https://www.thehindu.com/contact-us/" },
                        { label: "Pitch Insider.in editorial", url: "https://insider.in/" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="STREETWEAR DIRECTORIES & PRESS"
                      items={[
                        { label: "Hypebeast tips", url: "https://hypebeast.com/contact" },
                        { label: "Highsnobiety submit", url: "https://www.highsnobiety.com/contact/" },
                        { label: "The Established (India culture)", url: "https://theestablished.com/" },
                        { label: "Lifestyle Asia India", url: "https://www.lifestyleasia.com/ind/" },
                        { label: "Grailed seller signup", url: "https://www.grailed.com/sell" },
                        { label: "Depop India shop", url: "https://www.depop.com/" },
                        { label: "Sneaker News India tips" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="EVENT DIRECTORIES (GLOBAL)"
                      items={[
                        { label: "Songkick promoter", url: "https://www.songkick.com/" },
                        { label: "Bandsintown for Promoters", url: "https://artists.bandsintown.com/" },
                        { label: "JamBase events", url: "https://www.jambase.com/" },
                        { label: "Eventbrite organiser", url: "https://www.eventbrite.com/organizer/overview/" },
                        { label: "Allevents.in submit", url: "https://allevents.in/" },
                        { label: "LBB Bangalore submit", url: "https://lbb.in/bangalore/" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="LINK-BAIT ASSETS (DONE FOR YOU)"
                      items={[
                        { label: "✓ Press kit page (logos, bios, contact)", url: "/press" },
                        { label: "✓ Embeddable upcoming-events widget — share with venues/blogs", url: "/embed/upcoming" },
                        { label: "✓ RSS feed for Feedly / Inoreader / AI pipelines", url: "/rss.xml" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="CONSISTENCY (NAP)"
                      items={[
                        { label: "Same Name + Address + Email across IG bio, Linktree, listings" },
                        { label: "Use 'Cats Can Dance — Bangalore' wording consistently" },
                        { label: "Link back to https://catscandance.com from every listing" },
                      ]}
                    />

                    <LinkChecklistGroup
                      title="AI / GEO READY (DONE FOR YOU)"
                      items={[
                        { label: "✓ /llms.txt — AI crawler brand summary", url: "/llms.txt" },
                        { label: "✓ /llms-full.txt — long-form brand + events", url: "/llms-full.txt" },
                        { label: "✓ /brand.json — single-file brand summary for AI agents", url: "/brand.json" },
                        { label: "✓ robots.txt allows GPTBot / ClaudeBot / PerplexityBot / Google-Extended", url: "/robots.txt" },
                        { label: "✓ JSON-LD: Organization, LocalBusiness, MusicEvent, FAQ, BlogPosting, ItemList, BreadcrumbList" },
                        { label: "✓ Geo meta tags + Bangalore address in Footer" },
                        { label: "✓ Pillar blog posts targeting 'best parties Bangalore'", url: "/blog" },
                      ]}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* MARQUEES */}
              <TabsContent value="marquees">
                <p className="text-ink/70 font-medium mb-4">
                  Toggle, recolor, and edit the scrolling tickers between homepage sections. Items are comma-separated.
                </p>
                <div className="space-y-4">
                  {(settings?.marquees ?? MARQUEE_DEFAULTS).map((m, idx) => (
                    <div key={m.id} className="bg-cream border-4 border-ink chunk-shadow p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <h3 className="font-display text-xl text-ink uppercase">{m.id.replace("above-", "Above: ")}</h3>
                        <label className="flex items-center gap-2 font-display text-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.enabled}
                            onChange={(e) => {
                              if (!settings) return;
                              const next = [...(settings.marquees ?? MARQUEE_DEFAULTS)];
                              next[idx] = { ...m, enabled: e.target.checked };
                              setSettings({ ...settings, marquees: next });
                            }}
                            className="w-5 h-5 accent-magenta"
                          />
                          ENABLED
                        </label>
                      </div>
                      <div className={`${m.bg} border-4 border-ink py-2 px-3 mb-3 overflow-hidden whitespace-nowrap`}>
                        <span className="font-display text-ink">{m.items.join(" ★ ")}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-display text-xs text-ink/70 mb-1">BACKGROUND</label>
                          <select
                            value={m.bg}
                            onChange={(e) => {
                              if (!settings) return;
                              const next = [...(settings.marquees ?? MARQUEE_DEFAULTS)];
                              next[idx] = { ...m, bg: e.target.value };
                              setSettings({ ...settings, marquees: next });
                            }}
                            className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-display"
                          >
                            {MARQUEE_BG_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end gap-4">
                          <label className="flex items-center gap-2 font-display text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.reverse}
                              onChange={(e) => {
                                if (!settings) return;
                                const next = [...(settings.marquees ?? MARQUEE_DEFAULTS)];
                                next[idx] = { ...m, reverse: e.target.checked };
                                setSettings({ ...settings, marquees: next });
                              }}
                              className="w-5 h-5 accent-magenta"
                            />
                            REVERSE
                          </label>
                          <label className="flex items-center gap-2 font-display text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.size === "lg"}
                              onChange={(e) => {
                                if (!settings) return;
                                const next = [...(settings.marquees ?? MARQUEE_DEFAULTS)];
                                next[idx] = { ...m, size: e.target.checked ? "lg" : "sm" };
                                setSettings({ ...settings, marquees: next });
                              }}
                              className="w-5 h-5 accent-magenta"
                            />
                            LARGE
                          </label>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block font-display text-xs text-ink/70 mb-1">ITEMS (comma-separated)</label>
                        <input
                          value={m.items.join(", ")}
                          onChange={(e) => {
                            if (!settings) return;
                            const items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            const next = [...(settings.marquees ?? MARQUEE_DEFAULTS)];
                            next[idx] = { ...m, items: items.length ? items : m.items };
                            setSettings({ ...settings, marquees: next });
                          }}
                          className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-display"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={async () => {
                      if (!settings) return;
                      try {
                        await callContent({
                          method: "POST",
                          body: JSON.stringify({ type: "settings", action: "upsert", payload: settings }),
                        });
                        toast.success("Marquees saved");
                      } catch {
                        toast.error("Save failed");
                      }
                    }}
                    className="bg-ink text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    💾 SAVE MARQUEES
                  </button>
                </div>
              </TabsContent>

              {/* THEME */}
              <TabsContent value="theme">
                <p className="text-ink/70 font-medium mb-4">
                  Pick a preset to re-skin the entire site. Saves apply live to every open visitor.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {Object.keys(THEME_PRESETS).map((id) => {
                    const preset = THEME_PRESETS[id];
                    const palette = resolvePalette({ preset: id });
                    const swatches = [palette.magenta, palette.acidYellow, palette.electricBlue, palette.cream, palette.ink];
                    const active = (settings?.theme?.preset ?? "default") === id;
                    return (
                      <button
                        key={id}
                        onClick={() => settings && setSettings({ ...settings, theme: { preset: id } })}
                        className={`text-left bg-cream border-4 border-ink chunk-shadow p-4 transition-transform hover:-translate-y-1 ${active ? "ring-4 ring-magenta" : ""}`}
                      >
                        <div className="flex gap-1 mb-3">
                          {swatches.map((c, i) => (
                            <span key={i} className="w-8 h-8 border-2 border-ink" style={{ background: `hsl(${c})` }} />
                          ))}
                        </div>
                        <p className="font-display text-xl text-ink">{preset.label.toUpperCase()}</p>
                        <p className="text-ink/70 text-sm">{preset.description}</p>
                        {active && <p className="font-display text-xs text-magenta mt-2">★ ACTIVE</p>}
                      </button>
                    );
                  })}
                </div>
                <div className="bg-cream border-4 border-ink chunk-shadow p-4 mb-4">
                  <p className="font-display text-ink mb-3">COLOR OVERRIDES (HSL — e.g. <code>0 72% 51%</code>)</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(["brand", "accent", "surface", "surfaceAlt", "onBrand", "onSurface"] as const).map((k) => {
                      const v = settings?.theme?.overrides?.[k] ?? "";
                      return (
                        <div key={k}>
                          <label className="block font-display text-xs text-ink/70 mb-1">{k.toUpperCase()}</label>
                          <div className="flex gap-2">
                            <span className="w-10 h-10 border-2 border-ink shrink-0" style={{ background: v ? `hsl(${v})` : "transparent" }} />
                            <input
                              value={v}
                              placeholder="leave blank to use preset"
                              onChange={(e) => {
                                if (!settings) return;
                                const next = { ...(settings.theme?.overrides ?? {}) };
                                if (e.target.value.trim()) next[k] = e.target.value.trim();
                                else delete next[k];
                                setSettings({
                                  ...settings,
                                  theme: { preset: settings.theme?.preset ?? "default", overrides: next },
                                });
                              }}
                              className="flex-1 bg-cream text-ink border-4 border-ink px-3 py-2 font-display text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!settings) return;
                      try {
                        await callContent({
                          method: "POST",
                          body: JSON.stringify({
                            type: "settings",
                            action: "upsert",
                            payload: { theme: settings.theme ?? { preset: "default" } },
                          }),
                        });
                        // Apply locally right away: drop any local override and
                        // apply the freshly-saved preset so the admin sees it instantly.
                        themeCtx.clearOverride();
                        applyTheme({ preset: settings.theme?.preset ?? "default", overrides: settings.theme?.overrides as any });
                        toast.success("Theme saved — applied live");
                      } catch {
                        toast.error("Save failed");
                      }
                    }}
                    className="bg-ink text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    💾 SAVE THEME
                  </button>
                  <button
                    onClick={() => settings && setSettings({ ...settings, theme: { preset: settings.theme?.preset ?? "default" } })}
                    className="bg-cream text-ink font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    RESET OVERRIDES
                  </button>
                </div>
              </TabsContent>

              {/* HOMEPAGE */}
              <TabsContent value="homepage">
                <p className="text-ink/70 font-medium mb-4">
                  Edit copy that appears on the homepage. Leave a field blank to use the default.
                </p>
                <div className="space-y-6">
                  <div className="bg-cream border-4 border-ink chunk-shadow p-4">
                    <p className="font-display text-xl text-ink mb-3">ABOUT STRIP</p>
                    {([
                      { k: "kicker", label: "Kicker (e.g. / THE BRAND)", multiline: false },
                      { k: "title", label: "Title", multiline: false },
                      { k: "body", label: "Body", multiline: true },
                      { k: "ctaLabel", label: "CTA label", multiline: false },
                      { k: "ctaHref", label: "CTA link", multiline: false },
                    ] as const).map((f) => {
                      const val = (settings?.home_content?.about as any)?.[f.k] ?? "";
                      const onChange = (v: string) => {
                        if (!settings) return;
                        setSettings({
                          ...settings,
                          home_content: {
                            ...(settings.home_content ?? {}),
                            about: { ...(settings.home_content?.about ?? {}), [f.k]: v },
                          },
                        });
                      };
                      return (
                        <div key={f.k} className="mb-3">
                          <label className="block font-display text-xs text-ink/70 mb-1">{f.label.toUpperCase()}</label>
                          {f.multiline ? (
                            <textarea
                              value={val}
                              onChange={(e) => onChange(e.target.value)}
                              rows={3}
                              className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-medium"
                            />
                          ) : (
                            <input
                              value={val}
                              onChange={(e) => onChange(e.target.value)}
                              className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-medium"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={async () => {
                      if (!settings) return;
                      try {
                        await callContent({
                          method: "POST",
                          body: JSON.stringify({
                            type: "settings",
                            action: "upsert",
                            payload: { home_content: settings.home_content ?? {} },
                          }),
                        });
                        toast.success("Homepage content saved");
                      } catch {
                        toast.error("Save failed");
                      }
                    }}
                    className="bg-ink text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    💾 SAVE HOMEPAGE
                  </button>
                </div>
              </TabsContent>


              <TabsContent value="rsvps">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block font-display text-xs text-ink/70 mb-1">FILTER BY EVENT</label>
                      <select
                        value={rsvpEventFilter}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setRsvpEventFilter(slug);
                          loadRsvps(slug || undefined);
                        }}
                        className="bg-cream text-ink border-4 border-ink px-3 py-2 font-display"
                      >
                        <option value="">All events</option>
                        {events.map((ev) => (
                          <option key={ev.slug} value={ev.slug}>{ev.title} ({ev.slug})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => loadRsvps(rsvpEventFilter || undefined)}
                      className="bg-cream text-ink font-display px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                    >
                      🔄 REFRESH
                    </button>
                  </div>
                  <button
                    onClick={downloadRsvpsCsv}
                    className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    DOWNLOAD CSV
                  </button>
                </div>
                <p className="text-ink/70 font-medium mb-3">{rsvps.length} RSVP{rsvps.length === 1 ? "" : "s"}</p>
                <div className="border-4 border-ink chunk-shadow bg-cream overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-ink text-cream font-display">
                      <tr>
                        <th className="px-4 py-3">EVENT</th>
                        <th className="px-4 py-3">NAME</th>
                        <th className="px-4 py-3">EMAIL</th>
                        <th className="px-4 py-3">+1s</th>
                        <th className="px-4 py-3">SUBMITTED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rsvps.map((r) => (
                        <tr key={r.id} className="border-t-2 border-ink/20">
                          <td className="px-4 py-3 font-display">{r.event_slug}</td>
                          <td className="px-4 py-3 font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-ink/80">{r.email}</td>
                          <td className="px-4 py-3 text-ink/80">{r.plus_ones}</td>
                          <td className="px-4 py-3 text-ink/70">{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {rsvps.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/60">{rsvpsLoaded ? "No RSVPs yet." : "Loading…"}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </section>
    </main>
  );
};

const EventEditor = ({
  event, onChange, onSave, onDelete,
}: {
  event: EventRow;
  onChange: (e: EventRow) => void;
  onSave: () => void;
  onDelete: () => void;
}) => {
  const [lineupStr, setLineupStr] = useState((event.lineup ?? []).join(", "));
  useEffect(() => { setLineupStr((event.lineup ?? []).join(", ")); }, [event.id]);
  const commitLineup = () => onChange({ ...event, lineup: lineupStr.split(",").map((s) => s.trim()).filter(Boolean) });
  const [uploading, setUploading] = useState(false);
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;

  const uploadFile = async (file: File): Promise<{ path: string; publicUrl: string } | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", event.slug || "poster");
    const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
    const res = await fetch(`${projectUrl}/functions/v1/admin-upload-poster`, {
      method: "POST",
      headers: {
        "x-admin-password": pwd,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "upload failed");
    return data;
  };

  const onUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile(file);
      if (!data) return;
      onChange({ ...event, poster_url: data.path });
      toast.success("Poster uploaded — hit SAVE to persist");
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const [galleryUploading, setGalleryUploading] = useState(false);
  const onGalleryUpload = async (file: File) => {
    if (!file) return;
    setGalleryUploading(true);
    try {
      const data = await uploadFile(file);
      if (!data) return;
      const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
      const next: MediaItem[] = [...(event.media ?? []), { type, url: data.publicUrl, caption: "" }];
      onChange({ ...event, media: next });
      toast.success("Added — hit SAVE to persist");
    } catch {
      toast.error("Upload failed");
    } finally {
      setGalleryUploading(false);
    }
  };

  const updateMedia = (idx: number, patch: Partial<MediaItem>) => {
    const next = (event.media ?? []).map((m, i) => (i === idx ? { ...m, ...patch } : m));
    onChange({ ...event, media: next });
  };
  const removeMedia = (idx: number) => {
    onChange({ ...event, media: (event.media ?? []).filter((_, i) => i !== idx) });
  };
  const moveMedia = (idx: number, dir: -1 | 1) => {
    const arr = [...(event.media ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    onChange({ ...event, media: arr });
  };


  const sharLink = async () => {
    const url = `https://catscandance.com/events/${event.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied: " + url);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const posterPreview = (() => {
    const raw = (event.poster_url ?? "").trim();
    if (!raw) return null;
    if (raw.startsWith("http") || raw.startsWith("/")) return raw;
    try {
      const { data } = supabase.storage.from("event-posters").getPublicUrl(raw);
      return data?.publicUrl ?? null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="bg-cream border-4 border-ink chunk-shadow p-5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title" value={event.title} onChange={(v) => onChange({ ...event, title: v })} />
        <Field label="Slug" value={event.slug} onChange={(v) => onChange({ ...event, slug: v })} />
        <Field label="Date" value={event.date} onChange={(v) => onChange({ ...event, date: v })} />
        <Field label="City" value={event.city} onChange={(v) => onChange({ ...event, city: v })} />
        <Field label="Venue" value={event.venue} onChange={(v) => onChange({ ...event, venue: v })} />
        <div>
          <label className="block font-display text-sm text-ink mb-1">Status</label>
          <select
            value={event.status}
            onChange={(e) => onChange({ ...event, status: e.target.value })}
            className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
          >
            <option value="upcoming">upcoming</option>
            <option value="past">past</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block font-display text-sm text-ink mb-1">Poster</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Paste URL or upload below"
              value={event.poster_url ?? ""}
              onChange={(e) => onChange({ ...event, poster_url: e.target.value || null })}
              className="flex-1 min-w-[220px] bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
            <label className="bg-acid-yellow text-ink font-display px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform cursor-pointer">
              {uploading ? "UPLOADING…" : "📤 UPLOAD"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {posterPreview && (
              <img src={posterPreview} alt="poster preview" className="h-16 w-16 object-cover border-2 border-ink" />
            )}
          </div>
        </div>
        <Field
          label="Sort order"
          value={String(event.sort_order)}
          onChange={(v) => onChange({ ...event, sort_order: Number(v) || 0 })}
        />
      </div>
      <div>
        <label className="block font-display text-sm text-ink mb-1">Blurb</label>
        <textarea
          rows={3} value={event.blurb}
          onChange={(e) => onChange({ ...event, blurb: e.target.value })}
          className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
        />
      </div>
      <div>
        <label className="block font-display text-sm text-ink mb-1">Lineup (comma-separated)</label>
        <input
          value={lineupStr}
          onChange={(e) => setLineupStr(e.target.value)}
          onBlur={commitLineup}
          className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-display text-sm text-ink">Gallery ({(event.media ?? []).length})</label>
          <label className="bg-acid-yellow text-ink font-display px-3 py-1.5 border-2 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform cursor-pointer text-sm">
            {galleryUploading ? "UPLOADING…" : "+ ADD PHOTO/VIDEO"}
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              disabled={galleryUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onGalleryUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {(event.media ?? []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(event.media ?? []).map((m, i) => (
              <div key={`${m.url}-${i}`} className="bg-background border-2 border-ink p-2 space-y-2">
                <div className="flex gap-2">
                  {m.type === "video" ? (
                    <video src={m.url} muted playsInline className="h-20 w-28 object-cover bg-ink border-2 border-ink shrink-0" />
                  ) : (
                    <img src={m.url} alt="" className="h-20 w-28 object-cover border-2 border-ink shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={m.caption ?? ""}
                      onChange={(e) => updateMedia(i, { caption: e.target.value })}
                      className="w-full bg-cream text-ink border-2 border-ink px-2 py-1 text-sm font-medium focus:outline-none focus:bg-acid-yellow"
                    />
                    <p className="text-xs text-ink/60 uppercase font-display">{m.type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveMedia(i, -1)} disabled={i === 0} className="bg-ink text-cream font-display px-2 py-1 text-xs disabled:opacity-30">▲</button>
                  <button type="button" onClick={() => moveMedia(i, 1)} disabled={i === (event.media ?? []).length - 1} className="bg-ink text-cream font-display px-2 py-1 text-xs disabled:opacity-30">▼</button>
                  <button type="button" onClick={() => removeMedia(i)} className="ml-auto bg-destructive text-cream font-display px-2 py-1 text-xs">✕ REMOVE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onSave} className="bg-ink text-cream font-display px-6 py-3 hover:bg-magenta transition-colors text-base">
          💾 SAVE EVENT
        </button>
        <button onClick={sharLink} className="bg-acid-yellow text-ink font-display px-5 py-3 border-2 border-ink hover:bg-magenta hover:text-cream transition-colors">
          ↗ SHARE
        </button>
        <button onClick={onDelete} className="bg-destructive text-cream font-display px-5 py-3">DELETE</button>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block font-display text-sm text-ink mb-1">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
    />
  </div>
);

const ChecklistGroup = ({ title, items }: { title: string; items: string[] }) => (
  <div>
    <p className="font-display text-magenta text-lg mb-2">/ {title}</p>
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-3 bg-background/50 border-2 border-ink/20 px-3 py-2">
          <span className="font-display text-ink/40 mt-0.5">▢</span>
          <span className="text-ink/85 font-medium">{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

const LinkChecklistGroup = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; url?: string }[];
}) => (
  <div>
    <p className="font-display text-magenta text-lg mb-2">/ {title}</p>
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-start gap-3 bg-background/50 border-2 border-ink/20 px-3 py-2">
          <span className="font-display text-ink/40 mt-0.5">▢</span>
          {it.url ? (
            <a
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink/85 font-medium underline decoration-2 underline-offset-2 hover:text-magenta transition-colors"
            >
              {it.label} ↗
            </a>
          ) : (
            <span className="text-ink/85 font-medium">{it.label}</span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const VerificationForm = ({
  value,
  onSave,
}: {
  value: Verifications;
  onSave: (v: Verifications) => void;
}) => {
  const [google, setGoogle] = useState(value.google ?? "");
  const [bing, setBing] = useState(value.bing ?? "");
  const [plausible, setPlausible] = useState(value.plausible_domain ?? "");

  useEffect(() => {
    setGoogle(value.google ?? "");
    setBing(value.bing ?? "");
    setPlausible(value.plausible_domain ?? "");
  }, [value.google, value.bing, value.plausible_domain]);

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div>
        <label className="block font-display text-sm text-ink mb-1">Google site-verification token</label>
        <input
          value={google}
          onChange={(e) => setGoogle(e.target.value)}
          placeholder="abc123...xyz"
          className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-mono text-sm focus:outline-none focus:bg-acid-yellow"
        />
      </div>
      <div>
        <label className="block font-display text-sm text-ink mb-1">Bing msvalidate.01</label>
        <input
          value={bing}
          onChange={(e) => setBing(e.target.value)}
          placeholder="ABCDEF1234..."
          className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-mono text-sm focus:outline-none focus:bg-acid-yellow"
        />
      </div>
      <div>
        <label className="block font-display text-sm text-ink mb-1">Plausible domain (optional)</label>
        <input
          value={plausible}
          onChange={(e) => setPlausible(e.target.value)}
          placeholder="catscandance.com"
          className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 font-mono text-sm focus:outline-none focus:bg-acid-yellow"
        />
      </div>
      <div className="sm:col-span-3">
        <button
          onClick={() =>
            onSave({
              google: google.trim() || undefined,
              bing: bing.trim() || undefined,
              plausible_domain: plausible.trim() || undefined,
            })
          }
          className="bg-ink text-cream font-display px-5 py-2 hover:bg-magenta transition-colors"
        >
          SAVE VERIFICATION
        </button>
      </div>
    </div>
  );
};

export default Admin;

// ============= CURATED EVENTS TAB =============
type CuratedRow = {
  id?: string;
  title: string;
  venue: string;
  event_date: string;
  event_time: string;
  url: string;
  source: string;
  blurb: string;
  genre: string[];
  is_featured: boolean;
};

const emptyCurated = (): CuratedRow => ({
  title: "", venue: "", event_date: "", event_time: "",
  url: "", source: "manual", blurb: "", genre: [], is_featured: false,
});

const CURATED_SOURCES = [
  { key: "skillboxes", label: "Skillbox" },
  { key: "sortmyscene", label: "SortMyScene" },
  { key: "insider", label: "Insider" },
  { key: "district", label: "District" },
  { key: "highape", label: "HighApe" },
  { key: "bookmyshow", label: "BookMyShow" },
] as const;

const CURATED_CITIES = [
  { key: "bangalore", label: "Bangalore" },
  { key: "mumbai", label: "Mumbai" },
  { key: "delhi", label: "Delhi" },
  { key: "pune", label: "Pune" },
  { key: "hyderabad", label: "Hyderabad" },
  { key: "chennai", label: "Chennai" },
  { key: "kochi", label: "Kochi" },
  { key: "jaipur", label: "Jaipur" },
  { key: "indore", label: "Indore" },
  { key: "ranchi", label: "Ranchi" },
  { key: "shillong", label: "Shillong" },
  { key: "all", label: "All Cities" },
] as const;

function CuratedEventsTab() {
  const [rows, setRows] = useState<CuratedRow[]>([]);
  const [draft, setDraft] = useState<CuratedRow>(emptyCurated());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [crawlSource, setCrawlSource] = useState<string>("skillboxes");
  const [crawlCity, setCrawlCity] = useState<string>("bangalore");
  const [lastRun, setLastRun] = useState<any>(null);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-asc");

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const pwd = sessionStorage.getItem(PASS_KEY) ?? "";

  const headers = {
    "x-admin-password": pwd,
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${projectUrl}/functions/v1/admin-curated-events`, { headers });
      const data = await res.json();
      if (res.ok) {
        setRows(data.events ?? []);
      } else {
        toast.error(data?.error ?? "Could not load curated events");
      }
    } catch (e) {
      toast.error("Could not load curated events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const upsert = async (row: CuratedRow) => {
    if (!row.title || !row.url) { toast.error("Title and URL are required"); return; }
    const res = await fetch(`${projectUrl}/functions/v1/admin-curated-events`, {
      method: "POST", headers,
      body: JSON.stringify({ action: "upsert", payload: row }),
    });
    if (res.ok) { toast.success("Saved"); setDraft(emptyCurated()); load(); }
    else toast.error("Save failed");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this curated event?")) return;
    const res = await fetch(`${projectUrl}/functions/v1/admin-curated-events`, {
      method: "POST", headers,
      body: JSON.stringify({ action: "delete", payload: { id } }),
    });
    if (res.ok) { toast.success("Deleted"); load(); }
    else toast.error("Delete failed");
  };

  const refreshFromWeb = async () => {
    setRefreshing(true);
    setLastRun(null);
    try {
      const res = await fetch(`${projectUrl}/functions/v1/curate-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ source: crawlSource, city: crawlCity, mode: "single", limit: 10 }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastRun(data);
        toast.success(`Upserted ${data.upserted ?? 0} from ${crawlSource}/${crawlCity}`);
        load();
      } else {
        toast.error(data.error ?? "Refresh failed");
      }
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const runFullNightly = async () => {
    if (!confirm("Run the full nightly scraper now? This crawls all sources × all cities and may take 2–5 minutes.")) return;
    setRefreshing(true);
    setLastRun(null);
    try {
      const res = await fetch(`${projectUrl}/functions/v1/scheduled-curate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pwd },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Nightly run complete: ${data.total_upserted ?? 0} upserted, ${data.featured ?? 0} featured, ${data.deduped ?? 0} deduped`);
        setLastRun({ runs: data.runs ?? [] });
        load();
      } else {
        toast.error(data.error ?? "Nightly run failed");
      }
    } catch {
      toast.error("Nightly run failed (likely timed out — it may still be running server-side)");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">CURATED EVENTS</h3>
          <p className="text-ink/70 font-medium text-sm">Hand-picked + auto-crawled events shown on /events.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={crawlSource}
            onChange={(e) => setCrawlSource(e.target.value)}
            disabled={refreshing}
            className="border-4 border-ink bg-cream text-ink font-display px-3 py-2"
          >
            {CURATED_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select
            value={crawlCity}
            onChange={(e) => setCrawlCity(e.target.value)}
            disabled={refreshing}
            className="border-4 border-ink bg-cream text-ink font-display px-3 py-2"
          >
            {CURATED_CITIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={refreshFromWeb}
            disabled={refreshing}
            className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
          >
            {refreshing ? "CRAWLING…" : "🔄 REFRESH SOURCE"}
          </button>
          <button
            onClick={runFullNightly}
            disabled={refreshing}
            className="bg-magenta text-cream font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
          >
            {refreshing ? "RUNNING…" : "🌙 RUN NIGHTLY NOW"}
          </button>
        </div>
      </div>

      {lastRun?.runs?.length > 0 && (
        <div className="bg-cream border-4 border-ink p-4 space-y-2 text-sm">
          {lastRun.runs.map((r: any, i: number) => (
            <div key={i} className="font-mono text-ink">
              <strong>{r.source}</strong> — candidates: {r.candidateLinks} · scraped: {r.scrapedPages} · extracted: {r.extracted} · saved: <strong>{r.upserted}</strong>
              {r.errors?.length > 0 && (
                <div className="text-magenta text-xs mt-1">errors: {r.errors.join(" | ")}</div>
              )}
              {r.samples?.length > 0 && r.upserted === 0 && (
                <div className="text-ink/60 text-xs mt-1">candidates seen: {r.samples.slice(0, 3).join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-3">
        <h4 className="font-display text-xl text-ink">ADD MANUALLY</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title *" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          <Field label="URL *" value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} />
          <Field label="Venue" value={draft.venue} onChange={(v) => setDraft({ ...draft, venue: v })} />
          <Field label="Date (YYYY-MM-DD)" value={draft.event_date} onChange={(v) => setDraft({ ...draft, event_date: v })} />
          <Field label="Time" value={draft.event_time} onChange={(v) => setDraft({ ...draft, event_time: v })} />
          <div>
            <label className="block font-display text-sm text-ink mb-1">Source</label>
            <select
              value={draft.source}
              onChange={(e) => setDraft({ ...draft, source: e.target.value })}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-display focus:outline-none focus:bg-acid-yellow"
            >
              <option value="manual">CCD Pick</option>
              <option value="skillboxes">Skillbox</option>
              <option value="district">District</option>
              <option value="insider">Insider</option>
              <option value="sortmyscene">SortMyScene</option>
              <option value="paytm-insider">Paytm Insider</option>
            </select>
          </div>
          <Field
            label="Genres (comma-separated)"
            value={draft.genre.join(", ")}
            onChange={(v) => setDraft({ ...draft, genre: v.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
        <div>
          <label className="block font-display text-sm text-ink mb-1">Blurb</label>
          <textarea
            rows={2}
            value={draft.blurb}
            onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
            className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <label className="flex items-center gap-2 font-medium text-ink">
          <input
            type="checkbox"
            checked={draft.is_featured}
            onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })}
          />
          Feature this event
        </label>
        <button onClick={() => upsert(draft)} className="bg-ink text-cream font-display px-5 py-2 hover:bg-magenta transition-colors">
          ADD CURATED EVENT
        </button>
      </div>

      {(() => {
        const visible = rows
          .filter((r) => filterSource === "all" || r.source === filterSource)
          .filter((r) => filterCity === "all" || (r as any).city === filterCity)
          .slice()
          .sort((a, b) => {
            const da = a.event_date || "9999-12-31";
            const db = b.event_date || "9999-12-31";
            switch (sortBy) {
              case "date-desc": return db.localeCompare(da);
              case "source": return (a.source || "").localeCompare(b.source || "");
              case "city": return ((a as any).city || "").localeCompare((b as any).city || "");
              case "featured": return Number(!!b.is_featured) - Number(!!a.is_featured);
              case "date-asc":
              default: return da.localeCompare(db);
            }
          });
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="border-4 border-ink bg-cream text-ink font-display px-3 py-2">
                <option value="all">All sources</option>
                {CURATED_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                <option value="manual">CCD Pick</option>
              </select>
              <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="border-4 border-ink bg-cream text-ink font-display px-3 py-2">
                {CURATED_CITIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border-4 border-ink bg-cream text-ink font-display px-3 py-2">
                <option value="date-asc">Sort: Date ↑</option>
                <option value="date-desc">Sort: Date ↓</option>
                <option value="source">Sort: Source</option>
                <option value="city">Sort: City</option>
                <option value="featured">Sort: Featured first</option>
              </select>
              <p className="text-ink/70 font-medium text-sm ml-auto">
                {visible.length} of {rows.length} event{rows.length === 1 ? "" : "s"}
              </p>
            </div>
            {loading && <p className="text-ink/60">Loading…</p>}
            {visible.map((r) => (
              <div key={r.id} className="bg-cream border-4 border-ink chunk-shadow p-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-ink">{r.title}</p>
                  <p className="text-ink/70 text-sm">
                    {r.source} · {(r as any).city || "—"} · {r.event_date || "no date"} {r.event_time && `· ${r.event_time}`} {r.venue && `· ${r.venue}`}
                    {r.is_featured && " · ⭐"}
                  </p>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-magenta text-xs underline break-all">{r.url}</a>
                </div>
                <button
                  onClick={() => upsert({ ...r, is_featured: !r.is_featured })}
                  className="bg-acid-yellow text-ink font-display px-4 py-2 border-4 border-ink"
                >
                  {r.is_featured ? "UNFEATURE" : "FEATURE"}
                </button>
                <button onClick={() => r.id && remove(r.id)} className="bg-destructive text-cream font-display px-4 py-2">DELETE</button>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}


// ============= BLOG TAB =============
type WizardStep = 1 | 2 | 3;

const CATEGORIES: Category[] = ["GUIDES", "CULTURE", "ARTISTS", "JOURNAL", "DROPS", "PETS"];

const emptyDraft = (): DraftPost => ({
  slug: "",
  title: "",
  excerpt: "",
  category: "GUIDES",
  coverTitle: "",
  coverColor: "magenta",
  tag: "",
  tldr: [],
  quickPicks: { title: "", items: [] },
  pullQuote: "",
  whatWedSkip: "",
  body: [],
  seoTitle: "",
  metaDescription: "",
  dateISO: new Date().toISOString().slice(0, 10),
  author: "Cats Can Dance",
});

function BlogTab() {
  const [step, setStep] = useState<WizardStep>(1);
  const [category, setCategory] = useState<Category>("GUIDES");
  const [seedTitle, setSeedTitle] = useState("");
  const [seedKeyword, setSeedKeyword] = useState("");
  const [seedAngle, setSeedAngle] = useState("");
  const [draft, setDraft] = useState<DraftPost>(emptyDraft());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<DraftPost[]>([]);

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const pwd = sessionStorage.getItem(PASS_KEY) ?? "";

  const loadPublished = async () => {
    try {
      const res = await fetch(`${projectUrl}/functions/v1/admin-publish-blog`, {
        headers: {
          "x-admin-password": pwd,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const data = await res.json();
      const cms: DraftPost[] = res.ok ? (data.posts ?? []) : [];

      // Merge in code-based static posts so they're editable too.
      // Editing a static post and re-publishing creates a CMS override (same slug).
      const mod = await import("@/content/posts");
      const staticPosts = mod.posts as any[];
      const cmsSlugs = new Set(cms.map((p) => p.slug));
      const staticAsDrafts: DraftPost[] = staticPosts
        .filter((p) => !cmsSlugs.has(p.slug))
        .map((p) => ({
          ...emptyDraft(),
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt ?? "",
          category: (p.category as Category) ?? "JOURNAL",
          coverTitle: p.coverTitle ?? "",
          coverColor: p.coverColor ?? "magenta",
          tag: p.tag ?? "",
          tldr: p.tldr ?? [],
          quickPicks: p.quickPicks ?? { title: "", items: [] },
          pullQuote: p.pullQuote ?? "",
          whatWedSkip: p.whatWedSkip ?? "",
          body: p.body ?? [],
          date: p.date,
          author: p.author,
          dateISO: p.date ?? new Date().toISOString().slice(0, 10),
        }));

      setPublished([...cms, ...staticAsDrafts]);
    } catch {
      /* ignore */
    }
  };

  const editPost = (p: DraftPost) => {
    const next: DraftPost = {
      ...emptyDraft(),
      ...p,
      tldr: Array.isArray(p.tldr) ? p.tldr : [],
      body: Array.isArray(p.body) ? p.body : [],
      quickPicks: p.quickPicks ?? { title: "", items: [] },
    };
    setDraft(next);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`Editing "${p.title}"`);
  };

  useEffect(() => {
    loadPublished();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async (useInputs: boolean) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { category };
      if (useInputs) {
        if (seedTitle.trim()) body.title = seedTitle.trim();
        if (seedKeyword.trim()) body.keyword = seedKeyword.trim();
        if (seedAngle.trim()) body.angle = seedAngle.trim();
      }
      const res = await fetch(`${projectUrl}/functions/v1/admin-generate-blog`, {
        method: "POST",
        headers: {
          "x-admin-password": pwd,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        toast.error("Rate limit hit. Wait a moment and try again.");
        return;
      }
      if (res.status === 402) {
        toast.error("AI credits exhausted. Top up at Settings → Workspace → Usage.");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.post) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      const post = { ...emptyDraft(), ...data.post } as DraftPost;
      post.tldr = Array.isArray(post.tldr) ? post.tldr : [];
      post.body = Array.isArray(post.body) ? post.body : [];
      post.quickPicks = post.quickPicks ?? { title: "", items: [] };
      setDraft(post);
      setStep(2);
      toast.success("Draft generated");
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!draft.slug || !draft.title) {
      toast.error("Slug and title are required");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`${projectUrl}/functions/v1/admin-publish-blog`, {
        method: "POST",
        headers: {
          "x-admin-password": pwd,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Publish failed");
        return;
      }
      toast.success("Published");
      setDraft(emptyDraft());
      setSeedTitle("");
      setSeedKeyword("");
      setSeedAngle("");
      setStep(1);
      loadPublished();
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const deletePost = async (slug: string) => {
    if (!confirm(`Delete post "${slug}"?`)) return;
    try {
      const res = await fetch(
        `${projectUrl}/functions/v1/admin-publish-blog?action=delete&slug=${encodeURIComponent(slug)}`,
        {
          method: "POST",
          headers: {
            "x-admin-password": pwd,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (res.ok) {
        toast.success("Deleted");
        loadPublished();
      } else toast.error("Delete failed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const upd = (patch: Partial<DraftPost>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`px-4 py-2 border-4 border-ink font-display ${
              step === n ? "bg-ink text-cream" : "bg-cream text-ink/60"
            }`}
          >
            {n}. {n === 1 ? "COMPOSE" : n === 2 ? "PREVIEW & EDIT" : "PUBLISH"}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
          <h3 className="font-display text-2xl text-ink">GENERATE A DRAFT</h3>
          <div>
            <label className="block font-display text-sm text-ink mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-display focus:outline-none focus:bg-acid-yellow"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Field label="Title (optional)" value={seedTitle} onChange={setSeedTitle} />
          <Field label="Keyword (optional)" value={seedKeyword} onChange={setSeedKeyword} />
          <div>
            <label className="block font-display text-sm text-ink mb-1">Angle (optional)</label>
            <textarea
              rows={2}
              value={seedAngle}
              onChange={(e) => setSeedAngle(e.target.value)}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => generate(false)}
              disabled={loading}
              className="bg-ink text-cream font-display px-5 py-2 hover:bg-magenta transition-colors disabled:opacity-60"
            >
              {loading ? "GENERATING…" : "GENERATE FROM RESEARCH"}
            </button>
            <button
              onClick={() => generate(true)}
              disabled={loading}
              className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
            >
              {loading ? "GENERATING…" : "GENERATE WITH MY INPUTS"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-ink">PREVIEW & EDIT</h3>
            <button
              onClick={() => setStep(1)}
              className="bg-cream text-ink font-display px-4 py-1 border-2 border-ink hover:bg-acid-yellow"
            >
              ← BACK
            </button>
          </div>

          <div className="border-4 border-ink p-4 bg-background">
            <BlogCover category={draft.category} title={draft.coverTitle || draft.title} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Slug" value={draft.slug} onChange={(v) => upd({ slug: v })} />
            <div>
              <label className="block font-display text-sm text-ink mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => upd({ category: e.target.value as Category })}
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-display focus:outline-none focus:bg-acid-yellow"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Title" value={draft.title} onChange={(v) => upd({ title: v })} />
            <Field
              label="Cover title"
              value={draft.coverTitle}
              onChange={(v) => upd({ coverTitle: v })}
            />
            <Field label="Tag" value={draft.tag} onChange={(v) => upd({ tag: v })} />
            <Field label="Cover color" value={draft.coverColor} onChange={(v) => upd({ coverColor: v })} />
            <Field label="Date (ISO)" value={draft.dateISO} onChange={(v) => upd({ dateISO: v })} />
            <Field label="Author" value={draft.author ?? ""} onChange={(v) => upd({ author: v })} />
          </div>

          <div>
            <label className="block font-display text-sm text-ink mb-1">Excerpt</label>
            <textarea
              rows={2}
              value={draft.excerpt}
              onChange={(e) => upd({ excerpt: e.target.value })}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>

          <div>
            <label className="block font-display text-sm text-ink mb-1">TL;DR (one per line)</label>
            <textarea
              rows={4}
              value={(draft.tldr ?? []).join("\n")}
              onChange={(e) =>
                upd({ tldr: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>

          <Field
            label="Quick picks title"
            value={draft.quickPicks?.title ?? ""}
            onChange={(v) => upd({ quickPicks: { ...draft.quickPicks, title: v } })}
          />
          <div>
            <label className="block font-display text-sm text-ink mb-1">Quick picks items (one per line)</label>
            <textarea
              rows={4}
              value={(draft.quickPicks?.items ?? []).join("\n")}
              onChange={(e) =>
                upd({
                  quickPicks: {
                    title: draft.quickPicks?.title ?? "",
                    items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>

          <div>
            <label className="block font-display text-sm text-ink mb-1">Pull quote</label>
            <textarea
              rows={2}
              value={draft.pullQuote}
              onChange={(e) => upd({ pullQuote: e.target.value })}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>

          <div>
            <label className="block font-display text-sm text-ink mb-1">What we'd skip</label>
            <textarea
              rows={2}
              value={draft.whatWedSkip}
              onChange={(e) => upd({ whatWedSkip: e.target.value })}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>

          <div>
            <label className="block font-display text-sm text-ink mb-1">Body (paragraphs separated by blank line)</label>
            <textarea
              rows={14}
              value={(draft.body ?? []).join("\n\n")}
              onChange={(e) =>
                upd({ body: e.target.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow font-mono text-sm"
            />
          </div>

          <Field label="SEO title" value={draft.seoTitle} onChange={(v) => upd({ seoTitle: v })} />
          <div>
            <label className="block font-display text-sm text-ink mb-1">Meta description</label>
            <textarea
              rows={2}
              value={draft.metaDescription}
              onChange={(e) => upd({ metaDescription: e.target.value })}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(3)}
              className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
            >
              CONTINUE →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-ink">PUBLISH</h3>
            <button
              onClick={() => setStep(2)}
              className="bg-cream text-ink font-display px-4 py-1 border-2 border-ink hover:bg-acid-yellow"
            >
              ← BACK
            </button>
          </div>
          <p className="text-ink/80 font-medium">
            Publishing <span className="font-display">{draft.title}</span> to <code>/{draft.slug}</code>.
          </p>
          <button
            onClick={publish}
            disabled={publishing}
            className="bg-magenta text-cream font-display text-xl px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
          >
            {publishing ? "PUBLISHING…" : "PUBLISH NOW"}
          </button>
        </div>
      )}

      <div className="bg-cream border-4 border-ink chunk-shadow p-6">
        <h3 className="font-display text-2xl text-ink mb-1">ALL PUBLISHED POSTS</h3>
        <p className="text-ink/60 text-sm mb-4">
          {published.length} total. Edit reloads any post (CMS or code-based) into the wizard; publishing creates/overwrites a CMS version which takes precedence on the live site.
        </p>
        {published.length === 0 ? (
          <p className="text-ink/60">No posts yet.</p>
        ) : (
          <ul className="divide-y-2 divide-ink/20">
            {published.map((p) => (
              <li key={p.slug} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-ink truncate">{p.title}</p>
                  <p className="text-ink/60 text-sm truncate">
                    /blog/{p.slug} · {p.category} · {p.dateISO || p.date || "—"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-cream text-ink font-display px-3 py-1 border-2 border-ink hover:bg-acid-yellow"
                  >
                    VIEW
                  </a>
                  <button
                    onClick={() => editPost(p)}
                    className="bg-acid-yellow text-ink font-display px-4 py-1 border-2 border-ink hover:bg-magenta hover:text-cream"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => deletePost(p.slug)}
                    className="bg-destructive text-cream font-display px-4 py-1"
                  >
                    DELETE
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


// ============= PROMOTERS DIRECTORY TAB =============
type PromoterRow = {
  id?: string;
  slug: string;
  name: string;
  city: string | null;
  cities: string[];
  blurb: string | null;
  genres: string[];
  instagram: string | null;
  website: string | null;
  booking_email: string | null;
  logo_url: string | null;
  trusted: boolean;
  crawl_urls: { label: string; url: string; kind?: string }[];
  status: string;
};

const EMPTY_PROMOTER: PromoterRow = {
  slug: "", name: "", city: "", cities: [], blurb: "", genres: [],
  instagram: null, website: null, booking_email: null, logo_url: null,
  trusted: true, crawl_urls: [], status: "approved",
};

function PromoterApplicationsTab() {
  const [rows, setRows] = useState<PromoterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PromoterRow>(EMPTY_PROMOTER);
  const [editingId, setEditingId] = useState<string | null>(null);

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const pwd = sessionStorage.getItem(PASS_KEY) ?? "";
  const headers = {
    "x-admin-password": pwd,
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${projectUrl}/functions/v1/admin-promoters`, { headers });
      const data = await res.json();
      if (res.ok) setRows((data.promoters ?? []).map((p: any) => ({
        ...p, cities: p.cities ?? [], genres: p.genres ?? [], crawl_urls: p.crawl_urls ?? [],
      })));
      else toast.error(data?.error ?? "Could not load promoters");
    } catch { toast.error("Could not load promoters"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.slug || !draft.name) { toast.error("Slug and name required"); return; }
    try {
      const res = await fetch(`${projectUrl}/functions/v1/admin-promoters`, {
        method: "POST", headers,
        body: JSON.stringify({ action: "upsert", payload: editingId ? { ...draft, id: editingId } : draft }),
      });
      if (res.ok) { toast.success("Saved"); setDraft(EMPTY_PROMOTER); setEditingId(null); load(); }
      else { const e = await res.json(); toast.error(e?.error ?? "Save failed"); }
    } catch { toast.error("Save failed"); }
  };

  const toggleTrust = async (id: string, trusted: boolean) => {
    const res = await fetch(`${projectUrl}/functions/v1/admin-promoters`, {
      method: "POST", headers,
      body: JSON.stringify({ action: "toggle_trust", payload: { id, trusted } }),
    });
    if (res.ok) { setRows(rows.map((r) => r.id === id ? { ...r, trusted } : r)); }
    else toast.error("Update failed");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this promoter?")) return;
    const res = await fetch(`${projectUrl}/functions/v1/admin-promoters`, {
      method: "POST", headers,
      body: JSON.stringify({ action: "delete", payload: { id } }),
    });
    if (res.ok) { toast.success("Deleted"); setRows(rows.filter((r) => r.id !== id)); }
    else toast.error("Delete failed");
  };

  const edit = (r: PromoterRow) => { setDraft(r); setEditingId(r.id ?? null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-2xl text-ink">PROMOTERS DIRECTORY</h3>
        <p className="text-ink/70 font-medium text-sm">
          {rows.length} total · {rows.filter((r) => r.trusted).length} trusted (feed the crawler)
        </p>
      </div>

      <div className="bg-cream border-4 border-ink chunk-shadow p-5 space-y-3">
        <p className="font-display text-lg uppercase">{editingId ? "Edit promoter" : "Add promoter"}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug (e.g. krunk)" className="border-2 border-ink px-3 py-2" />
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className="border-2 border-ink px-3 py-2" />
          <input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Primary city" className="border-2 border-ink px-3 py-2" />
          <input value={draft.cities.join(", ")} onChange={(e) => setDraft({ ...draft, cities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="All cities (comma separated)" className="border-2 border-ink px-3 py-2" />
          <input value={draft.genres.join(", ")} onChange={(e) => setDraft({ ...draft, genres: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Genres (comma separated)" className="border-2 border-ink px-3 py-2" />
          <input value={draft.instagram ?? ""} onChange={(e) => setDraft({ ...draft, instagram: e.target.value || null })} placeholder="Instagram handle" className="border-2 border-ink px-3 py-2" />
          <input value={draft.website ?? ""} onChange={(e) => setDraft({ ...draft, website: e.target.value || null })} placeholder="Website" className="border-2 border-ink px-3 py-2" />
          <input value={draft.booking_email ?? ""} onChange={(e) => setDraft({ ...draft, booking_email: e.target.value || null })} placeholder="Booking email" className="border-2 border-ink px-3 py-2" />
        </div>
        <textarea value={draft.blurb ?? ""} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} placeholder="Blurb" rows={3} className="w-full border-2 border-ink px-3 py-2" />
        <textarea
          value={JSON.stringify(draft.crawl_urls, null, 2)}
          onChange={(e) => { try { setDraft({ ...draft, crawl_urls: JSON.parse(e.target.value) }); } catch {} }}
          placeholder='Crawl URLs JSON: [{"label":"Instagram","url":"https://...","kind":"instagram"}]'
          rows={4}
          className="w-full border-2 border-ink px-3 py-2 font-mono text-xs"
        />
        <label className="inline-flex items-center gap-2 font-display text-sm">
          <input type="checkbox" checked={draft.trusted} onChange={(e) => setDraft({ ...draft, trusted: e.target.checked })} className="w-4 h-4 accent-magenta" />
          Trusted (feeds the crawler)
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="bg-ink text-cream font-display px-5 py-2 border-4 border-ink chunk-shadow">
            {editingId ? "UPDATE" : "ADD"}
          </button>
          {editingId && (
            <button onClick={() => { setDraft(EMPTY_PROMOTER); setEditingId(null); }} className="bg-cream text-ink font-display px-5 py-2 border-4 border-ink">
              CANCEL
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-ink/60">Loading…</p>}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className={`bg-cream border-4 border-ink chunk-shadow p-4 flex flex-wrap items-center justify-between gap-3 ${r.trusted ? "" : "opacity-70"}`}>
            <div className="min-w-0">
              <p className="font-display text-lg text-ink">{r.name} <span className="text-ink/40 text-xs">/{r.slug}</span></p>
              <p className="text-xs text-ink/60">{r.city ?? r.cities[0]} · {r.genres.slice(0,4).join(" · ")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => r.id && toggleTrust(r.id, !r.trusted)} className={`text-xs font-display px-3 py-1.5 border-2 border-ink ${r.trusted ? "bg-magenta text-cream" : "bg-cream text-ink"}`}>
                {r.trusted ? "TRUSTED" : "UNTRUSTED"}
              </button>
              <button onClick={() => edit(r)} className="text-xs font-display bg-acid-yellow text-ink px-3 py-1.5 border-2 border-ink">EDIT</button>
              <button onClick={() => r.id && del(r.id)} className="text-xs font-display bg-destructive text-cream px-3 py-1.5 border-2 border-ink">DEL</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ArtistsTabProps = {
  artists: Array<{
    id: string; slug: string; name: string; instagram: string | null;
    photo_url: string | null; booking_email: string | null; manager_email: string | null;
    bio: string | null; based_city: string | null;
    enrichment_status: string; enriched_at: string | null;
  }>;
  reload: () => Promise<void>;
  enrichAll: (force: boolean) => Promise<void>;
  enrichOne: (id: string) => Promise<void>;
  busy: boolean;
};

function ArtistsTab({ artists, reload, enrichAll, enrichOne, busy }: ArtistsTabProps) {
  const counts = artists.reduce((m, a) => { m[a.enrichment_status] = (m[a.enrichment_status] || 0) + 1; return m; }, {} as Record<string, number>);
  const statusColor = (s: string) =>
    s === "enriched" ? "bg-acid-yellow" : s === "enriching" ? "bg-cream" : s === "failed" ? "bg-red-200" : "bg-cream";

  return (
    <div className="space-y-4">
      <div className="bg-cream border-4 border-ink chunk-shadow p-5 flex flex-wrap items-center gap-3">
        <div className="font-display text-2xl text-ink mr-4">ROSTER ({artists.length})</div>
        <div className="font-mono text-xs text-ink/70">
          enriched {counts.enriched ?? 0} · pending {counts.pending ?? 0} · failed {counts.failed ?? 0}
        </div>
        <div className="flex-1" />
        <button disabled={busy} onClick={reload}
          className="bg-cream text-ink font-display px-4 py-2 border-4 border-ink chunk-shadow disabled:opacity-50">
          REFRESH
        </button>
        <button disabled={busy} onClick={() => enrichAll(false)}
          className="bg-acid-yellow text-ink font-display px-4 py-2 border-4 border-ink chunk-shadow disabled:opacity-50">
          ENRICH ALL PENDING
        </button>
        <button disabled={busy} onClick={() => enrichAll(true)}
          className="bg-ink text-cream font-display px-4 py-2 border-4 border-ink chunk-shadow disabled:opacity-50">
          FORCE RE-ENRICH ALL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {artists.map((a) => (
          <div key={a.id} className="bg-cream border-4 border-ink chunk-shadow p-4 flex gap-4">
            {a.photo_url ? (
              <img src={a.photo_url} alt={a.name} className="w-20 h-20 object-cover border-2 border-ink" />
            ) : (
              <div className="w-20 h-20 border-2 border-ink bg-ink/10 flex items-center justify-center text-xs font-mono text-ink/50">no photo</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-xl text-ink">{a.name}</div>
                  <div className="font-mono text-xs text-ink/60">{a.based_city ?? "—"} · @{a.instagram ?? "?"}</div>
                </div>
                <span className={`font-mono text-[10px] uppercase px-2 py-1 border-2 border-ink ${statusColor(a.enrichment_status)}`}>
                  {a.enrichment_status}
                </span>
              </div>
              <div className="font-mono text-xs text-ink/70 mt-2 line-clamp-2">{a.bio ?? "—"}</div>
              <div className="font-mono text-xs text-ink/60 mt-1">
                booking: {a.booking_email ?? "—"}{a.manager_email ? ` · mgr: ${a.manager_email}` : ""}
              </div>
              <div className="mt-3 flex gap-2">
                <button disabled={busy} onClick={() => enrichOne(a.id)}
                  className="bg-acid-yellow text-ink font-display text-xs px-3 py-1 border-2 border-ink disabled:opacity-50">
                  ✨ ENRICH
                </button>
                <a href={`/artists/${a.slug}`} target="_blank" rel="noreferrer"
                  className="bg-cream text-ink font-display text-xs px-3 py-1 border-2 border-ink">
                  VIEW
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

