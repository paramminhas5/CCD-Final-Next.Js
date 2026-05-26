import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyTheme, THEME_PRESETS, ThemeConfig, DEFAULT_THEME, FRONTEND_PRESET_IDS } from "@/lib/theme";

const FRONTEND_IDS = FRONTEND_PRESET_IDS.filter((id) => THEME_PRESETS[id]);

type Ctx = {
  config: ThemeConfig;
  setPreset: (preset: string) => void;
  clearOverride: () => void;
  hasLocalOverride: boolean;
  presetIds: string[];
};

const ThemeCtx = createContext<Ctx>({
  config: { preset: "default" },
  setPreset: () => {},
  clearOverride: () => {},
  hasLocalOverride: false,
  presetIds: FRONTEND_IDS,
});

const LOCAL_KEY = "ccd_theme_preset";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY) : null;
    return { preset: stored && THEME_PRESETS[stored] ? stored : DEFAULT_THEME.id };
  });
  const [hasLocalOverride, setHasLocalOverride] = useState<boolean>(() => {
    return typeof window !== "undefined" && !!localStorage.getItem(LOCAL_KEY);
  });
  const cmsConfigRef = useRef<ThemeConfig | null>(null);

  // Apply tokens whenever config changes
  useEffect(() => {
    applyTheme(config);
  }, [config]);

  // Fetch CMS theme on mount and subscribe to changes
  useEffect(() => {
    const loadCms = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("theme")
        .eq("id", "main")
        .maybeSingle();
      const t = (data?.theme ?? null) as ThemeConfig | null;
      if (t && t.preset && THEME_PRESETS[t.preset]) {
        cmsConfigRef.current = t;
        // Only auto-apply if the user has not picked their own preset.
        if (!localStorage.getItem(LOCAL_KEY)) setConfig(t);
      }
    };
    loadCms();

    const channel = supabase
      .channel("site_settings_theme")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "id=eq.main" },
        (payload) => {
          const t = (payload.new as any)?.theme as ThemeConfig | null;
          if (t && t.preset && THEME_PRESETS[t.preset]) {
            cmsConfigRef.current = t;
            if (!localStorage.getItem(LOCAL_KEY)) setConfig(t);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setPreset = useCallback((preset: string) => {
    if (!THEME_PRESETS[preset]) return;
    setConfig({ preset });
    try {
      localStorage.setItem(LOCAL_KEY, preset);
      setHasLocalOverride(true);
    } catch { /* ignore */ }
  }, []);

  const clearOverride = useCallback(() => {
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ }
    setHasLocalOverride(false);
    setConfig(cmsConfigRef.current ?? { preset: DEFAULT_THEME.id });
  }, []);

  // Cycle presets on Shift+T (easter-egg keyboard shortcut)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "T" || e.key === "t") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        const ids = FRONTEND_IDS;
        const currentIdx = ids.indexOf(config.preset);
        const next = ids[(currentIdx + 1) % ids.length] ?? ids[0];
        setPreset(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config.preset, setPreset]);

  return (
    <ThemeCtx.Provider
      value={{ config, setPreset, clearOverride, hasLocalOverride, presetIds: FRONTEND_IDS }}
    >
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);
