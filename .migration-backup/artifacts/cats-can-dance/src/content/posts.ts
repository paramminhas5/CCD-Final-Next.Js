// Edit this file to add/edit blog posts. Each post supports a slug, title,
// excerpt, cover color, category, optional brief coverTitle, tag, date,
// author, body and optional human-readable structure.

export type CoverColor =
  | "cream"
  | "acid-yellow"
  | "lime"
  | "magenta"
  | "electric-blue"
  | "orange";

export type Category = "GUIDES" | "CULTURE" | "ARTISTS" | "JOURNAL" | "DROPS";

export type QuickPicks = {
  title: string;
  items: string[];
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  coverColor: CoverColor;
  /** High-level category — drives the cover chip */
  category?: Category;
  /** Brief 4-7 word version of the title shown on the cover tile */
  coverTitle?: string;
  /** Optional explicit issue number; otherwise derived from index */
  issue?: number;
  tag: string;
  date: string;
  author: string;
  /** TL;DR bullets — shown at top of post */
  tldr?: string[];
  /** Sidebar quick picks block (3 named things) */
  quickPicks?: QuickPicks;
  /** Big pull-quote rendered mid-post */
  pullQuote?: string;
  /** Honest "what we'd skip" near the end */
  whatWedSkip?: string;
  body: string[];
};

