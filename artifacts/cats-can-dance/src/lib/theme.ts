// Cats Can Dance — design tokens & theme presets
// All colors are stored as raw HSL strings (e.g. "0 72% 51%") so they can be
// dropped straight into `hsl(var(--token))` in CSS.

export type ThemeTokens = {
  brand: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  onBrand: string;
  onSurface: string;
  shadow: string;
};

// Full named-palette overrides — these remap the existing bg-magenta /
// bg-cream / bg-ink / bg-acid-yellow / bg-electric-blue / bg-orange / bg-lime
// classes used across the entire site, so a preset re-skins everything
// without touching component code.
export type PaletteOverrides = Partial<{
  magenta: string;
  cream: string;
  ink: string;
  acidYellow: string;
  electricBlue: string;
  orange: string;
  lime: string;
  hotPink: string;
  bubblegum: string;
}>;

export type ThemePreset = {
  id: string;
  label: string;
  description: string;
  tokens: ThemeTokens;
  palette?: PaletteOverrides;
};

// Original palette — used as the fallback baseline so partial preset overrides
// never leave a slot undefined.
const BASE_PALETTE = {
  magenta: "0 72% 51%",
  cream: "20 6% 90%",
  ink: "222 47% 4%",
  acidYellow: "84 81% 56%",
  electricBlue: "221 83% 53%",
  orange: "21 90% 53%",
  lime: "142 76% 73%",
  hotPink: "0 72% 51%",
  bubblegum: "0 93% 86%",
};

// Helper to build a preset from the ccdthemes-style full palette.
const preset = (
  id: string,
  label: string,
  description: string,
  p: Required<PaletteOverrides> & {
    surface: string;
    surfaceAlt: string;
    onSurface: string;
    onBrand: string;
    brand: string;
    accent: string;
  }
): ThemePreset => ({
  id,
  label,
  description,
  tokens: {
    brand: p.brand,
    accent: p.accent,
    surface: p.surface,
    surfaceAlt: p.surfaceAlt,
    onBrand: p.onBrand,
    onSurface: p.onSurface,
    shadow: p.ink,
  },
  palette: {
    magenta: p.magenta,
    cream: p.cream,
    ink: p.ink,
    acidYellow: p.acidYellow,
    electricBlue: p.electricBlue,
    orange: p.orange,
    lime: p.lime,
    hotPink: p.hotPink,
    bubblegum: p.bubblegum,
  },
});

