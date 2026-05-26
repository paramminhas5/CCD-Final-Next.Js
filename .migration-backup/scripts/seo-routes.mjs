// Single source of truth for SEO-critical routes + per-route head metadata.
// Used by the build-time prerender plugin and the sitemap generator so
// canonical URLs, sitemap entries, and per-page <head> never drift apart.

export const SITE = "https://catscandance.com";

// Static (non-blog) routes. Keep this list in sync with src/App.tsx routes
// that should be indexed.
export const staticRoutes = [
  {
    path: "/",
    title: "Cats Can Dance — Bangalore Underground · Parties, Drops, Culture",
    description:
      "Cats Can Dance is Bangalore's underground crew — dance music nights, limited streetwear drops, and a culture worth showing up for. RSVP, shop, join the pack.",
    priority: "1.0",
    changefreq: "weekly",
  },
  {
    path: "/about",
    title: "About Cats Can Dance — Bangalore Underground Crew",
    description:
      "Who's behind Cats Can Dance — a Bangalore underground dance music collective and streetwear label running RSVP-only Episodes and limited drops.",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/events",
    title: "Upcoming Episodes & Underground Parties in Bangalore | Cats Can Dance",
    description:
      "Upcoming Cats Can Dance Episodes — RSVP-only underground dance music nights in Bangalore. House, techno, disco, garage, drum & bass.",
    priority: "1.0",
    changefreq: "weekly",
  },
  {
    path: "/shop",
    title: "Shop — Limited Streetwear Drops | Cats Can Dance",
    description:
      "Limited streetwear drops from Cats Can Dance — heavyweight cotton, screen-printed in Bangalore, no restocks. Shop the current drop.",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/pets",
    title: "Pet Streetwear — Cat Bandanas, Bucket Hats & Treats | Cats Can Dance",
    description:
      "Pet streetwear from Cats Can Dance — cat bandanas, bucket hats, and CCD treats. Pan-India shipping.",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/blog",
    title: "Field Notes from Bangalore's Underground | Cats Can Dance",
    description:
      "Long reads on Bangalore's party scene, apparel drops, cool culture & streetwear, and the artists behind the nights.",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/press",
    title: "Press — Cats Can Dance",
    description:
      "Press coverage, mentions, and media kit for Cats Can Dance, Bangalore's underground dance music collective and streetwear label.",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/media",
    title: "Media & Photos | Cats Can Dance",
    description:
      "Photos and media from Cats Can Dance Episodes — Bangalore underground nights and limited streetwear drops.",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/playlists",
    title: "Curator Playlists & Mixes | Cats Can Dance",
    description:
      "Mixes and playlists from Cats Can Dance residents and guests — house, techno, disco, garage, drum & bass.",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/videos",
    title: "Videos — Sets, Recaps & Footage | Cats Can Dance",
    description:
      "Sets, recaps, and footage from Cats Can Dance Episodes and the wider Bangalore underground scene.",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/cat-studio",
    title: "Cat Studio — Generate Your Own Cat | Cats Can Dance",
    description:
      "Cat Studio: generate your own Cats Can Dance cat with AI. A small playground from Bangalore's underground crew.",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    path: "/for-venues",
    title: "For Venues — Partner with Cats Can Dance",
    description:
      "Partner with Cats Can Dance to host an Episode at your venue in Bangalore. Curated nights, real sound, careful crowds.",
    priority: "0.5",
    changefreq: "yearly",
  },
  {
    path: "/for-artists",
    title: "For Artists — Play a Cats Can Dance Episode",
    description:
      "How to get booked at a Cats Can Dance Episode in Bangalore. Send a mix, send a note, and read the long version here.",
    priority: "0.5",
    changefreq: "yearly",
  },
  {
    path: "/for-investors",
    title: "For Investors — Cats Can Dance",
    description:
      "Cats Can Dance for investors — a Bangalore underground dance music brand and streetwear label scaling drop culture in India.",
    priority: "0.4",
    changefreq: "yearly",
  },
  {
    path: "/bengaluru-underground-dance-music",
    title: "The Bengaluru Underground Dance Music Guide | Cats Can Dance",
    description:
      "A working guide to Bengaluru's underground dance music scene — venues, promoters, sound, and how to actually find the nights.",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/bengaluru-techno-events",
    title: "Techno Events in Bengaluru — Venues, Promoters & Guide | Cats Can Dance",
    description:
      "A working guide to techno events in Bengaluru — the venues, the promoters, and how to find the nights that matter.",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/bengaluru-house-parties",
    title: "House Music Parties in Bengaluru — Venues & Guide | Cats Can Dance",
    description:
      "House music parties in Bengaluru — where to find them, who's playing, and the venues that book deep, soulful, and disco-leaning house.",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/authors/param-minhas",
    title: "Param Minhas — Co-founder, Cats Can Dance",
    description: "Param Minhas, co-founder of Cats Can Dance — Bengaluru underground dance music and streetwear.",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    path: "/authors/satwik-harisenany",
    title: "Satwik Harisenany — Co-founder, Cats Can Dance",
    description: "Satwik Harisenany, co-founder of Cats Can Dance — Bengaluru underground dance music and streetwear.",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    path: "/authors/the-pack",
    title: "The Pack — Cats Can Dance Editorial",
    description: "The Pack — the collective byline behind the Cats Can Dance journal in Bengaluru.",
    priority: "0.4",
    changefreq: "monthly",
  },
  {
    path: "/submit-event",
    title: "Submit an Event | Cats Can Dance",
    description:
      "Submit an underground dance music event in Bangalore to Cats Can Dance. We list things we'd actually go to.",
    priority: "0.4",
    changefreq: "monthly",
  },
  {
    path: "/privacy",
    title: "Privacy Policy | Cats Can Dance",
    description: "Privacy policy for Cats Can Dance — what we collect and why.",
    priority: "0.2",
    changefreq: "yearly",
  },
  {
    path: "/terms",
    title: "Terms of Service | Cats Can Dance",
    description: "Terms of service for Cats Can Dance.",
    priority: "0.2",
    changefreq: "yearly",
  },
  {
    path: "/cookies",
    title: "Cookies | Cats Can Dance",
    description: "Cookie policy for Cats Can Dance.",
    priority: "0.2",
    changefreq: "yearly",
  },
];
