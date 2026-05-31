import { useEffect, useRef, useState } from "react";
import { Link, NavLink as RouterNavLink, useLocation, useNavigate } from "@/lib/compat-router";
import { ChevronDown, Search, User, LogOut, LayoutDashboard } from "lucide-react";
import DiscoButton from "@/components/DiscoButton";
import DiscoMute from "@/components/DiscoMute";
import DiscoHint from "@/components/DiscoHint";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import ccdLogo from "@/assets/ccd-logo.png";
import { imgUrl } from "@/lib/img";
import { useSafeUser, useSafeClerk } from "@/lib/clerk-safe";

const primaryLinks = [
  { to: "/about",    label: "About"    },
  { to: "/discover", label: "Discover" },
  { to: "/events",   label: "Events"   },
  { to: "/ccdxsocial", label: "Series" },
  { to: "/artists",  label: "Artists"  },
  { to: "/shop",     label: "Shop"     },
];

const partnersLinks = [
  { to: "/talent",        label: "Talent Directory" },
  { to: "/for-venues",    label: "For Venues"       },
  { to: "/for-artists",   label: "For Artists"      },
  { to: "/for-investors", label: "For Investors"    },
  { to: "/book",          label: "Book an Artist"   },
  { to: "/promoters",     label: "Promoters"        },
];

const moreLinks: { to: string; label: string; external?: boolean }[] = [
  { to: "/care", label: "Cats Can Care" },
  { to: "/videos", label: "Videos" },
  { to: "/playlists", label: "Playlists" },
  { to: "/pets", label: "Pets" },
  { to: "/blog", label: "Blog" },
  { to: "https://learn.catscandance.com", label: "Learn", external: true },
];

// Flat list for mobile hamburger — primary + partners + more (no Talent in primary, it's in Work With Us)
const mobileLinks: { to: string; label: string; external?: boolean }[] = [...primaryLinks, ...partnersLinks, ...moreLinks];

