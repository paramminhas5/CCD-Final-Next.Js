import { Link } from "@/lib/compat-router";
import ccdLogo from "@/assets/ccd-logo.png";
import { imgUrl } from "@/lib/img";
import { getAllPosts } from "@/content/posts";
import { useState } from "react";

const groups = [
  {
    title: "EXPLORE",
    links: [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/discover", label: "Discover" },
      { to: "/events", label: "Events" },
      { to: "/shop", label: "Shop" },
    ],
  },
  {
    title: "SCENES",
    links: [
      { to: "/scene/bengaluru", label: "Bengaluru" },
      { to: "/scene/mumbai", label: "Mumbai" },
      { to: "/scene/delhi", label: "Delhi" },
      { to: "/scene/goa", label: "Goa" },
      { to: "/scene/hyderabad", label: "Hyderabad" },
      { to: "/scene/pune", label: "Pune" },
    ],
  },
  {
    title: "GENRES",
    links: [
      { to: "/genres/techno", label: "Techno" },
      { to: "/genres/house", label: "House" },
      { to: "/genres/jungle-dnb", label: "Jungle / D&B" },
      { to: "/genres/uk-garage", label: "UK Garage" },
      { to: "/genres/disco", label: "Disco" },
      { to: "/genres/ambient", label: "Ambient" },
    ],
  },
  {
    title: "GLOBAL ORIGINS",
    links: [
      { to: "/scenes/detroit-techno", label: "Detroit Techno" },
      { to: "/scenes/chicago-house", label: "Chicago House" },
      { to: "/scenes/london-jungle", label: "London Jungle" },
      { to: "/scenes/berlin-techno", label: "Berlin Techno" },
      { to: "/scenes/goa-trance", label: "Goa Trance" },
    ],
  },
  {
    title: "WATCH & LISTEN",
    links: [
      { to: "/videos", label: "Videos" },
      { to: "/playlists", label: "Playlists" },
    ],
  },
  {
    title: "READ",
    links: [
      { to: "/blog", label: "Blog" },
      { to: "/press", label: "Press" },
      { to: "/media", label: "Media" },
      { to: "/pets", label: "Pets" },
    ],
  },
  {
    title: "PLAY",
    links: [
      { to: "/cat-studio", label: "Cat Studio ✦" },
    ],
  },
  {
    title: "PARTNERS",
    links: [
      { to: "/for-venues", label: "Venue Partners" },
      { to: "/for-artists", label: "For Artists" },
      { to: "/for-investors", label: "For Investors" },
      { to: "/book", label: "Book an Artist" },
      { to: "/promoters", label: "Promoters" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/cookies", label: "Cookies" },
    ],
  },
];

const buildDiscover = () => {
  const links: { to: string; label: string }[] = [
    { to: "/blog", label: "The Journal" },
    { to: "/bengaluru-underground-dance-music", label: "Bengaluru Scene Guide" },
  ];
  try {
    const posts = getAllPosts();
    const featured = posts.find((p) => p.category === "GUIDES") ?? posts[0];
    if (featured) links.push({ to: `/blog/${featured.slug}`, label: featured.coverTitle || featured.title.slice(0, 32) });
  } catch { /* noop */ }
  links.push({ to: "/events", label: "Next Episode" });
  return links;
};


const Footer = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state === "busy" || state === "done") return;
    setState("busy");
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), source: "footer" }),
      });
      setState(res.ok || res.status === 409 ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="relative bg-ink text-cream py-24 md:py-32 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-8 right-8 w-14 h-14 rounded-full bg-cream border-2 border-ink chunk-shadow grid place-items-center transition-transform duration-700 hover:rotate-[-360deg]"
      >
        <img src={imgUrl(ccdLogo)} alt="" loading="lazy" className="w-9" />
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-16 left-8 w-12 h-12 rounded-full bg-cream border-2 border-ink chunk-shadow grid place-items-center transition-transform duration-700 hover:rotate-[-360deg]"
      >
        <img src={imgUrl(ccdLogo)} alt="" loading="lazy" className="w-7" />
      </div>

      <div className="container">
        <p className="font-display text-acid-yellow text-2xl md:text-3xl mb-6 text-center">/ JOIN THE PARTY</p>
        <h2 className="font-display text-5xl md:text-[8rem] leading-[0.9] text-cream text-center">
          WE'RE<br/>JUST<br/>
          <span className="text-magenta">GETTING</span><br/>
          <span className="text-acid-yellow ink-stroke">STARTED.</span>
        </h2>

        <a
          href="mailto:hello@catscandance.com"
          className="block w-fit mx-auto mt-10 bg-acid-yellow text-ink font-display text-2xl md:text-3xl px-10 py-5 border-4 border-cream rounded-full chunk-shadow-lg hover:-translate-y-1 transition-transform"
        >
          GET IN TOUCH →
        </a>

        {/* ── Newsletter capture ── */}
        <div className="mt-12 max-w-md mx-auto text-center">
          <p className="font-display text-cream/70 text-sm uppercase tracking-widest mb-3">Stay in the loop</p>
          {state === "done" ? (
            <p className="font-display text-acid-yellow text-sm uppercase tracking-widest">✓ You're on the list</p>
          ) : (
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={255}
                className="flex-1 bg-cream/10 text-cream border-4 border-cream/30 px-4 py-2 font-medium text-sm focus:outline-none focus:border-acid-yellow placeholder:text-cream/30"
              />
              <button
                type="submit"
                disabled={state === "busy"}
                className="bg-acid-yellow text-ink font-display text-xs uppercase px-4 py-2 border-4 border-acid-yellow hover:bg-cream transition-colors disabled:opacity-60"
              >
                {state === "busy" ? "…" : "JOIN"}
              </button>
            </form>
          )}
          {state === "error" && <p className="text-magenta text-xs mt-1 font-display">Something went wrong — try again</p>}
        </div>

        <div className="mt-20 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-10 max-w-6xl mx-auto">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="font-display text-acid-yellow text-lg mb-3">{g.title}</p>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="font-medium text-cream/80 hover:text-acid-yellow transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="font-display text-acid-yellow text-lg mb-3">DISCOVER</p>
            <ul className="space-y-2">
              {buildDiscover().map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="font-medium text-cream/80 hover:text-acid-yellow transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-acid-yellow text-lg mb-3">FOLLOW</p>
            <ul className="space-y-2">
              <li><a href="https://instagram.com/catscan.dance" target="_blank" rel="noopener noreferrer" className="font-medium text-cream/80 hover:text-acid-yellow transition-colors">Instagram</a></li>
              <li><a href="https://www.youtube.com/@thesecatscandance" target="_blank" rel="noopener noreferrer" className="font-medium text-cream/80 hover:text-acid-yellow transition-colors">YouTube</a></li>
              <li><a href="/rss.xml" className="font-medium text-cream/80 hover:text-acid-yellow transition-colors">RSS</a></li>
              <li><a href="mailto:hello@catscandance.com" className="font-medium text-cream/80 hover:text-acid-yellow transition-colors">Email</a></li>
            </ul>
          </div>
        </div>

        <p className="mt-16 text-cream/70 text-sm font-display text-center tracking-wide">
          BANGALORE
        </p>
        <p className="mt-2 text-cream/50 text-sm font-medium text-center">© {new Date().getFullYear()} Cats Can Dance — so can you.</p>
        <nav aria-label="Legal" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-cream/60">
          <Link to="/privacy" className="hover:text-acid-yellow transition-colors">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-acid-yellow transition-colors">Terms</Link>
          <span aria-hidden="true">·</span>
          <Link to="/cookies" className="hover:text-acid-yellow transition-colors">Cookies</Link>
          <span aria-hidden="true">·</span>
          <a href="mailto:hello@catscandance.com" className="hover:text-acid-yellow transition-colors">Contact</a>
        </nav>
      </div>
    </section>
  );
};

export default Footer;
