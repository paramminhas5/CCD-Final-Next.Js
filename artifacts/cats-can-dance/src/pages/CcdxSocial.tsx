import { useEffect, useState } from "react";
import Head from "next/head";
import ccdLogo from "@/assets/ccd-logo.png";
import socialLogo from "@/assets/social-logo.png";
import { imgUrl } from "@/lib/img";

type TabId = "op" | "ops";

const PDF_OP = "/ccdxsocial/CCD-One-Pager.pdf";
const PDF_OPS = "/ccdxsocial/CCD-Operations-Doc.pdf";

const OP_SECTIONS: { id: string; label: string; short: string }[] = [
  { id: "sec-what", label: "The Plan", short: "PL" },
  { id: "sec-activities", label: "Activities", short: "AC" },
  { id: "sec-roles", label: "Roles", short: "RL" },
  { id: "sec-revenue", label: "Revenue", short: "RV" },
  { id: "sec-calendar", label: "Calendar", short: "CA" },
];
const OPS_SECTIONS: { id: string; label: string; short: string }[] = [
  { id: "sec-ops-1", label: "1 Shows", short: "01" },
  { id: "sec-ops-2", label: "2 Run of Show", short: "02" },
  { id: "sec-ops-3", label: "3 Roles", short: "03" },
  { id: "sec-ops-4", label: "4 Venue", short: "04" },
  { id: "sec-ops-5", label: "5 Checklist", short: "05" },
  { id: "sec-ops-6", label: "6 Expansion", short: "06" },
  { id: "sec-ops-7", label: "7 Next Steps", short: "07" },
];

/**
 * Standalone partnership proposal page (rendered at /ccdxsocial).
 * - noindex/nofollow (also disallowed in robots.txt, omitted from sitemap).
 * - Hides the global site Nav/Footer/ThemeSwitcher/DiscoButton while mounted.
 */
