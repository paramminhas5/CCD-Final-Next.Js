// Static scene data for city pages, global scene pages, and genre pages.

export type CityScene = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string; // tailwind bg class
  textColor: string;
  activeGenres: string[];
  keyVenues: string[];
  starterPlaylistEmbed: string | null; // YouTube embed ID
};

export const CITY_SCENES: CityScene[] = [
  {
    slug: "bengaluru",
    name: "Bengaluru",
    tagline: "India's underground capital.",
    description:
      "Bengaluru's underground started in basements and rooftops and never looked back. The city runs on House, Disco, Jungle and Drum & Bass — genres that reward patience and curiosity. Bar Wild in Indiranagar is its beating heart; Cats Can Dance its loudest voice.",
    accentColor: "bg-electric-blue",
    textColor: "text-cream",
    activeGenres: ["House", "Disco", "Jungle", "Drum & Bass", "Garage", "Techno"],
    keyVenues: ["Bar Wild", "Skyye", "The Humming Tree", "Plan B"],
    starterPlaylistEmbed: null,
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    tagline: "South Bombay selectors and Bandra rooftops.",
    description:
      "Mumbai's scene splits across Bandra's rooftop parties, Byculla warehouse nights and South Bombay jazz-inflected selector sets. Techno found its footing here first; House and Afro followed. The city has deep Boiler Room history and a growing roster of internationally bookable artists.",
    accentColor: "bg-magenta",
    textColor: "text-cream",
    activeGenres: ["Techno", "House", "Afro House", "Minimal", "Experimental"],
    keyVenues: ["antiSOCIAL", "Kitty Su", "Trilogy", "The Cove"],
    starterPlaylistEmbed: null,
  },
  {
    slug: "delhi",
    name: "Delhi",
    tagline: "The capital of Indian Techno.",
    description:
      "Delhi is where Indian techno was born. Kohra, Sandunes, and a generation of selectors built a scene defined by restraint and depth. The city's nights run late, its crowds are discerning, and its artists are the most internationally connected in the country.",
    accentColor: "bg-ink",
    textColor: "text-cream",
    activeGenres: ["Techno", "Minimal", "Industrial", "Ambient", "House"],
    keyVenues: ["Auro Kitchen & Bar", "Misfits", "Summer House Cafe", "PCO"],
    starterPlaylistEmbed: null,
  },
  {
    slug: "goa",
    name: "Goa",
    tagline: "Where it all started for Indian electronic music.",
    description:
      "Goa Trance isn't a niche — it's an origin story. The beaches and forests of North Goa gave birth to a psychedelic sound that circled the globe. Today, the state hosts some of India's biggest festivals (Sunburn, Magnetic Fields' sibling events) alongside intimate jungle parties that carry the original spirit.",
    accentColor: "bg-lime",
    textColor: "text-ink",
    activeGenres: ["Goa Trance", "Psytrance", "Techno", "Ambient", "World"],
    keyVenues: ["Hilltop", "Curlies", "Club Cabana", "Nyex Beach Club"],
    starterPlaylistEmbed: null,
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    tagline: "The city that gave the world Nikki Nair.",
    description:
      "Hyderabad's electronic music scene punches above its weight. Home to Nikki Nair (Boiler Room Hyderabad, 2022), the city has a growing underground following and a tech-savvy crowd that discovered dance music through YouTube rabbit holes and is now building real venues and communities.",
    accentColor: "bg-orange",
    textColor: "text-ink",
    activeGenres: ["Techno", "Breakbeat", "Electro", "House"],
    keyVenues: ["10D", "Plan B", "Tito's"],
    starterPlaylistEmbed: null,
  },
  {
    slug: "pune",
    name: "Pune",
    tagline: "Student energy meets serious selector culture.",
    description:
      "Pune's large student population and proximity to Mumbai creates a unique energy — a city that's always been willing to try something different. Promoters here take risks; the crowd follows. A strong live electronics scene sits alongside the DJ culture.",
    accentColor: "bg-acid-yellow",
    textColor: "text-ink",
    activeGenres: ["House", "Techno", "Live Electronics", "Funk", "Disco"],
    keyVenues: ["High Spirits", "Elephant & Co", "Hard Rock Cafe"],
    starterPlaylistEmbed: null,
  },
];


// ─── Global Scenes ────────────────────────────────────────────────────────────