const rawPosts: Post[] = [
  {
    slug: "best-underground-parties-bangalore-2026",
    title: "The Best Underground Parties in Bangalore (2026 Guide)",
    coverTitle: "Underground Parties in Bangalore",
    category: "GUIDES",
    excerpt:
      "From basements in Indiranagar to warehouses in Whitefield — a working guide to where Bangalore actually dances when the lights go down.",
    coverColor: "magenta",
    tag: "GUIDE",
    date: "JAN 14, 2026",
    author: "The Pack",
    tldr: [
      "The best Bangalore parties are 200-400 cap, RSVP-driven, and never on the front page of an aggregator.",
      "Indiranagar and CBD lean house and listening-bar; Whitefield runs the warehouse techno end.",
      "Show up early, follow promoters not venues, and skip anything with bottle-service marketing.",
    ],
    quickPicks: {
      title: "QUICK PICKS — TONIGHT",
      items: [
        "Cats Can Dance — next Episode (RSVP at /events)",
        "A small house night in CBD on the last Friday of the month",
        "An eastside warehouse takeover when the lineup hits",
      ],
    },
    pullQuote:
      "A tight room with a real system beats a stadium every time. Bangalore figured this out a decade ago.",
    whatWedSkip:
      "Anything with a 1500-rupee cover at a rooftop bar in Indiranagar before midnight, anything sold as a 'festival experience' indoors, and any 'EDM night' at a five-star hotel. Life's short.",
    body: [
      "Bangalore's underground scene runs on word of mouth. Most of the best nights aren't on a flyer — they're a screenshot, a forwarded address, a 'come through' from a friend who knows. If you're new to the city, or you've outgrown the same three rooftop bars, this is the working map.",
      "First, the obvious: Cats Can Dance Episodes. We curate 4-6 nights a year, each in a different room, each anchored by a sound system that hits and a lineup that doesn't show up on the algorithm. RSVP at /events — capacity is small on purpose.",
      "Beyond us, the rotation that matters in 2026 includes pop-up nights at unmarked spaces around CBD and South Bangalore, recurring techno hours at a handful of east-side venues, and the occasional warehouse takeover near Whitefield. The crews to watch share a few traits: they don't oversell, they care about the low-end, and they treat the floor like a co-creator.",
      "What separates Bangalore from Mumbai or Delhi is intimacy. Our best parties top out at 200-400 people. That's not a limitation — it's the format. A tight room with a real system beats a stadium every time.",
      "Genre-wise, expect a heavy spine of house and techno, with detours into UK garage, breaks, and the occasional left-field ambient afterparty. A single night might run from dub techno at 11pm to peak-time acid at 2am to a downtempo cool-down at 4am.",
      "If you want to find these nights without us writing them down: follow the right Instagram accounts, show up early to the listed parties to meet the right people, and never skip an opening set. Half the city's best DJs are warming up at 10pm to a room of twelve.",
      "And when you're ready, check the Cats Can Dance event schedule — we'll see you on the floor.",
    ],
  },
  {
    slug: "where-to-find-electronic-music-events-bangalore",
    title: "Where to Find Electronic Music Events in Bangalore",
    coverTitle: "Find Electronic Events in Bangalore",
    category: "GUIDES",
    excerpt:
      "Insider.in, Instagram, word of mouth — the actual sources Bangalore promoters use to fill rooms in 2026.",
    coverColor: "acid-yellow",
    tag: "GUIDE",
    date: "JAN 21, 2026",
    author: "The Pack",
    tldr: [
      "Insider.in for ticketed shows, RA for the international bookings, Instagram for the real pulse.",
      "Follow promoters, not venues. Venues recycle audiences; promoters curate them.",
      "Invite-only nights live in DMs. To get on those lists, show up to the public ones first.",
    ],
    quickPicks: {
      title: "WHERE TO LOOK",
      items: [
        "Insider.in — search 'Bangalore' + filter Music",
        "Instagram saved-stories folder of 10-15 promoter accounts",
        "Cats Can Dance early-access list at /#early-access",
      ],
    },
    pullQuote: "Follow promoters, not venues. Proximity is currency.",
    whatWedSkip:
      "SEO-spam 'Top 10 nightclubs in Bangalore' blogs that haven't been updated since 2022. They'll send you to a closed venue.",
    body: [
      "If you've ever Googled 'electronic music events Bangalore' you've seen the problem: the first page is mostly aggregator listings two months out of date and a few SEO-spam blogs that don't actually go to parties. Here's how the people who do, find out.",
      "Insider.in remains the strongest single ticketing source for paid electronic events in Bangalore — most established promoters list there. RA (Resident Advisor) covers a thinner slice but tends to surface the more international and underground bookings.",
      "Instagram is where the real pulse lives. Follow promoters, not venues. Venues recycle audiences; promoters curate them. A dozen accounts in your saved-stories folder will tell you more about next weekend than any listing site.",
      "Then there are the invite-only nights. These are usually small, free or pay-what-you-want, and announced 24-48 hours before doors via DM. To get on those lists you need to actually show up to the public ones first — proximity is currency.",
      "Cats Can Dance sits in the middle: our Episodes are public RSVPs (so anyone can come), but with controlled capacity (so it never feels like a paid concert). All current nights are at /events. Add yourself to the early-access list to hear about each one before it goes wider.",
      "One more thing: keep an eye on Bangalore's record stores and listening bars. They host more curated electronic events than most clubs, and the crowds skew toward people who actually care about the music.",
    ],
  },
  {
    slug: "top-event-organisers-india-dance-music",
    title: "Top 10 Event Organisers in India for Dance Music",
    coverTitle: "Top Event Organisers in India",
    category: "GUIDES",
    excerpt:
      "From Bangalore to Mumbai to Goa — the independent crews shaping India's dance music scene right now.",
    coverColor: "electric-blue",
    tag: "FEATURE",
    date: "JAN 28, 2026",
    author: "The Pack",
    tldr: [
      "India's dance music in 2026 is built on independents running 200-800 cap nights, not festivals.",
      "Bangalore, Mumbai, Delhi-NCR and Goa each have a distinct flavour and a small set of trusted operators.",
      "What unites the best is discipline about capacity and respect for openers.",
    ],
    quickPicks: {
      title: "BY CITY",
      items: [
        "Bangalore — Cats Can Dance, plus a tight rotation of techno residencies",
        "Mumbai — South Bombay and Bandra crews focused on sound + design",
        "Goa — year-round outdoor parties, Nov-Mar peak",
      ],
    },
    pullQuote:
      "What unites the best operators across cities is the same thing: discipline about capacity, and respect for the openers.",
    whatWedSkip:
      "Mega-festival 'EDM' tours that parachute in once a year and leave nothing behind. They don't build scenes; they extract from them.",
    body: [
      "India's dance music ecosystem in 2026 isn't built on festivals — it's built on independent organisers running 200-800 capacity nights, every week, in cities across the country. Here are the ones doing the work.",
      "**Bangalore:** Cats Can Dance leads the underground Episode format, focused on cult parties with curated lineups and small rooms. The city also hosts a strong rotation of techno and house promoters running monthly residencies.",
      "**Mumbai:** A handful of South Bombay and Bandra-based crews continue to dominate, anchored around a small set of venues that prioritise sound and design over capacity. Denser scene than Bangalore, more competitive on door price.",
      "**Delhi/Gurgaon:** The capital's underground has rebuilt steadily over the last three years — heavy on techno, light on house, with a growing afters culture in the western suburbs.",
      "**Goa:** Always its own ecosystem. Year-round outdoor parties and a tight rotation of villa raves keep Goa's reputation as India's electronic music heartland intact, particularly in the Nov-Mar window.",
      "**Pune, Hyderabad, Pondicherry:** Smaller scenes but real ones — each has at least one promoter consistently booking lineups that would headline anywhere in the country.",
      "What unites the best operators across cities is discipline about capacity, respect for the headliner *and* the openers, and refusal to chase trend genres that don't suit the room.",
      "Cats Can Dance's contribution to the national picture is the Episode format — RSVP-only nights with no flyer marketing, designed to read more as a community gathering than a commercial event. Read more on /about or check upcoming episodes at /events.",
    ],
  },
  {
    slug: "rsvp-culture-bangalore-party-scene",
    title: "RSVP Culture: How Bangalore's Party Scene Works",
    coverTitle: "RSVP Culture in Bangalore",
    category: "CULTURE",
    excerpt:
      "Why the best nights in Bangalore aren't sold by the ticket — and what RSVP actually means in 2026.",
    coverColor: "lime",
    tag: "ESSAY",
    date: "FEB 4, 2026",
    author: "The Pack",
    tldr: [
      "RSVP-only nights let promoters shape the room instead of just filling it.",
      "It puts a small psychological cost on attending — RSVPs get honoured, walk-ins ghost.",
      "It sidesteps the 1500-rupee-cover, overpriced-cocktail Bangalore club economy entirely.",
    ],
    quickPicks: {
      title: "HOW TO RSVP RIGHT",
      items: [
        "Reply early — most lists fill in 24 hours",
        "If you're in, show up. Ghosting kills lists",
        "Bring one friend, not five",
      ],
    },
    pullQuote: "It's not exclusive in a snobbish way. It's exclusive in the practical sense that 250 people can't fit a thousand.",
    whatWedSkip:
      "RSVP nights that actually charge 800 at the door 'for cover'. That's just a slow ticket sale dressed in cooler clothes.",
    body: [
      "Walk into the wrong Bangalore club at 1am and you'll find 600 people who paid 1500 rupees to feel nothing. Walk into the right room and you'll find 200 people who replied to an email. The difference is RSVP culture.",
      "RSVP — request, then maybe receive — is how most of the city's best nights run now. You don't buy a ticket. You submit your name, your email, sometimes a sentence on why. The promoter curates a guest list. Doors are tighter than the room. Nothing about it is exclusive in a snobbish way; it's exclusive in the practical sense that a 250-cap room cannot hold a thousand people without losing the thing that made it worth attending.",
      "Why does this work? Three reasons. One: it lets the promoter shape the room. A floor with the right energy is half the night, and the wrong twenty people can sink it. Two: it puts a small psychological cost on attending — if you replied, you show up. Three: it sidesteps the awful Bangalore club economy where the door price doubles by midnight and the bar makes back its margin on overpriced cocktails.",
      "Cats Can Dance has run on RSVP since Episode 01. Free, capacity-limited, name-on-the-door. We've never sold a ticket and we don't intend to. The model isn't anti-commercial — it's pro-room.",
      "If you want in, the RSVP for the next Episode is at /events. If we're full, you go on the next-edition list. We rotate venues so the audience rotates with us — which keeps the room honest.",
    ],
  },
  {
    slug: "guide-techno-house-nights-bangalore",
    title: "A Guide to Techno & House Nights in Bangalore",
    coverTitle: "Techno & House Nights, Bangalore",
    category: "GUIDES",
    excerpt:
      "Where the city actually plays techno and house in 2026 — by tempo, by neighbourhood, by what time you should arrive.",
    coverColor: "orange",
    tag: "GUIDE",
    date: "FEB 11, 2026",
    author: "The Pack",
    tldr: [
      "House nights in Bangalore start at 10-11pm; techno peaks around 2am.",
      "Indiranagar / CBD lean house. Whitefield / east is where techno lives.",
      "Trust the curve. Arrive at doors and stay through the opening set.",
    ],
    quickPicks: {
      title: "TIME IT RIGHT",
      items: [
        "House — doors 10pm, peak 12-1am",
        "Techno — doors 11pm, peak 2am, afters past 4",
        "Episode nights — slow build all night, peak around 1.30",
      ],
    },
    pullQuote: "The DJs putting Bangalore on the map didn't get there by playing for the people who showed up at 1:30am.",
    whatWedSkip:
      "Self-described 'tech-house' nights at hookah bars. They are neither tech nor house, and the air quality will end you.",
    body: [
      "Bangalore's techno and house scenes share DJs but rarely share rooms. Here's how the two worlds split across the city in 2026, and how to navigate them.",
      "**House nights** in Bangalore tend to start earlier (10-11pm), live in smaller rooms (150-300 capacity), and lean toward deep, soulful, and disco-tinged selections. The crowd usually skews 25-35, the bar gets used more than the smoking area, and dancing is the default — not the exception.",
      "**Techno nights** push later (11pm-12am doors, peak hour around 2am), occupy bigger rooms when the lineup deserves it, and run a tempo range from 128 BPM dub techno to 145+ BPM peak-time and rave revivals. Crowds are mixed but the regulars are committed.",
      "Neighbourhoods matter. Indiranagar and the CBD host most of the listening-bar and house-leaning nights. Whitefield and the eastern suburbs are where you'll find the warehouse-style techno parties. Pockets of South Bangalore have started doing genre-fluid takeovers in 2025/26 that defy the geography.",
      "Cats Can Dance Episodes blur the line on purpose — most of our nights run a slow build from house into peak-time techno across the night, with one back-to-back as a centrepiece. We pick rooms that suit the format. Schedule is at /events.",
      "If you want to time it right: arrive when doors open, stay through the opening set, and trust the room's curve.",
    ],
  },
  {
    slug: "behind-the-decks-bangalore-rising-djs",
    title: "Behind the Decks: Bangalore's Rising DJs",
    coverTitle: "Bangalore's Rising DJs",
    category: "ARTISTS",
    excerpt:
      "Six artists from Bangalore reshaping how the city sounds at 2am — and where to catch them next.",
    coverColor: "cream",
    tag: "ARTISTS",
    date: "FEB 18, 2026",
    author: "The Pack",
    tldr: [
      "A new generation of Bangalore DJs went from living-room openers to national headliners in three years.",
      "The most exciting acts to book are hybrid live/DJ artists running hardware on the fly.",
      "The openers are the secret heart of the scene. Show up at doors.",
    ],
    quickPicks: {
      title: "WHAT TO LISTEN FOR",
      items: [
        "Crate diggers — monthly mixes built from records you've never heard",
        "Hybrid live acts — hardware + DJ improv",
        "Genre-fluid headliners — disco to peak-time without losing the room",
      ],
    },
    pullQuote: "The artists whose 11pm sets are the secret heart of the scene.",
    whatWedSkip:
      "DJs whose entire identity is a Boiler Room booking from three years ago. The set was great. The set is also the past.",
    body: [
      "The list of DJs you should know in Bangalore in 2026 is longer than it was in 2022. The city has produced a generation of selectors who came up playing opening sets in living rooms and now headline rooms across India. Here's a partial map.",
      "We're not naming names individually in this piece — we'll let the bookings on /events speak. But the archetypes are worth identifying, because they tell you something about where the scene is heading.",
      "**The crate diggers.** Two or three artists in the city are putting out monthly mixes built around records most people in India have never heard. Their sets are educational without ever feeling like a lecture. If you go home wanting to Shazam ten things, you've heard one of them.",
      "**The hybrid live acts.** Not pure DJ sets, not full live shows — a small handful of Bangalore artists are running improvised hardware-and-DJ hybrids that blur the line. These are the most exciting Episodes for us to book.",
      "**The genre fluid headliners.** A few names can credibly close a night that ran from disco to peak-time techno without losing the room. They're rare globally and Bangalore has a couple.",
      "**The openers who deserve headline slots.** Probably the most important category — the artists whose 11pm sets are the secret heart of the scene. Cats Can Dance has built more than one Episode around a 90-minute opener.",
    ],
  },
  {
    slug: "inside-episode-01",
    title: "Inside Episode 01: How Bangalore Showed Up",
    coverTitle: "Inside Episode 01",
    category: "JOURNAL",
    excerpt:
      "No flyer, no ads, just a whisper. Here's what happened when Cats Can Dance dropped its first night in Bangalore.",
    coverColor: "magenta",
    tag: "JOURNAL",
    date: "MAY 12, 2025",
    author: "The Pack",
    tldr: [
      "Episode 01 had no flyer, no ad spend, and no headliner. Bangalore filled the room anyway.",
      "The opening b2b ran 90 minutes long. Nobody complained.",
      "Three lessons: humans want human nights, tight rooms beat big ones, the cats can dance.",
    ],
    pullQuote: "People are starving for nights that feel like they were made by humans, not algorithms.",
    whatWedSkip:
      "Calling it a 'launch'. It wasn't a launch, it was a stress test. Launches are for products. This was for the room.",
    body: [
      "We didn't print a flyer. We didn't run an ad. We told twenty people the address two hours before doors, and asked them to bring one friend each. By midnight the room was full and the floor was a blur.",
      "Episode 01 was less an event and more a stress test — could a city this loud about its scene actually show up for something brand new, with no headliner, no genre tag, and no promises beyond a sound system that hits? Bangalore answered fast.",
      "The opening b2b ran ninety minutes longer than planned. Nobody noticed. The bar ran out of one specific drink at 1:14am and somebody made a TikTok about it. Two strangers swapped jackets. A cat-eared kid in the back kept yelling 'one more' until we played one more.",
      "We learned three things. One: people are starving for nights that feel like they were made by humans, not algorithms. Two: a tight room beats a big room every time. Three: the cats can, in fact, dance.",
      "Episode 02 is being built right now. Same energy, more space, better low-end. RSVP locks your spot — capacity will be tighter than you think.",
    ],
  },
  {
    slug: "streetwear-drop-cats-can-dance",
    title: "Inside the Cats Can Dance Streetwear Drop",
    coverTitle: "Inside the Streetwear Drop",
    category: "DROPS",
    excerpt:
      "How a Bangalore streetwear label turns a music night into a wearable archive — limited drops, cat graphics, no restocks.",
    coverColor: "electric-blue",
    tag: "STREETWEAR",
    date: "FEB 25, 2026",
    author: "The Pack",
    tldr: [
      "Each capsule is tied to one Episode and lives the week of the party.",
      "Under 100 units per SKU. No restocks. Heavyweight cotton, screen-printed in Bangalore.",
      "The cat is the spine of every graphic — sometimes literal, sometimes abstract.",
    ],
    quickPicks: {
      title: "ANATOMY OF A DROP",
      items: [
        "1 tee + 1 hoodie + occasional cap or longsleeve",
        "Tied to a specific Episode date and visual identity",
        "Listed the week of the party, retired when sold",
      ],
    },
    pullQuote: "Scarcity protects the meaning. Every piece in the wild is a flag.",
    whatWedSkip:
      "Sales, restocks, discount codes. We'd rather a piece sit in our archive than dilute the model.",
    body: [
      "Cats Can Dance isn't just a Bangalore party brand — it's a streetwear label that drops limited collections tied to specific Episodes. Each piece is a wearable archive of the night it came out of, and once a drop sells through, it doesn't come back.",
      "The format is simple and old-school. We design a small capsule — usually a tee, a hoodie, sometimes a longsleeve and a cap — around the visual identity of the next Episode. Quantities are deliberately low (often under 100 units per SKU). We list it the week of the party. Whatever sells, sells. Whatever doesn't, gets retired.",
      "Why limited? The same reason our parties are RSVP-only: scarcity protects the meaning. Every Cats Can Dance piece in the wild is a flag — a way of saying 'I was in that room' or 'I follow what this brand actually does'. Mass-printing the same logo tee every quarter dilutes that. We'd rather sell out small than discount big.",
      "Materials matter. Every drop is heavyweight cotton, screen-printed in Bangalore by people we know. We pay properly for the labour, we don't cut corners on the print, and we'd rather skip a drop than ship something we wouldn't wear ourselves.",
      "Graphically, the spine is the cat. Sometimes a literal cat (the Cats Can Dance mascot, drawn in our brutalist house style) and sometimes more abstract — a paw, a silhouette, a slogan reworking the name. The constraint forces creativity, and it makes every piece instantly recognisable to anyone who knows the brand.",
      "If you've never grabbed a piece, head to /shop. Sign up to early-access at /#early-access for first dibs on the next one.",
    ],
  },
  {
    slug: "music-merch-collectibles-india",
    title: "The Rise of Music Merch as Collectibles in India",
    coverTitle: "Music Merch as Collectibles",
    category: "CULTURE",
    excerpt:
      "Why a 2026 hoodie from a Bangalore party brand is the new vinyl — and how India's music merch culture finally caught up.",
    coverColor: "acid-yellow",
    tag: "CULTURE",
    date: "MAR 4, 2026",
    author: "The Pack",
    tldr: [
      "As streaming flattened recorded music, physical merch became the new identity object.",
      "India's resale market is small but growing — sold-out party drops trade at 2-3x retail.",
      "Scarcity plus context is what makes a music object a collectible.",
    ],
    quickPicks: {
      title: "WHAT TO COLLECT",
      items: [
        "First-run independent label vinyl",
        "Single-Episode party tees",
        "One-off zines and printed flyers",
      ],
    },
    pullQuote: "Scarcity plus context — these objects mean something because they came out of a specific moment in a specific scene.",
    whatWedSkip:
      "'Limited edition' tees that turn out to be limited only by demand. If they restock when it sells, it wasn't limited.",
    body: [
      "Five years ago, music merch in India meant a tour t-shirt at a stadium gig and not much else. In 2026, the most-traded music collectibles in the country are limited drops from independent labels and party brands — and Bangalore is in the middle of it.",
      "The shift mirrors what happened globally a decade ago. As streaming flattened the value of recorded music, artists and labels rebuilt their identity around physical objects: vinyl, cassettes, books, and merch. In India, the gap between releasing music and being able to sell anything tangible used to be huge. Now it's closing fast.",
      "What counts as a music collectible in India today? A pressing of an Indian electronic record on coloured vinyl. A first-run Cats Can Dance Episode tee. A festival enamel pin from a one-off rooftop show. A zine printed in 200 copies. A cap from a sound system collective that never made another. The unifying thread is scarcity plus context.",
      "The resale market is small but growing. Indian buyers are starting to track second-hand listings on Instagram and Telegram channels the way collectors used to track record fairs. Pricing is informal but real: a sold-out Bangalore party hoodie can trade at 2-3x its retail price within months.",
      "Cats Can Dance leans into this on purpose. Every drop has a date, a story, and a tied-back Episode. We don't restock. We don't run sales. The goal isn't volume — it's making things that hold their meaning ten years from now, the same way a 1995 rave flyer or a 2008 boiler room poster does today.",
    ],
  },
  {
    slug: "bangalore-underground-brands-cult",
    title: "How Bangalore's Underground Brands Build Cult Followings",
    coverTitle: "Building Cult Followings",
    category: "CULTURE",
    excerpt:
      "From RSVP nights to limited streetwear drops — the playbook independent Bangalore brands are using to build real loyalty.",
    coverColor: "lime",
    tag: "CULTURE",
    date: "MAR 11, 2026",
    author: "The Pack",
    tldr: [
      "Pick a tribe and stay loyal. Specificity beats reach.",
      "Treat scarcity as a feature, not a bug. RSVP nights, limited drops, no restocks.",
      "Compound — don't chase virality. A drop a quarter beats one viral month.",
    ],
    quickPicks: {
      title: "FIVE-MOVE PLAYBOOK",
      items: [
        "Define a precise tribe",
        "Build identity into every touchpoint",
        "Talk to your audience in DMs, not ads",
      ],
    },
    pullQuote: "Most cult brands don't blow up. They compound.",
    whatWedSkip:
      "Influencer 'partnerships' that flatten the brand into one more sponsored carousel. The cult dies the moment the brand sounds like everyone else.",
    body: [
      "There's a specific kind of brand emerging out of Bangalore right now. Small. Independent. Music-adjacent. Wildly loyal audience. They sell out drops in hours, fill rooms with no flyer, and outperform companies ten times their size on cultural relevance. Here's what they all do.",
      "**One: they pick a tribe and stay loyal.** The best Bangalore underground brands don't try to be for everybody. They pick a sound, a scene, an aesthetic, and they go deep. Cats Can Dance is for people who like dance music and cats, and that's not a joke — that's a precise audience definition.",
      "**Two: they treat scarcity as a feature, not a bug.** RSVP-only parties. Limited drops. No restocks. No discount codes. Scarcity isn't a marketing trick — it's the entire economic model.",
      "**Three: they over-invest in identity.** Visual language, copy, music selection, room design — every touchpoint reinforces the brand. That coherence is what builds cult loyalty over time.",
      "**Four: they show up consistently.** Most cult brands don't blow up. They compound. A drop a quarter, a party every other month, a blog post a week.",
      "**Five: they keep the loop tight.** Bangalore's best underground brands sell directly to their audience, talk to them in DMs, get feedback after every drop, and adjust. The relationship is the moat.",
    ],
  },
  {
    slug: "limited-drops-101-scarcity-sells",
    title: "Limited Drops 101: Why Scarcity Sells",
    coverTitle: "Limited Drops 101",
    category: "DROPS",
    excerpt:
      "A field guide to drop culture for India's emerging streetwear and music brands — written from inside the room.",
    coverColor: "orange",
    tag: "STREETWEAR",
    date: "MAR 18, 2026",
    author: "The Pack",
    tldr: [
      "A drop is a small, time-limited release. Make less than you'll sell. Don't restock.",
      "Scarcity sells via loss aversion, signal value, and protected margin.",
      "If you secretly restock, the audience figures it out and the model collapses.",
    ],
    quickPicks: {
      title: "STARTING SIZES",
      items: [
        "First drop: 50-150 units / SKU",
        "With audience: 100-300 / SKU",
        "Sell direct — Shopify or DM",
      ],
    },
    pullQuote: "Scarcity only works if it's real.",
    whatWedSkip:
      "Countdown overlays, fake-stock urgency bots, and 'last 3 left!' banners. They cheapen the drop and the audience can smell it.",
    body: [
      "Drop culture isn't new — Supreme has been doing it since 1994 and Japanese streetwear brands have been doing it for longer. But it took until the last few years for the model to land properly in India. This is what we've learned running it for Cats Can Dance.",
      "**What is a drop?** A drop is a small, time-limited release of a product. You make less than you think you'll sell. You list it on a fixed day. You don't restock. The drop window can be hours or weeks — usually it sells through fast or doesn't sell at all, and either is fine.",
      "**Why does scarcity sell?** Three reasons. Loss aversion (people are wired to want what they might miss). Signal value (owning something rare is a way of demonstrating taste and membership). And economics (low quantity protects margin and lets you skip the discounting cycle that destroys most apparel brands).",
      "**The trap.** Scarcity only works if it's real. If you keep restocking, if you do private discount codes, if you produce twice what you said you would, the audience figures it out fast and the model collapses. The brands that get this right hold the line — even when it costs them money in the short term.",
      "**Drop sizing for an Indian independent brand.** A reasonable starting point: 50-150 units per SKU for a first drop, 100-300 once you have an audience. Sell direct (Shopify, Instagram). Price for the audience you actually have, not the one you wish you had.",
      "**Marketing a drop.** Less is more. A drop announcement on Instagram 7 days out, a teaser 48 hours out, a launch post on the day. No discounts, no urgency-bots, no countdown overlays. The product and the brand do the work.",
      "**What we do at Cats Can Dance.** Every drop ties back to an Episode. We design the capsule with the night in mind, list it the same week, and retire whatever doesn't sell. The current drop is at /shop.",
    ],
  },
];

