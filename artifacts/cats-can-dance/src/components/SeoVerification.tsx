import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase-shim";

type Verifications = {
  google?: string;
  bing?: string;
  plausible_domain?: string;
};

const SeoVerification = () => {
  const [v, setV] = useState<Verifications>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("seo_verifications")
        .eq("id", "main")
        .maybeSingle();
      const sv = (data as any)?.seo_verifications;
      if (sv && typeof sv === "object") setV(sv as Verifications);
    })();
  }, []);

  useEffect(() => {
    if (v.google) {
      let m = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement("meta"); m.name = "google-site-verification"; document.head.appendChild(m); }
      m.content = v.google;
    }
    if (v.bing) {
      let m = document.querySelector('meta[name="msvalidate.01"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement("meta"); m.name = "msvalidate.01"; document.head.appendChild(m); }
      m.content = v.bing;
    }
    if (v.plausible_domain) {
      if (!document.querySelector(`script[data-domain="${v.plausible_domain}"]`)) {
        const s = document.createElement("script"); s.defer = true;
        s.setAttribute("data-domain", v.plausible_domain);
        s.src = "https://plausible.io/js/script.js";
        document.head.appendChild(s);
      }
    }
  }, [v]);

  return null;
};

export default SeoVerification;
