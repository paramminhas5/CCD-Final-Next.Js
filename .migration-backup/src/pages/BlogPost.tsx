import { useParams, Link, Navigate } from "react-router-dom";
import { useSyncExternalStore } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogCover from "@/components/BlogCover";
import { getPost, getRelatedPosts, subscribePosts, getAllPosts, type Category } from "@/content/posts";
import { useDynamicPosts } from "@/hooks/useDynamicPosts";

const SITE = "https://catscandance.com";

const FAQ_BY_CATEGORY: Record<string, { q: string; a: string }[]> = {
  GUIDES: [
    { q: "Where are the best underground parties in Bangalore?", a: "The best underground parties in Bangalore are RSVP-driven, 200–400 capacity nights run by independent crews — Cats Can Dance Episodes, plus rotating pop-ups in CBD, Indiranagar, and Whitefield. Full guide and upcoming dates at catscandance.com/events." },
    { q: "How do I find dance music events in Bengaluru?", a: "Follow independent organisers on Instagram, sign up to Cats Can Dance early-access at catscandance.com, and check our curated /events feed — most real underground nights never hit aggregator apps." },
    { q: "What is RSVP culture in Bangalore's party scene?", a: "Most credible Bangalore underground nights are RSVP-only with capped capacity. RSVP early, show up on time, and respect the room. Cats Can Dance episodes are free entry with name on the door — RSVP at catscandance.com/events." },
  ],
  DROPS: [
    { q: "Where can I buy Cats Can Dance streetwear?", a: "All current Cats Can Dance drops are at catscandance.com/shop. Pet streetwear (cat bandanas, bucket hats, treats) lives at /pets." },
    { q: "Do Cats Can Dance drops restock?", a: "No. Every drop is limited and screen-printed in Bangalore. Once a piece sells out, it doesn't come back." },
    { q: "Does Cats Can Dance ship across India?", a: "Yes — pan-India shipping is available on every order from catscandance.com/shop." },
  ],
  ARTISTS: [
    { q: "Who plays at Cats Can Dance events?", a: "Cats Can Dance lineups feature resident selectors and guest DJs from Bangalore and across India playing House, Disco, Jungle, Garage, and Drum & Bass. Recent lineups are at catscandance.com/events." },
    { q: "How do artists get booked at Cats Can Dance?", a: "We curate small lineups per Episode. Send a mix and a short note to hello@catscandance.com or read /for-artists for the long version." },
    { q: "Where can I listen to Cats Can Dance sets?", a: "Recordings, mixes, and curator playlists live at catscandance.com/playlists and /videos." },
  ],
  CULTURE: [
    { q: "What is Cats Can Dance?", a: "Cats Can Dance is a Bengaluru-based underground dance music collective and streetwear label running RSVP-only Episodes and limited drops rooted in dance music culture." },
    { q: "Where do Cats Can Dance events happen?", a: "Cats Can Dance Episodes run at intimate venues across Bengaluru including Bar Wild in Indiranagar. All upcoming dates and RSVP links are at catscandance.com/events." },
    { q: "How do I join the Cats Can Dance pack?", a: "Sign up for early access at catscandance.com — we send drop alerts, RSVP openings, and the journal." },
  ],
  JOURNAL: [
    { q: "Who writes the Cats Can Dance journal?", a: "The Pack — the people running the floor and the drops in Bangalore. Honest, by humans." },
    { q: "How often does Cats Can Dance publish?", a: "Roughly weekly. Subscribe via RSS at catscandance.com/rss.xml." },
    { q: "What does Cats Can Dance write about?", a: "Bangalore's underground party scene, India's drop culture, the artists behind the nights, and the brand's own Episodes." },
  ],
};

const FAQ_DEFAULT = FAQ_BY_CATEGORY.CULTURE;