export const THEME_PRESETS: Record<string, ThemePreset> = {
  default: {
    id: "default",
    label: "Default",
    description: "Magenta · acid · cream · ink",
    tokens: {
      brand: BASE_PALETTE.magenta,
      accent: BASE_PALETTE.acidYellow,
      surface: BASE_PALETTE.cream,
      surfaceAlt: BASE_PALETTE.ink,
      onBrand: BASE_PALETTE.cream,
      onSurface: BASE_PALETTE.ink,
      shadow: BASE_PALETTE.ink,
    },
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    description: "Electric · lime · near-ink",
    tokens: {
      brand: "221 83% 53%",
      accent: "142 76% 73%",
      surface: "222 47% 8%",
      surfaceAlt: "222 47% 4%",
      onBrand: "20 6% 90%",
      onSurface: "20 6% 90%",
      shadow: "0 0% 0%",
    },
    palette: {
      magenta: "221 83% 53%",
      cream: "222 47% 8%",
      ink: "20 6% 90%",
      acidYellow: "142 76% 73%",
      electricBlue: "221 83% 53%",
      orange: "32 95% 60%",
      lime: "142 76% 73%",
      hotPink: "221 83% 53%",
      bubblegum: "221 50% 25%",
    },
  },
  sunburn: {
    id: "sunburn",
    label: "Sunburn",
    description: "Orange · acid · cream",
    tokens: {
      brand: "21 90% 53%",
      accent: "84 81% 56%",
      surface: "20 6% 90%",
      surfaceAlt: "222 47% 4%",
      onBrand: "222 47% 4%",
      onSurface: "222 47% 4%",
      shadow: "222 47% 4%",
    },
    palette: {
      magenta: "21 90% 53%",
      electricBlue: "10 80% 55%",
      hotPink: "21 90% 53%",
      bubblegum: "30 95% 85%",
    },
  },

  // --- Imported from ccdthemes.lovable.app ---
  original: preset("original", "Original", "Cream · pink · acid · sky", {
    brand: "0 0% 6%",
    accent: "52 100% 56%",
    surface: "42 80% 94%",
    surfaceAlt: "0 0% 6%",
    onBrand: "52 100% 56%",
    onSurface: "0 0% 6%",
    hotPink: "330 100% 72%",
    bubblegum: "330 100% 85%",
    acidYellow: "52 100% 56%",
    electricBlue: "200 100% 55%",
    lime: "80 90% 55%",
    orange: "22 100% 58%",
    magenta: "320 90% 50%",
    cream: "42 80% 94%",
    ink: "0 0% 6%",
  }),
  synthwave: preset("synthwave", "Synthwave", "Indigo · pink · cyan · violet", {
    brand: "270 60% 97%",
    accent: "330 100% 62%",
    surface: "250 64% 11%",
    surfaceAlt: "250 64% 14%",
    onBrand: "250 64% 11%",
    onSurface: "270 60% 97%",
    hotPink: "330 100% 62%",
    bubblegum: "271 91% 65%",
    acidYellow: "46 98% 59%",
    electricBlue: "188 100% 50%",
    lime: "111 100% 54%",
    orange: "25 100% 50%",
    magenta: "270 98% 54%",
    cream: "250 64% 11%",
    ink: "270 60% 97%",
  }),
  brutalist: preset("brutalist", "Brutalist", "Concrete · red · lime · blue", {
    brand: "222 47% 4%",
    accent: "84 81% 56%",
    surface: "20 6% 90%",
    surfaceAlt: "20 6% 82%",
    onBrand: "84 81% 56%",
    onSurface: "222 47% 4%",
    hotPink: "0 72% 51%",
    bubblegum: "0 93% 86%",
    acidYellow: "84 81% 56%",
    electricBlue: "221 83% 53%",
    lime: "142 76% 73%",
    orange: "21 90% 53%",
    magenta: "262 83% 58%",
    cream: "20 6% 90%",
    ink: "222 47% 4%",
  }),
  y2k: preset("y2k", "Y2K", "Lavender · pink · yellow · cyan", {
    brand: "262 67% 14%",
    accent: "60 100% 50%",
    surface: "265 100% 95%",
    surfaceAlt: "326 80% 90%",
    onBrand: "60 100% 50%",
    onSurface: "262 67% 14%",
    hotPink: "344 100% 72%",
    bubblegum: "326 100% 86%",
    acidYellow: "60 100% 50%",
    electricBlue: "190 100% 50%",
    lime: "111 100% 54%",
    orange: "27 100% 50%",
    magenta: "279 87% 53%",
    cream: "265 100% 95%",
    ink: "262 67% 14%",
  }),
  matcha: preset("matcha", "Matcha", "Beige · forest · amber · sage", {
    brand: "130 16% 18%",
    accent: "45 90% 55%",
    surface: "48 41% 90%",
    surfaceAlt: "48 30% 82%",
    onBrand: "45 90% 55%",
    onSurface: "130 16% 18%",
    hotPink: "10 70% 60%",
    bubblegum: "30 60% 82%",
    acidYellow: "45 90% 55%",
    electricBlue: "180 30% 45%",
    lime: "125 25% 55%",
    orange: "28 85% 50%",
    magenta: "350 50% 50%",
    cream: "48 41% 90%",
    ink: "130 16% 18%",
  }),
  mono: preset("mono", "Mono+1", "White · black · orange spark", {
    brand: "0 0% 4%",
    accent: "16 100% 50%",
    surface: "0 0% 98%",
    surfaceAlt: "0 0% 92%",
    onBrand: "0 0% 98%",
    onSurface: "0 0% 4%",
    hotPink: "16 100% 50%",
    bubblegum: "0 0% 88%",
    acidYellow: "16 100% 50%",
    electricBlue: "0 0% 20%",
    lime: "0 0% 75%",
    orange: "16 100% 50%",
    magenta: "0 0% 4%",
    cream: "0 0% 98%",
    ink: "0 0% 4%",
  }),
  sunset: preset("sunset", "Sunset", "Peach · coral · amber · violet", {
    brand: "350 50% 12%",
    accent: "1 100% 68%",
    surface: "26 100% 92%",
    surfaceAlt: "20 80% 86%",
    onBrand: "42 100% 50%",
    onSurface: "350 50% 12%",
    hotPink: "1 100% 68%",
    bubblegum: "20 100% 85%",
    acidYellow: "42 100% 50%",
    electricBlue: "270 75% 63%",
    lime: "160 60% 55%",
    orange: "14 100% 60%",
    magenta: "320 85% 55%",
    cream: "26 100% 92%",
    ink: "350 50% 12%",
  }),
  oceanic: preset("oceanic", "Oceanic", "Navy · cyan · amber accent", {
    brand: "190 100% 95%",
    accent: "42 100% 51%",
    surface: "212 95% 11%",
    surfaceAlt: "212 80% 14%",
    onBrand: "212 95% 11%",
    onSurface: "190 100% 95%",
    hotPink: "340 90% 65%",
    bubblegum: "195 75% 75%",
    acidYellow: "42 100% 51%",
    electricBlue: "192 100% 42%",
    lime: "165 70% 55%",
    orange: "20 100% 55%",
    magenta: "280 80% 60%",
    cream: "212 95% 11%",
    ink: "190 100% 95%",
  }),
  candy: preset("candy", "Candy Pop", "Blush · hot pink · mint · yellow", {
    brand: "330 60% 15%",
    accent: "338 100% 65%",
    surface: "340 100% 97%",
    surfaceAlt: "330 80% 92%",
    onBrand: "50 100% 62%",
    onSurface: "330 60% 15%",
    hotPink: "338 100% 65%",
    bubblegum: "330 100% 88%",
    acidYellow: "50 100% 62%",
    electricBlue: "195 95% 60%",
    lime: "155 85% 72%",
    orange: "20 100% 62%",
    magenta: "300 90% 60%",
    cream: "340 100% 97%",
    ink: "330 60% 15%",
  }),
  forest: preset("forest", "Forest", "Deep green · chartreuse · brick", {
    brand: "45 60% 90%",
    accent: "75 55% 56%",
    surface: "130 20% 13%",
    surfaceAlt: "130 20% 16%",
    onBrand: "130 20% 13%",
    onSurface: "45 60% 90%",
    hotPink: "359 45% 51%",
    bubblegum: "80 50% 70%",
    acidYellow: "75 55% 56%",
    electricBlue: "180 40% 55%",
    lime: "85 50% 60%",
    orange: "25 75% 55%",
    magenta: "320 50% 55%",
    cream: "130 20% 13%",
    ink: "45 60% 90%",
  }),
  pinkpunk: preset("pinkpunk", "Pink Punk", "Pure black · white · hot pink", {
    brand: "0 0% 100%",
    accent: "330 100% 59%",
    surface: "0 0% 0%",
    surfaceAlt: "0 0% 12%",
    onBrand: "0 0% 0%",
    onSurface: "0 0% 100%",
    hotPink: "330 100% 59%",
    bubblegum: "330 100% 75%",
    acidYellow: "330 100% 59%",
    electricBlue: "0 0% 100%",
    lime: "0 0% 100%",
    orange: "330 100% 59%",
    magenta: "330 100% 59%",
    cream: "0 0% 0%",
    ink: "0 0% 100%",
  }),
  linework: preset("linework", "Linework", "Pure black & white only", {
    brand: "0 0% 0%",
    accent: "0 0% 0%",
    surface: "0 0% 100%",
    surfaceAlt: "0 0% 96%",
    onBrand: "0 0% 100%",
    onSurface: "0 0% 0%",
    hotPink: "0 0% 0%",
    bubblegum: "0 0% 96%",
    acidYellow: "0 0% 100%",
    electricBlue: "0 0% 0%",
    lime: "0 0% 96%",
    orange: "0 0% 0%",
    magenta: "0 0% 0%",
    cream: "0 0% 100%",
    ink: "0 0% 0%",
  }),
};

