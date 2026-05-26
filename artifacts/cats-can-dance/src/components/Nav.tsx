import { useEffect, useRef, useState } from "react";
import { Link, NavLink as RouterNavLink, useLocation, useNavigate } from "@/lib/compat-router";
import { ChevronDown } from "lucide-react";
import DiscoButton from "@/components/DiscoButton";
import DiscoMute from "@/components/DiscoMute";
import DiscoHint from "@/components/DiscoHint";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import ccdLogo from "@/assets/ccd-logo.png";
import { imgUrl } from "@/lib/img";
import { useUser, useClerk } from "@clerk/react";

const primaryLinks = [
  { to: "/about", label: "About" },
  { to: "/discover", label: "Discover" },
  { to: "/events", label: "Events" },
  { to: "/artists", label: "Artists" },
  { to: "/book", label: "Book" },
  { to: "/promoters", label: "Promoters" },
  { to: "/shop", label: "Shop" },
];

const partnersLinks = [
  { to: "/for-venues", label: "For Venues" },
  { to: "/for-artists", label: "For Artists" },
  { to: "/for-investors", label: "For Investors" },
];

const moreLinks: { to: string; label: string; external?: boolean }[] = [
  { to: "/care", label: "Cats Can Care" },
  { to: "/videos", label: "Videos" },
  { to: "/playlists", label: "Playlists" },
  { to: "/pets", label: "Pets" },
  { to: "/blog", label: "Blog" },
  { to: "https://lovable.dev/projects/74e0d8d1-d0d1-44e3-a353-45e10e319248", label: "Learn", external: true },
];

// Flat list for mobile hamburger
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

const Nav = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();
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
          <Dropdown label="Partners" links={partnersLinks} scrolled={effectiveScrolled} />
          <Dropdown label="More" links={moreLinks} scrolled={effectiveScrolled} />
        </ul>
        <div className="hidden lg:flex items-center gap-3">
          <span className="hidden xl:block"><DiscoMute /></span>
          <DiscoButton compact />
          {hasCart && <CartDrawer />}
          {isLoaded && (
            user ? (
              <div className="flex items-center gap-2">
                <a href="/profile"
                  className="font-display text-xs uppercase px-3 py-2 border-4 border-ink bg-cream text-ink hover:bg-acid-yellow transition-colors">
                  Profile
                </a>
                <a href="/dashboard"
                  className="font-display text-xs uppercase px-3 py-2 border-4 border-ink bg-acid-yellow text-ink hover:bg-magenta hover:text-cream transition-colors">
                  Dashboard
                </a>
                <button onClick={() => signOut()}
                  className="font-display text-xs uppercase px-3 py-2 border-4 border-ink bg-cream text-ink hover:bg-ink hover:text-cream transition-colors">
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => openSignIn()}
                className="font-display text-xs uppercase px-3 py-2 xl:px-4 border-4 border-ink bg-cream text-ink hover:bg-magenta hover:text-cream transition-colors chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Sign In
              </button>
            )
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
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 sm:w-11 sm:h-11 grid place-items-center border-4 border-ink bg-cream chunk-shadow"
          >
            <span className="font-display text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden bg-cream border-t-4 border-ink">
          <ul className="container py-4 flex flex-col gap-1">
            {mobileLinks.map((l) => (
              <li key={l.to}>
                {l.external ? (
                  <a
                    href={l.to}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-display text-2xl text-ink py-2"
                  >
                    {l.label} ↗
                  </a>
                ) : (
                  <RouterNavLink to={l.to} className="block font-display text-2xl text-ink py-2">
                    {l.label}
                  </RouterNavLink>
                )}
              </li>
            ))}
            {isLoaded && (
              user ? (
                <>
                  <li><a href="/profile" className="block font-display text-2xl text-ink py-2">Profile</a></li>
                  <li><a href="/dashboard" className="block font-display text-2xl text-ink py-2">Dashboard</a></li>
                  <li><button onClick={() => signOut()} className="block font-display text-2xl text-ink/50 py-2 w-full text-left">Sign Out</button></li>
                </>
              ) : (
                <li><button onClick={() => openSignIn()} className="block font-display text-2xl text-magenta py-2 w-full text-left">Sign In →</button></li>
              )
            )}
            <li>
              <a href="/#early-access" onClick={goToEarlyAccess} className="block font-display text-2xl text-magenta py-2">
                Early Access →
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Nav;