const TAKE_IT_FURTHER: Record<string, { to: string; label: string; desc: string }[]> = {
  GUIDES: [
    { to: "/events", label: "RSVP an upcoming Episode", desc: "Live dates and lineups in Bangalore." },
    { to: "/bengaluru-underground-dance-music", label: "The Bengaluru underground guide", desc: "Our deep map of the scene." },
    { to: "/blog", label: "More guides", desc: "Read the full journal." },
  ],
  DROPS: [
    { to: "/shop", label: "Shop the current drop", desc: "Limited streetwear, no restocks." },
    { to: "/pets", label: "Pet streetwear", desc: "Bandanas, bucket hats, CCD treats." },
    { to: "/about", label: "Why we drop the way we do", desc: "The brand behind the print." },
  ],
  ARTISTS: [
    { to: "/playlists", label: "Curator playlists", desc: "Mixes from the lineup." },
    { to: "/videos", label: "Watch sets & recaps", desc: "Footage from the floor." },
    { to: "/events", label: "Upcoming Episodes", desc: "Catch them live." },
  ],
  CULTURE: [
    { to: "/about", label: "About Cats Can Dance", desc: "Who we are." },
    { to: "/events", label: "Upcoming nights", desc: "RSVP." },
    { to: "/shop", label: "The drop", desc: "Limited streetwear from Bangalore." },
  ],
  JOURNAL: [
    { to: "/blog", label: "All posts", desc: "Browse the journal." },
    { to: "/events", label: "Episodes", desc: "Live dates." },
    { to: "/about", label: "About the Pack", desc: "Who's behind it." },
  ],
};

const TAKE_IT_FURTHER_DEFAULT = TAKE_IT_FURTHER.CULTURE;