export const DEFAULT_THEME = THEME_PRESETS.default;

// Presets exposed in the public-site easter-egg switcher (and Shift+T cycle).
// Admin still sees every preset in THEME_PRESETS.
export const FRONTEND_PRESET_IDS = ["default", "brutalist", "matcha", "candy", "mono"];

export type ThemeConfig = {
  preset: string;
  overrides?: Partial<ThemeTokens>;
};

export const resolveTheme = (config?: ThemeConfig | null): ThemeTokens => {
  const p = (config?.preset && THEME_PRESETS[config.preset]) || DEFAULT_THEME;
  return { ...p.tokens, ...(config?.overrides ?? {}) };
};

export const resolvePalette = (config?: ThemeConfig | null): Required<PaletteOverrides> => {
  const p = (config?.preset && THEME_PRESETS[config.preset]) || DEFAULT_THEME;
  return { ...BASE_PALETTE, ...(p.palette ?? {}) } as Required<PaletteOverrides>;
};

export const applyTheme = (config?: ThemeConfig | null) => {
  const tokens = resolveTheme(config);
  const palette = resolvePalette(config);
  const root = document.documentElement;

  // Semantic tokens
  root.style.setProperty("--brand", tokens.brand);
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--surface", tokens.surface);
  root.style.setProperty("--surface-alt", tokens.surfaceAlt);
  root.style.setProperty("--on-brand", tokens.onBrand);
  root.style.setProperty("--on-surface", tokens.onSurface);
  root.style.setProperty("--shadow", tokens.shadow);

  // Named palette — what makes existing bg-magenta / bg-cream / etc. classes
  // re-skin when a preset changes.
  root.style.setProperty("--magenta", palette.magenta);
  root.style.setProperty("--cream", palette.cream);
  root.style.setProperty("--ink", palette.ink);
  root.style.setProperty("--acid-yellow", palette.acidYellow);
  root.style.setProperty("--electric-blue", palette.electricBlue);
  root.style.setProperty("--orange", palette.orange);
  root.style.setProperty("--lime", palette.lime);
  root.style.setProperty("--hot-pink", palette.hotPink);
  root.style.setProperty("--bubblegum", palette.bubblegum);

  // Keep the base background/foreground in sync so the page itself flips too.
  root.style.setProperty("--background", palette.cream);
  root.style.setProperty("--foreground", palette.ink);
  root.style.setProperty("--border", palette.ink);
};
