/**
 * /ccdxsocial — now handled by /ccdxsocial/index.tsx (the public series page).
 * This file redirects immediately so any old external links still work.
 * The private proposal lives at /ccdxsocial/proposal.
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

const CcdxSocialRedirect = () => {
  const router = useRouter();
  useEffect(() => { router.replace("/ccdxsocial"); }, [router]);
  return null;
};

export default CcdxSocialRedirect;