const CcdxSocial = () => {
  const [tab, setTab] = useState<TabId>("op");
  const [dlOpen, setDlOpen] = useState(false);
  const [pdfMode, setPdfMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("pdf");
    if (p === "op" || p === "ops") {
      setTab(p as TabId);
      setPdfMode(true);
      document.documentElement.classList.add("ccd-pdf-mode");
    }
    return () => {
      document.documentElement.classList.remove("ccd-pdf-mode");
    };
  }, []);

  // Hide global site chrome only while this page is mounted.
  useEffect(() => {
    document.documentElement.classList.add("ccdxsocial-active");
    const style = document.createElement("style");
    style.id = "ccdxsocial-hide-chrome";
    style.textContent = `
      html.ccdxsocial-active body > div#root > header,
      html.ccdxsocial-active body > div#root > footer,
      html.ccdxsocial-active body > header,
      html.ccdxsocial-active body > footer,
      html.ccdxsocial-active [data-theme-switcher],
      html.ccdxsocial-active [data-disco-button] { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => {
      document.documentElement.classList.remove("ccdxsocial-active");
      style.remove();
    };
  }, []);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const subnav = tab === "op" ? OP_SECTIONS : OPS_SECTIONS;

  const Lockup = ({ size = 28 }: { size?: number }) => (
    <span className="ccd-lockup" style={{ ["--lh" as never]: `${size}px` } as React.CSSProperties}>
      <img src={imgUrl(ccdLogo)} alt="CatsCaNDance" className="ccd-lg ccd-lg-ccd" />
      <span className="ccd-lx">×</span>
      <img src={imgUrl(socialLogo)} alt="Social" className="ccd-lg ccd-lg-soc" />
    </span>
  );

  return (
    <>
      <Head>
        <title>CatsCaNDance × Social — Partnership Proposal</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="CatsCaNDance × Social: India's first curated pet lifestyle festival. Partnership one-pager and operations document."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className={`ccd ${pdfMode ? "is-pdf" : ""}`}>
        <nav className="ccd-nav">
          <div className="ccd-brand"><Lockup /></div>
          <div className="ccd-tabs">
            <button className={`ccd-tab ${tab === "op" ? "on" : ""}`} onClick={() => setTab("op")}>ONE-PAGER</button>
            <button className={`ccd-tab ${tab === "ops" ? "on" : ""}`} onClick={() => setTab("ops")}>OPERATIONS DOC</button>
          </div>
          <div className="ccd-actions">
            <a className="ccd-dl" href={PDF_OP} download>⬇ ONE-PAGER PDF</a>
            <a className="ccd-dl alt" href={PDF_OPS} download>⬇ OPS DOC PDF</a>
          </div>
        </nav>

        <div className="ccd-subnav">
          {subnav.map(s => (
            <button key={s.id} className="ccd-sub" onClick={() => jumpTo(s.id)}>{s.label}</button>
          ))}
        </div>

        {/* Floating side rail */}
        <div className="ccd-rail">
          {subnav.map(s => (
            <button key={s.id} className="ccd-rail-btn" onClick={() => jumpTo(s.id)} title={s.label}>
              <span className="ccd-rail-short" aria-hidden>•</span>
              <span className="ccd-rail-full">{s.label}</span>
            </button>
          ))}
          <div className="ccd-rail-sep" />
          <button className="ccd-rail-btn ccd-rail-dl" onClick={() => setDlOpen(v => !v)} title="Download PDFs">
            <span className="ccd-rail-short">⬇</span>
            <span className="ccd-rail-full">Download</span>
          </button>
          {dlOpen && (
            <div className="ccd-rail-pop">
              <a className="ccd-pop-item" href={PDF_OP} download onClick={() => setDlOpen(false)}>One-Pager PDF</a>
              <a className="ccd-pop-item alt" href={PDF_OPS} download onClick={() => setDlOpen(false)}>Ops Doc PDF</a>
            </div>
          )}
        </div>

        {/* ONE-PAGER */}
        <div className={`doc ${tab === "op" ? "" : "doc-hidden"}`} id="doc-op">
          <main className="page">
            <section className="hero pdf-block" id="sec-hero">
              <div className="hero-dots" />
              <div className="hero-inner">
                <div>
                  <div className="h-tag">Official Venue &amp; Co-Marketing Partnership · Season 1 · 2026</div>
                  <div className="hero-lockup"><Lockup size={56} /></div>
                  <h1 className="h-title">CATS<span className="y">CAN</span>DANCE<br />× SOCIAL</h1>
                  <p className="h-sub">India's first curated pet lifestyle festival — 4 shows at Social BLR + a grand season finale. Co-hosted, co-marketed, built for the city's 24–45 pet parent crowd.</p>
                  <div className="h-pills">
                    <div className="h-pill hi">4 Shows at Social BLR</div>
                    <div className="h-pill hi">1 Grand Finale</div>
                    <div className="h-pill">Co-Marketing Partnership</div>
                    <div className="h-pill">Season 1 · BLR → National</div>
                  </div>
                </div>
                <div className="h-badges">
                  <div className="hb"><div className="hb-n">4</div><div className="hb-l">Shows</div></div>
                  <div className="hb" style={{ background: "var(--magenta)" }}>
                    <div className="hb-n" style={{ color: "var(--cream)" }}>1</div>
                    <div className="hb-l" style={{ color: "var(--cream)" }}>Finale</div>
                  </div>
                  <div className="hb" style={{ background: "var(--lime)" }}>
                    <div className="hb-n">3K</div><div className="hb-l">Pax</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pdf-block pdf-break-before" id="sec-what">
              <h2 className="slbl">The Plan</h2>
              <div className="grid2">
                {[
                  ["🐾", "4 SHOWS AT SOCIAL BLR", "Ticketed (walk-ins welcome at door), capped at 200. Curated vendor market, pet + parent activities, DJ set. Saturday 2pm to close. A different Social neighbourhood each time."],
                  ["✨", "1 GRAND FINALE — YOU COULD BE IN IT", "A large-format season finale (2,000–3,000 pax) — runway, cat showcase, full agility competition, everything. Social has first right to co-present: Social branding, Social bar ops, Social content."],
                  ["📣", "SOCIAL CO-MARKETS EVERY SHOW", "Every event is co-branded. Social promotes across outlet handles and city channels — pre-event, during, and post. CCD drives paid and influencer; Social drives local neighbourhood reach."],
                  ["👥", "THE AUDIENCE", "Urban, 24–45, spending ₹3–8K/month on their pets. Primarily ticketed — walk-ins can buy at the door. Already Social regulars. Same person, same Saturday, now with their pet."],
                ].map(([icon, title, body]) => (
                  <div className="gc" key={title}>
                    <div className="gc-icon">{icon}</div>
                    <div className="gc-title">{title}</div>
                    <div className="gc-body">{body}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-block pdf-break-before" id="sec-activities">
              <h2 className="slbl">What Could Happen at Each Show</h2>
              <div className="act-strip">
                {[
                  ["🛍️", "VENDOR MARKET", "2–3 curated pet brands"],
                  ["🎨", "PET PORTRAIT BOOTH", "Polaroid / digital prints"],
                  ["🏃", "OBSTACLE COURSE", "Dog agility taster"],
                  ["👯", "LOOKALIKE CONTEST", "Pet + parent twins"],
                  ["✂️", "LIVE GROOMING DEMO", "Partner brand on stage"],
                  ["🏆", "GOLDEN PAW AWARDS", "Crowd-voted live"],
                  ["🎧", "DJ SET", "Live set throughout"],
                ].map(([icon, name, sub]) => (
                  <div className="act-tag" key={name}>
                    <div className="act-icon">{icon}</div>
                    <div className="act-name">{name}<span className="act-sub">{sub}</span></div>
                  </div>
                ))}
                <div className="act-tag" style={{ background: "var(--acid)" }}>
                  <div className="act-icon">🎪</div>
                  <div className="act-name">+ MORE<span className="act-sub">Rotates per show</span></div>
                </div>
              </div>
            </section>

            <section className="pdf-block pdf-break-before" id="sec-roles">
              <h2 className="slbl">Who Does What</h2>
              <div className="wdw">
                <div className="wdw-col wdw-s">
                  <div className="wdw-hd"><div className="wdw-hd-title">🏠 SOCIAL PROVIDES + CO-MARKETS</div></div>
                  <div className="wdw-body">
                    {[
                      ["Venue access", "outdoor space open from 2pm to close"],
                      ["F&B operations", "full bar + kitchen throughout the event"],
                      ["Designated pet zone", "outdoor area with water facilities, pee/poo corner, and easy access"],
                      ["Pet-friendly F&B", "optional: 1–2 pet-safe snack items if feasible"],
                      ["Staff briefing", "team prepped on pet protocols + CCD format"],
                      ["Co-marketing", "Social city + outlet channels promoting every show"],
                      ["Outlet-level permits", "outdoor event + music permissions as needed"],
                      ["Finale option", "first right to co-present the Grand Finale"],
                    ].map(([k, v]) => (
                      <div className="wi" key={k}><div className="wi-dot" /><div className="wi-t"><strong>{k}</strong> — {v}</div></div>
                    ))}
                  </div>
                </div>
                <div className="wdw-col wdw-c">
                  <div className="wdw-hd"><div className="wdw-hd-title">🎪 CCD HANDLES EVERYTHING ELSE</div></div>
                  <div className="wdw-body">
                    {[
                      ["Full event production", "vendors, DJ, décor, signage, layout"],
                      ["Creative direction", "all design, visuals, curation, brand experience"],
                      ["Ticketing", "platform, sales, check-in, guest management"],
                      ["All paid marketing", "digital, email, influencer, paid ads"],
                      ["Content", "photographer + videographer on-site, assets to Social within a week"],
                      ["Event day staffing", "CCD ops lead + crew, independent of Social staff"],
                      ["Vendor curation", "selection, briefing, day-of management"],
                    ].map(([k, v]) => (
                      <div className="wi" key={k}><div className="wi-dot" /><div className="wi-t"><strong>{k}</strong> — {v}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="pdf-block pdf-break-before" id="sec-revenue">
              <h2 className="slbl">Revenue Structure</h2>
              <div className="rev2">
                <div className="rv rv-a">
                  <div className="rv-hd">
                    <div className="rv-rec">Recommended</div>
                    <div className="rv-tag">Option A</div>
                    <div className="rv-name">CLEAN SPLIT</div>
                  </div>
                  <div className="rv-body">
                    <div className="fb s"><div className="fb-who">Social</div><div className="fb-pct">100%</div><div className="fb-desc"><strong>All F&amp;B revenue</strong> — bar + food</div></div>
                    <div className="fb c"><div className="fb-who">CCD</div><div className="fb-pct">100%</div><div className="fb-desc"><strong>All tickets + vendors + sponsors</strong></div></div>
                    <div className="fb n"><div className="fb-who">Fee</div><div className="fb-pct">₹0</div><div className="fb-desc">No venue fee — F&amp;B is Social's contribution</div></div>
                  </div>
                </div>
                <div className="rv rv-b">
                  <div className="rv-hd">
                    <div className="rv-tag">Option B</div>
                    <div className="rv-name">FLAT FEE +<br />BAR SHARE</div>
                  </div>
                  <div className="rv-body">
                    <div className="fb c"><div className="fb-who">CCD</div><div className="fb-pct">₹35K</div><div className="fb-desc"><strong>Flat venue fee</strong> paid to Social per show</div></div>
                    <div className="fb s"><div className="fb-who">Social</div><div className="fb-pct">80–90%</div><div className="fb-desc"><strong>Bar + food revenue</strong></div></div>
                    <div className="fb c"><div className="fb-who">CCD</div><div className="fb-pct">10–20%</div><div className="fb-desc"><strong>Bar revenue share</strong></div></div>
                    <div className="fb c"><div className="fb-who">CCD</div><div className="fb-pct">100%</div><div className="fb-desc"><strong>All tickets + vendors + sponsors</strong></div></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pdf-block pdf-break-before" id="sec-calendar">
              <h2 className="slbl">Season 1 Calendar — Bengaluru</h2>
              <div className="tl">
                {[
                  ["Show 01 · Jun 2026", "The Debut", "Portrait Booth · Lookalike Contest"],
                  ["Show 02 · Jul 2026", "The Groom Room", "Live Grooming Demo · Makeover Contest"],
                  ["Show 03 · Aug 2026", "Zoomies", "2 Agility Courses · Speed Run"],
                  ["Show 04 · Sep 2026", "The Big Tease", "Golden Paw Awards · Finale Ticket Drop"],
                ].map(([mo, name, note]) => (
                  <div className="tc mini" key={mo}>
                    <div className="tc-top"><div className="tc-mo">{mo}</div></div>
                    <div className="tc-body">
                      <div className="tc-type">Mini Show</div>
                      <div className="tc-name">{name}</div>
                      <div className="tc-pax">~200 pax</div>
                      <div className="tc-note">{note}</div>
                    </div>
                  </div>
                ))}
                <div className="tc finale">
                  <div className="tc-top"><div className="tc-mo">GRAND FINALE · Dec 2026</div></div>
                  <div className="tc-body">
                    <div className="tc-type">Co-Presented (Option)</div>
                    <div className="tc-name">Season Finale</div>
                    <div className="tc-pax">2,000–3,000 pax</div>
                    <div className="tc-note">Social has first right to co-present</div>
                  </div>
                </div>
              </div>
              <div className="cta acid">
                <p><strong>Jun–Sep 2026</strong> — 4 shows across different Social BLR locations (Indiranagar, Church Street, Koramangala, HSR). Grand Finale Dec 2026 — Social has first right to co-present.</p>
              </div>
              <div className="footer">
                <div className="ft-brand"><Lockup size={32} /></div>
                <div className="ft-contacts">
                  <div><div className="ft-l">Website</div><div className="ft-v">catscandance.com</div></div>
                  <div><div className="ft-l">Email</div><div className="ft-v">hello@catscandance.com</div></div>
                  <div><div className="ft-l">Instagram</div><div className="ft-v">@catscan.dance</div></div>
                </div>
              </div>
            </section>
          </main>
        </div>

        {/* OPS DOC */}
        <div className={`doc ${tab === "ops" ? "" : "doc-hidden"}`} id="doc-ops">
          <main className="page">
            <section className="ops-cover pdf-block" id="sec-ops-cover">
              <div className="ops-cover-grain" />
              <div className="ops-cover-inner">
                <div className="ops-tag">Operations Document · Confidential · 2026</div>
                <div className="hero-lockup"><Lockup size={56} /></div>
                <h1 className="ops-title">CATS<span className="y">CAN</span>DANCE<br />× SOCIAL</h1>
                <p className="ops-sub">4 show themes, full run-of-show, responsibilities, venue requirements, co-marketing plan, and national expansion roadmap.</p>
                <div className="ops-meta">
                  {[
                    ["Season 1", "Jun–Dec 2026"],
                    ["Home City", "Bengaluru"],
                    ["Shows", "4 × Social BLR + Finale"],
                    ["Expansion", "MUM + DEL Season 2"],
                  ].map(([l, v]) => (
                    <div className="ops-mp" key={l}>
                      <div className="ops-mp-l">{l}</div>
                      <div className="ops-mp-v">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="ops-sec os1 pdf-block pdf-break-before" id="sec-ops-1">
              <div className="ops-sec-hd"><div className="ops-sec-num">01</div><div className="ops-sec-title">THE FOUR SHOWS — THEMES + ACTIVATIONS</div></div>
              <div className="ops-sec-body">
                <p className="ops-body">Each show has a theme that goes progressively deeper into pet culture — four chapters of the same story, each building community and raising stakes for the next. Same DNA, different energy. The theme shapes the vendor edit, possible activities, and signature activation. Everything listed per show is what <em>could</em> happen — not all of it will, and the mix is refined closer to date.</p>
                <div className="mini-grid">
                  {[
                    { cls: "mc1", month: "Show 01 · Jun 2026", name: "THE DEBUT", tag: "BROAD · WELCOMING · FIRST IMPRESSION", desc: "The introduction to CatsCaNDance — widest possible appeal. Vendor edit covers food, accessories, grooming, photography. 2–3 curated brands. Energy is curious and excited. Social promotes as a neighbourhood Saturday event.", actName: "🎨 Pet Portrait Booth · 👯 Lookalike Contest", actDesc: "Polaroid or digital print takeaway for every pet. Lookalike contest pits pet parents against their animals — crowd votes. The \"tell everyone you came\" moments of the season." },
                    { cls: "mc2", month: "Show 02 · Jul 2026", name: "THE GROOM ROOM", tag: "FASHION · GROOMING · STYLE", desc: "All about looking good — pets and parents alike. Fashion, grooming, accessories. Vendor edit leans into apparel and grooming brands. A natural playground for partner integrations and style-forward content.", actName: "✂️ Live Grooming Demo · 👗 Best Dressed Contest · 📸 Style Booth", actDesc: "Partner grooming brand runs a live demo on stage. Best Dressed Pet + Parent voted by crowd. Dedicated style photography corner for content creation." },
                    { cls: "mc3", month: "Show 03 · Aug 2026", name: "ZOOMIES", tag: "AGILITY · PERFORMANCE · SPEED", desc: "Dogs doing what dogs do best. The most physical show of the season — movement, competition, raw energy. Vendor edit includes nutrition, training and performance brands. First taste of the finale's agility competition.", actName: "🏃 Two Agility Courses · ⚡ Timed Speed Run · 🥇 Performance Contest", actDesc: "Two simultaneous obstacle courses — beginner and advanced. A timed speed run that seeds the competitive energy of the finale. Any breed, any age, any skill level welcome." },
                    { cls: "mc4", month: "Show 04 · Sep 2026", name: "THE BIG TEASE", tag: "SHOWCASE · JUDGING · FINALE PREVIEW", desc: "Think dog show, cat show, pet parent show — structured judging, categories, ceremony. The community is fully formed. Grand Finale tickets drop exclusively at this event. Biggest buzz of the four shows.", actName: "🐾 Pet Showcase Judging · 🏆 Golden Paw Awards · 🎟️ Exclusive Finale Drop", actDesc: "Structured categories judged on stage — Most Dramatic Cat, Best Dressed Duo, Most Likely to Judge Everyone. Finale tickets go on sale on the night, first access for attendees only." },
                  ].map(s => (
                    <div className={`mini-card ${s.cls}`} key={s.name}>
                      <div className="mini-card-hd">
                        <div>
                          <div className="mc-month">{s.month}</div>
                          <div className="mc-name">{s.name}</div>
                        </div>
                      </div>
                      <div className="mini-card-body">
                        <div className="mc-tagline">{s.tag}</div>
                        <div className="mc-desc">{s.desc}</div>
                        <div className="mc-activation">
                          <div>
                            <div className="mc-act-label">Could Include</div>
                            <div className="mc-act-name">{s.actName}</div>
                            <div className="mc-act-desc">{s.actDesc}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cta ink"><p><strong>Every show has:</strong> 2–3 curated vendors, designated pet zone, DJ set, and a mix of pet + pet parent activities rotating per show. The Grand Finale brings it all together — runway, cat showcase, full agility competition, vendors, DJ, and more.</p></div>
              </div>
            </section>

            <section className="ops-sec os2 pdf-block pdf-break-before" id="sec-ops-2">
              <div className="ops-sec-hd"><div className="ops-sec-num">02</div><div className="ops-sec-title">APPROXIMATE RUN OF SHOW — SATURDAY FORMAT</div></div>
              <div className="ops-sec-body">
                <p className="ops-body">Social's indoor space continues normal operations throughout. The event uses the outdoor/pet zone only — additive, not a takeover. VIPs have open access all evening and typically arrive late. The exact schedule is confirmed per show closer to the date. Event runs 2pm to close.</p>
                <div className="ros-wrap">
                  <div className="ros-thead">
                    <div className="ros-th">Time</div>
                    <div className="ros-th">Segment</div>
                    <div className="ros-th">Owner</div>
                  </div>
                  {[
                    { t: "2:00 PM", e: "Setup + Staff Brief", d: "CCD ops arrive. Vendors set up in designated pet zone. Social staff briefed on protocols and layout.", o: [["b", "Both"]] as [string, string][] },
                    { t: "3:00 PM", e: "Doors Open", d: "General entry and walk-ins begin. Vendor market and pet zone open. Bar service starts. DJ on ambient set. VIPs come and go freely throughout the evening.", o: [["b", "Both"]] as [string, string][] },
                    { t: "4:30 PM", e: "Activities + Activations", d: "Obstacle course, portrait booth, grooming demo, lookalike or showcase judging — depending on the show. Drop-in format, no fixed slots. Crowd builds.", o: [["c", "CCD"]] as [string, string][] },
                    { t: "6:00 PM", e: "Peak Moment", d: "Contest winners announced. Sponsor moments. DJ transitions to foreground. Vendors still running.", o: [["c", "CCD"]] as [string, string][] },
                    { t: "7:00 PM", e: "Evening Mode 🍺", d: "Vendors wind down. DJ full foreground. Bar peaks. Attendees shift from event mode to Social regulars staying through close.", o: [["s", "Social bar"], ["c", "CCD DJ"]] as [string, string][] },
                    { t: "Close", e: "Event Wraps", d: "CCD ops clear equipment and signage from pet zone. Post-event report and content package sent to Social within the week.", o: [["c", "CCD"]] as [string, string][] },
                  ].map(r => (
                    <div className="ros-row" key={r.t}>
                      <div className="ros-t">{r.t}</div>
                      <div className="ros-content">
                        <div className="ros-e">{r.e}</div>
                        <div className="ros-d">{r.d}</div>
                      </div>
                      <div className="ros-own-cell">
                        {r.o.map(([k, label]) => <span key={label} className={`own own-${k}`}>{label}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="ops-sec os3 pdf-block pdf-break-before" id="sec-ops-3">
              <div className="ops-sec-hd"><div className="ops-sec-num">03</div><div className="ops-sec-title">RESPONSIBILITIES — FULL DETAIL</div></div>
              <div className="ops-sec-body">
                <div className="ops-two">
                  <div>
                    <div className="ops-col-hd s">SOCIAL IS RESPONSIBLE FOR</div>
                    <ul className="ops-list">
                      {[
                        ["Venue access", "outdoor space open from 2pm to close"],
                        ["Designated pet zone", "defined outdoor area with water facilities, pee/poo corner, and easy street access"],
                        ["F&B service throughout", "full bar + kitchen operational during the event"],
                        ["Pet-friendly F&B", "optional: 1–2 pet-safe snack options if kitchen can accommodate"],
                        ["Staff briefing", "outlet team prepped on pet protocols + CCD layout"],
                        ["Co-marketing", "Social city + outlet channels promoting every show"],
                        ["Outlet-level permits", "outdoor event + music permissions as required"],
                        ["Grand Finale option", "first right to co-present the season finale"],
                      ].map(([k, v]) => <li key={k}><span><strong>{k}</strong> — {v}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="ops-col-hd c">CCD HANDLES EVERYTHING ELSE</div>
                    <ul className="ops-list c">
                      {[
                        ["Full event production", "vendor market layout, DJ, décor, signage"],
                        ["Creative direction", "all design, visuals, brand experience, curation"],
                        ["Ticketing", "platform, sales, guest list, check-in management"],
                        ["All paid marketing", "social media, email, influencer, paid promotion"],
                        ["Content production", "photographer + videographer, assets to Social within the week"],
                        ["Event day staffing", "CCD ops lead + crew, independent of Social staff"],
                        ["Vendor curation + management", "selection, briefing, day-of"],
                        ["DJ booking", "artist, sound system, setup, volume management"],
                      ].map(([k, v]) => <li key={k}><span><strong>{k}</strong> — {v}</span></li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="ops-sec os4 pdf-block pdf-break-before" id="sec-ops-4">
              <div className="ops-sec-hd"><div className="ops-sec-num">04</div><div className="ops-sec-title">VENUE REQUIREMENTS PER SHOW</div></div>
              <div className="ops-sec-body">
                <p className="ops-body">Not every Social outlet will work. The goal is a different neighbourhood per show — Indiranagar, Church Street, Koramangala, HSR/Whitefield for Season 1.</p>
                <ul className="vr-list">
                  {[
                    ["must", "Outdoor or terrace area that can comfortably hold ~150–200 people"],
                    ["must", "Designated zone that can function as the pet area"],
                    ["must", "Water access and a pee/poo corner within or adjacent to the zone"],
                    ["must", "Full bar service accessible to the outdoor area"],
                    ["must", "Necessary permits — outdoor event + music/DJ at outlet level"],
                    ["must", "Pet-friendly building — no restrictions on animals"],
                    ["nice", "Shaded section — pet comfort in summer months"],
                    ["nice", "Easy street access — supports walk-in ticketing at door"],
                  ].map(([k, v]) => <li key={v} className={`vr ${k}`}>{v}</li>)}
                </ul>
              </div>
            </section>

            <section className="ops-sec os5 pdf-block pdf-break-before" id="sec-ops-5">
              <div className="ops-sec-hd"><div className="ops-sec-num">05</div><div className="ops-sec-title">4-WEEK CHECKLIST</div></div>
              <div className="ops-sec-body">
                <p className="ops-body">Both teams work from this for each show. Social's programming contact and CCD's ops lead are the two POCs.</p>
                {[
                  { hd: "4 WEEKS BEFORE", items: [
                    ["Confirm Social outlet + revenue model for this show", "b", "Both"],
                    ["Confirm outlet-level permits — outdoor event + music", "s", "Social"],
                    ["Vendors confirmed + briefed", "c", "CCD"],
                    ["DJ booked + briefed on format", "c", "CCD"],
                    ["Ticketing page live", "c", "CCD"],
                    ["Sponsor activation confirmed", "c", "CCD"],
                    ["Co-marketing goes live — Social + CCD channels", "b", "Both"],
                  ] as [string, string, string][]},
                  { hd: "2 WEEKS BEFORE", items: [
                    ["Layout plan + event brief shared with outlet manager", "c", "CCD"],
                    ["Photographer + videographer confirmed", "c", "CCD"],
                    ["Pet-friendly F&B options confirmed (if applicable)", "b", "Both"],
                    ["Reminder campaign goes out — Social + CCD channels", "b", "Both"],
                  ] as [string, string, string][]},
                  { hd: "DAY BEFORE", items: [
                    ["Social outlet staff briefed on CCD format + pet protocols", "s", "Social"],
                    ["Guest list finalised + check-in team briefed", "c", "CCD"],
                    ["Pet zone facilities confirmed — water, pee/poo corner", "s", "Social"],
                    ["Day-before promo goes live on all channels", "b", "Both"],
                  ] as [string, string, string][]},
                  { hd: "ON THE DAY", items: [
                    ["CCD ops arrives 2pm — setup in pet zone", "c", "CCD"],
                    ["Social bar + kitchen operational from 3pm", "s", "Social"],
                    ["CCD delivers post-event report + content to Social within the week", "c", "CCD"],
                    ["Post-event recap goes live on Social channels", "s", "Social"],
                    ["Revenue settlement per agreed model (A or B)", "b", "Both"],
                  ] as [string, string, string][]},
                ].map(group => (
                  <div className="chk-group" key={group.hd}>
                    <div className="chk-hd">{group.hd}</div>
                    {group.items.map(([text, who, label]) => (
                      <div className="chk-item" key={text}>
                        <div className="chk-box" />
                        <div className="chk-text">{text}</div>
                        <span className={`chk-who own-${who}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="ops-sec os6 pdf-block pdf-break-before" id="sec-ops-6">
              <div className="ops-sec-hd"><div className="ops-sec-num">06</div><div className="ops-sec-title">NATIONAL EXPANSION PLAN</div></div>
              <div className="ops-sec-body">
                <p className="ops-body">Season 1 Bengaluru proves the model. Season 2 is the national play — same structure, different pincodes. Social's existing footprint in Mumbai and Delhi makes the rollout a framework, not a rebuild.</p>
                <div className="city-grid">
                  <div className="city-card city-blr">
                    <div className="city-hd"><div className="city-season">Season 1 · 2026</div><div className="city-name">BENGALURU</div></div>
                    <div className="city-body"><strong>4 Shows</strong> at 4 different Social BLR outlets<br /><strong>Grand Finale</strong> — Dec 2026, Social first right to co-present<br /><br />Goal: prove the model, build the community, create the template.</div>
                  </div>
                  <div className="city-card city-mum">
                    <div className="city-hd"><div className="city-season">Season 2 · 2027</div><div className="city-name">MUMBAI</div></div>
                    <div className="city-body"><strong>4 Shows</strong> at Mumbai Social outlets<br /><strong>1 Grand Finale</strong><br /><br />Bandra Born, Colaba Social, Andheri — different neighbourhood per show. Same model, Mumbai energy.</div>
                  </div>
                  <div className="city-card city-del">
                    <div className="city-hd"><div className="city-season">Season 2/3 · 2027</div><div className="city-name">DELHI</div></div>
                    <div className="city-body"><strong>4 Shows</strong> at Delhi Social outlets<br /><strong>1 Grand Finale</strong><br /><br />Hauz Khas, GK, Connaught Place Social. Delhi's pet culture is distinct — content angle adapts accordingly.</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="ops-sec os7 pdf-block pdf-break-before" id="sec-ops-7">
              <div className="ops-sec-hd"><div className="ops-sec-num">07</div><div className="ops-sec-title">NEXT STEPS</div></div>
              <div className="ops-sec-body">
                <div className="next-list">
                  {[
                    "Agree on revenue model — Option A or B",
                    "Confirm 4 BLR Social outlets and provisional show dates",
                    "Align on co-marketing plan — channels, cadence, content",
                    "Confirm Grand Finale co-presenting arrangement (if Social is in)",
                    "Partnership brief signed off both sides",
                  ].map(t => (
                    <div className="chk-item" key={t}>
                      <div className="chk-box" />
                      <div className="chk-text">{t}</div>
                      <span className="chk-who own-b">Both</span>
                    </div>
                  ))}
                </div>
                <div className="contact-block">
                  <div className="contact-l">GET IN TOUCH</div>
                  <div className="contact-v">hello@catscandance.com  ·  @catscan.dance  ·  catscandance.com</div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
};

export default CcdxSocial;
