// Shared data for PDF generation — mirrors CcdxSocialSponsor.tsx data

export const COLORS = {
  ink: "#0b0e1a",
  cream: "#e8e4dc",
  electricBlue: "#2563EB",
  acidYellow: "#a3e635",
  magenta: "#DC2626",
  lime: "#86efac",
  white: "#ffffff",
};

export const TIERS = [
  {
    name: "SERIES PARTNER",
    icon: "\u{1F43E}",
    scope: "All 3 shows + Grand Finale",
    color: COLORS.electricBlue,
    textColor: COLORS.cream,
    chipColor: COLORS.acidYellow,
    chipText: COLORS.ink,
    headline: "Be the name everyone remembers",
    deliverables: [
      "Headline logo on all event materials \u2014 posters, socials, stage",
      "Dedicated activation booth at all 3 shows + finale",
      "Stage naming rights at grand format show",
      "Co-branded content package (photo + video) from every show",
      "3 dedicated social posts + stories across CCD channels",
      "Brand mention in every RSVP confirmation email",
      "Logo on CCD website for the full season",
      "Option to co-brand the pet zone",
      "2 VIP + early access passes per show",
    ],
    bestFor: "Pet brands, lifestyle brands, beverages, outdoor brands wanting max reach",
  },
  {
    name: "SHOW SPONSOR",
    icon: "\u2726",
    scope: "One show of your choice",
    color: COLORS.magenta,
    textColor: COLORS.cream,
    chipColor: COLORS.cream,
    chipText: COLORS.ink,
    headline: "Own a single night end to end",
    deliverables: [
      "Headline logo at your chosen show",
      "Dedicated activation booth",
      "Co-branded content package from that show",
      "1 dedicated social post + stories",
      "Brand mention in that show\u2019s RSVP emails",
      "Logo on event page for the duration",
      "2 passes to the show",
    ],
    bestFor: "Local brands, product launches, grooming & nutrition brands",
  },
  {
    name: "COMMUNITY SUPPORTER",
    icon: "\u{1F33F}",
    scope: "All shows, light touch",
    color: COLORS.lime,
    textColor: COLORS.ink,
    chipColor: COLORS.ink,
    chipText: COLORS.lime,
    headline: "Show up everywhere, simply",
    deliverables: [
      "Logo across all event materials (below fold)",
      "Social tag in one round-up post per show",
      "Mention in event comms and on the website",
      "2 passes split across the season",
    ],
    bestFor: "Indie pet brands, local businesses, NGOs, community partners",
  },
];

export const SHOWS = [
  { num: "01", name: "CCDXSOCIAL 01", date: "Sun, 29 Jun 2026", tagline: "BROAD \u00B7 WELCOMING \u00B7 FIRST IMPRESSION" },
  { num: "02", name: "CCDXSOCIAL 02", date: "Sun, 27 Jul 2026", tagline: "STYLE \u00B7 FASHION \u00B7 MIDSUMMER ENERGY" },
  { num: "03", name: "CCDXSOCIAL 03", date: "Sun, 30 Aug 2026", tagline: "AGILITY \u00B7 FINALE PREVIEW \u00B7 ONE MORE" },
];

export const STATS = [
  { label: "Per show capacity", value: "~200 pax" },
  { label: "Grand finale", value: "2,000+ pax" },
  { label: "Series total reach", value: "3,000+ across 4 events" },
  { label: "Audience profile", value: "Urban 24\u201345, pet parents + electronic music fans" },
  { label: "Content output", value: "Photo + video from every show, shared with sponsors" },
];

export const WHO_SHOULD_SPONSOR = [
  "Pet food & nutrition brands",
  "Grooming & wellness brands",
  "Pet accessories & fashion",
  "Audio & lifestyle brands",
  "Beverages & F&B brands",
  "Photo & creative services",
  "Outdoor & adventure brands",
  "Pet health & supplements",
];

export const WHAT_YOU_GET = [
  { title: "On-site activation space", desc: "Your own area in the outdoor pet zone or event floor" },
  { title: "Content assets", desc: "Professional photo + video from every show you sponsor, yours to use" },
  { title: "Social reach", desc: "CCD Instagram, email newsletter, event pages \u2014 targeted pet + music fans" },
  { title: "Co-branding", desc: "Your brand alongside CCD on all materials for your shows" },
  { title: "Guest access", desc: "Passes for your team to attend and experience the events" },
  { title: "Post-event report", desc: "Attendance, content delivery, social stats \u2014 sent within a week of each show" },
];
