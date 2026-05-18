import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HomeContent = {
  about?: {
    kicker?: string;
    title?: string;
    body?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  cta?: {
    title?: string;
    body?: string;
    label?: string;
    href?: string;
  };
};

export const HOME_CONTENT_DEFAULTS: HomeContent = {
  about: {
    kicker: "/ THE BRAND",
    title: "A CULTURE FOR PEOPLE WHO MOVE.",
    body: "Cats Can Dance is dance music, pet culture and streetwear in one club. Drops, parties, playlists and a community that shows up.",
    ctaLabel: "READ THE STORY →",
    ctaHref: "/about",
  },
};

export const useHomeContent = () => {
  const [content, setContent] = useState<HomeContent>(HOME_CONTENT_DEFAULTS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("home_content")
        .eq("id", "main")
        .maybeSingle();
      const remote = (data?.home_content ?? {}) as HomeContent;
      setContent({
        about: { ...HOME_CONTENT_DEFAULTS.about, ...(remote.about ?? {}) },
        cta: { ...HOME_CONTENT_DEFAULTS.cta, ...(remote.cta ?? {}) },
      });
    })();
  }, []);

  return content;
};