export type GlobalScene = {
  slug: string;
  name: string;
  city: string;
  decade: string;
  tagline: string;
  origin: string;
  indiaConnection: string;
  keyArtists: string[];
  starterTracks: { title: string; artist: string; youtubeId: string }[];
  accentColor: string;
  textColor: string;
  bpm: string;
  relatedGenres: string[];
};

export const GLOBAL_SCENES: GlobalScene[] = [
  {
    slug: "detroit-techno",
    name: "Detroit Techno",
    city: "Detroit, USA",
    decade: "1980s",
    tagline: "Machines and soul in a post-industrial city.",
    origin:
      "Detroit Techno was born in the mid-80s from three Black teenagers — Juan Atkins, Derrick May, and Kevin Saunderson — who fed Kraftwerk, funk and the bleakness of a city gutted by deindustrialisation into synthesisers and drum machines. The result was hypnotic, mechanical, deeply human.",
    indiaConnection:
      "Delhi's techno scene is the most direct descendant of Detroit in India. Kohra's minimalist, industrial sets trace a clear line back to Atkins' Model 500. Several Indian artists have played Movement Festival in Detroit.",
    keyArtists: ["Juan Atkins", "Derrick May", "Kevin Saunderson", "Underground Resistance", "Jeff Mills"],
    starterTracks: [
      { title: "No UFOs", artist: "Model 500", youtubeId: "SHMaEa4Mj7c" },
      { title: "Strings of Life", artist: "Derrick May", youtubeId: "8dIDmYkTBLk" },
      { title: "Good Life", artist: "Inner City", youtubeId: "k4jk7vw7KFc" },
    ],
    accentColor: "bg-ink",
    textColor: "text-cream",
    bpm: "130–145",
    relatedGenres: ["Techno", "Industrial Techno", "Electro"],
  },
  {
    slug: "chicago-house",
    name: "Chicago House",
    city: "Chicago, USA",
    decade: "1980s",
    tagline: "Four-to-the-floor gospel from the Midwest.",
    origin:
      "House music was born in Chicago's Warehouse club under DJ Frankie Knuckles in the late 70s/early 80s. It married the 4/4 kick of disco with synthesised basslines, Roland 808s and the emotional intensity of gospel. It was Black, queer, working-class music made in spite of everything.",
    indiaConnection:
      "Chicago House is the backbone of India's underground. Virtually every Indian selector who isn't playing techno is playing some branch of House — Deep, Tech, Soulful — that roots back to Chicago. Bengaluru's scene runs on it.",
    keyArtists: ["Frankie Knuckles", "Larry Heard", "Marshall Jefferson", "Jesse Saunders", "Larry Levan"],
    starterTracks: [
      { title: "Your Love", artist: "Frankie Knuckles", youtubeId: "rBOA2Kk0oBc" },
      { title: "Can You Feel It", artist: "Larry Heard", youtubeId: "P2JgFVH3-Cs" },
      { title: "Move Your Body", artist: "Marshall Jefferson", youtubeId: "O3UJaYAR3BI" },
    ],
    accentColor: "bg-acid-yellow",
    textColor: "text-ink",
    bpm: "120–130",
    relatedGenres: ["House", "Deep House", "Tech House", "Soulful House"],
  },
  {
    slug: "london-jungle",
    name: "London Jungle / Drum & Bass",
    city: "London, UK",
    decade: "1990s",
    tagline: "170 BPM. South London. Never slowing down.",
    origin:
      "Jungle emerged from London's rave scene in the early 90s — a collision of Jamaican sound system culture, breakbeat hardcore and reggae that Black and mixed-heritage youth in South and East London made their own. It became Drum & Bass; the energy never changed.",
    indiaConnection:
      "Bengaluru has India's most passionate D&B and Jungle community, anchored by Cats Can Dance. The link is cultural as well as musical — India's sound system culture and Jungle's Jamaican roots share a spiritual DNA.",
    keyArtists: ["Goldie", "LTJ Bukem", "Grooverider", "Fabio", "4hero", "DJ Hype"],
    starterTracks: [
      { title: "Inner City Life", artist: "Goldie", youtubeId: "gXXFbsB1koo" },
      { title: "Horizons", artist: "LTJ Bukem", youtubeId: "u-fJADVAqKc" },
      { title: "Mr Kirk's Nightmare", artist: "4hero", youtubeId: "FT1pQUFnQCs" },
    ],
    accentColor: "bg-lime",
    textColor: "text-ink",
    bpm: "160–180",
    relatedGenres: ["Jungle", "Drum & Bass", "Liquid DnB", "Neurofunk"],
  },
  {
    slug: "berlin-techno",
    name: "Berlin Techno",
    city: "Berlin, Germany",
    decade: "1990s",
    tagline: "Post-wall. Industrial. All night. No cameras.",
    origin:
      "When the Berlin Wall fell in 1989, empty factories and bunkers became clubs. Tresor, Berghain, Watergate — institutions built in the ruins of a divided city. Berlin Techno is harder, longer, more industrial than Detroit's original. It invented club culture as a 12-hour devotional practice.",
    indiaConnection:
      "Berlin is the finishing school for Indian artists who've broken through. Kohra, Sandunes and others have played Tresor and Berghain residencies. The Berlin template — late nights, serious crowds, no phones — is what serious Indian promoters aspire to recreate.",
    keyArtists: ["Berghain residents", "Marcel Dettmann", "Ben Klock", "Surgeon", "DVS1"],
    starterTracks: [
      { title: "Cascade", artist: "Marcel Dettmann", youtubeId: "8GVFPuBYa4c" },
      { title: "Accelerator", artist: "Ben Klock", youtubeId: "oNvqIh6H8rY" },
    ],
    accentColor: "bg-ink",
    textColor: "text-cream",
    bpm: "136–145",
    relatedGenres: ["Techno", "Industrial Techno", "Dark Techno"],
  },
  {
    slug: "uk-garage",
    name: "UK Garage",
    city: "London, UK",
    decade: "1990s",
    tagline: "Pitched-up vocals, shuffled beats, late-night energy.",
    origin:
      "UK Garage emerged from London's pirate radio stations in the mid-90s — a British reinterpretation of US house and R&B that got faster, more syncopated, and distinctly South London. It gave birth to Grime and Dubstep and never really went away.",
    indiaConnection:
      "UK Garage is a growing sound in Bengaluru and Mumbai, introduced through CCD nights and Bengaluru selectors who tracked UK pirate radio from afar. Its syncopated rhythms resonate strongly with Indian music's own polyrhythmic traditions.",
    keyArtists: ["Todd Edwards", "MJ Cole", "DJ EZ", "Artful Dodger", "Craig David"],
    starterTracks: [
      { title: "Re-Rewind", artist: "Artful Dodger ft. Craig David", youtubeId: "mRfSM-0jBiM" },
      { title: "Sincere", artist: "MJ Cole", youtubeId: "3zPBbTz1xkA" },
    ],
    accentColor: "bg-electric-blue",
    textColor: "text-cream",
    bpm: "130–135",
    relatedGenres: ["UK Garage", "Grime", "Bassline", "2-Step"],
  },
  {
    slug: "nyc-house",
    name: "New York House",
    city: "New York, USA",
    decade: "1980s–90s",
    tagline: "Paradise Garage. Larry Levan. The church of dance.",
    origin:
      "If Chicago invented house, New York elevated it into a religion. Larry Levan's Paradise Garage was the cathedral — a place where Black and Latino gay men danced all night to music that was equal parts joy and survival. NYC house is warmer, more gospel-influenced, more emotional than its Chicago cousin.",
    indiaConnection:
      "Soulful and vocal House — the New York tradition — is popular in Mumbai and Pune. The city's cosmopolitan crowd connects with the warmth and emotional depth that defines the NYC sound.",
    keyArtists: ["Larry Levan", "François Kevorkian", "Masters At Work", "Todd Terry", "Louie Vega"],
    starterTracks: [
      { title: "The Basement", artist: "Kenny Dope presents The Bucketheads", youtubeId: "MQiWqSmNOdw" },
      { title: "Work", artist: "Masters At Work", youtubeId: "hT4e-1W-Ys8" },
    ],
    accentColor: "bg-magenta",
    textColor: "text-cream",
    bpm: "120–128",
    relatedGenres: ["Soulful House", "Vocal House", "Deep House", "Garage"],
  },
  {
    slug: "goa-trance",
    name: "Goa Trance",
    city: "Goa, India",
    decade: "1980s–90s",
    tagline: "India's own genre that circled the globe.",
    origin:
      "Goa Trance is the only electronic music genre to originate in India. It grew from the hippie-trail beach parties of North Goa in the 80s — Western travellers bringing synthesisers and drum machines, fusing them with Indian spirituality and the trance-inducing qualities of traditional ritual music. By the 90s it had spawned Psytrance worldwide.",
    indiaConnection:
      "This is India's contribution to global electronic music. The legacy lives on in Goa's festival circuit, in Indian psytrance artists touring globally, and in the spiritual approach to club culture that distinguishes Indian underground from its Western counterparts.",
    keyArtists: ["Astral Projection", "Man With No Name", "Juno Reactor", "Infected Mushroom", "Shpongle"],
    starterTracks: [
      { title: "Trust in Trance", artist: "Astral Projection", youtubeId: "SPlSZPsepbI" },
      { title: "Outside the Asylum", artist: "Man With No Name", youtubeId: "dFtmFkAVA80" },
    ],
    accentColor: "bg-lime",
    textColor: "text-ink",
    bpm: "145–160",
    relatedGenres: ["Goa Trance", "Psytrance", "Forest", "Full-On"],
  },
];


