import { Link, Navigate, useParams } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE = "https://catscandance.com";

type Author = {
  slug: string;
  name: string;
  role: string;
  bio: string[];
  city: string;
  sameAs: string[];
  expertise: string[];
};

const AUTHORS: Record<string, Author> = {
  "param-minhas": {
    slug: "param-minhas",
    name: "Param Minhas",
    role: "Co-founder, Cats Can Dance",
    city: "Bengaluru, India",
    bio: [
      "Param is a co-founder of Cats Can Dance. He builds the brand, the drops, and the long arc of how an Episode feels — from the door to the closing track.",
      "He writes about Bengaluru's underground party scene, drop culture in India, and the practical mechanics of running independent nights that don't burn out.",
    ],
    expertise: [
      "Underground dance music in Bengaluru",
      "Independent event production",
      "Drop culture & limited streetwear",
      "Brand building in India",
    ],
    sameAs: ["https://instagram.com/catscan.dance"],
  },
  "satwik-harisenany": {
    slug: "satwik-harisenany",
    name: "Satwik Harisenany",
    role: "Co-founder, Cats Can Dance",
    city: "Bengaluru, India",
    bio: [
      "Satwik is a co-founder of Cats Can Dance. He runs the floor side — booking, sound, and the room logic that makes a 300-person night feel like the right one.",
      "His writing is grounded in years of being on the dance floor in Bengaluru, plugging in cables before doors and listening to mixes nobody asked him to listen to.",
    ],
    expertise: [
      "DJ booking & curation",
      "Sound system & room design",
      "House, techno, garage, drum & bass",
      "Bangalore nightlife venues",
    ],
    sameAs: ["https://instagram.com/catscan.dance"],
  },
  "the-pack": {
    slug: "the-pack",
    name: "The Pack",
    role: "Cats Can Dance editorial",
    city: "Bengaluru, India",
    bio: [
      "The Pack is the collective byline for Cats Can Dance — co-founders Param Minhas and Satwik Harisenany, plus the residents and friends who run the floor and the drops.",
      "Posts under this name are written by people who were actually in the room.",
    ],
    expertise: [
      "Bengaluru underground music",
      "RSVP-only event culture",
      "Limited streetwear drops",
    ],
    sameAs: ["https://instagram.com/catscan.dance", "https://www.youtube.com/@thesecatscandance"],
  },
};

const AuthorProfile = () => {
  const { slug = "" } = useParams();
  const author = AUTHORS[slug];
  if (!author) return <Navigate to="/blog" replace />;

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: author.role,
    url: `${SITE}/authors/${author.slug}`,
    worksFor: { "@type": "Organization", name: "Cats Can Dance", url: SITE },
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" },
    knowsAbout: author.expertise,
    sameAs: author.sameAs,
    description: author.bio[0],
  };

  return (
    <>
      <SEO
        title={`${author.name} — ${author.role} | Cats Can Dance`}
        description={author.bio[0]}
        path={`/authors/${author.slug}`}
        jsonLd={[personLd]}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <article className="pt-28 md:pt-32 pb-16">
          <div className="container max-w-3xl">
            <Breadcrumbs
              items={[
                { label: "Home", to: "/" },
                { label: "Authors" },
                { label: author.name },
              ]}
            />
            <span className="inline-block bg-magenta text-cream text-xs font-bold px-3 py-1 mb-4">AUTHOR</span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-ink mb-3 leading-[0.95] break-words">
              {author.name}
            </h1>
            <p className="font-display text-ink/70 text-base sm:text-lg mb-1">{author.role}</p>
            <p className="font-display text-ink/50 text-sm mb-8">{author.city}</p>

            <div className="space-y-5 mb-10">
              {author.bio.map((p, i) => (
                <p key={i} className="text-ink/85 font-medium text-base sm:text-lg leading-relaxed">{p}</p>
              ))}
            </div>

            <aside className="bg-acid-yellow border-4 border-ink chunk-shadow p-5 sm:p-6 mb-8">
              <p className="font-display text-ink text-lg mb-3">/ KNOWS ABOUT</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {author.expertise.map((e) => (
                  <li key={e} className="font-medium text-ink text-base flex gap-2">
                    <span aria-hidden className="text-magenta">→</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="flex flex-wrap gap-3">
              <Link to="/blog" className="bg-ink text-cream font-display px-5 py-2 hover:bg-magenta transition-colors">
                READ THE JOURNAL →
              </Link>
              <Link to="/about" className="bg-cream text-ink font-display px-5 py-2 border-4 border-ink hover:bg-acid-yellow">
                ABOUT CCD
              </Link>
            </div>
          </div>
        </article>
        <Footer />
      </main>
    </>
  );
};

export default AuthorProfile;
