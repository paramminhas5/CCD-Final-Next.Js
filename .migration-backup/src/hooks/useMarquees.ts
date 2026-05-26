import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MarqueeSlotId =
  | "above-about"
  | "above-events"
  | "above-videos"
  | "above-playlist"
  | "above-drops"
  | "above-instagram"
  | "above-early-access";

export type MarqueeConfig = {
  id: MarqueeSlotId | string;
  enabled: boolean;
  bg: string;
  reverse: boolean;
  size: "lg" | "sm";
  items: string[];
};

export const DEFAULT_MARQUEES: MarqueeConfig[] = [
  { id: "above-about", enabled: true, bg: "bg-acid-yellow", reverse: false, size: "lg",
    items: ["WHO WE ARE", "BANGALORE UNDERGROUND", "A CULTURE BRAND", "DANCE · PETS · STREETWEAR"] },
  { id: "above-events", enabled: true, bg: "bg-orange", reverse: true, size: "sm",
    items: ["EPISODE 01", "EPISODE 02", "CATCH US LIVE", "BANGALORE", "RSVP NOW"] },
  { id: "above-videos", enabled: true, bg: "bg-magenta", reverse: false, size: "sm",
    items: ["WATCH THE TAPES", "LIVE SETS", "RECAPS", "YOUTUBE"] },
  { id: "above-playlist", enabled: true, bg: "bg-acid-yellow", reverse: true, size: "sm",
    items: ["NOW SPINNING", "DANCE MUSIC", "LATE NIGHT", "WAREHOUSE CUTS"] },
  { id: "above-drops", enabled: true, bg: "bg-electric-blue", reverse: false, size: "sm",
    items: ["STREETWEAR", "LIMITED DROPS", "PET MERCH", "WEAR THE CULTURE"] },
  { id: "above-instagram", enabled: true, bg: "bg-acid-yellow", reverse: true, size: "sm",
    items: ["@CATSCANDANCE", "LATEST", "BTS", "FOLLOW"] },
  { id: "above-early-access", enabled: true, bg: "bg-orange", reverse: false, size: "sm",
    items: ["JOIN THE PACK", "EARLY ACCESS", "DON'T MISS A DROP"] },
];

const mergeWithDefaults = (raw: any[]): MarqueeConfig[] => {
  const byId = new Map<string, MarqueeConfig>();
  DEFAULT_MARQUEES.forEach((m) => byId.set(m.id, { ...m }));
  for (const r of raw ?? []) {
    if (!r || typeof r.id !== "string") continue;
    const base = byId.get(r.id) ?? {
      id: r.id, enabled: true, bg: "bg-acid-yellow", reverse: false, size: "sm" as const, items: [],
    };
    byId.set(r.id, {
      ...base,
      enabled: typeof r.enabled === "boolean" ? r.enabled : base.enabled,
      bg: typeof r.bg === "string" ? r.bg : base.bg,
      reverse: typeof r.reverse === "boolean" ? r.reverse : base.reverse,
      size: r.size === "lg" || r.size === "sm" ? r.size : base.size,
      items: Array.isArray(r.items) && r.items.length ? r.items.map(String) : base.items,
    });
  }
  return DEFAULT_MARQUEES.map((d) => byId.get(d.id)!);
};

export const useMarquees = () => {
  const [marquees, setMarquees] = useState<MarqueeConfig[]>(DEFAULT_MARQUEES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("marquees")
          .eq("id", "main")
          .maybeSingle();
        if (cancelled) return;
        const raw = (data as any)?.marquees;
        if (Array.isArray(raw) && raw.length) {
          setMarquees(mergeWithDefaults(raw));
        }
      } catch {/* keep defaults */}
    })();
    return () => { cancelled = true; };
  }, []);

  return marquees;
};