// ─── Genre Pages ──────────────────────────────────────────────────────────────

export type GenrePage = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  bpm: string;
  origin: string;
  originDecade: string;
  indianScene: string;
  keyIndianArtists: string[];
  globalLandmarks: string[];
  starterTracks: { title: string; artist: string; youtubeId: string }[];
  accentColor: string;
  textColor: string;
  relatedGlobalScene: string | null;
};

export const GENRE_PAGES: GenrePage[] = [
  {
    slug: "techno",
    name: "Techno",
    tagline: "Repetition as transcendence.",
    description:
      "Techno is the most minimalist and hypnotic of all electronic music genres. Built on relentless 4/4 kick drums, synthesised basslines and industrial textures, it was designed to induce a trance-like state on crowded dance floors. It rewards patience — the pay-off comes after twenty minutes.",
    bpm: "130–150",
    origin: "Detroit, USA",
    originDecade: "1980s",
    indianScene:
      "Delhi is the capital of Indian techno, built on artists like Kohra, Sandunes and Murthovic who play the international festival circuit. Mumbai and Bengaluru have growing techno communities with regular underground nights.",
    keyIndianArtists: ["Kohra", "Sandunes", "Murthovic", "Dobby", "Blot!"],
    globalLandmarks: ["Movement Festival Detroit", "Berghain Berlin", "Tresor Berlin", "fabric London"],
    starterTracks: [
      { title: "No UFOs", artist: "Model 500", youtubeId: "SHMaEa4Mj7c" },
      { title: "Strings of Life", artist: "Derrick May", youtubeId: "8dIDmYkTBLk" },
    ],
    accentColor: "bg-ink",
    textColor: "text-cream",
    relatedGlobalScene: "detroit-techno",
  },
  {
    slug: "house",
    name: "House",
    tagline: "Four-to-the-floor. Timeless.",
    description:
      "House music is the most democratic of all dance music genres — it welcomes everyone onto the floor. At its core: a 4/4 kick on every beat, a synthesised bassline, soulful chords and often a vocal. It came from Chicago's Black gay community and has never stopped moving.",
    bpm: "120–135",
    origin: "Chicago, USA",
    originDecade: "1980s",
    indianScene:
      "House is the most widely played genre in India's underground. From Bengaluru's basement nights to Mumbai's rooftop parties, deep house and soulful house dominate. Artists like BLOT!, Ishan Bhatt and Ankytrixx have been playing house for over a decade.",
    keyIndianArtists: ["BLOT!", "Ishan Bhatt", "Ankytrixx", "Qilla", "Hamza Rahimtula"],
    globalLandmarks: ["The Warehouse Chicago", "Paradise Garage NYC", "Fabric London", "DC-10 Ibiza"],
    starterTracks: [
      { title: "Your Love", artist: "Frankie Knuckles", youtubeId: "rBOA2Kk0oBc" },
      { title: "Can You Feel It", artist: "Larry Heard", youtubeId: "P2JgFVH3-Cs" },
    ],
    accentColor: "bg-acid-yellow",
    textColor: "text-ink",
    relatedGlobalScene: "chicago-house",
  },
  {
    slug: "jungle-dnb",
    name: "Jungle / Drum & Bass",
    tagline: "170 BPM. Never surrender.",
    description:
      "Jungle and Drum & Bass are built on the breakbeat — a looped drum break played at 160–180 BPM over deep sub-bass. Born in London from Jamaica's sound system culture, it's physically and emotionally intense. At its best, D&B produces the most energetic dance floors on the planet.",
    bpm: "160–180",
    origin: "London, UK",
    originDecade: "1990s",
    indianScene:
      "Bengaluru has India's most dedicated D&B community. Cats Can Dance was built partly around Jungle and D&B nights. A small but deeply passionate scene exists in Mumbai too.",
    keyIndianArtists: ["Subculture DJs", "MAXI", "Sequence"],
    globalLandmarks: ["Fabric Room Two London", "Metalheadz Sundays (Blue Note London)", "Hospital Records"],
    starterTracks: [
      { title: "Inner City Life", artist: "Goldie", youtubeId: "gXXFbsB1koo" },
      { title: "Horizons", artist: "LTJ Bukem", youtubeId: "u-fJADVAqKc" },
    ],
    accentColor: "bg-lime",
    textColor: "text-ink",
    relatedGlobalScene: "london-jungle",
  },
  {
    slug: "uk-garage",
    name: "UK Garage",
    tagline: "Shuffled beats and pitched vocals.",
    description:
      "UK Garage is House music refracted through a British lens — faster, more syncopated, with pitched-up R&B vocals and a distinctly London energy. It came from South London's pirate radio scene and spawned Grime and Dubstep as it evolved. The original 2-Step sound is having a global revival.",
    bpm: "130–135",
    origin: "London, UK",
    originDecade: "1990s",
    indianScene:
      "UK Garage is growing in Bengaluru and Mumbai, brought in by selectors who followed UK pirate radio. Its syncopated rhythms connect naturally with Indian music's own polyrhythmic traditions.",
    keyIndianArtists: ["Sumer Chandna", "DJ Sahil Makhija", "Pune selectors"],
    globalLandmarks: ["Ministry of Sound London", "Twice as Nice nights", "Kiss 100 FM"],
    starterTracks: [
      { title: "Re-Rewind", artist: "Artful Dodger ft. Craig David", youtubeId: "mRfSM-0jBiM" },
      { title: "Sincere", artist: "MJ Cole", youtubeId: "3zPBbTz1xkA" },
    ],
    accentColor: "bg-electric-blue",
    textColor: "text-cream",
    relatedGlobalScene: "uk-garage",
  },
  {
    slug: "disco",
    name: "Disco",
    tagline: "Before house, there was disco.",
    description:
      "Disco is the mother of all dance music. Born in New York's LGBTQ+ and Black communities in the 1970s, it gave us the 4/4 kick, the Roland 808, the DJ as artist, and the concept of the all-night dance floor. Every genre on this list is its direct descendant. It never died; it just went underground and became house.",
    bpm: "110–130",
    origin: "New York, USA",
    originDecade: "1970s",
    indianScene:
      "Disco is deeply embedded in Indian party culture — both through Bollywood's disco era and through the underground revival of classic disco and nu-disco. Mumbai and Bengaluru both have thriving disco nights.",
    keyIndianArtists: ["Hamza Rahimtula", "Noni Mouse", "The F16s (live)"],
    globalLandmarks: ["Studio 54 NYC", "Paradise Garage NYC", "The Loft NYC"],
    starterTracks: [
      { title: "I Feel Love", artist: "Donna Summer", youtubeId: "k5HWR1JGgyM" },
      { title: "Le Freak", artist: "Chic", youtubeId: "wlVDEHoJJCk" },
    ],
    accentColor: "bg-magenta",
    textColor: "text-cream",
    relatedGlobalScene: null,
  },
  {
    slug: "ambient",
    name: "Ambient",
    tagline: "Music as environment. Silence as rhythm.",
    description:
      "Ambient music is designed to be heard and ignored simultaneously — to create atmosphere rather than demand attention. Brian Eno coined the term. Its modern iterations include drone, dark ambient, and the chill-out room culture that developed alongside rave culture. In India, it intersects with devotional and meditative traditions.",
    bpm: "60–90 (or none)",
    origin: "UK / Global",
    originDecade: "1970s–80s",
    indianScene:
      "Ambient has a natural home in India given the country's deep meditation and devotional music traditions. Artists like Sandunes blur the line between ambient electronics and Indian classical.",
    keyIndianArtists: ["Sandunes", "Dualist Inquiry", "When Chai Met Toast"],
    globalLandmarks: ["chill-out rooms of early UK raves", "Kompakt label Germany"],
    starterTracks: [
      { title: "Music For Airports (1/1)", artist: "Brian Eno", youtubeId: "vNwYtllyt3Q" },
    ],
    accentColor: "bg-electric-blue",
    textColor: "text-cream",
    relatedGlobalScene: null,
  },
];
