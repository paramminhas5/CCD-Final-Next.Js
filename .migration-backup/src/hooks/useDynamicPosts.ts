import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setDynamicPosts, type Post } from "@/content/posts";

let loaded = false;

/** Fetches AI-published blog posts from site_settings.blog_posts and merges
 *  them into the in-memory posts list. Runs at most once per session. */
export const useDynamicPosts = () => {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("blog_posts")
          .eq("id", "main")
          .maybeSingle();
        if (error) return;
        const raw = (data as any)?.blog_posts;
        if (!Array.isArray(raw)) return;
        setDynamicPosts(raw as Post[]);
      } catch {
        /* silent */
      }
    })();
  }, []);
};