const BlogPost = () => {
  useDynamicPosts();
  // Re-render when dynamic posts arrive
  useSyncExternalStore(subscribePosts, getAllPosts, getAllPosts);
  const { slug = "" } = useParams();
  const post = getPost(slug);

  if (!post) return <Navigate to="/" replace />;

  const related = getRelatedPosts(post.slug, 3);
  const cat = (post.category as Category | undefined) ?? "JOURNAL";
  const faqEntries = FAQ_BY_CATEGORY[cat] ?? FAQ_DEFAULT;
  const takeFurther = TAKE_IT_FURTHER[cat] ?? TAKE_IT_FURTHER_DEFAULT;
  const wordCount = post.body.join(" ").split(/\s+/).filter(Boolean).length;
  const keywords = [post.tag, post.category, "Bangalore", "underground", "dance music", "Cats Can Dance"]
    .filter(Boolean)
    .join(", ");

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [`${SITE}/og-image.jpg`],
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "en-IN",
    wordCount,
    keywords,
    articleSection: post.category || post.tag,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Cats Can Dance",
      logo: { "@type": "ImageObject", url: `${SITE}/ccd-logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}`,
    },
    isPartOf: { "@type": "Blog", name: "Cats Can Dance — Journal", url: `${SITE}/blog` },
    about: ["dance music", "events in Bangalore", "underground parties India"],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <SEO
        title={`${post.title} — Cats Can Dance`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        type="article"
        keywords={keywords}
        jsonLd={[articleLd, faqLd]}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <article className="pt-28 md:pt-32 pb-16">
          <div className="container max-w-3xl">
            <Breadcrumbs
              items={[
                { label: "Home", to: "/" },
                { label: "Blog", to: "/blog" },
                { label: post.title },
              ]}
            />
            <span className="inline-block bg-ink text-cream text-xs font-bold px-3 py-1 mb-4">{post.category || post.tag}</span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-ink mb-4 leading-[0.95] break-words">{post.title}</h1>
            {(() => {
              const authorSlugMap: Record<string, string> = {
                "the pack": "the-pack",
                "param minhas": "param-minhas",
                "satwik harisenany": "satwik-harisenany",
                "cats can dance": "the-pack",
              };
              const authorSlug = authorSlugMap[(post.author || "").toLowerCase().trim()];
              return (
                <p className="font-display text-ink/70 text-sm mb-1">
                  {post.date} ·{" "}
                  {authorSlug ? (
                    <Link to={`/authors/${authorSlug}`} className="underline decoration-2 underline-offset-2 hover:text-magenta">
                      {post.author}
                    </Link>
                  ) : (
                    post.author
                  )}
                </p>
              );
            })()}
            <p className="font-display text-ink/50 text-xs mb-8 italic">Honest, by humans, from Bangalore.</p>
            <div className="aspect-video w-full border-4 border-ink chunk-shadow-lg mb-10 overflow-hidden">
              <BlogCover title={post.title} coverTitle={post.coverTitle} category={post.category} tag={post.tag} issue={post.issue} color={post.coverColor} size="lg" className="border-0" />
            </div>

            {post.tldr && post.tldr.length > 0 && (
              <aside className="mb-10 bg-acid-yellow border-4 border-ink chunk-shadow p-5 sm:p-6">
                <p className="font-display text-ink text-xl sm:text-2xl mb-3">/ TL;DR</p>
                <ul className="space-y-2 list-none">
                  {post.tldr.map((t, i) => (
                    <li key={i} className="text-ink font-medium text-base sm:text-lg flex gap-3">
                      <span aria-hidden className="font-display text-magenta">→</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="space-y-6">
              {post.body.map((p, i) => {
                const insertPicks = post.quickPicks && i === Math.min(2, post.body.length - 1);
                const insertQuote = post.pullQuote && i === Math.min(Math.floor(post.body.length / 2), post.body.length - 1);
                return (
                  <div key={i} className="space-y-6">
                    <p
                      className="text-ink/85 font-medium text-base sm:text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: p.replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink">$1</strong>'),
                      }}
                    />
                    {insertPicks && (
                      <aside className="bg-electric-blue text-cream border-4 border-ink chunk-shadow p-5 sm:p-6">
                        <p className="font-display text-acid-yellow text-base sm:text-lg mb-3">/ {post.quickPicks!.title}</p>
                        <ul className="space-y-2">
                          {post.quickPicks!.items.map((it, idx) => (
                            <li key={idx} className="font-medium text-cream/95 text-base sm:text-lg flex gap-3">
                              <span aria-hidden className="font-display text-acid-yellow">{idx + 1}.</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </aside>
                    )}
                    {insertQuote && (
                      <blockquote className="border-l-8 border-magenta pl-5 sm:pl-6 py-2 my-4">
                        <p className="font-display text-2xl sm:text-3xl md:text-4xl text-ink leading-[1.05]">
                          “{post.pullQuote}”
                        </p>
                      </blockquote>
                    )}
                  </div>
                );
              })}

              {post.whatWedSkip && (
                <aside className="mt-8 bg-magenta text-cream border-4 border-ink chunk-shadow p-5 sm:p-6">
                  <p className="font-display text-acid-yellow text-base sm:text-lg mb-2">/ WHAT WE'D SKIP</p>
                  <p className="font-medium text-cream/95 text-base sm:text-lg">{post.whatWedSkip}</p>
                </aside>
              )}

              <p className="mt-10 font-display text-ink text-sm sm:text-base border-t-4 border-ink pt-6">
                — Written by The Pack, on the floor in Bangalore.
              </p>
            </div>

            {/* Take it further — internal linking */}
            <aside className="mt-12 bg-cream border-4 border-ink chunk-shadow p-5 sm:p-6">
              <p className="font-display text-magenta text-base sm:text-lg mb-4">/ TAKE IT FURTHER</p>
              <ul className="grid gap-3 sm:grid-cols-3">
                {takeFurther.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="block bg-acid-yellow border-4 border-ink p-4 hover:-translate-y-1 hover:translate-x-1 transition-transform h-full"
                    >
                      <p className="font-display text-ink text-base sm:text-lg leading-tight mb-1">
                        {l.label} →
                      </p>
                      <p className="text-ink/70 text-xs sm:text-sm font-medium">{l.desc}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>

            {related.length > 0 && (
              <aside className="mt-16 pt-10 border-t-4 border-ink">
                <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">/ READ NEXT</h2>
                <ul className="grid gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        to={`/blog/${r.slug}`}
                        className="block bg-cream border-4 border-ink chunk-shadow p-4 hover:-translate-y-1 hover:translate-x-1 transition-transform h-full"
                      >
                        <span className="inline-block bg-ink text-cream text-[10px] font-bold px-2 py-0.5 mb-2">
                          {r.tag}
                        </span>
                        <p className="font-display text-ink text-lg leading-tight mb-1">{r.title}</p>
                        <p className="text-ink/70 text-xs font-medium line-clamp-2">{r.excerpt}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </article>
        <Footer />
      </main>
    </>
  );
};

export default BlogPost;