const scrollToEarlyAccess = () => {
  setTimeout(() => {
    const el = document.getElementById("early-access");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
};

const Dropdown = ({
  label,
  links,
  scrolled,
}: {
  label: string;
  links: { to: string; label: string; external?: boolean }[];
  scrolled: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const location = useLocation();
  const isActive = links.some((l) => location.pathname.startsWith(l.to));

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const activeColor = scrolled ? "text-magenta" : "text-acid-yellow";
  const baseColor = scrolled ? "text-ink" : "text-cream";

  return (
    <li ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`font-display text-base hover:${activeColor} transition-colors inline-flex items-baseline gap-1 ${
          isActive ? activeColor : baseColor
        }`}
      >
        {label} <ChevronDown className="w-4 h-4 self-center" />
      </button>
      {open && (
        <div className="absolute top-full right-0 pt-2 min-w-[180px] z-50">
          <ul className="py-1 bg-cream border-4 border-ink chunk-shadow">
            {links.map((l) => {
              const isHash = l.to.includes("#");
              return (
                <li key={l.to}>
                  {l.external ? (
                    <a
                      href={l.to}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 font-display text-base text-ink hover:bg-acid-yellow"
                    >
                      {l.label} ↗
                    </a>
                  ) : (
                    <RouterNavLink
                      to={l.to}
                      onClick={(e) => {
                        setOpen(false);
                        if (isHash) {
                          e.preventDefault();
                          const [path, hash] = l.to.split("#");
                          const scroll = () => {
                            const el = document.getElementById(hash);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          };
                          if (location.pathname === (path || "/")) {
                            scroll();
                          } else {
                            window.history.pushState({}, "", l.to);
                            window.dispatchEvent(new PopStateEvent("popstate"));
                            setTimeout(scroll, 120);
                          }
                        }
                      }}
                      className={({ isActive }) =>
                        `block px-4 py-2 font-display text-base text-ink hover:bg-acid-yellow ${
                          isActive && !isHash ? "bg-acid-yellow" : ""
                        }`
                      }
                    >
                      {l.label}
                    </RouterNavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};

// ── Account dropdown — compact avatar/initials button with menu ──────────────
const AccountDropdown = ({ user, signOut, scrolled }: { user: any; signOut: () => void; scrolled: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = (user?.firstName?.[0] ?? user?.username?.[0] ?? "U").toUpperCase();
  const baseColor = scrolled ? "bg-cream text-ink" : "bg-cream/20 text-cream";

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
        className={`w-9 h-9 border-4 border-ink font-display text-sm grid place-items-center transition-colors ${baseColor} hover:bg-acid-yellow hover:text-ink`}
      >
        {initials}
      </button>
      {open && (
        <div className="absolute top-full right-0 pt-2 min-w-[160px] z-50">
          <ul className="py-1 bg-cream border-4 border-ink chunk-shadow">
            <li>
              <a href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 font-display text-sm text-ink hover:bg-acid-yellow">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </a>
            </li>
            <li>
              <a href="/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 font-display text-sm text-ink hover:bg-acid-yellow">
                <User className="w-3.5 h-3.5" /> Profile
              </a>
            </li>
            <li className="border-t-2 border-ink/10">
              <button onClick={() => { signOut(); setOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 font-display text-sm text-ink/60 hover:bg-acid-yellow hover:text-ink">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const Nav = () => {
  const { user, isLoaded } = useSafeUser();
  const { openSignIn, signOut } = useSafeClerk();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const hasCart = cartCount > 0;

  const lightBgRoutes = ["/about", "/blog", "/media", "/press", "/playlists", "/videos", "/cat-studio"];
  const forceScrolledStyle = lightBgRoutes.some((r) => location.pathname === r || location.pathname.startsWith(r + "/"));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const goToEarlyAccess = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname === "/") {
      scrollToEarlyAccess();
    } else {
      navigate("/#early-access");
      scrollToEarlyAccess();
    }
  };

  const effectiveScrolled = scrolled || forceScrolledStyle;
  const activeColor = effectiveScrolled ? "text-magenta" : "text-acid-yellow";
  const baseColor = effectiveScrolled ? "text-ink" : "text-cream";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        effectiveScrolled ? "bg-cream/95 backdrop-blur border-b-4 border-ink" : "bg-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between py-3 md:py-4 gap-3 md:gap-4">
        <Link to="/" className={`group flex items-center gap-2 font-display text-xl md:text-2xl leading-none shrink-0 ${baseColor}`}>
          <img
            src={imgUrl(ccdLogo)}
            alt="Cats Can Dance logo"
            style={{ filter: effectiveScrolled ? "none" : "invert(1) brightness(1.2)" }}
            className="h-9 md:h-11 w-auto transition-transform duration-700 group-hover:rotate-[360deg]"
          />
          <span className="hidden sm:inline">CATS<span className="text-magenta">.</span>CAN<span className="text-magenta">.</span>DANCE</span>
          <span className="sm:hidden">CCD</span>
        </Link>

        <ul className="hidden lg:flex items-baseline gap-4">
          {primaryLinks.map((l) => (
            <li key={l.to}>
              <RouterNavLink
                to={l.to}
                className={({ isActive }) =>
                  `font-display text-base hover:${activeColor} transition-colors ${
                    isActive ? activeColor : baseColor
                  }`
                }
              >
                {l.label}
              </RouterNavLink>
            </li>
          ))}
          <Dropdown label="Work With Us" links={partnersLinks} scrolled={effectiveScrolled} />
          <Dropdown label="More" links={moreLinks} scrolled={effectiveScrolled} />
        </ul>
        <div className="hidden lg:flex items-center gap-3">
          {/* Global search trigger */}
          <RouterNavLink
            to="/discover"
            aria-label="Search"
            className={`hover:${activeColor} transition-colors`}
          >
            <Search className={`w-4 h-4 ${baseColor}`} />
          </RouterNavLink>
          <span className="hidden xl:block"><DiscoMute /></span>
          <DiscoButton compact />
          {hasCart && <CartDrawer />}
          {user ? (
            /* ── Compact avatar dropdown for signed-in users ── */
            <AccountDropdown user={user} signOut={signOut} scrolled={effectiveScrolled} />
          ) : (
            // Always render the Sign In CTA — unconditional, so it shows even
            // before Clerk loads (or when Clerk is disabled / mis-configured).
            // openSignIn() falls back to navigating to /sign-in when needed.
            <button onClick={() => openSignIn()}
              className="font-display text-xs uppercase px-3 py-2 xl:px-4 border-4 border-ink bg-cream text-ink hover:bg-magenta hover:text-cream transition-colors chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              Sign In
            </button>
          )}
          <a
            href="/#early-access"
            onClick={goToEarlyAccess}
            className="inline-block bg-ink text-cream font-display px-3 py-2 xl:px-4 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform text-xs xl:text-sm"
          >
            Early Access
          </a>
        </div>

        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2 relative">
          <DiscoMute />
          <div className="relative"><DiscoButton compact /><DiscoHint /></div>
          {hasCart && <CartDrawer />}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 sm:w-11 sm:h-11 grid place-items-center border-4 border-ink bg-cream chunk-shadow"
          >
            <span className="font-display text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden bg-cream border-t-4 border-ink max-h-[85vh] overflow-y-auto">
          <div className="container py-4 space-y-1">
            {/* ── Primary navigation ── */}
            {primaryLinks.map((l) => (
              <RouterNavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `block font-display text-xl text-ink py-2 border-b border-ink/10 ${isActive ? "text-magenta" : ""}`
                }
              >
                {l.label}
              </RouterNavLink>
            ))}

            {/* ── Work With Us group ── */}
            <div className="pt-2">
              <p className="font-display text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-1">Work With Us</p>
              {partnersLinks.map((l) => (
                <RouterNavLink key={l.to} to={l.to} className="block font-display text-lg text-ink py-1.5 border-b border-ink/5">
                  {l.label}
                </RouterNavLink>
              ))}
            </div>

            {/* ── More group ── */}
            <div className="pt-2">
              <p className="font-display text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-1">More</p>
              {moreLinks.map((l) =>
                l.external ? (
                  <a key={l.to} href={l.to} target="_blank" rel="noreferrer"
                    className="block font-display text-lg text-ink py-1.5 border-b border-ink/5">
                    {l.label} ↗
                  </a>
                ) : (
                  <RouterNavLink key={l.to} to={l.to} className="block font-display text-lg text-ink py-1.5 border-b border-ink/5">
                    {l.label}
                  </RouterNavLink>
                )
              )}
            </div>

            {/* ── Account + utilities ── */}
            <div className="pt-3 border-t-2 border-ink/20 space-y-1">
              {user ? (
                <>
                  <a href="/dashboard" className="flex items-center gap-2 font-display text-lg text-ink py-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </a>
                  <a href="/profile" className="flex items-center gap-2 font-display text-lg text-ink py-2">
                    <User className="w-4 h-4" /> Profile
                  </a>
                  <button onClick={() => signOut()} className="flex items-center gap-2 font-display text-lg text-ink/50 py-2 w-full text-left">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => openSignIn()} className="block font-display text-xl text-magenta py-2 w-full text-left">
                  Sign In →
                </button>
              )}
              <a href="/#early-access" onClick={goToEarlyAccess} className="block font-display text-xl text-magenta py-2">
                Early Access →
              </a>
              {/* Disco mode toggle */}
              <div className="flex items-center gap-3 pt-2 border-t border-ink/10">
                <span className="font-display text-sm uppercase text-ink/40 tracking-widest">Disco Mode</span>
                <DiscoButton compact />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Nav;