// Auto-assign issue numbers based on order so covers always show "№ 01"…"№ 11"
const staticPosts: Post[] = rawPosts.map((p, i) => ({
  ...p,
  issue: p.issue ?? i + 1,
}));

// ============================================================================
// AI-published posts (loaded from Lovable Cloud at runtime). The static posts
// above always render; published posts are merged in by the loader hook below.
// ============================================================================

let dynamicPosts: Post[] = [];
let mergedPosts: Post[] = staticPosts;
const subscribers = new Set<() => void>();

const rebuildMergedPosts = () => {
  mergedPosts = dynamicPosts.length > 0 ? [...dynamicPosts, ...staticPosts] : staticPosts;
};

const notify = () => {
  for (const fn of subscribers) fn();
};

/** Subscribe to dynamic-post changes. Returns an unsubscribe function. */
export const subscribePosts = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

export const setDynamicPosts = (next: Post[]) => {
  // Newest first; assign continuing issue numbers after the static ones.
  const baseIssue = staticPosts.length;
  const nextDynamicPosts = next.map((p, i) => ({
    ...p,
    issue: p.issue ?? baseIssue + next.length - i,
  }));

  const hasChanged = JSON.stringify(nextDynamicPosts) !== JSON.stringify(dynamicPosts);
  if (!hasChanged) return;

  dynamicPosts = nextDynamicPosts;
  rebuildMergedPosts();
  notify();
};

export const getAllPosts = (): Post[] => {
  return mergedPosts;
};

// Backwards-compatible default export — current code uses `posts`.
// We expose a Proxy-like getter via a function to avoid mutation issues.
export const posts: Post[] = new Proxy([] as Post[], {
  get(_t, prop) {
    const all = getAllPosts();
    return (all as any)[prop];
  },
  has(_t, prop) {
    const all = getAllPosts();
    return prop in all;
  },
  ownKeys() {
    return Reflect.ownKeys(getAllPosts());
  },
  getOwnPropertyDescriptor(_t, prop) {
    const all = getAllPosts();
    return Reflect.getOwnPropertyDescriptor(all, prop);
  },
}) as Post[];

export const getPost = (slug: string) => getAllPosts().find((p) => p.slug === slug);

export const getRelatedPosts = (slug: string, limit = 3) =>
  getAllPosts().filter((p) => p.slug !== slug).slice(0, limit);
