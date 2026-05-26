import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

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

  return (
    <Helmet>
      {v.google && <meta name="google-site-verification" content={v.google} />}
      {v.bing && <meta name="msvalidate.01" content={v.bing} />}
      {v.plausible_domain && (
        <script
          defer
          data-domain={v.plausible_domain}
          src="https://plausible.io/js/script.js"
        />
      )}
    </Helmet>
  );
};

export default SeoVerification;
